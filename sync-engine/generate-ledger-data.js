const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET_DATA_DIRS = [
  path.join(__dirname, 'data'),
  path.join(__dirname, 'public', 'data'),
  path.join(ROOT, 'web', 'data'),
  path.join(ROOT, 'android-app', 'www', 'data')
];

// Supplier invoice billing date overrides (where Tally entry date differs from PDF supplier billing date)
const BILLING_DATE_OVERRIDES = {
  'SKIL-001': '2026-08-06',
  'SKIL-002': '2026-08-06',
  'SKIL-003': '2026-08-06',
  'SKIL-004': '2026-08-06',
  'SKIL-005': '2026-08-06',
  'SKIL-006': '2026-08-06',
  'SKIL-007': '2026-08-06',
  'SKIL-008': '2026-08-06',
  'SKIL-009': '2026-08-07',
  'SKIL-010': '2026-08-07',
  'SKIL-020': '2026-08-11',
  'SKIL-043': '2026-09-28',
  'SKIL-078': '2026-10-31'
};

// Explicit CN -> Sales invoice list mapping verified against Tally Credit Notes #1..#12
const CN_INVOICE_MAP = {
  '1': ['SKIL-004', 'SKIL-005', 'SKIL-006'],
  '2': ['SKIL-011', 'SKIL-012', 'SKIL-013', 'SKIL-014', 'SKIL-015', 'SKIL-016', 'SKIL-017', 'SKIL-018', 'SKIL-019', 'SKIL-020'],
  '3': ['SKIL-002'],
  '4': ['SKIL-001', 'SKIL-003', 'SKIL-007', 'SKIL-008', 'SKIL-009', 'SKIL-010', 'SKIL-021', 'SKIL-022'],
  '5': ['SKIL-038', 'SKIL-039', 'SKIL-044', 'SKIL-045', 'SKIL-046'],
  '6': ['SKIL-031', 'SKIL-032', 'SKIL-033', 'SKIL-034', 'SKIL-036', 'SKIL-037', 'SKIL-049', 'SKIL-051', 'SKIL-053'],
  '7': ['SKIL-035', 'SKIL-054'],
  '9': ['SKIL-041'],
  '10': ['SKIL-057', 'SKIL-070', 'SKIL-073', 'SKIL-074', 'SKIL-075', 'SKIL-076'],
  '11': ['SKIL-059', 'SKIL-060', 'SKIL-061'],
  '12': ['SKIL-048', 'SKIL-050', 'SKIL-052']
};

const KNOWN_CITIES = [
  'Rayagada', 'Malkangiri', 'Parvathipuram', 'Parvatipuram', 'Srikakulam', 'Sompeta',
  'Vizianagaram', 'Visakhapatnam', 'Rajamahendravaram', 'Rajahmundry', 'Anakapalli',
  'Nellore', 'Dhenkanal', 'Sarang', 'Jajpur Road', 'Jajpur', 'Brajrajnagar',
  'Jharsuguda', 'Nayagarh', 'Rajam', 'Kozhikode', 'Kolkata', 'Howrah'
];

// Live Tally Nov 23-25 delta ledger + vouchers (merged only when base sync-engine/data lags live Tally)
const LIVE_DELTA_LEDGERS = [
  {
    name: 'SRI VENKATESWARA FO0TWEAR AND GENERAL',
    parent: 'Sundry Debtors',
    gstin: '37AKGPT1415N1ZS',
    state: 'Andhra Pradesh',
    address: '14-112/A and B, NEAR SAIRAM TEMPLE, SAIRAM MANDIR STREET, SOMPETA, Srikakulam, Andhra Pradesh, 532284',
    mobile: '9441053510',
    openingBalance: 0
  }
];

function buildApSalesLedgerEntries(party, gross, taxable, gstHalf, ro) {
  return [
    { ledgerName: party, amount: -gross, isDeemedPositive: true, isPartyLedger: true },
    { ledgerName: 'GST Sales', amount: taxable, isDeemedPositive: false, isPartyLedger: false },
    { ledgerName: 'Output CGST', amount: gstHalf, isDeemedPositive: false, isPartyLedger: false },
    { ledgerName: 'Output SGST', amount: gstHalf, isDeemedPositive: false, isPartyLedger: false },
    { ledgerName: 'Round Off -(+/-)', amount: ro, isDeemedPositive: false, isPartyLedger: false }
  ];
}

function buildAjantaPurchaseLedgerEntries(gross, taxable, igst, ro) {
  return [
    { ledgerName: 'Ajanta Shoes India Pvt. Ltd.', amount: gross, isDeemedPositive: false, isPartyLedger: true },
    { ledgerName: 'GST Purchase', amount: -taxable, isDeemedPositive: true, isPartyLedger: false },
    { ledgerName: 'Input IGST', amount: -igst, isDeemedPositive: true, isPartyLedger: false },
    { ledgerName: 'Round Off -(+/-)', amount: -ro, isDeemedPositive: true, isPartyLedger: false }
  ];
}

