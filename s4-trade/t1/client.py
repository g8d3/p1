import asyncio
import json
from typing import Optional
from contextlib import AsyncExitStack
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.shared.exceptions import McpError

class MCPExplorer:
    def __init__(self):
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self.tools = []

    async def connect_to_server(self, command: str, args: list):
        """Connect to an MCP server using stdio transport."""
        try:
            server_params = StdioServerParameters(command=command, args=args, env=None)
            stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
            self.stdio, self.stdout = stdio_transport
            self.session = await self.exit_stack.enter_async_context(ClientSession(self.stdio, self.stdout))
            await self.session.initialize()
            print("Connected to browsermcp server.")
        except Exception as e:
            print(f"Failed to connect to server: {str(e)}")
            raise

    async def list_capabilities(self):
        """List available tools, resources, and prompts, handling errors gracefully."""
        if not self.session:
            print("Error: Not connected to any server.")
            return

        # List tools
        try:
            tool_response = await self.session.list_tools()
            self.tools = tool_response.tools
            print("\nAvailable Tools:")
            for tool in self.tools:
                print(f"- {tool.name}: {tool.description}")
        except McpError as e:
            print(f"Error listing tools: {str(e)}")

        # List resources (with error handling)
        try:
            resource_response = await self.session.list_resources()
            print("\nAvailable Resources:")
            for resource in resource_response.resources:
                print(f"- {resource.name} ({resource.uri})")
        except McpError as e:
            print(f"Error listing resources: {str(e)}")

        # List prompts (with error handling)
        try:
            prompt_response = await self.session.list_prompts()
            print("\nAvailable Prompts:")
            for prompt in prompt_response.prompts:
                print(f"- {prompt.name}: {prompt.description}")
        except McpError as e:
            print(f"Error listing prompts: {str(e)}")

    async def invoke_tool(self, tool_name: str, params: dict):
        """Invoke a specific tool with given parameters."""
        if not self.session:
            print("Error: Not connected to any server.")
            return

        try:
            response = await self.session.call_tool(tool_name, params)
            print(f"\nTool '{tool_name}' Response:")
            print(json.dumps(response.result, indent=2))
        except McpError as e:
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
        except McpError as e:
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
                print("\nAvailable tools:")
                for tool in explorer.tools:
                    print(f"- {tool.name}")
                tool_name = input("Enter tool name: ")
                params = input("Enter parameters as JSON (e.g., {}): ")
                try:
                    params_dict = json.loads(params) if params.strip() else {}
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

    except Exception as e:
        print(f"Error in main loop: {str(e)}")
    finally:
        await explorer.close()

if __name__ == "__main__":
    asyncio.run(main())