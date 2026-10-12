import { Page } from '@playwright/test';
import { readSessionKey } from '../utils/sessionKey';

export class CustomerHarnessPage {
  constructor(private readonly page: Page) {}

  async open(marker: string) {
    await this.page.goto(`/?marker=${encodeURIComponent(marker)}`);
    await this.page.waitForFunction(() => !!(window as any).GLANCE?.Cobrowse?.Visitor, null, {
      timeout: 30_000,
    });
  }

  async enterPii(pii: { acct: string; ssn: string }) {
    await this.page.locator('#acct').fill(pii.acct);
    await this.page.locator('#ssn').fill(pii.ssn);
  }

  async startCobrowse(): Promise<string> {
    await this.page.locator('#cobrowse-btn').click();
    return readSessionKey(this.page);
  }
}
