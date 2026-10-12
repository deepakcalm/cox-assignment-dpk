import { Page } from '@playwright/test';
import { readSessionKey } from '../utils/sessionKey';

/**
 * Selectors are best-effort: usbank.com was not reachable from the authoring
 * environment. Verify with `npx playwright codegen <USBANK_URL>` or Playwright MCP
 * and tighten these to stable ids/data attributes.
 */
export class UsBankPage {
  constructor(private readonly page: Page) {}

  async open(url = process.env.USBANK_URL ?? 'https://www.usbank.com/') {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.dismissCookieBanner();
  }

  async startCobrowseFromFooter(): Promise<string> {
    const footer = this.page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await footer
      .getByRole('button', { name: /co-?browse|screen ?share/i })
      .or(footer.getByRole('link', { name: /co-?browse|screen ?share/i }))
      .first()
      .click();

    // Consent / terms modal before the key is issued (if present)
    const consent = this.page.getByRole('button', { name: /accept|agree|continue|start/i }).first();
    if (await consent.isVisible({ timeout: 5_000 }).catch(() => false)) await consent.click();

    return readSessionKey(this.page);
  }

  private async dismissCookieBanner() {
    const btn = this.page.getByRole('button', { name: /accept( all)?|got it|close/i }).first();
    if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) await btn.click();
  }
}
