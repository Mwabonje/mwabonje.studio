const fs = require('fs');
let content = fs.readFileSync('src/pages/Invoices.tsx', 'utf8');

if (!content.includes('import { PDFLoader }')) {
  content = content.replace(
    "import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';",
    "import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';\nimport { PDFLoader } from '@/components/PDFLoader';"
  );
  
  content = content.replace(
    '<div className="space-y-6">',
    '<div className="space-y-6">\n      <PDFLoader isGenerating={isGeneratingPDF} />'
  );
  fs.writeFileSync('src/pages/Invoices.tsx', content);
  console.log('Invoices.tsx updated');
}
