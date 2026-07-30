import React, { forwardRef } from "react";
import { format } from "date-fns";
import { Quote, useStore } from "@/store";

interface ContractProps {
  quote: Quote;
  isAutoSigned?: boolean;
}

export const Contract = forwardRef<HTMLDivElement, ContractProps>(({ quote, isAutoSigned }, ref) => {
  const { settings } = useStore();
  const companyName = settings?.companyName || "Mwabonje Photography";
  const ownerName = settings?.ownerName || companyName;

  const getSelectedPackages = () => {
    if (quote.selectedPackages && quote.selectedPackages.length > 0) {
      return quote.packages.filter(pkg => quote.selectedPackages!.includes(pkg.id));
    }
    return quote.packages;
  };

  const getSubtotal = () =>
    getSelectedPackages().reduce((sum, pkg) => sum + pkg.settlement, 0);

  const getTaxAmount = () => {
    if (!quote.taxRate) return 0;
    return getSubtotal() * (quote.taxRate / 100);
  };

  const getTotalAmount = () => getSubtotal() + getTaxAmount();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: quote.currency || "KES",
    }).format(amount);
  };

  return (
    <div
      ref={ref}
      className="bg-white p-4 sm:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8 text-slate-800 text-sm leading-relaxed relative"
      style={{ fontFamily: "serif" }}
    >
      <div className="text-center space-y-2 mb-12">
        <h1 className="text-2xl font-bold uppercase tracking-wider">
          Service Agreement
        </h1>
        <p className="text-slate-500">
          Quote / Ref Number: {quote.quoteNumber || quote.id.slice(0, 8)}
        </p>
      </div>

      <div className="space-y-4">
        <p>
          This SERVICE AGREEMENT (the "Agreement") is entered into on this{" "}
          <strong>{format(new Date(), "do")}</strong> day of{" "}
          <strong>{format(new Date(), "MMMM, yyyy")}</strong> (the "Effective
          Date"), by and between:
        </p>

        <div className="pl-4 border-l-2 border-slate-200 ml-4 py-2 flex flex-col gap-4">
          <div>
            <strong>1. {ownerName}</strong>{companyName !== ownerName ? ` (trading as ${companyName})` : ""}
            <br />
            ("Service Provider")
          </div>
          <div>AND</div>
          <div>
            <strong>2. {quote.clientName}</strong>
            <br />
            ("Client")
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">1. Scope of Services</h2>
        <p>
          The Service Provider agrees to provide photography and/or videography
          services for the Client's project titled "<strong>{quote.projectTitle}</strong>".
        </p>
        <p>
          <strong>Event/Project Date:</strong> {quote.eventDate ? format(new Date(quote.eventDate), "MMMM d, yyyy") : "TBD"}<br />
          <strong>Location:</strong> {quote.location || "TBD"}
          {quote.photographers && quote.photographers.split('\n').map((line, idx) => {
            if (!line.trim()) return null;
            
            const parts = line.split(':');
            if (parts.length > 1) {
              return (
                <React.Fragment key={`crew-${idx}`}>
                  <br />
                  <strong>{parts[0].trim()}:</strong> {parts.slice(1).join(':').trim()}
                </React.Fragment>
              );
            }
            
            const parenMatch = line.match(/^(.*?)\s*\((.*?)\)$/);
            if (parenMatch) {
              return (
                <React.Fragment key={`crew-${idx}`}>
                  <br />
                  <strong>{parenMatch[2].trim()}:</strong> {parenMatch[1].trim()}
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={`crew-${idx}`}>
                <br />
                <strong>Crew:</strong> {line.trim()}
              </React.Fragment>
            );
          })}
        </p>
        <div className="bg-slate-50 p-4 border border-slate-200 text-xs">
          <strong>Packages Selected:</strong>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            {getSelectedPackages().map((pkg) => (
              <li key={pkg.id}>
                {pkg.name} - {formatCurrency(pkg.settlement)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">2. Payment Terms</h2>
        <p>
          In consideration for the services provided, the Client agrees to pay the
          Service Provider the total amount of <strong>{formatCurrency(getTotalAmount())}</strong>.
        </p>
        <div className="pl-4 border-l-2 border-slate-200 text-slate-700 whitespace-pre-wrap">
          {quote.retainerClause || "A non-refundable retainer must be paid upon signing this Agreement to secure the Date. The remaining balance shall be due and payable prior to or on the date of the event/project."}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">3. Cancellation and Postponement</h2>
        <p>
          In the event the Client cancels the services, the retainer fee is non-refundable as it serves as liquidated damages to the Service Provider for reserving the Date. If the Client requests to postpone or change the Date, the Service Provider will accommodate the change subject to availability, and a new agreement or amendment may be required.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">4. Copyright and Image Reproduction</h2>
        <p>
          The Service Provider retains the copyright to all images and media produced. Upon final payment, the Client is granted a non-exclusive, non-transferable license to use, reproduce, and share the media.{' '}
          {quote.hasCommercialLicense ? (
            <>
              Full commercial usage license included with all delivered assets — covering advertising, packaging, social media, and web use by {quote.clientName}. Portfolio use by Mwabonje Photography included unless otherwise requested.
            </>
          ) : (
            <>
              Commercial use of the media by the Client requires prior written consent from the Service Provider. Portfolio use by Mwabonje Photography included unless otherwise requested.
            </>
          )}
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">5. Delivery and Archiving</h2>
        <p>
          The Service Provider shall deliver the final edited media to the Client within a reasonable timeframe, typically estimated in the attached quotation. Following delivery, the Client assumes sole responsibility for backing up the media. The Service Provider will retain active files for up to 7 days post-delivery; thereafter, archives may be purged.
        </p>
      </div>

      <div className="mt-16 pt-8 border-t border-slate-200">
        <p className="mb-8 font-bold">
          IN WITNESS WHEREOF, the Parties have executed this Agreement as of the
          Effective Date.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
          <div className="space-y-6">
            <h3 className="font-bold text-slate-500 uppercase text-xs tracking-wider">
              The Client
            </h3>
            <div className="border-b border-slate-400 pb-1 h-16 flex items-end">
              {/* Client signature space */}
            </div>
            <div>
              <p className="font-medium text-lg">{quote.clientName}</p>
              <p className="text-sm text-slate-500">Date & Signature</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-bold text-slate-500 uppercase text-xs tracking-wider">
              Service Provider
            </h3>
            <div className="border-b border-slate-400 pb-1 h-16 relative flex items-end">
              {isAutoSigned && settings?.companySignature && (
                <img 
                  src={settings.companySignature} 
                  alt="Owner Signature" 
                  className="absolute bottom-0 left-0 h-20 w-auto object-contain mix-blend-multiply opacity-90"
                />
              )}
            </div>
            <div>
              <p className="font-medium text-lg">{ownerName}</p>
              <p className="text-sm text-slate-500">Date & Signature</p>
            </div>
          </div>
        </div>
      </div>
      
      {isAutoSigned && (
         <div className="absolute top-4 right-4 print:hidden opacity-50 bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-sans font-medium">Auto-Signed via Settings</div>
      )}
    </div>
  );
});

Contract.displayName = "Contract";
