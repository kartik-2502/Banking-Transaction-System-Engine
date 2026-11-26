import { Transaction } from '../types';

export function buildTransactionReceiptHtml(
  tx: Transaction,
  accountNumber: string,
  accountHolder: string
): string {
  const timestamp = new Date(tx.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Transaction Receipt - ${tx.transactionId}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #F3E7D4; color: #1B130D; padding: 32px; }
    .card { max-width: 640px; margin: 0 auto; background: #FFFDF9; border: 2px solid #CEB896; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(27,19,13,0.08); }
    .header { background: #261D15; color: #F4ECE0; padding: 24px 28px; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-size: 22px; font-weight: 700; color: #D9A86C; }
    .badge { background: #10B981; color: #FFFFFF; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .body { padding: 28px; }
    .amount-box { background: #E9D9C0; border: 1px solid #CEB896; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 22px; }
    .amount-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #3F3124; font-weight: 600; }
    .amount-value { font-size: 32px; font-weight: 800; color: #1B130D; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    td { padding: 10px 4px; border-bottom: 1px solid #E2D0B4; }
    td.label { color: #3F3124; font-weight: 600; width: 42%; }
    td.val { color: #1B130D; font-family: Consolas, monospace; text-align: right; }
    .footer { padding: 16px 28px; background: #EFE2CE; font-size: 12px; color: #3F3124; text-align: center; border-top: 1px solid #D9C7AB; }
    @media print { body { background: #FFFFFF; padding: 0; } .card { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div class="brand">Bank</div>
        <div style="font-size:12px;opacity:0.85;">Official Transaction Receipt</div>
      </div>
      <span class="badge">${tx.status}</span>
    </div>
    <div class="body">
      <div class="amount-box">
        <div class="amount-label">${tx.type} AMOUNT</div>
        <div class="amount-value">₹${Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <table>
        <tr><td class="label">Transaction Reference</td><td class="val">${tx.transactionId}</td></tr>
        <tr><td class="label">Account Number</td><td class="val">${accountNumber}</td></tr>
        <tr><td class="label">Account Holder</td><td class="val">${accountHolder}</td></tr>
        <tr><td class="label">Operation Type</td><td class="val">${tx.type}</td></tr>
        ${tx.sourceAccountNumber ? `<tr><td class="label">Source Account</td><td class="val">${tx.sourceAccountNumber}</td></tr>` : ''}
        ${tx.destinationAccountNumber ? `<tr><td class="label">Destination Account</td><td class="val">${tx.destinationAccountNumber}</td></tr>` : ''}
        <tr><td class="label">Date &amp; Time</td><td class="val">${timestamp}</td></tr>
      </table>
    </div>
    <div class="footer">
      Computer-generated transaction receipt &bull; Bank Digital Platform &bull; No physical signature required.
    </div>
  </div>
</body>
</html>`;
}

export function downloadTransactionReceipt(
  tx: Transaction,
  accountNumber: string,
  accountHolder: string
) {
  const html = buildTransactionReceiptHtml(tx, accountNumber, accountHolder);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Receipt_${tx.transactionId}.html`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // Defer cleanup so the browser completes reading the Blob URL before revocation
  setTimeout(() => {
    if (a.parentNode) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 5000);
}

export function printTransactionReceipt(
  tx: Transaction,
  accountNumber: string,
  accountHolder: string
) {
  const html = buildTransactionReceiptHtml(tx, accountNumber, accountHolder);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (iframe.parentNode) document.body.removeChild(iframe);
      }, 2000);
    }, 200);
  } else {
    window.print();
  }
}
