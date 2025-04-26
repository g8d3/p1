import os
import subprocess
import sqlite3
import faiss
import networkx as nx
import requests
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum
import logging
from threading import Lock
import json
import time
from uuid import uuid4

# Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

# Logging setup
logging.basicConfig(level=logging.INFO, filename="agent_collaboration.log")
logger = logging.getLogger(__name__)

# Safety and limits
ALLOWED_COMMANDS = ["ls", "cat", "echo", "mkdir", "touch", "python", "pip"]
ALLOWED_PATHS = ["/home/agent", "/tmp"]
MAX_EXECUTION_TIME = 30  # seconds
MAX_MEMORY_MB = 512
MAX_DISK_MB = 1024
MAX_API_CALLS_PER_AGENT = 20
MAX_COLLABORATION_ROUNDS = 10
MAX_MESSAGE_LENGTH = 1000
COST_PER_API_CALL = 0.001  # Example cost in USD
MAX_TOTAL_COST = 0.05  # Max total cost in USD
MIN_QUALITY_SCORE = 0.8  # Minimum peer review score (0-1)

# Database types
class DBType(Enum):
    SQL = "sql"
    VECTOR = "vector"
    GRAPH = "graph"

@dataclass
class AgentConfig:
    id: str
    model: str
    api_type: str  # "openrouter" or "gemini"
    shell_access: bool
    db_types: List[DBType]
    max_concurrent_tasks: int

@dataclass
class TaskState:
    task_id: str
    description: str
    current_code: str
    status: str  # "in_progress", "completed", "failed"
    contributions: Dict[str, List[str]]
    reviews: Dict[str, List[Dict[str, Any]]]
    round: int
    total_cost: float

