export function renderDemoPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AWS SDET Practice</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f8fb;
      --panel: #ffffff;
      --ink: #172033;
      --muted: #5b6577;
      --line: #d9e0ea;
      --accent: #1976d2;
      --accent-strong: #125aa1;
      --ok: #16865a;
      --warn: #a15c00;
      --pending: #6d5bd0;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      background: var(--bg);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    main {
      width: min(1180px, calc(100vw - 32px));
      margin: 0 auto;
      padding: 24px 0 40px;
    }

    header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    h1 {
      margin: 0;
      font-size: 28px;
      line-height: 1.1;
      font-weight: 760;
    }

    h2 {
      margin: 0 0 12px;
      font-size: 17px;
      line-height: 1.2;
    }

    .subtitle {
      margin: 7px 0 0;
      color: var(--muted);
      font-size: 14px;
    }

    .status {
      display: flex;
      gap: 8px;
      align-items: center;
      color: var(--muted);
      font-size: 13px;
      white-space: nowrap;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--ok);
    }

    .grid {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 16px;
      align-items: start;
    }

    section,
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
    }

    section {
      padding: 16px;
    }

    label {
      display: block;
      margin-bottom: 6px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 650;
    }

    input,
    select {
      width: 100%;
      height: 38px;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 0 10px;
      color: var(--ink);
      background: #fff;
      font: inherit;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .field-wide {
      grid-column: 1 / -1;
    }

    .actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 14px;
    }

    button {
      height: 40px;
      border: 0;
      border-radius: 6px;
      padding: 0 12px;
      background: var(--accent);
      color: #fff;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }

    button:hover {
      background: var(--accent-strong);
    }

    button.secondary {
      background: #233044;
    }

    button.secondary:hover {
      background: #151e2d;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .flow {
      display: grid;
      grid-template-columns: repeat(5, minmax(116px, 1fr));
      gap: 8px;
      margin-bottom: 16px;
    }

    .step {
      min-height: 76px;
      padding: 10px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fbfcfe;
    }

    .step strong {
      display: block;
      margin-bottom: 5px;
      font-size: 13px;
    }

    .step span {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.3;
    }

    .state-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .panel {
      min-height: 220px;
      padding: 14px;
      overflow: hidden;
    }

    .empty {
      color: var(--muted);
      font-size: 13px;
    }

    .record {
      display: grid;
      gap: 8px;
      margin-top: 10px;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fbfcfe;
      font-size: 13px;
    }

    .record:first-of-type {
      margin-top: 0;
    }

    .row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }

    .key {
      color: var(--muted);
    }

    .value {
      min-width: 0;
      overflow-wrap: anywhere;
      text-align: right;
      font-weight: 650;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 2px 8px;
      border-radius: 999px;
      background: #eef2ff;
      color: var(--pending);
      font-size: 12px;
      font-weight: 750;
    }

    .badge.processed {
      background: #e9f7f1;
      color: var(--ok);
    }

    pre {
      max-height: 190px;
      margin: 14px 0 0;
      padding: 12px;
      overflow: auto;
      border-radius: 8px;
      background: #101828;
      color: #d7e1f2;
      font-size: 12px;
      line-height: 1.5;
    }

    @media (max-width: 900px) {
      .grid,
      .state-grid,
      .flow {
        grid-template-columns: 1fr;
      }

      header {
        align-items: flex-start;
        flex-direction: column;
      }

      .status {
        white-space: normal;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>AWS SDET Practice</h1>
        <p class="subtitle">LocalStack flow: API -> DynamoDB -> EventBridge -> SQS -> Worker -> S3</p>
      </div>
      <div class="status"><span class="dot"></span><span>Local API: http://localhost:3000</span></div>
    </header>

    <div class="grid">
      <section>
        <h2>Order request</h2>
        <div class="form-grid">
          <div class="field-wide">
            <label for="customerId">Customer</label>
            <input id="customerId" value="client-42">
          </div>
          <div>
            <label for="pair">Pair</label>
            <select id="pair">
              <option>EUR/USD</option>
              <option>GBP/USD</option>
              <option>USD/JPY</option>
            </select>
          </div>
          <div>
            <label for="side">Side</label>
            <select id="side">
              <option>BUY</option>
              <option>SELL</option>
            </select>
          </div>
          <div class="field-wide">
            <label for="amount">Amount</label>
            <input id="amount" type="number" value="1000" min="1">
          </div>
        </div>
        <div class="actions">
          <button id="createOrder">Create order</button>
          <button id="runWorker" class="secondary">Run worker once</button>
        </div>
        <pre id="lastResponse">Click "Create order" to send POST /orders.</pre>
      </section>

      <section>
        <h2>Flow map</h2>
        <div class="flow">
          <div class="step"><strong>1. API</strong><span>Receives POST /orders and returns 202.</span></div>
          <div class="step"><strong>2. DynamoDB</strong><span>Stores order as PENDING.</span></div>
          <div class="step"><strong>3. EventBridge</strong><span>Routes OrderCreated event.</span></div>
          <div class="step"><strong>4. SQS</strong><span>Queue waits for worker.</span></div>
          <div class="step"><strong>5. S3</strong><span>Worker writes receipt and marks PROCESSED.</span></div>
        </div>

        <div class="state-grid">
          <div class="panel">
            <h2>DynamoDB</h2>
            <div id="orders" class="empty">No orders yet.</div>
          </div>
          <div class="panel">
            <h2>S3</h2>
            <div id="receipts" class="empty">No receipts yet.</div>
          </div>
        </div>
      </section>
    </div>
  </main>

  <script>
    const createButton = document.querySelector('#createOrder');
    const workerButton = document.querySelector('#runWorker');
    const lastResponse = document.querySelector('#lastResponse');
    const ordersEl = document.querySelector('#orders');
    const receiptsEl = document.querySelector('#receipts');

    function readOrderPayload() {
      return {
        customerId: document.querySelector('#customerId').value,
        pair: document.querySelector('#pair').value,
        side: document.querySelector('#side').value,
        amount: Number(document.querySelector('#amount').value)
      };
    }

    function showJson(value) {
      lastResponse.textContent = JSON.stringify(value, null, 2);
    }

    function row(label, value) {
      return '<div class="row"><span class="key">' + label + '</span><span class="value">' + value + '</span></div>';
    }

    function renderState(state) {
      ordersEl.className = state.orders.length ? '' : 'empty';
      ordersEl.innerHTML = state.orders.length
        ? state.orders.map((order) => (
            '<div class="record">' +
            row('orderId', order.orderId) +
            row('pair', order.pair + ' ' + order.side) +
            row('amount', order.amount) +
            row('status', '<span class="badge ' + (order.status === 'PROCESSED' ? 'processed' : '') + '">' + order.status + '</span>') +
            row('correlationId', order.correlationId) +
            '</div>'
          )).join('')
        : 'No orders yet.';

      receiptsEl.className = state.receipts.length ? '' : 'empty';
      receiptsEl.innerHTML = state.receipts.length
        ? state.receipts.map((receipt) => (
            '<div class="record">' +
            row('S3 key', receipt.key) +
            row('orderId', receipt.body.orderId) +
            row('status', '<span class="badge processed">' + receipt.body.status + '</span>') +
            row('processedAt', receipt.body.processedAt) +
            '</div>'
          )).join('')
        : 'No receipts yet.';
    }

    async function refreshState() {
      const response = await fetch('/dev/state');
      renderState(await response.json());
    }

    async function withBusy(button, action) {
      button.disabled = true;
      try {
        await action();
      } catch (error) {
        showJson({ error: error.message });
      } finally {
        button.disabled = false;
      }
    }

    createButton.addEventListener('click', () => withBusy(createButton, async () => {
      const response = await fetch('/orders', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': 'browser-demo-' + Date.now()
        },
        body: JSON.stringify(readOrderPayload())
      });
      showJson(await response.json());
      await refreshState();
    }));

    workerButton.addEventListener('click', () => withBusy(workerButton, async () => {
      const response = await fetch('/dev/process-next', { method: 'POST' });
      showJson(await response.json());
      await refreshState();
    }));

    refreshState().catch((error) => showJson({ error: error.message }));
  </script>
</body>
</html>`;
}
