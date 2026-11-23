const fs = require('fs');
const path = require('path');

function generateReminder(partyName, options = {}) {
  const agingPath = path.join(__dirname, 'data', 'aging.json');
  if (!fs.existsSync(agingPath)) {
    throw new Error('aging.json not found! Run sync first.');
  }

  const aging = JSON.parse(fs.readFileSync(agingPath, 'utf8'));
  const asOfDateStr = options.asOfDate || '23 Nov 26';
  const asOfDateIso = options.asOfDateIso || '2026-11-23';

  // Find party in debtors or creditors
  let party = aging.debtors.parties.find(p => p.partyName.toLowerCase() === partyName.toLowerCase());
  let partyType = 'debtor';

  if (!party) {
    party = aging.creditors.parties.find(p => p.partyName.toLowerCase() === partyName.toLowerCase());
    partyType = 'creditor';
  }

  if (!party) {
    // Try partial match
    party = aging.debtors.parties.find(p => p.partyName.toLowerCase().includes(partyName.toLowerCase()));
    partyType = 'debtor';
  }
  if (!party) {
    party = aging.creditors.parties.find(p => p.partyName.toLowerCase().includes(partyName.toLowerCase()));
    partyType = 'creditor';
  }

  if (!party) {
    throw new Error(`Party "${partyName}" not found in debtors or creditors!`);
  }

  const openBills = (party.bills || []).filter(b => (b.unpaidAmount !== undefined ? b.unpaidAmount : b.amount) > 0);
  const totalPending = party.netDue || openBills.reduce((s, b) => s + (b.unpaidAmount || b.amount), 0);

  // Build Biz Analyst Style Table Rows
  const tableRows = openBills.map(b => {
    const pending = b.unpaidAmount !== undefined ? b.unpaidAmount : b.amount;
    const refNo = b.voucherNumber ? `#${b.voucherNumber}` : (b.reference || 'N/A');
    return {
      date: b.formattedDate || b.date,
      refNo: b.voucherNumber,
      pendingAmount: pending,
      dueOn: b.formattedDueDate || b.dueDate,
      overdueDays: b.daysElapsed || 0,
      taxableAmount: b.taxableAmount ? Math.abs(b.taxableAmount) : Math.round((pending / 1.05) * 100) / 100,
      cartons: b.cartons || 1
    };
  });

  // Calculate 5% CD on Taxable Value
  const totalTaxable = tableRows.reduce((s, r) => s + r.taxableAmount, 0);
  const cdAmount = Math.round(totalTaxable * 0.05 * 100) / 100;
  const netAfterCd = Math.round((totalPending - cdAmount) * 100) / 100;

  // 1. Generate Biz Analyst Style WhatsApp Text
  let waText = `Hello! This is a reminder from *SKIL LIFESTYLE LLP* that your account balance of *₹${Number(totalPending).toLocaleString('en-IN')}* is overdue as of ${asOfDateStr}.\n\n`;
  waText += `📋 *Outstanding Bill-Wise Details (as of ${asOfDateStr}):*\n\n`;

  tableRows.forEach(r => {
    waText += `• *${r.date}* | *#${r.refNo}*: *₹${Number(r.pendingAmount).toLocaleString('en-IN')}* (Due: ${r.dueOn} • ${r.overdueDays}d overdue)\n`;
  });

  waText += `────────────────────────\n`;
  waText += `*Total Outstanding (${tableRows.length} Bills): ₹${Number(totalPending).toLocaleString('en-IN')}*\n`;
  
  if (partyType === 'debtor' && options.includeCd !== false) {
    waText += `*Less: 5% Cash Discount on Taxable (₹${Number(totalTaxable).toLocaleString('en-IN')}): -₹${Number(cdAmount).toLocaleString('en-IN')}*\n`;
    waText += `👉 *TOTAL TO TRANSFER (with CD): ₹${Number(netAfterCd).toLocaleString('en-IN')}*\n`;
  }
  waText += `────────────────────────\n\n`;
  waText += `*Bank Details:*\n`;
  waText += `SKIL LIFESTYLE LLP\n`;
  waText += `Union Bank of India | Rayagada\n`;
  waText += `A/c: *348621010000129*\n`;
  waText += `IFSC: *UBIN0934861*\n\n`;
  waText += `Please process the transfer and share the screenshot so we can issue your CD credit note. Thank you! 🙏\n\n`;
  waText += `_Sent through SKIL Master App_`;

  // 2. Generate Biz Analyst Style Clean HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Outstanding Bill wise details - ${party.partyName}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1E293B;
      background: #F8FAFC;
      margin: 0;
      padding: 24px;
    }
    .card {
      max-width: 780px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .greeting {
      font-size: 13.5px;
      line-height: 1.5;
      color: #334155;
      margin-bottom: 24px;
    }
    .company-title {
      text-align: center;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #0F172A;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .party-block {
      text-align: center;
      margin-bottom: 24px;
    }
    .party-name {
      font-size: 16px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 4px;
    }
    .party-address {
      font-size: 12.5px;
      color: #475569;
      line-height: 1.4;
    }
    .sub-heading {
      text-align: center;
      font-size: 14px;
      font-weight: 700;
      color: #0F172A;
      margin: 20px 0 4px 0;
    }
    .as-of-date {
      text-align: center;
      font-size: 12.5px;
      color: #64748B;
      margin-bottom: 18px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 13px;
    }
    th {
      border: 1px solid #94A3B8;
      background: #F1F5F9;
      padding: 10px 12px;
      text-align: center;
      font-weight: 700;
      color: #0F172A;
    }
    td {
      border: 1px solid #CBD5E1;
      padding: 9px 12px;
      color: #1E293B;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .total-box {
      border: 1.5px solid #0F172A;
      padding: 8px 16px;
      display: inline-block;
      font-weight: 800;
      font-size: 15px;
      background: #F8FAFC;
    }
    .total-container {
      text-align: center;
      margin-bottom: 28px;
    }
    .settlement-card {
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 6px;
      padding: 14px 18px;
      margin-bottom: 24px;
      font-size: 13px;
    }
    .settlement-card h4 {
      margin: 0 0 8px 0;
      color: #166534;
      font-size: 14px;
      font-weight: 700;
    }
    .footer {
      font-size: 12px;
      line-height: 1.5;
      color: #475569;
      border-top: 1px solid #E2E8F0;
      padding-top: 16px;
    }
    .footer b { color: #0F172A; }
    .badge-biz {
      display: inline-block;
      margin-top: 12px;
      font-size: 11px;
      color: #64748B;
    }
    @media print {
      body { background: #FFFFFF; padding: 0; }
      .card { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="greeting">
      Hello! This is a reminder that your account balance of <b>₹${Number(totalPending).toLocaleString('en-IN')}</b> was overdue as of <b>${asOfDateStr}</b>. Please find the Receivable for your reference. If you have any queries regarding this account, please contact our office as soon as possible.
    </div>

    <div class="company-title">SKIL LIFESTYLE LLP</div>

    <div class="party-block">
      <div class="party-name">${party.partyName}</div>
      <div class="party-address">
        ${party.address ? party.address.replace(/\n/g, ', ') : (party.city || 'Andhra Pradesh')}<br>
        ${party.gstin ? 'GSTIN: ' + party.gstin : ''} ${party.mobile ? '• Mob: ' + party.mobile : ''}
      </div>
    </div>

    <div class="sub-heading">Outstanding Bill wise details</div>
    <div class="as-of-date">As of Date: <b>${asOfDateStr}</b></div>

    <table>
      <thead>
        <tr>
          <th style="width: 18%;">Date</th>
          <th style="width: 28%;">Ref. No.</th>
          <th style="width: 22%;">Pending Amount (₹)</th>
          <th style="width: 18%;">Due on</th>
          <th style="width: 14%;">Overdue (Days)</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows.map(r => `
          <tr>
            <td class="text-center">${r.date}</td>
            <td class="text-center"><b>${r.refNo}</b></td>
            <td class="text-right">₹${Number(r.pendingAmount).toLocaleString('en-IN')}</td>
            <td class="text-center">${r.dueOn}</td>
            <td class="text-center" style="${r.overdueDays > 30 ? 'color: #DC2626; font-weight: 700;' : ''}">${r.overdueDays}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="total-container">
      <div class="total-box">
        Total Pending: ₹${Number(totalPending).toLocaleString('en-IN')}
      </div>
    </div>

    ${partyType === 'debtor' ? `
    <div class="settlement-card">
      <h4>Prompt Payment 5% Cash Discount (CD) Option:</h4>
      <div>• Total Outstanding: <b>₹${Number(totalPending).toLocaleString('en-IN')}</b></div>
      <div>• Less 5% CD on Taxable (₹${Number(totalTaxable).toLocaleString('en-IN')}): <b>-₹${Number(cdAmount).toLocaleString('en-IN')}</b></div>
      <div style="font-size: 14px; font-weight: 800; color: #15803D; margin-top: 6px;">
        👉 NET PAYABLE TO TRANSFER: ₹${Number(netAfterCd).toLocaleString('en-IN')}
      </div>
    </div>
    ` : ''}

    <div class="footer">
      <b>Regards,</b><br>
      <b>SKIL LIFESTYLE LLP</b><br>
      Shop No-7A, D.No.28-10-4, Floor No-3, Vasavi Plaza, Theatre Road, Jagadamba Jn, Visakhapatnam - 530020<br>
      <b>GSTIN:</b> 37AFZFS2777J1ZV • <b>Mob:</b> 9348343310<br>
      <b>Bank Details:</b> Union Bank of India | Rayagada • <b>A/c:</b> 348621010000129 • <b>IFSC:</b> UBIN0934861<br>
      <div class="badge-biz">Generated via SKIL Master Business Suite • Biz Analyst Standard Format</div>
    </div>
  </div>
</body>
</html>`;

  return {
    partyName: party.partyName,
    partyType,
    totalPending,
    totalTaxable,
    cdAmount,
    netAfterCd,
    openBillsCount: tableRows.length,
    tableRows,
    waText,
    html
  };
}

module.exports = { generateReminder };

if (require.main === module) {
  const partyArg = process.argv[2] || 'M/S.SHREE FOOTWEAR';
  const res = generateReminder(partyArg);
  console.log('=== WHATSAPP REMINDER TEXT ===\n');
  console.log(res.waText);
  
  const outHtmlPath = path.join(__dirname, '..', 'scratch', `reminder_${res.partyName.replace(/[^a-zA-Z0-9]/g, '_')}.html`);
  fs.writeFileSync(outHtmlPath, res.html);
  console.log('\nSaved HTML preview to:', outHtmlPath);
}
