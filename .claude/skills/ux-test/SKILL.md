---
name: ux-test
description: Run a UX test of a flow in Samboo with the ux-tester agent. Usage: /ux-test <flow> [persona], e.g. "/ux-test onboarding" or "/ux-test connect account, persona: 60-year-old inexperienced user".
---

Run a UX test of the flow given in the arguments: $ARGUMENTS

If no flow is given, ask which of these to test:

- **registration** – create an account and verify email (`(auth)/register`, `verify-email`)
- **login** – log in, forgotten password (`(auth)/login`, `forgotten-password`)
- **onboarding** – profile, create search filter, connect account (`(onboarding)/*`)
- **search** – browse listings and open a listing (`(tabs)/search`)
- **saved** – save listings to lists and find them again (`(tabs)/saved`)
- **connect account** – invite and connect with a partner, using both test users
- **settings** – change profile, filter and notifications (`(tabs)/settings`, `update-filter`)
- **everything** – free exploration of the whole app

## Steps

1. Check that the dev server responds:
   `curl -s -o /dev/null -w "%{http_code}" http://localhost:8081`
   If it doesn't respond, start it in the background with `npx expo start --web` and wait until it responds.
2. Launch the `ux-tester` agent with the flow, any persona and today's date in the task.
3. When the agent is done: show the result and the top 3 improvements, and link to the report in `ux-reports/`.
