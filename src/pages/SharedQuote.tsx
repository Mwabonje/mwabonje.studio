import React, { useRef, useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Quote } from '@/store';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Printer, ArrowLeft, Download } from 'lucide-react';
import { format } from 'date-fns';
import html2pdf from 'html2pdf.js';

export function SharedQuote() {
  const [searchParams] = useSearchParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    try {
      const dataParam = searchParams.get('data');
      if (dataParam) {
        const decodedString = decodeURIComponent(atob(dataParam));
        const parsedQuote = JSON.parse(decodedString) as Quote;
        setQuote(parsedQuote);
      } else {
        setError("No quote data found in the link.");
      }
    } catch (err) {
      console.error("Failed to parse quote data:", err);
      setError("The quote link appears to be invalid or corrupted.");
    }
  }, [searchParams]);

  if (error || !quote) {
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

  const handleDownloadPDF = () => {
    if (!quoteRef.current) return;
    
    const opt = {
      margin:       [15, 15, 15, 15] as [number, number, number, number],
      filename:     `Proposal_${quote.projectTitle.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg' as const, quality: 1 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    const element = quoteRef.current;
    html2pdf().set(opt).from(element).save();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto">
        
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 print:hidden">
          <Button variant="ghost" render={<Link to="/quotes" />} className="text-slate-500 hover:text-slate-900 rounded-none w-full sm:w-auto justify-start sm:justify-center">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <Button onClick={handlePrint} variant="outline" className="text-slate-600 bg-white shadow-sm rounded-none border-slate-300 w-full sm:w-auto">
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button onClick={handleDownloadPDF} className="bg-slate-900 hover:bg-slate-800 text-white rounded-none px-6 shadow-sm w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
          </div>
        </div>

        {/* Quote Document */}
        <div ref={quoteRef} className="bg-white shadow-xl border border-slate-100 p-6 sm:p-12 md:p-20 print:shadow-none print:border-none print:p-0 relative overflow-hidden">
          
          {/* Decorative Top Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-900"></div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start mb-16">
            <div className="mb-8 sm:mb-0">
              <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase mb-2">Proposal For</h2>
              <h1 className="text-4xl sm:text-5xl font-serif text-slate-900 leading-tight">{quote.clientName || 'Client Name'}</h1>
              <p className="text-lg text-slate-500 mt-2 font-serif italic">{quote.projectTitle || 'Project Title'}</p>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-3xl sm:text-4xl font-serif text-slate-200 tracking-widest uppercase mb-4">Quote</h2>
              <div className="space-y-1">
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

          {/* Packages */}
          <div className="mb-16">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-[0.15em] mb-8">Investment Options</h3>
            
            {quote.packages.length === 0 ? (
              <p className="text-slate-400 italic font-serif">No packages detailed.</p>
            ) : (
              <div className="space-y-8">
                {quote.packages.map((pkg, index) => (
                  <div key={pkg.id} className="border border-slate-200 p-8 print:border-slate-300 relative group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-slate-400 transition-colors"></div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                      <h4 className="text-2xl font-serif text-slate-900">{pkg.name || `Package ${index + 1}`}</h4>
                      <span className="text-xl font-serif text-slate-900 tracking-wide">
                        Ksh {pkg.settlement.toLocaleString()}
                      </span>
                    </div>
                    {pkg.inclusions.length > 0 && (
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
                        {pkg.inclusions.map((inc, i) => (
                          <li key={i} className="flex items-start text-sm text-slate-600">
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
            
            {quote.packages.length > 0 && (
              <div className="flex justify-end pt-12">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Total Estimated Value</p>
                  <p className="text-4xl font-serif text-slate-900">
                    Ksh {quote.totalAmount.toLocaleString()}
                  </p>
                </div>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
              {quote.retainerClause && (
                <div>
                  <h5 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Retainer & Booking</h5>
                  <p className="text-slate-500 text-sm whitespace-pre-wrap leading-relaxed">{quote.retainerClause}</p>
                </div>
              )}
              {quote.fulfillmentSchedule && (
                <div>
                  <h5 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Fulfillment Schedule</h5>
                  <p className="text-slate-500 text-sm whitespace-pre-wrap leading-relaxed">{quote.fulfillmentSchedule}</p>
                </div>
              )}
              {quote.usageLicense && (
                <div>
                  <h5 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Usage License</h5>
                  <p className="text-slate-500 text-sm whitespace-pre-wrap leading-relaxed">{quote.usageLicense}</p>
                </div>
              )}
              {quote.cancellationRescheduling && (
                <div>
                  <h5 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Cancellation</h5>
                  <p className="text-slate-500 text-sm whitespace-pre-wrap leading-relaxed">{quote.cancellationRescheduling}</p>
                </div>
              )}
              {quote.paymentDetails && (
                <div className="md:col-span-2 bg-slate-50 p-8 border border-slate-100 print:bg-transparent print:border-slate-200">
                  <h5 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Payment Details</h5>
                  <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{quote.paymentDetails}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Signature Area */}
          <div className="mt-24 pt-12 border-t border-slate-200 flex justify-between items-end print:break-inside-avoid">
            <div>
              <p className="text-xs font-bold tracking-[0.1em] text-slate-400 uppercase mb-8">Accepted By</p>
              <div className="w-48 h-px bg-slate-300 mb-2"></div>
              <p className="text-xs text-slate-500">Signature / Date</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-serif text-slate-900 font-bold">Thank you for your business.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
