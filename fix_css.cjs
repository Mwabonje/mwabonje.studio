const fs = require('fs');
for (const file of ['src/pages/Invoices.tsx', 'src/pages/SharedInvoice.tsx']) {
  let code = fs.readFileSync(file, 'utf-8');
  code = code.replace(/(\.invoice-root \.meta-line strong \{\s*font-weight: 500;\s*color: var\(--ink\);\s*\})\s*\.invoice-root \.meta-block:not\(\.accent\) \.meta-line strong \{\s*min-width: 80px;\s*\}\s*\{\s*font-weight: 500;\s*color: var\(--ink\);\s*\}/s, '$1\n                    .invoice-root .meta-block:not(.accent) .meta-line strong {\n                      min-width: 80px;\n                    }');
  fs.writeFileSync(file, code);
}
