import { test as base, BrowserContext, Page } from '@playwright/test';
import fs from 'node:fs';

/** Two isolated browser contexts in one test: customer (anonymous) and agent (logged in). */
type Fixtures = { customer: Page; agent: Page };

export const test = base.extend<Fixtures>({
  customer: async ({ browser, baseURL }, use) => {
    const ctx = await browser.newContext({ baseURL });
    await use(await ctx.newPage());
    await ctx.close();
  },
  agent: async ({ browser }, use, testInfo) => {
    const state = process.env.AGENT_STORAGE_STATE ?? '.auth/agent.json';
    if (!fs.existsSync(state)) {
      testInfo.skip(true, `No agent session at ${state}. Run: npm run agent:login`);
    }
    const ctx: BrowserContext = await browser.newContext({ storageState: state });
    await use(await ctx.newPage());
    await ctx.close();
  },
});

export { expect } from '@playwright/test';
