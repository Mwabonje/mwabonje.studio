const fs = require('fs');

function addLoader(filePath, importsHook, loadVars) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('import { PDFLoader }')) return;

  // Add import
  if (content.includes(importsHook)) {
    content = content.replace(importsHook, importsHook + "\nimport { PDFLoader } from '@/components/PDFLoader';");
  } else {
    // just append at the last import
    let lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i=0; i<lines.length; i++) {
       if (lines[i].startsWith('import ')) lastImportIdx = i;
    }
    if (lastImportIdx !== -1) {
       lines.splice(lastImportIdx + 1, 0, "import { PDFLoader } from '@/components/PDFLoader';");
       content = lines.join('\n');
    }
  }

  // Find the first outermost div return or something similar.
  // Actually, we can just look for the first `<div ` after `return (`
  // But a safer way is just find `<PDFLoader isGenerating={...} />` placement manually or via a known hook.
  
  const returnMatch = content.match(/return\s*\(\s*(<[A-Za-z0-9_.-]+[^>]*>)/);
  if (returnMatch) {
     const tag = returnMatch[1];
     let conditionStr = loadVars.map(v => v).join(' || ');
     content = content.replace(returnMatch[0], returnMatch[0] + `\n      <PDFLoader isGenerating={${conditionStr}} />`);
  }
  
  fs.writeFileSync(filePath, content);
  console.log(filePath + ' updated');
}

// src/pages/Invoices.tsx
addLoader('src/pages/Invoices.tsx', "import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';", ['isGeneratingPDF']);

// src/pages/Payments.tsx
addLoader('src/pages/Payments.tsx', "import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';", ['isGeneratingPDF']);

// src/pages/Projects.tsx
addLoader('src/pages/Projects.tsx', "import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';", ['isGeneratingPDF']);

// src/pages/Quotes.tsx
addLoader('src/pages/Quotes.tsx', "import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';", ['isGeneratingPDF', 'isGeneratingNDAPDF', 'isGeneratingContractPDF']);

// src/pages/SharedInvoice.tsx
addLoader('src/pages/SharedInvoice.tsx', "import { Button } from '@/components/ui/button';", ['isGeneratingPDF']);

// src/pages/SharedQuote.tsx
addLoader('src/pages/SharedQuote.tsx', "import { Button } from '@/components/ui/button';", ['isGeneratingPDF']);

