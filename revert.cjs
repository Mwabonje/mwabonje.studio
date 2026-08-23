const fs = require('fs');

const files = [
  'src/pages/Invoices.tsx',
  'src/pages/Payments.tsx',
  'src/pages/Projects.tsx',
  'src/pages/Quotes.tsx',
  'src/pages/SharedInvoice.tsx',
  'src/pages/SharedQuote.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace("import { PDFLoader } from '@/components/PDFLoader';\n", "");
  content = content.replace("import { PDFLoader } from '@/components/PDFLoader';", "");
  content = content.replace(/\n\s*<PDFLoader isGenerating=\{[^}]+\} \/>/g, "");
  fs.writeFileSync(file, content);
  console.log('Reverted ' + file);
}
