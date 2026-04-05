# Cloude Code ToolBox — Intelligence readiness

Run commands from the Command Palette (`Cloude Code ToolBox: …`) or the **MCP & skills** hub.

## ✓ claude-md
`CLAUDE.md` looks populated.

Suggested: `CloudeCodeToolBox.openInstructionsPicker`

## ✓ claude-rules
No `.claude/rules/*.md` files (optional scoped rules).

Suggested: `CloudeCodeToolBox.syncCursorRules`

## ✓ agents-md
No `AGENTS.md` (optional agent-oriented instructions).

Suggested: `CloudeCodeToolBox.openInstructionsPicker`

## ✓ memory-bank
`memory-bank/` directory present.

Suggested: `CloudeCodeToolBox.initMemoryBank`

## ○ mcp-json
Workspace `.vscode/mcp.json` missing.

Suggested: `CloudeCodeToolBox.portCursorMcp`

## ✓ cursorrules
Cursor rules (`.cursorrules` and/or `.cursor/rules`) present.

Suggested: `CloudeCodeToolBox.createCursorrulesTemplate`

## ✓ copilot-instructions-legacy
No `.github/copilot-instructions.md` (legacy GitHub Copilot instructions).

Suggested: `CloudeCodeToolBox.mergeCopilotInstructionsIntoClaudeMd`

## ✓ mcp-vs-claude-session
VS Code **`.vscode/mcp.json`** powers editor MCP; **Claude Code** uses **`/mcp`** in the Claude panel and may use `~/.claude/settings.json`. Configure both if you use MCP in each surface.

Suggested: `CloudeCodeToolBox.openClaudeUserSettingsJson`
