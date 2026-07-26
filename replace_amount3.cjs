const fs = require('fs');
let code = fs.readFileSync('src/pages/Payments.tsx', 'utf-8');

const target = `                              const itemPrice = item.price || 0;
                              let amountForThisItem = previewPayment.allocations?.[idx];
                              
                              if (amountForThisItem === undefined) {
                                // Fallback: Distribute amount paid over line items sequentially for display`;

const replacement = `                              const itemPrice = item.price || 0;
                              const hasAllocations = previewPayment.allocations && Object.keys(previewPayment.allocations).length > 0;
                              let amountForThisItem = previewPayment.allocations?.[idx];
                              
                              if (!hasAllocations) {
                                // Fallback: Distribute amount paid over line items sequentially for display`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/Payments.tsx', code);
