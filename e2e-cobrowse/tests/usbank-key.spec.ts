import { test, expect } from '@playwright/test';
import { UsBankPage } from '../pages/UsBankPage';

/**
 * Customer side ONLY. Joining as agent needs U.S. Bank's own Glance agent
 * credentials, which this suite does not (and should not) have.
 * Opt-in: hits a production site, never run on every CI build.
 */
test.skip(!process.env.RUN_USBANK_SMOKE, 'set RUN_USBANK_SMOKE=1 to run against production usbank.com');

test('footer CoBrowse issues a 4-digit session key', async ({ page }) => {
  const usb = new UsBankPage(page);
  await usb.open();
  const key = await usb.startCobrowseFromFooter();
  expect(key).toMatch(/^\d{4}$/);
  test.info().annotations.push({ type: 'session-key', description: key });
});
