const fs = require('fs');
let code = fs.readFileSync('src/pages/Payments.tsx', 'utf-8');

const target = `                              // Distribute amount paid over line items sequentially for display
                              let accumulatedOriginalAmount = 0;
                              if (idx > 0) {
                                for (let i = 0; i < idx; i++) accumulatedOriginalAmount += invoice.lineItems[i].price || 0;
                              }
                              let amountForThisItem = 0;
                              const itemPrice = item.price || 0;
                              
                              const itemStart = accumulatedOriginalAmount;
                              const itemEnd = itemStart + itemPrice;
                              
                              const paymentStart = previousAmountPaid;
                              const paymentEnd = previousAmountPaid + previewPayment.amount;

                              const overlapStart = Math.max(itemStart, paymentStart);
                              const overlapEnd = Math.min(itemEnd, paymentEnd);

                              if (overlapEnd > overlapStart) {
                                amountForThisItem = overlapEnd - overlapStart;
                              }`;

const replacement = `                              const itemPrice = item.price || 0;
                              let amountForThisItem = previewPayment.allocations?.[idx];
                              
                              if (amountForThisItem === undefined) {
                                // Fallback: Distribute amount paid over line items sequentially for display
                                let accumulatedOriginalAmount = 0;
                                if (idx > 0) {
                                  for (let i = 0; i < idx; i++) accumulatedOriginalAmount += invoice.lineItems[i].price || 0;
                                }
                                amountForThisItem = 0;
                                
                                const itemStart = accumulatedOriginalAmount;
                                const itemEnd = itemStart + itemPrice;
                                
                                const paymentStart = previousAmountPaid;
                                const paymentEnd = previousAmountPaid + previewPayment.amount;

                                const overlapStart = Math.max(itemStart, paymentStart);
                                const overlapEnd = Math.min(itemEnd, paymentEnd);

                                if (overlapEnd > overlapStart) {
                                  amountForThisItem = overlapEnd - overlapStart;
                                }
                              }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/Payments.tsx', code);
