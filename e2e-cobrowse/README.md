# CoBrowse e2e (Glance + Playwright)

The goal: a customer clicks **CoBrowse**, gets a **4-digit key**, and the agent joins with that key. The agent sees the live page with **PII masked**.

## Limits on testing against usbank.com

| Step | usbank.com | Your own page (harness / your app) |
|---|---|---|
| Customer clicks CoBrowse and gets a 4-digit key | Possible (`usbank-smoke`) | Yes |
| Agent joins with the key | **No.** This needs U.S. Bank's Glance agent login | Yes, with your Glance tenant |
| Check that PII is masked | No | Yes |
| Safe to run in CI | No: production site, bot detection, terms of service | Yes |

To test the whole flow you need a customer page where you set the Glance group and the masking rules.
`harness/` is that page. Later, point the same tests at your real app.

## Playwright test vs. Playwright MCP

They do different jobs, and you need both:

- **Playwright test (`tests/`)**: the regression suite. It is deterministic, runs in CI and gives a pass/fail result.
- **Playwright MCP (`/.mcp.json`)**: for exploring and writing tests. It starts two browsers:
  - `pw-customer` is anonymous.
  - `pw-agent` uses the saved agent login.

  Claude uses these browsers to find the real selectors (the footer button, the consent modal, the key element, the agent viewer iframe). You then copy those selectors into the page objects. MCP runs are not repeatable, so don't use them as the CI gate.

## Setup

```bash
cd e2e-cobrowse
npm i
cp .env.example .env          # set GLANCE_GROUP_ID / GLANCE_SITE / GLANCE_AGENT_JOIN_URL
npm run agent:login           # log in to Glance as agent once, saves .auth/agent.json
npm run test:wiring           # offline plumbing check
npm run test:harness          # full customer -> key -> agent join -> PII masked
RUN_USBANK_SMOKE=1 npm run test:usbank   # opt-in, customer side only
```

## How the main test works (`tests/cobrowse-join.spec.ts`)

1. Two isolated browser contexts are opened: a customer and an agent.
2. The customer opens the harness with a unique `RUN-<ts>` marker and types sample PII.
3. The customer clicks CoBrowse. `readSessionKey()` reads the key in this order:
   1. the page's own `data-testid`
   2. the Glance Visitor API
   3. any Glance UI element that contains 4 digits
4. The agent opens the join URL with the key. The test passes once any frame on the agent side shows the marker.
5. The test checks that no PII value appears in any agent frame's text or input values. It does this before and after DOM sync.

## Not yet verified (check these first)

- **usbank.com selectors.** The authoring sandbox could not reach the site. Run `npx playwright codegen https://www.usbank.com/` or use MCP, then update `pages/UsBankPage.ts`.
- **`GLANCE_AGENT_JOIN_URL`.** The URL depends on the tenant and viewer (classic or Panorama). Check it in Glance admin.
- **`GLANCE.Cobrowse.Visitor.getSessionKey` and the `sessionstart` event name.** Check both against your Glance JS version. The DOM fallback covers you if they differ.
- **Masking.** Set up the masking selectors in Glance admin as well. The test checks the actual result, so it catches a gap in either place.

## Next steps

1. Add Glance to the real app instead of the harness. Keep the same specs and change only `baseURL`.
2. Add negative tests:
   - an invalid or expired key is rejected
   - the customer ends the session and the agent is disconnected
   - a second agent with the same key
3. Add a check on the customer side that an agent has joined (the Glance visitor event or the UI indicator).
4. CI: run `test:wiring` on every PR. Run `test:harness` nightly with the agent `storageState` stored as a secret.
