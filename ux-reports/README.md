# UX reports

Reports from the UX agent (`.claude/agents/ux-tester.md`) end up here. The agent acts as a user, clicks around the web version of the app in mobile view and writes down what works well and what needs improvement.

## Getting started

1. Install the browser for Playwright (once):

   ```bash
   npx playwright install chromium
   ```

2. Start the app on the web:

   ```bash
   npx expo start --web
   ```

3. Run a test in Claude Code:

   ```
   /ux-test onboarding
   ```

   The first time, Claude Code asks whether you want to approve the `playwright` MCP server from `.mcp.json` – answer yes.

## Examples

```
/ux-test registration
/ux-test search, persona: 65-year-old inexperienced smartphone user
/ux-test connect account
/ux-test everything
```

## Structure

- `<date>-<flow>.md` – reports
- `screenshots/` – screenshots from the tests
