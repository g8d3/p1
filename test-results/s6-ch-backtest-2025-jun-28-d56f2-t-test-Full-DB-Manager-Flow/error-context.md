# Page snapshot

```yaml
- heading "Database Manager" [level=1]
- text: "Type:"
- combobox "Type:":
  - option "SQLite" [selected]
  - option "Postgres"
  - option "MySQL"
- text: "Host:"
- textbox "Host:"
- text: "Port:"
- textbox "Port:"
- text: "User:"
- textbox "User:"
- text: "Password:"
- textbox "Password:"
- text: "Database/File:"
- textbox "Database/File:": ":memory:"
- button "Save Credential"
- heading "Saved Credentials" [level=2]
- list:
  - listitem:
    - text: "[sqlite] @localhost:/a.db"
    - button "Connect"
  - listitem:
    - text: "[sqlite] @:/:memory:"
    - button "Connect"
```