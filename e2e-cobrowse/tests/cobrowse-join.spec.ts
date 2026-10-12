import { test, expect } from '../fixtures/cobrowse';
import { CustomerHarnessPage } from '../pages/CustomerHarnessPage';
import { AgentViewerPage } from '../pages/AgentViewerPage';

test.skip(!process.env.GLANCE_GROUP_ID, 'GLANCE_GROUP_ID not set (see .env.example)');

test('customer shares 4-digit key, agent joins, PII stays masked', async ({ customer, agent }) => {
  const marker = `RUN-${Date.now()}`;
  const pii = { acct: '9988776655443322', ssn: '123-45-6789' };

  const cust = new CustomerHarnessPage(customer);
  const viewer = new AgentViewerPage(agent);

  await test.step('customer opens app and types PII', async () => {
    await cust.open(marker);
    await cust.enterPii(pii);
  });

  const key = await test.step('customer clicks CoBrowse and gets 4-digit key', async () => {
    const k = await cust.startCobrowse();
    expect(k).toMatch(/^\d{4}$/);
    return k;
  });

  await test.step(`agent joins with key ${key}`, async () => {
    await viewer.join(key);
    await viewer.expectSees(marker); // proves the agent is rendering the live customer DOM
  });

  await test.step('PII is not visible to the agent', async () => {
    await viewer.expectNeverSees(pii.acct);
    await viewer.expectNeverSees(pii.ssn);
    await viewer.expectNeverSees('$12,345.67');
  });

  await test.step('PII typed after join is also not visible', async () => {
    const late = '5555444433332222';
    await customer.locator('#acct').fill(late);
    await customer.locator('[data-testid="marker"]').evaluate((el, t) => (el.textContent = t), `${marker}-SYNC`);
    await viewer.expectSees(`${marker}-SYNC`); // DOM sync caught up...
    await viewer.expectNeverSees(late); // ...and the masked field did not leak
  });
});
