import json
import sqlite3
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, render_template
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import pytest
import os
from typing import Dict, List
import logging
import requests
from openai import OpenAI
from google.cloud import aiplatform
import vertexai

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')

# Initialize Vertex AI for Gemini
vertexai.init(project=os.getenv('GOOGLE_CLOUD_PROJECT'), location="us-central1")

# Database setup
def init_db():
    conn = sqlite3.connect('agent_memory.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS conversations
                 (id TEXT PRIMARY KEY, user_id TEXT, timestamp TEXT, content TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS preferences
                 (user_id TEXT PRIMARY KEY, coding_style TEXT, test_framework TEXT, language TEXT, llm_provider TEXT)''')
    conn.commit()
    conn.close()

init_db()

# AI Agent class
class AIAgent:
    def __init__(self):
        self.memory = {}
        self.driver = None
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

    def setup_browser(self):
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        self.driver = webdriver.Chrome(options=chrome_options)

    def close_browser(self):
        if self.driver:
            self.driver.quit()

    def save_conversation(self, user_id: str, content: Dict):
        conn = sqlite3.connect('agent_memory.db')
        c = conn.cursor()
        conv_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        c.execute("INSERT INTO conversations (id, user_id, timestamp, content) VALUES (?, ?, ?, ?)",
                  (conv_id, user_id, timestamp, json.dumps(content)))
        conn.commit()
        conn.close()
        return conv_id

    def get_conversations(self, user_id: str) -> List[Dict]:
        conn = sqlite3.connect('agent_memory.db')
        c = conn.cursor()
        c.execute("SELECT id, timestamp, content FROM conversations WHERE user_id = ?", (user_id,))
        convs = [{"id": row[0], "timestamp": row[1], "content": json.loads(row[2])} for row in c.fetchall()]
        conn.close()
        return convs

    def delete_conversation(self, conv_id: str):
        conn = sqlite3.connect('agent_memory.db')
        c = conn.cursor()
        c.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
        conn.commit()
        conn.close()

    def update_preferences(self, user_id: str, preferences: Dict):
        conn = sqlite3.connect('agent_memory.db')
        c = conn.cursor()
        c.execute("INSERT OR REPLACE INTO preferences (user_id, coding_style, test_framework, language, llm_provider) VALUES (?, ?, ?, ?, ?)",
                  (user_id, 
                   preferences.get('coding_style', 'pep8'),
                   preferences.get('test_framework', 'pytest'),
                   preferences.get('language', 'python'),
                   preferences.get('llm_provider', 'openai')))
        conn.commit()
        conn.close()

    def get_preferences(self, user_id: str) -> Dict:
        conn = sqlite3.connect('agent_memory.db')
        c = conn.cursor()
        c.execute("SELECT coding_style, test_framework, language, llm_provider FROM preferences WHERE user_id = ?", (user_id,))
        row = c.fetchone()
        conn.close()
        if row:
            return {
                "coding_style": row[0], 
                "test_framework": row[1], 
                "language": row[2], 
                "llm_provider": row[3]
            }
        return {
            "coding_style": "pep8", 
            "test_framework": "pytest", 
            "language": "python", 
            "llm_provider": "openai"
        }

    def generate_code(self, user_id: str, prompt: str) -> Dict:
        preferences = self.get_preferences(user_id)
        llm_provider = preferences['llm_provider'].lower()
        
        system_prompt = f"""
You are an expert coder specializing in test-driven development (TDD). Generate both implementation code and corresponding unit tests based on the user prompt. Follow these preferences:
- Coding style: {preferences['coding_style']}
- Test framework: {preferences['test_framework']}
- Language: {preferences['language']}
Provide two outputs in the following format:
1. Implementation code wrapped in ```{preferences['language']}
2. Test code wrapped in ```{preferences['language']}
Separate the implementation and test code with "===TESTS===". Ensure the code is functional, well-documented, and adheres to best practices. The test code must include comprehensive unit tests that verify the implementation's functionality.
User prompt: {prompt}
"""

        try:
            if llm_provider == 'openai' and self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4.1-2025-04-14",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ]
                )
                content = response.choices[0].message.content
            elif llm_provider == 'gemini' and GOOGLE_API_KEY:
                from vertexai.preview.language_models import CodeGenerationModel
                model = CodeGenerationModel.from_pretrained("gemini-2.5-flash-preview-05-20")
                response = model.predict(system_prompt + "\n" + prompt, max_output_tokens=1500)
                content = response.text
            elif llm_provider == 'openrouter' and OPENROUTER_API_KEY:
                response = requests.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    headers={
                        'Authorization': f'Bearer {OPENROUTER_API_KEY}',
                        'Content-Type': 'application/json'
                    },
                    json={
                        'model': 'google/gemini-2.0-flash-001',
                        'messages': [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt}
                        ]
                    }
                )
                content = response.json()['choices'][0]['message']['content']
            else:
                logger.error("No valid LLM provider configured")
                return {
                    "code": f"# Error: No valid LLM provider configured",
                    "test_code": f"# Error: No valid LLM provider configured"
                }

            # Parse LLM response
            try:
                code_parts = content.split("===TESTS===")
                if len(code_parts) != 2:
                    raise ValueError("LLM response did not contain exactly one '===TESTS===' separator")
                
                # Extract code from within language-specific code blocks
                code = code_parts[0].strip()
                if code.startswith(f"```{preferences['language']}"):
                    code = code[len(f"```{preferences['language']}"):].strip()
                if code.endswith("```"):
                    code = code[:-3].strip()
                
                test_code = code_parts[1].strip()
                if test_code.startswith(f"```{preferences['language']}"):
                    test_code = test_code[len(f"```{preferences['language']}"):].strip()
                if test_code.endswith("```"):
                    test_code = test_code[:-3].strip()
                
                return {"code": code, "test_code": test_code}
            except Exception as e:
                logger.error(f"Failed to parse LLM response: {str(e)}")
                return {
                    "code": f"# Error: Failed to parse LLM response - {str(e)}",
                    "test_code": f"# Error: Failed to parse LLM response - {str(e)}"
                }

        except Exception as e:
            logger.error(f"LLM request failed: {str(e)}")
            return {
                "code": f"# Error: LLM request failed - {str(e)}",
                "test_code": f"# Error: LLM request failed - {str(e)}"
            }

    def run_tests(self, test_code: str) -> Dict:
        with open('test_temp.py', 'w') as f:
            f.write(test_code)
        
        result = os.popen('pytest test_temp.py -v').read()
        os.remove('test_temp.py')
        
        return {"test_result": result}

    def test_in_browser(self, code: str) -> Dict:
        self.setup_browser()
        try:
            with open('temp.html', 'w') as f:
                f.write(f"""
<!DOCTYPE html>
<html>
<body>
<script>
{code}
</script>
</body>
</html>
""")
            self.driver.get('file://' + os.path.abspath('temp.html'))
            result = {"status": "success", "output": "Browser test completed"}
        except Exception as e:
            result = {"status": "error", "output": str(e)}
        finally:
            self.close_browser()
            if os.path.exists('temp.html'):
                os.remove('temp.html')
        return result

agent = AIAgent()

# Web Interface Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/converse', methods=['POST'])
def converse():
    data = request.json
    user_id = data.get('user_id', 'default_user')
    prompt = data.get('prompt')
    
    response = agent.generate_code(user_id, prompt)
    test_result = agent.run_tests(response['test_code'])
    
    if 'javascript' in agent.get_preferences(user_id)['language'].lower():
        browser_result = agent.test_in_browser(response['code'])
        response['browser_result'] = browser_result
    
    conv_id = agent.save_conversation(user_id, {
        "prompt": prompt,
        "response": response,
        "test_result": test_result
    })
    
    return jsonify({"conv_id": conv_id, **response, "test_result": test_result})

@app.route('/api/conversations/<user_id>', methods=['GET'])
def get_conversations(user_id):
    return jsonify(agent.get_conversations(user_id))

@app.route('/api/conversations/<conv_id>', methods=['DELETE'])
def delete_conversation(conv_id):
    agent.delete_conversation(conv_id)
    return jsonify({"status": "success"})

@app.route('/api/preferences', methods=['POST'])
def update_preferences():
    data = request.json
    user_id = data.get('user_id', 'default_user')
    agent.update_preferences(user_id, data.get('preferences', {}))
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True)