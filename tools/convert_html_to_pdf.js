const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf');

const htmlFile = process.argv[2];
const pdfFile = process.argv[3];

if (!htmlFile || !pdfFile) {
  console.error('Usage: node convert_html_to_pdf.js <html-file> <pdf-file>');
  process.exit(1);
}

const html = fs.readFileSync(htmlFile, 'utf8');

const options = {
  format: 'A4',
  margin: '0.75in',
  timeout: 60000
};

pdf.create(html, options).toFile(pdfFile, (err, res) => {
  if (err) {
    console.error('Error creating PDF:', err);
    process.exit(1);
  }
  console.log(`PDF created successfully: ${pdfFile}`);
});
