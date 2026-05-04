import React, { useRef, useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Quote, Settings } from '@/store';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Printer, ArrowLeft, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function SharedQuote() {
  const [searchParams] = useSearchParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const quoteRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchQuoteData = async () => {
      try {
        const uid = searchParams.get('uid');
        const quoteId = searchParams.get('id');
        const dataParam = searchParams.get('data'); // Fallback for old links

        if (uid && quoteId) {
          // Fetch quote
          const quoteDoc = await getDoc(doc(db, `users/${uid}/quotes`, quoteId));
          if (quoteDoc.exists()) {
            setQuote(quoteDoc.data() as Quote);
          } else {
            setError("Quote not found.");
            setLoading(false);
            return;
          }

          // Fetch settings
          const settingsDoc = await getDoc(doc(db, `users/${uid}/settings`, 'profile'));
          if (settingsDoc.exists()) {
            setSettings(settingsDoc.data() as Settings);
          } else {
            // Fallback settings
            setSettings({
              logoUrl: '',
              companyName: 'CaptureCRM',
              companyAddress: '',
              companyEmail: '',
              companyPhone: '',
              companyWebsite: '',
              colorScheme: 'slate',
              paymentDetails: '',
            });
          }
        } else if (dataParam) {
          // Handle old encoded links
          const decodedString = decodeURIComponent(atob(dataParam));
          const parsedQuote = JSON.parse(decodedString) as Quote;
          setQuote(parsedQuote);
          setSettings({
            logoUrl: '',
            companyName: 'CaptureCRM',
            companyAddress: '',
            companyEmail: '',
            companyPhone: '',
            companyWebsite: '',
            colorScheme: 'slate',
            paymentDetails: '',
          });
        } else {
          setError("No quote data found in the link.");
        }
      } catch (err) {
        console.error("Failed to fetch quote data:", err);
        setError("The quote link appears to be invalid or corrupted.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuoteData();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error || !quote || !settings) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] p-4">
        <h1 className="text-2xl font-serif text-slate-800 mb-2">Quote Not Found</h1>
        <p className="text-slate-500 mb-6">{error || "Loading quote data..."}</p>
        <Button render={<Link to="/" />} variant="outline" className="rounded-none border-slate-300">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      slate: 'bg-slate-900',
      blue: 'bg-blue-900',
      green: 'bg-green-900',
      rose: 'bg-rose-900',
      amber: 'bg-amber-900',
      violet: 'bg-violet-900',
    };
    return colors[color] || 'bg-slate-900';
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto">
        
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center mb-8 gap-4 print:hidden">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <Button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 text-white rounded-none px-6 shadow-sm w-full sm:w-auto">
              <Printer className="w-4 h-4 mr-2" /> Print / Save as PDF
            </Button>
          </div>
        </div>

        {/* Quote Document */}
        <div ref={quoteRef} className="bg-white shadow-xl border border-slate-100 p-6 sm:p-12 md:p-20 print:shadow-none print:border-none print:p-0 relative overflow-hidden">
          
          {/* Decorative Top Line */}
          <div className={`absolute top-0 left-0 w-full h-1 ${getColorClass(settings.colorScheme)}`}></div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start mb-16">
            <div className="mb-8 sm:mb-0">
              {settings.logoUrl && (
                <img src={settings.logoUrl} alt="Company Logo" className="h-16 object-contain mb-8" />
              )}
              <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase mb-2">Proposal For</h2>
              <h1 className="text-4xl sm:text-5xl font-serif text-slate-900 leading-tight">{quote.clientName || 'Client Name'}</h1>
              <p className="text-lg text-slate-500 mt-2 font-serif italic mb-4">
                {quote.projectTitle || 'Project Title'}
                {quote.revisionOf && (
                  <span className="ml-3 text-xs font-sans font-bold tracking-widest uppercase text-slate-400 border border-slate-200 px-3 py-1 rounded-full align-middle print:border-slate-300">
                    Revision
                  </span>
                )}
              </p>
              {(quote.clientEmail || quote.clientPhone) && (
                <div className="text-sm text-slate-500 space-y-1">
                  {quote.clientEmail && <p>{quote.clientEmail}</p>}
                  {quote.clientPhone && <p>{quote.clientPhone}</p>}
                </div>
              )}
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-3xl sm:text-4xl font-serif text-slate-200 tracking-widest uppercase mb-4">Quote</h2>
              <div className="space-y-1">
                <p className="text-xs font-bold tracking-[0.1em] text-slate-400 uppercase">Quote No.</p>
                <p className="text-sm text-slate-800 mb-4 font-mono">{quote.quoteNumber || 'N/A'}</p>
                
                <p className="text-xs font-bold tracking-[0.1em] text-slate-400 uppercase">Issue Date</p>
                <p className="text-sm text-slate-800 mb-4">{quote.issueDate ? format(new Date(quote.issueDate), 'MMMM d, yyyy') : 'N/A'}</p>
                
                {quote.eventDate && (
                  <>
                    <p className="text-xs font-bold tracking-[0.1em] text-slate-400 uppercase">Event Date</p>
                    <p className="text-sm text-slate-800">{format(new Date(quote.eventDate), 'MMMM d, yyyy')}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200 mb-16"></div>

          {/* Deliverables Preview */}
          {(quote.deliverablesTitle || quote.deliverablesSubTitle || quote.deliverablesPrice || (quote.deliverableTasks && quote.deliverableTasks.length > 0)) && (
            <div className="mb-16 bg-[#1a1b1a] text-white py-8 px-6 sm:py-12 sm:px-12 md:px-20 -mx-6 sm:-mx-12 md:-mx-20 shadow-lg ring-1 ring-white/10 print:-mx-0 print:p-8 shrink-0 break-inside-avoid">
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-white/10 pb-8 gap-6">
                <div>
                  {quote.deliverablesSubTitle && (
                    <p className="text-[#d88c42] text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
                      {quote.deliverablesSubTitle}
                    </p>
                  )}
                  {quote.deliverablesTitle && (
                    <h3 className="text-3xl font-serif text-[#f4ecd8]">
                      {quote.deliverablesTitle}
                    </h3>
                  )}
                </div>
                {quote.deliverablesPrice && (
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-white/40 text-[10px] font-bold tracking-[0.15em] uppercase mb-1">
                      Total Investment
                    </p>
                    <p className="text-3xl font-serif text-white">
                      <span className="text-sm text-white/50 mr-1 select-none">Ksh</span> 
                      {Number(quote.deliverablesPrice).toLocaleString()}
                    </p>
                    {quote.deliverablesNote && (
                      <p className="text-[#a1a1aa] text-xs mt-1">
                        {quote.deliverablesNote}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Tasks Section */}
              <div>
                <h4 className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase mb-8">
                  Deliverables By Task
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  {quote.deliverableTasks.map((task, idx) => (
                    <div key={task.id} className="space-y-4 break-inside-avoid">
                      <div className="flex items-center space-x-3 border-b border-white/10 pb-3">
                        <span className="bg-[#3e5e3d] text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-sm shrink-0">
                          {idx + 1}
                        </span>
                        <h5 className="text-[#d88c42] text-xs font-bold tracking-[0.15em] uppercase">
                          {task.title}
                        </h5>
                      </div>
                      <ul className="space-y-3">
                        {task.items.map((item, iDx) => (
                          <li key={iDx} className="text-[#e2e8f0] text-sm flex items-start leading-relaxed font-normal">
                            <span className="text-white/30 mr-3 shrink-0 select-none font-normal">·</span>
                            <span className="font-normal">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Packages */}
          <div className="mb-16">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-[0.15em] mb-8">Investment Options</h3>
            
            {(quote.packages || []).length === 0 ? (
              <p className="text-slate-400 italic font-serif">No packages detailed.</p>
            ) : (
              <div className="space-y-8">
                {(quote.packages || []).map((pkg, index) => (
                  <div key={pkg.id} className="border border-slate-200 p-8 print:border-slate-300 relative group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-slate-400 transition-colors"></div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                      <h4 className="text-2xl font-serif text-slate-900">{pkg.name || `Package ${index + 1}`}</h4>
                      <span className="text-xl font-serif text-slate-900 tracking-wide">
                        Ksh {pkg.settlement.toLocaleString()}
                      </span>
                    </div>
                    {(pkg.inclusions || []).length > 0 && (
                      <ul className="columns-1 sm:columns-2 gap-x-8">
                        {(pkg.inclusions || []).map((inc, i) => (
                          <li key={i} className="mb-3 flex items-start text-sm text-slate-600 break-inside-avoid">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-3 mt-1.5 shrink-0"></span>
                            <span className="leading-relaxed">{inc || 'Empty inclusion'}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Note */}
          {quote.note && (
            <div className="mb-16">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-[0.15em] mb-6">Project Notes</h3>
              <div className="pl-6 border-l-2 border-slate-200">
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed font-serif italic">{quote.note}</p>
              </div>
            </div>
          )}

          <div className="w-full h-px bg-slate-200 mb-12 print:break-before-auto"></div>

          {/* Terms */}
          <div className="print:break-inside-avoid">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-[0.15em] mb-8">Terms & Conditions</h3>
            
            <div className="flex flex-wrap -mx-8">
              {quote.retainerClause && (
                <div className="w-full md:w-1/2 px-8 mb-10">
                  <h5 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Retainer & Booking</h5>
                  <p className="text-slate-500 text-sm whitespace-pre-wrap leading-relaxed">{quote.retainerClause}</p>
                </div>
              )}
              {quote.fulfillmentSchedule && (
                <div className="w-full md:w-1/2 px-8 mb-10">
                  <h5 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Fulfillment Schedule</h5>
                  <p className="text-slate-500 text-sm whitespace-pre-wrap leading-relaxed">{quote.fulfillmentSchedule}</p>
                </div>
              )}
              {quote.usageLicense && (
                <div className="w-full md:w-1/2 px-8 mb-10">
                  <h5 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Usage License</h5>
                  <p className="text-slate-500 text-sm whitespace-pre-wrap leading-relaxed">{quote.usageLicense}</p>
                </div>
              )}
              {quote.usageRights && (
                <div className="w-full md:w-1/2 px-8 mb-10">
                  <h5 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Usage Rights</h5>
                  <p className="text-slate-500 text-sm whitespace-pre-wrap leading-relaxed">{quote.usageRights}</p>
                </div>
              )}
              {quote.transportLogistics && (
                <div className="w-full md:w-1/2 px-8 mb-10">
                  <h5 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Transport & Logistics</h5>
                  <p className="text-slate-500 text-sm whitespace-pre-wrap leading-relaxed">{quote.transportLogistics}</p>
                </div>
              )}
              {quote.cancellationRescheduling && (
                <div className="w-full md:w-1/2 px-8 mb-10">
                  <h5 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Cancellation</h5>
                  <p className="text-slate-500 text-sm whitespace-pre-wrap leading-relaxed">{quote.cancellationRescheduling}</p>
                </div>
              )}
              {quote.paymentDetails && (
                <div className="w-full px-8 mb-10">
                  <div className="bg-slate-50 p-8 border border-slate-100 print:bg-transparent print:border-slate-200">
                    <h5 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Payment Details</h5>
                    <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{quote.paymentDetails}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Signature Area */}
          <div className="mt-24 pt-12 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-12 sm:gap-0 print:break-inside-avoid">
            <div className="w-full sm:w-auto">
              <p className="text-xs font-bold tracking-[0.1em] text-slate-400 uppercase mb-8">Accepted By</p>
              <div className="w-full sm:w-48 h-px bg-slate-300 mb-2"></div>
              <p className="text-xs text-slate-500">Signature / Date</p>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="font-bold text-slate-900 text-sm">{settings.companyName}</p>
              {settings.companyEmail && <p className="text-xs text-slate-500 break-all">{settings.companyEmail}</p>}
              {settings.companyPhone && <p className="text-xs text-slate-500">{settings.companyPhone}</p>}
              {settings.companyWebsite && <p className="text-xs text-slate-500 break-all">{settings.companyWebsite}</p>}
              {settings.companyAddress && <p className="text-xs text-slate-500 whitespace-pre-wrap mt-1">{settings.companyAddress}</p>}
              <p className="text-xs text-slate-500 mt-2 italic">Thank you for your business.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