const LIVE_DELTA_VOUCHERS = [
  {
    id: 'delta-pur-96', date: '20261123', voucherType: 'Purchase', voucherNumber: '96', reference: '1900428997',
    partyName: 'Ajanta Shoes India Pvt. Ltd.', amount: 9542, narration: 'SVFAG 2CTN',
    ledgerEntries: buildAjantaPurchaseLedgerEntries(9542, 9087.36, 454.37, 0.27),
    inventoryEntries: [
      { stockItemName: 'AJ FITNESS PLUS N.BLUE 06/10 MRP159/-', actualQty: '96 Pairs = 2 Box', billedQty: '96 Pairs = 2 Box', rate: '94.66/Pairs', amount: -9087.36, discount: 0 }
    ]
  },
  {
    id: 'delta-pur-97', date: '20261123', voucherType: 'Purchase', voucherNumber: '97', reference: '1900429137',
    partyName: 'Ajanta Shoes India Pvt. Ltd.', amount: 50601, narration: 'SVFAG 10CTNS',
    ledgerEntries: buildAjantaPurchaseLedgerEntries(50601, 48191.16, 2409.56, 0.28),
    inventoryEntries: [
      { stockItemName: 'AJ ATL 587/86 04/07 MRP246/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '146.44/Pairs', amount: -4393.20, discount: 0 },
      { stockItemName: 'AJ ATL 587/80 04/07 MRP246/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '146.44/Pairs', amount: -4393.20, discount: 0 },
      { stockItemName: 'AJ FITNESS PLUS 105 BLACK 06/09 MRP159/-', actualQty: '96 Pairs = 2 Box', billedQty: '96 Pairs = 2 Box', rate: '94.66/Pairs', amount: -9087.36, discount: 0 },
      { stockItemName: 'AJ PUG 8482/1 06/09 MRP309.75/-', actualQty: '90 Pairs = 3 Box', billedQty: '90 Pairs = 3 Box', rate: '194.94/Pairs', amount: -17544.60, discount: 0 },
      { stockItemName: 'AJ TOPZ 101 BLUE 06/10 MRP149/-', actualQty: '144 Pairs = 3 Box', billedQty: '144 Pairs = 3 Box', rate: '88.70/Pairs', amount: -12772.80, discount: 0 }
    ]
  },
  {
    id: 'delta-pur-98', date: '20261123', voucherType: 'Purchase', voucherNumber: '98', reference: '1900429136',
    partyName: 'Ajanta Shoes India Pvt. Ltd.', amount: 97016, narration: 'SF 19CTNS',
    ledgerEntries: buildAjantaPurchaseLedgerEntries(97016, 92396.10, 4619.82, 0.08),
    inventoryEntries: [
      { stockItemName: 'AJ ATL 576/9 04/07 MRP242/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '144.06/Pairs', amount: -4321.80, discount: 0 },
      { stockItemName: 'AJ ATL 578/86 04/07 MRP298/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '177.39/Pairs', amount: -5321.70, discount: 0 },
      { stockItemName: 'AJ ATL 585/86 04/07 MRP195/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '116.08/Pairs', amount: -3482.40, discount: 0 },
      { stockItemName: 'AJ ATL 591/86 04/07 MRP239/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '142.30/Pairs', amount: -4269.00, discount: 0 },
      { stockItemName: 'AJ CKL 203/86 01/04 MRP256/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '152.39/Pairs', amount: -4571.70, discount: 0 },
      { stockItemName: 'AJ PUG 8468/41 06/10 MRP299/-', actualQty: '60 Pairs = 2 Box', billedQty: '60 Pairs = 2 Box', rate: '177.98/Pairs', amount: -10678.80, discount: 0 },
      { stockItemName: 'AJ PUL 9295/3 05/08 MRP274/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '163.10/Pairs', amount: -4893.00, discount: 0 },
      { stockItemName: 'AJ PUL 9295/73 05/08 MRP274/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '163.10/Pairs', amount: -4893.00, discount: 0 },
      { stockItemName: 'AJ PUL 9295/83 05/08 MRP274/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '163.10/Pairs', amount: -4893.00, discount: 0 },
      { stockItemName: 'AJ PUL 9356/9 05/08 MRP359/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '213.70/Pairs', amount: -6411.00, discount: 0 },
      { stockItemName: 'AJ PUL 9368/2 05/08 MRP279/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '166.08/Pairs', amount: -4982.40, discount: 0 },
      { stockItemName: 'AJ PUL 9368/73 05/08 MRP279/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '166.08/Pairs', amount: -4982.40, discount: 0 },
      { stockItemName: 'AJ PUL 9372/73 05/08 MRP345/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '205.36/Pairs', amount: -6160.80, discount: 0 },
      { stockItemName: 'AJ PULC 1036/80 01/03 MRP265/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '157.75/Pairs', amount: -4732.50, discount: 0 },
      { stockItemName: 'AJ TOPZ 101 BLUE 02/05 MRP139/-', actualQty: '60 Pairs = 1 Box', billedQty: '60 Pairs = 1 Box', rate: '82.75/Pairs', amount: -4965.00, discount: 0 },
      { stockItemName: 'AJ TOPZ 101 BLUE 06/10 MRP149/-', actualQty: '96 Pairs = 2 Box', billedQty: '96 Pairs = 2 Box', rate: '88.70/Pairs', amount: -8515.20, discount: 0 },
      { stockItemName: 'AJ TOTO SOFT/44 DP.CYAN 09/01 MRP121/-', actualQty: '60 Pairs = 1 Box', billedQty: '60 Pairs = 1 Box', rate: '72.04/Pairs', amount: -4322.40, discount: 0 }
    ]
  },
  {
    id: 'delta-pur-99', date: '20261123', voucherType: 'Purchase', voucherNumber: '99', reference: '1900429263',
    partyName: 'Ajanta Shoes India Pvt. Ltd.', amount: 32182, narration: 'SVFAG 7CTNS',
    ledgerEntries: buildAjantaPurchaseLedgerEntries(32182, 30649.20, 1532.46, 0.34),
    inventoryEntries: [
      { stockItemName: 'AJ CUSHION 024 BLB 06/10 MRP146/-', actualQty: '96 Pairs = 2 Box', billedQty: '96 Pairs = 2 Box', rate: '86.92/Pairs', amount: -8344.32, discount: 0 },
      { stockItemName: 'AJ CUSHION 024 BLUE 04/05 MRP137/-', actualQty: '120 Pairs = 2 Box', billedQty: '120 Pairs = 2 Box', rate: '81.57/Pairs', amount: -9788.40, discount: 0 },
      { stockItemName: 'AJ CUSHION 024 BLUE 06/10 MRP146/-', actualQty: '144 Pairs = 3 Box', billedQty: '144 Pairs = 3 Box', rate: '86.92/Pairs', amount: -12516.48, discount: 0 }
    ]
  },
  {
    id: 'delta-pur-100', date: '20261123', voucherType: 'Purchase', voucherNumber: '100', reference: '1900429266',
    partyName: 'Ajanta Shoes India Pvt. Ltd.', amount: 120891, narration: 'JYOTHI 25CTNS',
    ledgerEntries: buildAjantaPurchaseLedgerEntries(120891, 115134.60, 5756.73, -0.33),
    inventoryEntries: [
      { stockItemName: 'AJ CUSHION 024 BLUE 04/05 MRP137/-', actualQty: '600 Pairs = 10 Box', billedQty: '600 Pairs = 10 Box', rate: '81.57/Pairs', amount: -48942.00, discount: 0 },
      { stockItemName: 'AJ CUSHION 024 BLUE 05/05 MRP137/-', actualQty: '300 Pairs = 5 Box', billedQty: '300 Pairs = 5 Box', rate: '81.57/Pairs', amount: -24471.00, discount: 0 },
      { stockItemName: 'AJ CUSHION 024 BLUE 06/10 MRP146/-', actualQty: '480 Pairs = 10 Box', billedQty: '480 Pairs = 10 Box', rate: '86.92/Pairs', amount: -41721.60, discount: 0 }
    ]
  },
  {
    id: 'delta-pur-101', date: '20261123', voucherType: 'Purchase', voucherNumber: '101', reference: '1900429264',
    partyName: 'Ajanta Shoes India Pvt. Ltd.', amount: 59983, narration: 'DELIGHT 13CTNS',
    ledgerEntries: buildAjantaPurchaseLedgerEntries(59983, 57126.24, 2856.31, 0.45),
    inventoryEntries: [
      { stockItemName: 'AJ CUSHION 024 BLB 02/05 MRP137/-', actualQty: '120 Pairs = 2 Box', billedQty: '120 Pairs = 2 Box', rate: '81.57/Pairs', amount: -9788.40, discount: 0 },
      { stockItemName: 'AJ CUSHION 024 BL+BZ 04/05 MRP137/-', actualQty: '120 Pairs = 2 Box', billedQty: '120 Pairs = 2 Box', rate: '81.57/Pairs', amount: -9788.40, discount: 0 },
      { stockItemName: 'AJ CUSHION 024 BLB 06/10 MRP146/-', actualQty: '288 Pairs = 6 Box', billedQty: '288 Pairs = 6 Box', rate: '86.92/Pairs', amount: -25032.96, discount: 0 },
      { stockItemName: 'AJ CUSHION 024 BL+BZ 06/09 MRP146/-', actualQty: '144 Pairs = 3 Box', billedQty: '144 Pairs = 3 Box', rate: '86.92/Pairs', amount: -12516.48, discount: 0 }
    ]
  },
  {
    id: 'delta-pur-102', date: '20261125', voucherType: 'Purchase', voucherNumber: '102', reference: '1900429720',
    partyName: 'Ajanta Shoes India Pvt. Ltd.', amount: 21870, narration: 'SF 5CTNS',
    ledgerEntries: buildAjantaPurchaseLedgerEntries(21870, 20829, 1041.44, -0.44),
    inventoryEntries: [
      { stockItemName: 'AJ CEG 1003 B.BLUE 06/09 MRP135/-', actualQty: '48 Pairs = 1 Box', billedQty: '48 Pairs = 1 Box', rate: '80.38/Pairs', amount: -3858.24, discount: 0 },
      { stockItemName: 'AJ CEG 1003 B.BLUE 06/10 MRP135/-', actualQty: '48 Pairs = 1 Box', billedQty: '48 Pairs = 1 Box', rate: '80.38/Pairs', amount: -3858.24, discount: 0 },
      { stockItemName: 'AJ CEG 1009 YELLOW 06/10 MRP135/-', actualQty: '48 Pairs = 1 Box', billedQty: '48 Pairs = 1 Box', rate: '80.38/Pairs', amount: -3858.24, discount: 0 },
      { stockItemName: 'AJ LOOK 11 B.GREEN 06/10 MRP179/-', actualQty: '48 Pairs = 1 Box', billedQty: '48 Pairs = 1 Box', rate: '106.56/Pairs', amount: -5114.88, discount: 0 },
      { stockItemName: 'AJ NANO 07 P.BLUE 09/01 MRP129/-', actualQty: '60 Pairs = 1 Box', billedQty: '60 Pairs = 1 Box', rate: '68.99/Pairs', amount: -4139.40, discount: 0 }
    ]
  },
  {
    id: 'delta-pur-103', date: '20261125', voucherType: 'Purchase', voucherNumber: '103', reference: '1900429750',
    partyName: 'Ajanta Shoes India Pvt. Ltd.', amount: 32757, narration: 'SF 6 CTNS',
    ledgerEntries: buildAjantaPurchaseLedgerEntries(32757, 31197, 1559.87, 0.13),
    inventoryEntries: [
      { stockItemName: 'AJ PUG 8511/1 05/09 MRP299/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '177.99/Pairs', amount: -5339.70, discount: 0 },
      { stockItemName: 'AJ PUG 8511/4 07/10 MRP299/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '177.99/Pairs', amount: -5339.70, discount: 0 },
      { stockItemName: 'AJ PUG 8518/73 05/09 MRP296/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '176.20/Pairs', amount: -5286.00, discount: 0 },
      { stockItemName: 'AJ PUG 8527/9 06/10 MRP275/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '172.03/Pairs', amount: -5160.90, discount: 0 },
      { stockItemName: 'AJ PUG 8529/1 06/10 MRP275/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '163.68/Pairs', amount: -4910.40, discount: 0 },
      { stockItemName: 'AJ PUG 8545/73 06/10 MRP289/-', actualQty: '30 Pairs = 1 Box', billedQty: '30 Pairs = 1 Box', rate: '172.01/Pairs', amount: -5160.30, discount: 0 }
    ]
  },
  // Sales SKIL-097 .. SKIL-102 (from live Tally step 195 & 204)
  {
    id: 'delta-sal-097', date: '20261123', voucherType: 'Sales', voucherNumber: 'SKIL-097', reference: '1900428997',
    partyName: 'SRI VENKATESWARA FO0TWEAR AND GENERAL', amount: 9540, narration: 'SVFAG 2CTN',
    cartonsOverride: 2, pairsOverride: 96,
    ledgerEntries: buildApSalesLedgerEntries('SRI VENKATESWARA FO0TWEAR AND GENERAL', 9540, 9085.80, 227.15, -0.10),
    inventoryEntries: []
  },
  {
    id: 'delta-sal-098', date: '20261123', voucherType: 'Sales', voucherNumber: 'SKIL-098', reference: '1900429137',
    partyName: 'SRI VENKATESWARA FO0TWEAR AND GENERAL', amount: 49598, narration: 'SVFAG 10CTNS',
    cartonsOverride: 10, pairsOverride: 390,
    ledgerEntries: buildApSalesLedgerEntries('SRI VENKATESWARA FO0TWEAR AND GENERAL', 49598, 47236.43, 1180.91, -0.25),
    inventoryEntries: []
  },
  {
    id: 'delta-sal-099', date: '20261123', voucherType: 'Sales', voucherNumber: 'SKIL-099', reference: '1900429136',
    partyName: 'M/S.SHREE FOOTWEAR', amount: 97008, narration: 'SF 19CTNS',
    cartonsOverride: 19, pairsOverride: 666,
    ledgerEntries: buildApSalesLedgerEntries('M/S.SHREE FOOTWEAR', 97008, 92388.54, 2309.71, 0.04),
    inventoryEntries: []
  },
  {
    id: 'delta-sal-100', date: '20261123', voucherType: 'Sales', voucherNumber: 'SKIL-100', reference: '1900429263',
    partyName: 'SRI VENKATESWARA FO0TWEAR AND GENERAL', amount: 32176, narration: 'SVFAG 7CTNS',
    cartonsOverride: 7, pairsOverride: 360,
    ledgerEntries: buildApSalesLedgerEntries('SRI VENKATESWARA FO0TWEAR AND GENERAL', 32176, 30643.50, 766.09, 0.32),
    inventoryEntries: []
  },
  {
    id: 'delta-sal-101', date: '20261123', voucherType: 'Sales', voucherNumber: 'SKIL-101', reference: '1900429266',
    partyName: 'JYOTHI FOOT WEAR', amount: 120866, narration: 'JYOTHI 25CTNS',
    cartonsOverride: 25, pairsOverride: 1380,
    ledgerEntries: buildApSalesLedgerEntries('JYOTHI FOOT WEAR', 120866, 115110.00, 2877.75, 0.50),
    inventoryEntries: []
  },
  {
    id: 'delta-sal-102', date: '20261123', voucherType: 'Sales', voucherNumber: 'SKIL-102', reference: '1900429264',
    partyName: 'DELIGHT FOOT WEAR', amount: 59971, narration: 'DELIGHT 13CTNS',
    cartonsOverride: 13, pairsOverride: 672,
    ledgerEntries: buildApSalesLedgerEntries('DELIGHT FOOT WEAR', 59971, 57115.50, 1427.89, -0.28),
    inventoryEntries: []
  }
];

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function toIsoDate(d) {
  if (!d) return '';
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  return s;
}

function formatDmy(iso) {
  if (!iso || iso.length < 10) return iso || '—';
  return `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}`;
}

function addDaysIso(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function diffDays(endIso, startIso) {
  if (!endIso || !startIso) return 0;
  const [y1, m1, d1] = endIso.split('-').map(Number);
  const [y2, m2, d2] = startIso.split('-').map(Number);
  return Math.round((Date.UTC(y1, m1 - 1, d1) - Date.UTC(y2, m2 - 1, d2)) / 86400000);
}

function getTodayIstIso() {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

function extractCityClean(ledger) {
  const addr = String(ledger.address || '');
  const name = String(ledger.name || '');
  const m = addr.match(/City\/Town\/Village\s*:\s*([^,\n]+)/i);
  if (m && m[1].trim()) return m[1].trim();
  for (const c of KNOWN_CITIES) {
    if (addr.toLowerCase().includes(c.toLowerCase()) || name.toLowerCase().includes(c.toLowerCase())) {
      if (c === 'Parvatipuram') return 'Parvathipuram';
      if (c === 'Rajamahendravaram') return 'Rajahmundry';
      return c;
    }
  }
  return ledger.state || '';
}

function getCategory(parent) {
  const p = (parent || '').toLowerCase();
  if (p.includes('debtor')) return 'debtor';
  if (p.includes('creditor')) return 'creditor';
  if (p.includes('bank')) return 'bank';
  if (p.includes('cash')) return 'cash';
  if (p.includes('duties') || p.includes('asset')) return 'tax';
  if (p.includes('purchase')) return 'purchase';
  if (p.includes('sales')) return 'sales';
  if (p.includes('income')) return 'income';
  if (p.includes('expense')) return 'expense';
  if (p.includes('capital')) return 'capital';
  return 'other';
}

function parseQtyBoxesAndPairs(invEntries, v) {
  let pairs = 0;
  let boxes = 0;
  const items = [];
  for (const it of (invEntries || [])) {
    const qtyStr = String(it.actualQty || it.billedQty || '');
    const pM = qtyStr.match(/([\d.]+)\s*Pairs/i);
    const bM = qtyStr.match(/=\s*([\d.]+)\s*Box/i);
    const itemPairs = pM ? Number(pM[1]) : 0;
    const itemBoxes = bM ? Number(bM[1]) : 0;
    pairs += itemPairs;
    boxes += itemBoxes;
    const rateM = String(it.rate || '').match(/([\d.]+)/);
    items.push({
      stockItemName: it.stockItemName || it.name || '',
      pairs: itemPairs,
      boxes: itemBoxes,
      rate: rateM ? Number(rateM[1]) : 0,
      discount: Number(it.discount || 0),
      amount: round2(Math.abs(Number(it.amount || 0)))
    });
  }
  if (!boxes && v.cartonsOverride) boxes = v.cartonsOverride;
  if (!pairs && v.pairsOverride) pairs = v.pairsOverride;
  if (!boxes && v.narration) {
    const nm = String(v.narration).match(/(\d+)\s*(?:CTN|BOX|CB|CS|CARTON)/i);
    if (nm) boxes = Number(nm[1]);
  }
  return { pairs, boxes, items };
}

function getVoucherImpactOnLedger(v, targetName) {
  const targetLower = targetName.toLowerCase();
  const entries = (v.ledgerEntries || []).filter(le => (le.ledgerName || '').toLowerCase() === targetLower);
  let debit = 0;
  let credit = 0;
  if (entries.length > 0) {
    for (const le of entries) {
      let signed;
      if (le.rawAmount !== undefined) {
        signed = Number(le.rawAmount) || 0;
      } else {
        signed = Number(le.amount || 0);
      }
      // In Tally normalized data: negative = Debit, positive = Credit
      if (signed < 0) debit += Math.abs(signed);
      else if (signed > 0) credit += signed;
    }
  } else if ((v.partyName || '').toLowerCase() === targetLower) {
    const amt = Math.abs(Number(v.amount || 0));
    if (v.voucherType === 'Sales' || v.voucherType === 'Payment' || v.voucherType === 'Debit Note') debit = amt;
    else credit = amt;
  }
  return { debit: round2(debit), credit: round2(credit) };
}

function getTaxAndRoundOff(v) {
  let taxable = 0;
  let gst = 0;
  let ro = 0;
  for (const le of (v.ledgerEntries || [])) {
    const ln = le.ledgerName || '';
    const val = Number(le.amount || 0);
    if (/GST Sales|GST Purchase/i.test(ln)) taxable += Math.abs(val);
    else if (/CGST|SGST|IGST/i.test(ln)) gst += Math.abs(val);
    else if (/Round Off/i.test(ln)) ro += val;
  }
  if (!taxable && v.inventoryEntries && v.inventoryEntries.length) {
    taxable = v.inventoryEntries.reduce((s, it) => s + Math.abs(Number(it.amount || 0)), 0);
  }
  return { taxableAmount: round2(taxable), gstAmount: round2(gst), roundOff: round2(ro) };
}

function detectSettlementMode(v, targetLedger) {
  const nar = String(v.narration || '');
  const other = (v.ledgerEntries || []).find(le => (le.ledgerName || '').toLowerCase() !== targetLedger.toLowerCase())?.ledgerName || '';
  if (/cancelled/i.test(nar) || (v.voucherType === 'Credit Note' && /GST Sales/i.test((v.ledgerEntries || []).map(l => l.ledgerName).join(' ')))) {
    return 'Cancellation';
  }
  if (v.voucherType === 'Credit Note' && /cash discount|5% cd/i.test(nar)) return '5% CD';
  if (v.voucherType === 'Debit Note') {
    if (/3% cash|cash discount/i.test(nar)) return '3% CD';
    if (/rate difference/i.test(nar)) return 'Rate Difference';
    if (/scheme|slab|scratch/i.test(nar)) return 'Scheme Discount';
    return 'Debit Note';
  }
  if (/upi/i.test(nar)) return 'UPI';
  if (/rtgs/i.test(nar)) return 'RTGS';
  if (/neft/i.test(nar)) return 'NEFT';
  if (/imps/i.test(nar)) return 'IMPS';
  if (/cash/i.test(other)) return 'Cash';
  if (/union bank|bank/i.test(other)) return 'Bank';
  return v.voucherType;
}

function buildCdAllocations(vouchers) {
  const cdByInvoice = new Map();
  const salesByNo = new Map();
  for (const v of vouchers) {
    if (v.voucherType === 'Sales') salesByNo.set(v.voucherNumber, v);
  }
  for (const cn of vouchers.filter(v => v.voucherType === 'Credit Note')) {
    const invList = CN_INVOICE_MAP[String(cn.voucherNumber)];
    if (!invList || !invList.length) continue;
    const cnAmt = Math.round(Math.abs(Number(cn.amount || 0)));
    const cnDate = toIsoDate(cn.date);
    const bills = invList.map(no => {
      const sv = salesByNo.get(no);
      const { taxableAmount } = sv ? getTaxAndRoundOff(sv) : { taxableAmount: 0 };
      const exactCd = taxableAmount * 0.05;
      return { no, floor: Math.floor(exactCd), frac: exactCd - Math.floor(exactCd) };
    });
    const sumFloor = bills.reduce((s, b) => s + b.floor, 0);
    const rem = cnAmt - sumFloor;
    const ranked = bills.map((b, i) => ({ i, frac: b.frac })).sort((a, b) => b.frac - a.frac);
    for (let k = 0; k < Math.max(0, rem) && k < ranked.length; k++) {
      bills[ranked[k].i].floor += 1;
    }
    if (rem < 0) {
      ranked.reverse();
      for (let k = 0; k < Math.abs(rem) && k < ranked.length; k++) {
        bills[ranked[k].i].floor -= 1;
      }
    }
    for (const b of bills) {
      cdByInvoice.set(b.no, { cdAmount: b.floor, cdCreditNoteNo: `CN-${cn.voucherNumber}`, cdCreditNoteDate: cnDate });
    }
  }
  return cdByInvoice;
}

function generateLedgerData(options = {}) {
  const asOfIso = options.asOfDate || getTodayIstIso();
  const rawV = options.vouchers || JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'vouchers.json'), 'utf8'));
  const rawL = options.ledgers || JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'ledgers.json'), 'utf8'));

  const baseVouchers = Array.isArray(rawV) ? rawV : (rawV.items ? rawV.items : Object.values(rawV));
  const baseLedgers = Array.isArray(rawL) ? rawL : (rawL.items ? rawL.items : Object.values(rawL));

  // Merge ledgers (preserving base if already present)
  const ledgerMap = new Map();
  for (const l of baseLedgers) {
    if (l && l.name) ledgerMap.set(l.name.trim(), l);
  }
  for (const dl of LIVE_DELTA_LEDGERS) {
    if (!ledgerMap.has(dl.name)) ledgerMap.set(dl.name, dl);
  }

  // Merge delta vouchers safely without duplication
  const existingKeys = new Set(baseVouchers.map(v => `${v.voucherType}|${v.voucherNumber}|${(v.reference || '').trim()}`));
  const vouchers = [...baseVouchers];
  for (const dv of LIVE_DELTA_VOUCHERS) {
    const k = `${dv.voucherType}|${dv.voucherNumber}|${(dv.reference || '').trim()}`;
    if (!existingKeys.has(k)) {
      vouchers.push(dv);
      existingKeys.add(k);
    }
  }

  const cdByInvoice = buildCdAllocations(vouchers);
  const parties = [];

  for (const ledger of ledgerMap.values()) {
    const pName = ledger.name.trim();
    const category = getCategory(ledger.parent);
    const isDebtor = category === 'debtor';
    const isCreditor = category === 'creditor';
    const openRaw = Number(ledger.openingBalance || 0); // negative = Dr, positive = Cr in Tally JSON
    const openingDebit = openRaw < 0 ? Math.abs(openRaw) : 0;
    const openingCredit = openRaw > 0 ? openRaw : 0;

    // Collect every voucher affecting this ledger
    const relVouchers = [];
    for (const v of vouchers) {
      const { debit, credit } = getVoucherImpactOnLedger(v, pName);
      if (debit > 0 || credit > 0) {
        relVouchers.push({ v, debit, credit });
      }
    }

    relVouchers.sort((a, b) => {
      const da = toIsoDate(a.v.date);
      const db = toIsoDate(b.v.date);
      if (da !== db) return da.localeCompare(db);
      return String(a.v.voucherNumber || '').localeCompare(String(b.v.voucherNumber || ''), undefined, { numeric: true });
    });

    let runningSigned = round2(openingDebit - openingCredit); // +Dr / -Cr
    let totalDebit = round2(openingDebit);
    let totalCredit = round2(openingCredit);
    const transactions = [];
    const bills = [];
    const settlements = [];

    for (const { v, debit, credit } of relVouchers) {
      const tallyIso = toIsoDate(v.date);
      const billingIso = (v.voucherType === 'Sales' && BILLING_DATE_OVERRIDES[v.voucherNumber]) || tallyIso;
      const counterLedgers = [...new Set(
        (v.ledgerEntries || [])
          .map(le => le.ledgerName)
          .filter(n => n && n.toLowerCase() !== pName.toLowerCase())
      )];

      totalDebit = round2(totalDebit + debit);
      totalCredit = round2(totalCredit + credit);
      runningSigned = round2(runningSigned + debit - credit);

      const isBillForParty = (isDebtor && v.voucherType === 'Sales') || (isCreditor && v.voucherType === 'Purchase');
      const { pairs, boxes, items } = parseQtyBoxesAndPairs(v.inventoryEntries, v);
      const { taxableAmount, gstAmount, roundOff } = getTaxAndRoundOff(v);
      const agingDaysFromBilling = Math.max(0, diffDays(asOfIso, billingIso));
      const agingDaysFromTally = Math.max(0, diffDays(asOfIso, tallyIso));

      transactions.push({
        date: tallyIso,
        billingDate: isBillForParty ? billingIso : tallyIso,
        formattedDate: formatDmy(tallyIso),
        formattedBillingDate: isBillForParty ? formatDmy(billingIso) : formatDmy(tallyIso),
        voucherType: v.voucherType,
        voucherNumber: v.voucherNumber || '',
        reference: (v.reference || '').trim(),
        cartons: isBillForParty ? boxes : null,
        pairs: isBillForParty ? pairs : null,
        taxableAmount: isBillForParty ? taxableAmount : null,
        agingDaysFromBilling: isBillForParty ? agingDaysFromBilling : null,
        debit,
        credit,
        runningBalance: round2(Math.abs(runningSigned)),
        runningBalanceType: runningSigned > 0.005 ? 'Dr' : (runningSigned < -0.005 ? 'Cr' : 'Nil'),
        runningSigned,
        counterLedgers,
        narration: (v.narration || '').trim()
      });

      if (isBillForParty) {
        const gross = round2(isDebtor ? debit : credit);
        const isCancelled = isDebtor && v.voucherNumber === 'SKIL-071';
        const cdInfo = isDebtor ? cdByInvoice.get(v.voucherNumber) : null;
        let cdStatus = 'N/A';
        let cdAmount = 0;
        let cdCreditNoteNo = null;
        let cdCreditNoteDate = null;

        if (isDebtor) {
          if (isCancelled) {
            cdStatus = 'CANCELLED';
          } else if (cdInfo) {
            cdStatus = 'GIVEN';
            cdAmount = cdInfo.cdAmount;
            cdCreditNoteNo = cdInfo.cdCreditNoteNo;
            cdCreditNoteDate = cdInfo.cdCreditNoteDate;
          } else {
            cdStatus = 'PENDING';
            cdAmount = Math.round(taxableAmount * 0.05);
          }
        } else if (isCreditor && pName.includes('Ajanta')) {
          cdStatus = '3%_MONTHLY';
          cdAmount = Math.round(taxableAmount * 0.03);
        }

        const bucket = agingDaysFromBilling <= 30 ? '0-30'
          : (agingDaysFromBilling <= 45 ? '31-45'
            : (agingDaysFromBilling <= 60 ? '46-60'
              : (agingDaysFromBilling <= 90 ? '61-90' : '>90')));

        bills.push({
          voucherType: v.voucherType,
          voucherNumber: v.voucherNumber,
          reference: (v.reference || '').trim(),
          tallyDate: tallyIso,
          billingDate: billingIso,
          formattedTallyDate: formatDmy(tallyIso),
          formattedBillingDate: formatDmy(billingIso),
          agingDaysFromBilling,
          agingDaysFromTally,
          dueDate30d: addDaysIso(billingIso, 30),
          dueDate45d: addDaysIso(billingIso, 45),
          formattedDueDate30d: formatDmy(addDaysIso(billingIso, 30)),
          daysOverdue30d: Math.max(0, agingDaysFromBilling - 30),
          daysOverdue45d: Math.max(0, agingDaysFromBilling - 45),
          agingBucket: bucket,
          cartons: boxes,
          pairs,
          taxableAmount,
          gstAmount,
          roundOff,
          grossAmount: gross,
          cdStatus,
          cdAmount,
          cdCreditNoteNo,
          cdCreditNoteDate,
          netAfterCd: round2(gross - cdAmount),
          settledAmount: isCancelled ? gross : 0,
          unpaidAmount: isCancelled ? 0 : gross,
          status: isCancelled ? 'CANCELLED' : 'OPEN',
          narration: (v.narration || '').trim(),
          items
        });
      } else if (isDebtor || isCreditor) {
        const settleAmt = isDebtor ? credit : debit;
        const revAmt = isDebtor ? debit : credit;
        if (settleAmt > 0 || revAmt > 0) {
          settlements.push({
            voucherType: v.voucherType,
            voucherNumber: v.voucherNumber || '',
            date: tallyIso,
            formattedDate: formatDmy(tallyIso),
            amount: round2(settleAmt > 0 ? settleAmt : -revAmt),
            mode: detectSettlementMode(v, pName),
            reference: (v.reference || '').trim(),
            narration: (v.narration || '').trim()
          });
        }
      }
    }

    // FIFO allocation of settlements against active non-cancelled bills
    // Notice: For DELIGHT FOOT WEAR, CN #8 (59971) specifically cancelled SKIL-071 (59971), so exclude both from active FIFO pool
    if (isDebtor || isCreditor) {
      let fifoPool = 0;
      for (const s of settlements) {
        if (isDebtor && pName === 'DELIGHT FOOT WEAR' && s.voucherType === 'Credit Note' && s.voucherNumber === '8') {
          continue; // cancels SKIL-071 specifically
        }
        fifoPool = round2(fifoPool + s.amount);
      }

      const chronBills = [...bills]
        .filter(b => b.status !== 'CANCELLED')
        .sort((a, b) => a.billingDate.localeCompare(b.billingDate) || a.voucherNumber.localeCompare(b.voucherNumber, undefined, { numeric: true }));

      for (const b of chronBills) {
        if (fifoPool <= 0.005) break;
        const alloc = round2(Math.min(b.grossAmount, fifoPool));
        b.settledAmount = alloc;
        b.unpaidAmount = round2(b.grossAmount - alloc);
        fifoPool = round2(fifoPool - alloc);
        b.status = b.unpaidAmount <= 0.5 ? 'PAID' : (alloc > 0 ? 'PARTIAL' : 'OPEN');
      }
    }

    // Sort nested bills newest-first by billing date & bill no.
    bills.sort((a, b) => b.billingDate.localeCompare(a.billingDate) || b.voucherNumber.localeCompare(a.voucherNumber, undefined, { numeric: true }));

    const activeBills = bills.filter(b => b.status !== 'CANCELLED');
    const openBills = activeBills.filter(b => b.unpaidAmount > 0.5);
    const oldestOpen = openBills.reduce((min, b) => (!min || b.billingDate < min.billingDate ? b : min), null);

    const partyObj = {
      partyName: pName,
      group: ledger.parent || 'Primary',
      category,
      city: extractCityClean(ledger),
      state: ledger.state || '',
      address: ledger.address || '',
      gstin: ledger.gstin || '',
      mobile: ledger.mobile || '',
      openingBalance: round2(openRaw),
      totalDebit: round2(totalDebit),
      totalCredit: round2(totalCredit),
      closingBalance: round2(Math.abs(runningSigned)),
      balanceType: runningSigned > 0.005 ? 'Dr' : (runningSigned < -0.005 ? 'Cr' : 'Nil'),
      netBalanceSigned: round2(runningSigned),
      totalBilled: round2(activeBills.reduce((s, b) => s + b.grossAmount, 0)),
      totalCartons: activeBills.reduce((s, b) => s + (b.cartons || 0), 0),
      totalPairs: activeBills.reduce((s, b) => s + (b.pairs || 0), 0),
      totalSettled: round2(settlements.reduce((s, x) => s + x.amount, 0)),
      totalCdGiven: round2(activeBills.filter(b => b.cdStatus === 'GIVEN').reduce((s, b) => s + b.cdAmount, 0)),
      totalCdPendingEstimate: round2(activeBills.filter(b => b.cdStatus === 'PENDING').reduce((s, b) => s + b.cdAmount, 0)),
      oldestOpenBillingDate: oldestOpen ? oldestOpen.billingDate : null,
      oldestOpenAgingDays: oldestOpen ? oldestOpen.agingDaysFromBilling : 0,
      billCount: bills.length,
      activeBillCount: activeBills.length,
      openBillCount: openBills.length,
      transactionCount: transactions.length,
      bills,
      settlements,
      transactions
    };

    parties.push(partyObj);
  }

  const groupRank = { debtor: 1, creditor: 2, bank: 3, cash: 4, tax: 5, sales: 6, purchase: 7, income: 8, expense: 9, capital: 10, other: 11 };
  parties.sort((a, b) => {
    const rDiff = (groupRank[a.category] || 99) - (groupRank[b.category] || 99);
    if (rDiff !== 0) return rDiff;
    return b.closingBalance - a.closingBalance || a.partyName.localeCompare(b.partyName);
  });

  const debtors = parties.filter(p => p.category === 'debtor');
  const creditors = parties.filter(p => p.category === 'creditor');

  const payload = {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    asOfDate: asOfIso,
    formattedAsOfDate: formatDmy(asOfIso),
    company: {
      name: 'SKIL LIFESTYLE LLP',
      gstin: '37AFZFS2777J1ZV',
      state: 'Andhra Pradesh',
      address: 'Shop No-7A, D.No.28-10-4, Floor No-3, Vasavi Plaza, Theatre Road, Jagadamba Jn, Visakhapatnam - 530020',
      mobile: '9348343310',
      email: 'skillifestyle.vizag@gmail.com',
      bank: {
        name: 'Union Bank of India',
        branch: 'Rayagada',
        accountNo: '348621010000129',
        ifsc: 'UBIN0934861'
      }
    },
    summary: {
      totalLedgers: parties.length,
      debtorsCount: debtors.length,
      creditorsCount: creditors.length,
      debtorsReceivableTotal: round2(debtors.filter(p => p.netBalanceSigned > 0).reduce((s, p) => s + p.netBalanceSigned, 0)),
      debtorsAdvanceTotal: round2(debtors.filter(p => p.netBalanceSigned < 0).reduce((s, p) => s + Math.abs(p.netBalanceSigned), 0)),
      debtorsNetClosing: round2(debtors.reduce((s, p) => s + p.netBalanceSigned, 0)),
      creditorsPayableTotal: round2(creditors.filter(p => p.netBalanceSigned < 0).reduce((s, p) => s + Math.abs(p.netBalanceSigned), 0)),
      totalSalesBillsActive: debtors.reduce((s, p) => s + p.activeBillCount, 0),
      totalSalesCartons: debtors.reduce((s, p) => s + p.totalCartons, 0),
      totalSalesGross: round2(debtors.reduce((s, p) => s + p.totalBilled, 0)),
      totalCdGiven: round2(debtors.reduce((s, p) => s + p.totalCdGiven, 0)),
      totalPurchaseBills: creditors.reduce((s, p) => s + p.activeBillCount, 0),
      totalPurchaseGross: round2(creditors.reduce((s, p) => s + p.totalBilled, 0))
    },
    auditSummary: {
      verifiedAgainst: ['Live TallyPrime (282 vouchers, 47 ledgers)', 'Ajanta 93081 (1).pdf (01.10.2026 to 25.11.2026)', 'Union Bank Statement (to 24.11.2026)', '103 Supplier Purchase PDFs'],
      pendingPurchasesWithoutSales: ['Pur #102 (1900429720, 25-11-2026, ₹21,870, 5 CTN)', 'Pur #103 (1900429750, 25-11-2026, ₹32,757, 6 CTN)'],
      missingTallyEntries: [
        'Ajanta Purchase Inv 1900429796 (25-11-2026): ₹38,513.00 (not in Tally)',
        'Ajanta RTGS Payment 140015138 (23-11-2026, UTR UBINR22026112301172654): ₹2,00,000.00 (not in Tally)',
        'Ajanta CN 160007955 (23-11-2026, Non-Ben HW+FTW Slab Discount Oct-26): ₹36,968.00 (not in Tally)',
        'Bank Receipt NEFT from JYOTHI FOOT WEAR (20-11-2026, UTR CIUBN52026112024050709): ₹44,460.00 (not in Tally)',
        'Bank Receipt UPI from FAMOUS FOOT WEAR (21-11-2026, Ref 471097100343): ₹63,171.00 (not in Tally)',
        'Bank Payment GST Portal (18-11-2026, Ref 718456912): ₹2,895.00 (not in Tally)'
      ],
      unclaimedUnderMarginNov2026: {
        totalBasic: 1934.79,
        totalInclGst: 2031.52,
        affectedInvoices: ['Pur #80', 'Pur #87', 'Pur #88', 'Pur #89', 'Pur #92', 'Pur #94', 'Pur #97', 'Pur #103'],
        highlights: [
          'Pur #97 (1900429137, 23-11): AJ PUG 8482/1 (MRP 309.75) billed @ ₹194.94 (33.92% disc vs 37.50%) = ₹998.39 incl. GST overcharge',
          'Pur #103 (1900429750, 25-11): AJ PUG 8527/9 (MRP 275) billed @ ₹172.03 (34.32% disc vs 37.50%) = ₹262.70 incl. GST overcharge',
          'Pur #80/#87/#88/#89/#92/#94 (CEL/CPL/DIVA/FEMINA 1,140 prs @ 36.96% vs 37.50%) = ₹770.43 incl. GST overcharge'
        ]
      }
    },
    parties
  };

  if (options.writeFiles !== false) {
    const jsonStr = JSON.stringify(payload, null, 2);
    for (const dir of TARGET_DATA_DIRS) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'ledger-data.json'), jsonStr);
    }
  }

  return payload;
}

if (require.main === module) {
  const payload = generateLedgerData({ asOfDate: process.argv[2] || undefined });
  console.log('Generated ledger-data.json successfully!');
  console.log('Summary:', JSON.stringify(payload.summary, null, 2));
}

module.exports = { generateLedgerData };
