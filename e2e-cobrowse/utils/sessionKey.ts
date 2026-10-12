import { expect, Frame, Page } from '@playwright/test';

/**
 * Reads the 4-digit Glance session key from a customer page.
 * Order: our own data-testid -> Glance Visitor API -> any Glance UI element/frame
 * containing a standalone 4-digit number. Glance's UI markup varies by tenant
 * and version, so the DOM fallback is intentionally loose.
 */
export async function readSessionKey(page: Page, timeout = 30_000): Promise<string> {
  let key: string | null = null;
  await expect
    .poll(
      async () => {
        for (const frame of page.frames()) {
          key = await keyFromFrame(frame);
          if (key) return key;
        }
        return null;
      },
      { timeout, message: '4-digit cobrowse session key never appeared' },
    )
    .toMatch(/^\d{4}$/);
  return key!;
}

async function keyFromFrame(frame: Frame): Promise<string | null> {
  return frame
    .evaluate(() => {
      const fourDigits = (s?: string | null) => s?.match(/(?<!\d)\d{4}(?!\d)/)?.[0] ?? null;

      const own = document.querySelector('[data-testid="session-key"]')?.textContent?.trim();
      if (own && /^\d{4}$/.test(own)) return own;

      const V = (window as any).GLANCE?.Cobrowse?.Visitor;
      try {
        const k = V?.getSessionKey?.();
        if (k && /^\d{4}$/.test(String(k))) return String(k);
      } catch {}

      const candidates = document.querySelectorAll(
        '[id*="glance" i], [class*="glance" i], [id*="ssnkey" i], [class*="ssnkey" i]',
      );
      for (const el of Array.from(candidates)) {
        const k = fourDigits((el as HTMLElement).innerText);
        if (k) return k;
      }
      return null;
    })
    .catch(() => null); // cross-origin / detached frames
}
