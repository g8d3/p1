import asyncio
import json
from typing import Optional
from contextlib import AsyncExitStack
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.types import Resource, Tool, Prompt

class MCPExplorer:
    def __init__(self):
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()

    async def connect_to_server(self, command: str, args: list):
        """Connect to an MCP server using stdio transport."""
        server_params = StdioServerParameters(command=command, args=args, env=None)
        stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
        self.stdio, self.stdout = stdio_transport
        self.session = await self.exit_stack.enter_async_context(ClientSession(self.stdio, self.stdout))
        await self.session.initialize()
        print("Connected to browsermcp server.")

    async def list_capabilities(self):
        """List available tools, resources, and prompts."""
        if not self.session:
            print("Error: Not connected to any server.")
            return

        # List tools
        tool_response = await self.session.list_tools()
        print("\nAvailable Tools:")
        for tool in tool_response.tools:
            print(f"- {tool.name}: {tool.description}")

        # List resources
        resource_response = await self.session.list_resources()
        print("\nAvailable Resources:")
        for resource in resource_response.resources:
            print(f"- {resource.name} ({resource.uri})")

        # List prompts
        prompt_response = await self.session.list_prompts()
        print("\nAvailable Prompts:")
        for prompt in prompt_response.prompts:
            print(f"- {prompt.name}: {prompt.description}")

    async def invoke_tool(self, tool_name: str, params: dict):
        """Invoke a specific tool with given parameters."""
        if not self.session:
            print("Error: Not connected to any server.")
            return

        try:
            response = await self.session.call_tool(tool_name, params)
            print(f"\nTool '{tool_name}' Response:")
            print(json.dumps(response.result, indent=2))
        except Exception as e:
            print(f"Error invoking tool '{tool_name}': {str(e)}")

    async def get_resource(self, resource_uri: str):
        """Retrieve a specific resource by URI."""
        if not self.session:
            print("Error: Not connected to any server.")
            return

        try:
            response = await self.session.get_resource(resource_uri)
            print(f"\nResource '{resource_uri}' Content:")
            print(json.dumps(response.content, indent=2))
        except Exception as e:
            print(f"Error retrieving resource '{resource_uri}': {str(e)}")

    async def close(self):
        """Close the client session."""
        await self.exit_stack.aclose()

async def main():
    explorer = MCPExplorer()
    try:
        # Connect to the browsermcp server
        await explorer.connect_to_server("npx", ["@browsermcp/mcp@latest"])

        # List server capabilities
        await explorer.list_capabilities()

        # Interactive loop for exploration
        while True:
            print("\nOptions:")
            print("1. List capabilities")
            print("2. Invoke a tool")
            print("3. Get a resource")
            print("4. Exit")
            choice = input("Enter choice (1-4): ")

            if choice == "1":
                await explorer.list_capabilities()
            elif choice == "2":
                tool_name = input("Enter tool name: ")
                params = input("Enter parameters as JSON (e.g., {}): ")
                try:
                    params_dict = json.loads(params)
                    await explorer.invoke_tool(tool_name, params_dict)
                except json.JSONDecodeError:
                    print("Error: Invalid JSON parameters.")
            elif choice == "3":
                resource_uri = input("Enter resource URI: ")
                await explorer.get_resource(resource_uri)
            elif choice == "4":
                break
            else:
                print("Invalid choice. Try again.")

    finally:
        await explorer.close()

if __name__ == "__main__":
    asyncio.run(main())