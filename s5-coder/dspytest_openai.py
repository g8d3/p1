import dspy
import os
from typing import List, Optional
import ast
import asyncio

# Configure LLM using OpenAI
openai_lm = dspy.OpenAI(model="gpt-4.1-2025-04-14", api_key=os.getenv("OPENAI_API_KEY"))
dspy.settings.configure(lm=openai_lm)

# Define signatures for each agent
class PlanSignature(dspy.Signature):
    """Generate a step-by-step plan for a coding task, including user-friendly features."""
    user_request = dspy.InputField(desc="User's description of the desired program")
    plan = dspy.OutputField(desc="Step-by-step plan in markdown format with user-friendly features")

class CodeSignature(dspy.Signature):
    """Generate executable Python code based on a plan."""
    plan = dspy.InputField(desc="Step-by-step plan for the coding task")
    code = dspy.OutputField(desc="Executable Python code")

class TestSignature(dspy.Signature):
    """Test the generated code for correctness and usability."""
    code = dspy.InputField(desc="Python code to test")
    test_results = dspy.OutputField(desc="Test results and usability feedback")

class FeedbackSignature(dspy.Signature):
    """Incorporate user feedback to refine the plan and code."""
    user_feedback = dspy.InputField(desc="User's feedback on the code")
    current_plan = dspy.InputField(desc="Current plan")
    current_code = dspy.InputField(desc="Current code")
    revised_plan = dspy.OutputField(desc="Revised plan based on feedback")
    revised_code = dspy.OutputField(desc="Revised code based on feedback")

# Define DSPy modules for each agent
class PlannerAgent(dspy.Module):
    def __init__(self):
        super().__init__()
        self.plan = dspy.ChainOfThought(PlanSignature)

    def forward(self, user_request):
        return self.plan(user_request=user_request)

class CoderAgent(dspy.Module):
    def __init__(self):
        super().__init__()
        self.code = dspy.Predict(CodeSignature)

    def forward(self, plan):
        return self.code(plan=plan)

class TesterAgent(dspy.Module):
    def __init__(self):
        super().__init__()
        self.test = dspy.Predict(TestSignature)

    def forward(self, code):
        try:
            ast.parse(code)
            usability = "Code is syntactically valid. Checking for user-friendly features..."
            if "print(" in code or "input(" in code:
                usability += "\nFound user-friendly I/O (print/input statements)."
            else:
                usability += "\nMissing user-friendly I/O (e.g., print/input statements)."
            return dspy.Prediction(test_results=usability)
        except SyntaxError as e:
            return dspy.Prediction(test_results=f"Syntax error: {str(e)}")

class FeedbackAgent(dspy.Module):
    def __init__(self):
        super().__init__()
        self.feedback = dspy.ChainOfThought(FeedbackSignature)

    def forward(self, user_feedback, current_plan, current_code):
        return self.feedback(user_feedback=user_feedback, current_plan=current_plan, current_code=current_code)

# Main multi-agent system
class CodeDevelopmentSystem(dspy.Module):
    def __init__(self, max_iterations=3):
        super().__init__()
        self.planner = PlannerAgent()
        self.coder = CoderAgent()
        self.tester = TesterAgent()
        self.feedback = FeedbackAgent()
        self.max_iterations = max_iterations

    async def forward(self, user_request):
        iteration = 0
        plan = None
        code = None
        test_results = None

        while iteration < self.max_iterations:
            plan_result = self.planner(user_request=user_request)
            plan = plan_result.plan
            print(f"Iteration {iteration + 1} - Plan:\n{plan}\n")

            code_result = self.coder(plan=plan)
            code = code_result.code
            print(f"Iteration {iteration + 1} - Code:\n{code}\n")

            test_result = self.tester(code=code)
            test_results = test_result.test_results
            print(f"Iteration {iteration + 1} - Test Results:\n{test_results}\n")

            user_feedback = await self.simulate_user_feedback(code, test_results, iteration)
            if user_feedback.lower() == "approve":
                return dspy.Prediction(final_code=code, final_plan=plan, test_results=test_results)
            
            feedback_result = self.feedback(user_feedback=user_feedback, current_plan=plan, current_code=code)
            plan = feedback_result.revised_plan
            code = feedback_result.revised_code
            iteration += 1

        return dspy.Prediction(final_code=code, final_plan=plan, test_results=test_results)

    async def simulate_user_feedback(self, code, test_results, iteration):
        print(f"\nPlease review the code and provide feedback or type 'approve' to accept:\n{code}\n")
        print(f"Test Results:\n{test_results}\n")
        if iteration == 0:
            return "Please add a user-friendly interface with input prompts and clear output messages."
        elif iteration == 1:
            return "Looks better, but can you add error handling for invalid inputs?"
        else:
            return "approve"

# Example usage
async def main():
    system = CodeDevelopmentSystem(max_iterations=3)
    user_request = "Create a Python program that calculates the factorial of a number provided by the user."
    result = await system(user_request=user_request)
    print("\nFinal Output:")
    print(f"Final Plan:\n{result.final_plan}")
    print(f"Final Code:\n{result.final_code}")
    print(f"Test Results:\n{result.test_results}")

if __name__ == "__main__":
    asyncio.run(main())
