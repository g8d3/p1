import os
import subprocess

class Agent:
    def __init__(self, name, model):
        self.name = name
        self.model = model
        self.memory = []

    def communicate(self, message, other_agent):
        print(f"{self.name} sending message to {other_agent.name}: {message}")
        response = other_agent.receive(message, self)
        return response

    def receive(self, message, sender):
        print(f"{self.name} received message from {sender.name}: {message}")
        # Process the message and generate a response
        response = f"{self.name} received: {message}"
        return response

    def execute_shell_command(self, command):
        try:
            result = subprocess.run(command, shell=True, capture_output=True, text=True)
            return result.stdout, result.stderr
        except Exception as e:
            return None, str(e)

    def show_working_directory(self):
        cwd = os.getcwd()
        return cwd

# Example usage
if __name__ == "__main__":
    agent1 = Agent("Agent1", "Gemini Flash 2.0")
    agent2 = Agent("Agent2", "Gemini Flash 2.0")

    message = "Hello Agent2, can you hear me?"
    response = agent1.communicate(message, agent2)
    print(response)

    cwd = agent1.show_working_directory()
    print(f"Current working directory: {cwd}")

    # Example of executing a shell command
    stdout, stderr = agent1.execute_shell_command("ls -la")
    if stdout:
        print("Stdout:", stdout)
    if stderr:
        print("Stderr:", stderr)