class MemoryManager:
    def __init__(self, db_types: List[DBType], agent_id: str):
        self.db_types = db_types
        self.agent_id = agent_id
        self.sql_conn = None
        self.vector_index = None
        self.graph = None
        self.lock = Lock()

        if DBType.SQL in db_types:
            self.sql_conn = sqlite3.connect(f"{agent_id}_memory.db")
            self._init_sql_db()
        if DBType.VECTOR in db_types:
            self.vector_index = faiss.IndexFlatL2(512)
        if DBType.GRAPH in db_types:
            self.graph = nx.DiGraph()

    def _init_sql_db(self):
        with self.lock:
            cursor = self.sql_conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS interactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_id TEXT,
                    timestamp TEXT,
                    input TEXT,
                    output TEXT
                )
            """)
            self.sql_conn.commit()

    def store_interaction(self, task_id: str, input_data: str, output_data: str):
        with self.lock:
            if self.sql_conn:
                cursor = self.sql_conn.cursor()
                cursor.execute(
                    "INSERT INTO interactions (task_id, timestamp, input, output) VALUES (?, datetime('now'), ?, ?)",
                    (task_id, input_data, output_data)
                )
                self.sql_conn.commit()
            if self.vector_index:
                pass
            if self.graph:
                self.graph.add_node(input_data, task_id=task_id, output=output_data)

    def query_memory(self, task_id: str, query: str) -> List[Any]:
        with self.lock:
            if self.sql_conn:
                cursor = self.sql_conn.cursor()
                cursor.execute(
                    "SELECT input, output FROM interactions WHERE task_id = ? AND input LIKE ?",
                    (task_id, f"%{query}%")
                )
                return cursor.fetchall()
            return []

class ShellExecutor:
    def __init__(self):
        self.sandbox_env = {"PATH": "/usr/bin:/bin"}

    def execute(self, command: str, working_dir: str) -> Dict[str, Any]:
        if not self._is_safe_command(command):
            logger.error(f"Blocked unsafe command: {command}")
            return {"status": "error", "output": "Command not allowed"}

        if not self._is_safe_path(working_dir):
            logger.error(f"Blocked unsafe path: {working_dir}")
            return {"status": "error", "output": "Path not allowed"}

        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=MAX_EXECUTION_TIME,
                cwd=working_dir,
                env=self.sandbox_env
            )
            return {
                "status": "success",
                "output": result.stdout,
                "error": result.stderr
            }
        except subprocess.TimeoutExpired:
            logger.error(f"Command timed out: {command}")
            return {"status": "error", "output": "Command timed out"}
        except Exception as e:
            logger.error(f"Command execution failed: {str(e)}")
            return {"status": "error", "output": str(e)}

    def _is_safe_command(self, command: str) -> bool:
        cmd_parts = command.split()
        if not cmd_parts:
            return False
        base_cmd = cmd_parts[0].split("/")[-1]
        return base_cmd in ALLOWED_COMMANDS

    def _is_safe_path(self, path: str) -> bool:
        abs_path = os.path.abspath(path)
        return any(abs_path.startswith(allowed) for allowed in ALLOWED_PATHS)

class AIAgent:
    def __init__(self, config: AgentConfig):
        self.config = config
        self.memory = MemoryManager(config.db_types, config.id)
        self.shell = ShellExecutor() if config.shell_access else None
        self.api_headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY if config.api_type == 'openrouter' else GEMINI_API_KEY}",
            "Content-Type": "application/json"
        }
        self.api_url = OPENROUTER_URL if config.api_type == "openrouter" else GEMINI_URL
        self.api_calls = 0
        self.lock = Lock()

    def call_model(self, prompt: str) -> Optional[str]:
        with self.lock:
            if self.api_calls >= MAX_API_CALLS_PER_AGENT:
                logger.error(f"Agent {self.config.id} exceeded API call limit")
                return None
            self.api_calls += 1

        if len(prompt) > MAX_MESSAGE_LENGTH:
            logger.error(f"Prompt too long for agent {self.config.id}")
            return None

        payload = {
            "model": self.config.model,
            "messages": [{"role": "user", "content": prompt}]
        }
        try:
            response = requests.post(self.api_url, json=payload, headers=self.api_headers)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"API call failed for agent {self.config.id}: {str(e)}")
            return None

    def contribute_to_task(self, task_state: TaskState) -> Optional[Dict[str, Any]]:
        context = self.memory.query_memory(task_state.task_id, task_state.description)
        prompt = (
            f"Task: {task_state.description}\n"
            f"Current code:\n```python\n{task_state.current_code}\n```\n"
            f"Context: {context}\n"
            f"Contribute a code snippet or suggest improvements. Return code in ```python``` block."
        )

        response = self.call_model(prompt)
        if not response:
            return None

        self.memory.store_interaction(task_state.task_id, prompt, response)
        contribution = {"agent_id": self.config.id, "content": response}
        return contribution

    def review_contribution(self, task_state: TaskState, contribution: Dict[str, Any]) -> Dict[str, Any]:
        prompt = (
            f"Review the following contribution for task: {task_state.description}\n"
            f"Current code:\n```python\n{task_state.current_code}\n```\n"
            f"Contribution by {contribution['agent_id']}:\n{contribution['content']}\n"
            f"Score it from 0 to 1 based on correctness, relevance, and clarity. "
            f"Provide feedback and a score."
        )

        response = self.call_model(prompt)
        if not response:
            return {"score": 0, "feedback": "Review failed"}

        try:
            review_data = json.loads(response) if response.startswith("{") else {
                "score": 0,
                "feedback": response
            }
            return {
                "reviewer_id": self.config.id,
                "score": min(max(float(review_data.get("score", 0)), 0), 1),
                "feedback": review_data.get("feedback", "")
            }
        except Exception as e:
            logger.error(f"Review parsing failed for agent {self.config.id}: {str(e)}")
            return {"score": 0, "feedback": "Invalid review format"}

    def execute_code(self, code: str, working_dir: str = "/home/agent") -> Dict[str, Any]:
        if not self.config.shell_access:
            return {"status": "error", "output": "Shell access disabled"}

        # Write code to a temporary file
        temp_file = f"{working_dir}/temp_{uuid4().hex}.py"
        with open(temp_file, "w") as f:
            f.write(code)

        command = f"python {temp_file}"
        result = self.shell.execute(command, working_dir)
        os.remove(temp_file)
        return result

class AgentOrchestrator:
    def __init__(self):
        self.agents: Dict[str, AIAgent] = {}
        self.total_cost = 0.0
        self.lock = Lock()

    def create_agents(self, configs: List[AgentConfig]):
        for config in configs:
            self.agents[config.id] = AIAgent(config)
            logger.info(f"Created agent: {config.id}")

    def collaborate_on_task(self, task_description: str) -> Dict[str, Any]:
        task_state = TaskState(
            task_id=str(uuid4()),
            description=task_description,
            current_code="",
            status="in_progress",
            contributions={},
            reviews={},
            round=0,
            total_cost=0.0
        )

        while task_state.status == "in_progress" and task_state.round < MAX_COLLABORATION_ROUNDS:
            with self.lock:
                if self.total_cost + COST_PER_API_CALL * len(self.agents) > MAX_TOTAL_COST:
                    task_state.status = "failed"
                    task_state.current_code = "Cost limit exceeded"
                    break

            task_state.round += 1
            logger.info(f"Round {task_state.round} for task {task_state.task_id}")

            # Agents contribute
            for agent_id, agent in self.agents.items():
                contribution = agent.contribute_to_task(task_state)
                if contribution:
                    task_state.contributions.setdefault(agent_id, []).append(contribution["content"])
                    self.total_cost += COST_PER_API_CALL
                    task_state.total_cost += COST_PER_API_CALL

                    # Extract code from contribution
                    if "```python" in contribution["content"]:
                        start = contribution["content"].index("```python") + 9
                        end = contribution["content"].index("```", start)
                        new_code = contribution["content"][start:end].strip()
                        task_state.current_code = new_code  # Update with latest valid code

            # Agents review contributions
            for agent_id, contributions in task_state.contributions.items():
                for reviewer_id, reviewer in self.agents.items():
                    if reviewer_id != agent_id:
                        for contribution in contributions:
                            review = reviewer.review_contribution(task_state, {
                                "agent_id": agent_id,
                                "content": contribution
                            })
                            task_state.reviews.setdefault(agent_id, []).append(review)
                            self.total_cost += COST_PER_API_CALL
                            task_state.total_cost += COST_PER_API_CALL

            # Evaluate reviews
            avg_score = 0
            review_count = 0
            for reviews in task_state.reviews.values():
                for review in reviews:
                    avg_score += review["score"]
                    review_count += 1
            avg_score = avg_score / review_count if review_count > 0 else 0

            if avg_score >= MIN_QUALITY_SCORE:
                # Test the code
                test_agent = list(self.agents.values())[0]
                execution_result = test_agent.execute_code(task_state.current_code)
                if execution_result["status"] == "success":
                    task_state.status = "completed"
                else:
                    task_state.status = "failed"
                    task_state.current_code += f"\n# Execution error: {execution_result['error']}"
            elif task_state.round >= MAX_COLLABORATION_ROUNDS:
                task_state.status = "failed"
                task_state.current_code += "\n# Failed: Max rounds reached"

        return {
            "task_id": task_state.task_id,
            "status": task_state.status,
            "final_code": task_state.current_code,
            "total_cost": task_state.total_cost,
            "rounds": task_state.round,
            "reviews": task_state.reviews
        }

# Example Usage
if __name__ == "__main__":
    configs = [
        AgentConfig(
            id="agent1",
            model="google/gemini-flash-2.0",
            api_type="openrouter",
            shell_access=True,
            db_types=[DBType.SQL],
            max_concurrent_tasks=2
        ),
        AgentConfig(
            id="agent2",
            model="gemini-2.0-flash",
            api_type="gemini",
            shell_access=True,
            db_types=[DBType.SQL],
            max_concurrent_tasks=1
        )
    ]

    orchestrator = AgentOrchestrator()
    orchestrator.create_agents(configs)

    task = "Collaboratively create a Python script that implements a simple REST API using Flask."
    result = orchestrator.collaborate_on_task(task)
    print(json.dumps(result, indent=2))