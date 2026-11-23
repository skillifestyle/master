const TallyClient = require('./tally-client');
const normalizer = require('./normalizer');
const db = require('./database');
const agingService = require('./aging-service');
const folderUpdater = require('./folder-updater');
const { generateAllOpenDebtorPdfs } = require('./generate-pdf-statement');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET_DATA_DIRS = [
  path.join(__dirname, 'data'),
  path.join(__dirname, 'public', 'data'),
  path.join(ROOT, 'android-app', 'www', 'data'),
  path.join(ROOT, 'web', 'data')
];

async function syncAll(options = {}) {
  const startTime = Date.now();
  console.log('====================================================');
  console.log('🚀 [SKIL Master] Starting Complete Live Sync & Cloud Push');
  console.log('====================================================\n');

  // 1. Health check & connect to Tally
  console.log('1️⃣ Connecting to Tally Prime at http://localhost:9000...');
  const tc = new TallyClient();
  const healthXml = await tc.checkHealth();
  const companies = normalizer.normalizeCompanies(healthXml);
  if (!companies || companies.length === 0) {
    throw new Error('No company is currently open in Tally Prime! Please open SKIL LIFESTYLE LLP.');
  }
  const companyName = companies[0].name;
  console.log(`   ✅ Connected to active company: "${companyName}"\n`);

  // 2. Fetch Vouchers
  console.log('2️⃣ Fetching all accounting & inventory vouchers...');
  const vchXml = await tc.getVouchers(companyName, 0);
  const vouchers = normalizer.normalizeVouchers(vchXml);
  db.upsertVouchers(vouchers);
  console.log(`   ✅ Stored ${vouchers.length} vouchers in local database.\n`);

  // 3. Fetch Ledgers
  console.log('3️⃣ Fetching all ledgers...');
  const ledgersXml = await tc.getLedgers(companyName, 0);
  const ledgers = normalizer.normalizeLedgers(ledgersXml);
  db.upsertLedgers(ledgers);
  console.log(`   ✅ Stored ${ledgers.length} ledgers in local database.\n`);

  // 4. Fetch Stock Items
  console.log('4️⃣ Fetching all stock items...');
  const stockXml = await tc.getStockItems(companyName, 0);
  const stockItems = normalizer.normalizeStockItems(stockXml);
  db.upsertStockItems(stockItems);
  console.log(`   ✅ Stored ${stockItems.length} stock items in local database.\n`);

  // 5. Calculate Aging as of today
  const todayIso = new Date().toISOString().slice(0, 10);
  console.log(`5️⃣ Recalculating aging analysis as of ${todayIso}...`);
  const agingData = agingService.saveAgingFiles(todayIso);
  console.log(`   • Debtors Total:   ₹${Number(agingData.debtors.summary.totalOutstanding).toLocaleString('en-IN')}`);
  console.log(`   • Creditors Total: ₹${Number(agingData.creditors.summary.totalOutstanding).toLocaleString('en-IN')}\n`);

  // 6. Build Client Payloads
  const vouchersPayload = {
    total: vouchers.length,
    lastUpdated: new Date().toISOString(),
    items: vouchers
  };

  const statusPayload = {
    tallyOnline: true,
    activeCompany: companyName,
    lastSyncTimestamp: new Date().toISOString(),
    counts: {
      vouchers: vouchers.length,
      ledgers: ledgers.length,
      stockItems: stockItems.length
    },
    outstandings: {
      debtorsTotal: agingData.debtors.summary.totalOutstanding,
      creditorsTotal: agingData.creditors.summary.totalOutstanding
    }
  };

  // 7. Write to all target data directories (Sync Engine, Android App, Web/GitHub Pages)
  console.log('6️⃣ Distributing payloads across system directories...');
  TARGET_DATA_DIRS.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'vouchers.json'), JSON.stringify(vouchersPayload));
    fs.writeFileSync(path.join(dir, 'ledgers.json'), JSON.stringify(ledgers, null, 2));
    fs.writeFileSync(path.join(dir, 'status.json'), JSON.stringify(statusPayload, null, 2));
    fs.writeFileSync(path.join(dir, 'aging.json'), JSON.stringify(agingData, null, 2));
    console.log(`   ✓ Updated: ${path.relative(ROOT, dir)}`);
  });
  console.log('');

  // 8. Generate PDF Statements for all open debtors
  let generatedPdfs = [];
  if (options.skipPdfs !== true) {
    console.log('7️⃣ Generating Vector PDF Statements for all overdue debtors...');
    try {
      generatedPdfs = await generateAllOpenDebtorPdfs();
    } catch (pdfErr) {
      console.warn('⚠️ PDF generation warning:', pdfErr.message);
    }
    console.log('');
  }

  // 9. Update Managed Directory Timestamps
  console.log('8️⃣ Updating Managed Directory timestamps (FolderUpdater)...');
  try {
    folderUpdater.updateAll();
    console.log('   ✅ Directory timestamps aligned.\n');
  } catch (fErr) {
    console.warn('   ⚠️ Folder updater notice:', fErr.message, '\n');
  }

  // 10. Push to Git remote (skillifestyle/master) to deliver to Google Play Store Android app
  if (options.skipGit !== true) {
    console.log('9️⃣ Pushing updated data to GitHub (skillifestyle/master) for Play Store App...');
    try {
      execSync('git add -A', { cwd: ROOT, stdio: 'inherit' });
      const statusOutput = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' }).trim();
      if (statusOutput) {
        const commitMsg = `Sync Tally Prime data & statements - ${new Date().toLocaleDateString('en-GB')} [${vouchers.length} vchs]`;
        execSync(`git commit -m "${commitMsg}"`, { cwd: ROOT, stdio: 'inherit' });
        console.log('   ✅ Changes committed locally.');
      } else {
        console.log('   ℹ️ Working directory clean, no new changes to commit.');
      }

      console.log('   🚀 Pushing to remote "skillifestyle" branch "main"...');
      execSync('git push skillifestyle main', { cwd: ROOT, stdio: 'inherit' });
      console.log('   ✅ Successfully pushed to GitHub! Google Play Store app is now updated with live data.\n');
    } catch (gitErr) {
      console.error('   ❌ Git push error:', gitErr.message);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('====================================================');
  console.log(`🎉 SYNC COMPLETE in ${durationSec}s!`);
  console.log(`   • Vouchers: ${vouchers.length}`);
  console.log(`   • Ledgers: ${ledgers.length}`);
  console.log(`   • Open Debtors: ₹${Number(agingData.debtors.summary.totalOutstanding).toLocaleString('en-IN')}`);
  console.log(`   • PDFs Generated: ${generatedPdfs.length}`);
  console.log('====================================================\n');

  return {
    company: companyName,
    vouchers: vouchers.length,
    ledgers: ledgers.length,
    stockItems: stockItems.length,
    debtorsTotal: agingData.debtors.summary.totalOutstanding,
    creditorsTotal: agingData.creditors.summary.totalOutstanding,
    pdfCount: generatedPdfs.length
  };
}

if (require.main === module) {
  syncAll().catch(err => {
    console.error('❌ Sync failed:', err.message);
    process.exit(1);
  });
}

module.exports = { syncAll };
