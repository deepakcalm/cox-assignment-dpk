import { expect, Page } from '@playwright/test';

export class AgentViewerPage {
  constructor(private readonly page: Page) {}

  async join(key: string) {
    const tpl =
      process.env.GLANCE_AGENT_JOIN_URL ??
      'https://www.glance.net/agentjoin/AgentView.aspx?SessionKey={key}&Wait=1';
    await this.page.goto(tpl.replace('{key}', key));
  }

  /** Full text of every frame — the customer's page is rendered inside a viewer iframe. */
  async allFramesText(): Promise<string> {
    const texts = await Promise.all(
      this.page.frames().map((f) =>
        f
          .evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input, textarea'))
              .map((i) => (i as HTMLInputElement).value)
              .join(' ');
            return `${document.body?.innerText ?? ''} ${inputs}`;
          })
          .catch(() => ''),
      ),
    );
    return texts.join('\n');
  }

  async expectSees(text: string, timeout = 60_000) {
    await expect
      .poll(() => this.allFramesText(), { timeout, message: `agent never saw "${text}"` })
      .toContain(text);
  }

  async expectNeverSees(secret: string) {
    expect(await this.allFramesText(), 'PII leaked to agent view').not.toContain(secret);
  }
}
