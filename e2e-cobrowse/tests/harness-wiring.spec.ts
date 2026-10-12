import { test, expect } from '@playwright/test';
import { CustomerHarnessPage } from '../pages/CustomerHarnessPage';

// Offline check of our own plumbing (no Glance account needed): stub the Glance
// loader and confirm the key is read back. Safe to run on every CI build.
test('harness reads 4-digit key from (stubbed) Glance visitor', async ({ page }) => {
  await page.route('**/CobrowseJS.ashx**', (r) =>
    r.fulfill({
      contentType: 'text/javascript',
      body: `window.GLANCE = { Cobrowse: { Visitor: {
        _h: {}, addEventListener(e, f) { this._h[e] = f; },
        getSessionKey() { return '4821'; },
        startSession() { setTimeout(() => this._h.sessionstart && this._h.sessionstart(), 200); }
      } } };`,
    }),
  );
  const customer = new CustomerHarnessPage(page);
  await customer.open('WIRING');
  expect(await customer.startCobrowse()).toBe('4821');
});
