const fs = require('fs');
let code = fs.readFileSync('src/pages/Payments.tsx', 'utf-8');

const target = `<div className="space-y-2">
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  required
                />
              </div>`;

const replacement = `{formData.invoiceId ? (() => {
                const selectedInvoice = invoices.find(i => i.id === formData.invoiceId);
                return (
                  <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium text-sm">Package Allocations</h4>
                    {selectedInvoice?.lineItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground line-clamp-1">{item.description}</Label>
                          <div className="text-sm font-medium">KES {(item.price || 0).toLocaleString()}</div>
                        </div>
                        <div className="w-1/3">
                          <Input
                            type="number"
                            min="0"
                            max={item.price || 0}
                            placeholder="0"
                            value={formData.allocations?.[idx] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : 0;
                              const newAllocations = { ...(formData.allocations || {}), [idx]: val };
                              const totalAmount = Object.values(newAllocations).reduce((acc: any, curr: any) => acc + curr, 0);
                              setFormData({ ...formData, allocations: newAllocations, amount: totalAmount });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Payment Amount</span>
                        <span className="font-bold text-lg">KES {formData.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (KES)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    value={formData.amount || ''}
                    disabled
                    placeholder="Select an invoice first"
                    required
                  />
                </div>
              )}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/Payments.tsx', code);
