ai chat application with model context protocol support, both as server and client.

app gets text and build fullstack apps(let's call them built apps) including smart contracts.

types of users: admins and developers

admins can:

- config all needed for app to run via web ui so no env vars are needed, blank env vars do not break app
- and also act as developers

developers can:

- config LLMs: api url, model, api key
- config mcp servers(app is mcp client)
- enable or disable app as mcp server

both the app and built apps should have the same base. And both should allow the right type of user to handle auth, access, logs and tests. And everything configurable and expandable via the web ui.

features to skip on MVP:
- app as mcp server