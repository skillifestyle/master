const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { generateReminder } = require('./generate-billwise-reminder');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'user-documents-read-only-access', 'Overdue Statements');
const WEB_OUTPUT_DIR = path.join(ROOT, 'web', 'documents', 'statements');
const APP_OUTPUT_DIR = path.join(ROOT, 'android-app', 'www', 'documents', 'statements');

function getBrowserPath() {
  const browserPaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];
  return browserPaths.find(p => fs.existsSync(p));
}

function printHtmlToPdf(htmlPath, pdfPath) {
  return new Promise((resolve, reject) => {
    const browser = getBrowserPath();
    if (!browser) {
      return reject(new Error('Neither Microsoft Edge nor Google Chrome was found on this system!'));
    }

    const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
    const args = [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--no-pdf-header-footer',
      `--print-to-pdf=${pdfPath}`,
      fileUrl
    ];

    execFile(browser, args, (err, stdout, stderr) => {
      if (err) return reject(err);
      if (fs.existsSync(pdfPath)) {
        resolve(pdfPath);
      } else {
        reject(new Error(`Failed to generate PDF. Browser output: ${stderr || stdout}`));
      }
    });
  });
}

function getFormattedDateTag() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
}

async function createPartyStatementPdf(partyName, options = {}) {
  [OUTPUT_DIR, WEB_OUTPUT_DIR, APP_OUTPUT_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
  const scratchDir = path.join(ROOT, 'scratch');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const reminder = generateReminder(partyName, options);
  const cleanName = partyName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  const dateTag = options.dateTag || getFormattedDateTag();
  const tempHtmlPath = path.join(scratchDir, `temp_${cleanName}.html`);
  const outPdfFileName = `Statement - ${cleanName} - ${dateTag}.pdf`;
  const outPdfPath = path.join(OUTPUT_DIR, outPdfFileName);

  fs.writeFileSync(tempHtmlPath, reminder.html, 'utf8');

  await printHtmlToPdf(tempHtmlPath, outPdfPath);

  // Mirror to web and android-app so it is accessible via cloud/app
  try {
    fs.copyFileSync(outPdfPath, path.join(WEB_OUTPUT_DIR, outPdfFileName));
    fs.copyFileSync(outPdfPath, path.join(APP_OUTPUT_DIR, outPdfFileName));
  } catch (mErr) {
    // Ignore mirroring errors if any
  }

  // Clean temp file
  try { fs.unlinkSync(tempHtmlPath); } catch (_) {}

  const sizeKb = (fs.statSync(outPdfPath).size / 1024).toFixed(1);
  console.log(`✅ Generated PDF: ${outPdfFileName} (${sizeKb} KB)`);
  return { pdfPath: outPdfPath, fileName: outPdfFileName, sizeKb, reminder };
}

async function generateAllOpenDebtorPdfs(options = {}) {
  const agingPath = path.join(__dirname, 'data', 'aging.json');
  const aging = JSON.parse(fs.readFileSync(agingPath, 'utf8'));
  const debtors = aging.debtors.parties.filter(p => p.netDue > 0);

  console.log(`Generating statement PDFs for ${debtors.length} open debtors...`);
  const generated = [];

  for (const d of debtors) {
    try {
      const res = await createPartyStatementPdf(d.partyName, options);
      generated.push(res);
    } catch (e) {
      console.error(`Error generating PDF for ${d.partyName}:`, e.message);
    }
  }

  console.log(`\n🎉 Successfully generated ${generated.length} debtor statement PDFs in: ${OUTPUT_DIR}`);
  return generated;
}

module.exports = { createPartyStatementPdf, generateAllOpenDebtorPdfs };

if (require.main === module) {
  const partyArg = process.argv[2];
  if (partyArg && partyArg !== '--all') {
    createPartyStatementPdf(partyArg).then(res => {
      console.log('PDF Location:', res.pdfPath);
      console.log('\nWhatsApp Text:\n' + res.reminder.waText);
    }).catch(console.error);
  } else {
    generateAllOpenDebtorPdfs().catch(console.error);
  }
}
