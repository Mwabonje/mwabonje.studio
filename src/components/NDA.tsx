import React, { forwardRef } from "react";
import { format } from "date-fns";
import { Quote, useStore } from "@/store";

interface NDAProps {
  quote: Quote;
  isAutoSigned?: boolean;
}

export const NDA = forwardRef<HTMLDivElement, NDAProps>(({ quote, isAutoSigned }, ref) => {
  const { settings } = useStore();
  const companyName = settings?.companyName || "Mwabonje Photography";
  const ownerName = settings?.ownerName || companyName;

  return (
    <div
      ref={ref}
      className="bg-white p-4 sm:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8 text-slate-800 text-sm leading-relaxed relative"
      style={{ fontFamily: "serif" }}
    >
      <div className="text-center space-y-2 mb-12">
        <h1 className="text-2xl font-bold uppercase tracking-wider">
          Non-Disclosure and Confidentiality Agreement
        </h1>
        <p className="text-slate-500">
          Effective Date: {format(new Date(), "MMMM d, yyyy")}
        </p>
      </div>

      <div className="space-y-4">
        <p>
          This NON-DISCLOSURE AND CONFIDENTIALITY AGREEMENT (the "Agreement") is
          entered into on this <strong>{format(new Date(), "do")}</strong> day
          of <strong>{format(new Date(), "MMMM, yyyy")}</strong> (the "Effective
          Date"), by and between:
        </p>

        <div className="pl-4 border-l-2 border-slate-200 ml-4 py-2">
          <p>
            <strong>1. {ownerName}</strong>{" "}
            ("Photographer/Videographer"),
          </p>
          <p>AND</p>
          <p>
            <strong>2. {quote.clientName}</strong> ("Client")
          </p>
        </div>

        <p>
          referred to individually as a "Party" and collectively as the
          "Parties."
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">1. Purpose of Agreement</h2>
        <p>
          The Client has engaged the Photographer to provide photography and/or
          videography services for the project titled "
          <strong>{quote.projectTitle}</strong>" (the "Project"). The Client
          desires to ensure that the resulting photographs, videos, and
          associated materials (the "Media") are kept strictly confidential and
          are not shared with the public or on any social media platforms.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">
          2. Definition of Confidential Information
        </h2>
        <p>
          For the purposes of this Agreement, "Confidential Information" shall
          include all photographs, videos, digital files, unedited raw footage,
          outtakes, and any other visual or audio representation of the Client,
          their guests, or the event created by the Photographer during the
          Project.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">3. Non-Disclosure Obligations</h2>
        <p>
          The Photographer agrees to the following strict confidentiality
          requirements:
        </p>
        <ul className="list-disc pl-8 space-y-2">
          <li>
            <strong>No Social Media Use:</strong> The Photographer shall not
            post, publish, share, or upload any Confidential Information to any
            social media networks (including but not limited to Instagram,
            TikTok, Facebook, Twitter/X, LinkedIn, or any future platforms).
          </li>
          <li>
            <strong>No Portfolio or Website Use:</strong> The Photographer shall
            not use the Confidential Information on their professional website,
            in online or printed portfolios, or in any marketing or promotional
            materials without explicit, prior written consent from the Client.
          </li>
          <li>
            <strong>Third-Party Sharing:</strong> The Photographer will not
            sell, give, license, or share the Confidential Information with any
            third party, publication, or vendor, except as strictly necessary to
            fulfill the services contracted by the Client (e.g., sharing with
            sub-contracted editors or printing labs who are also bound by
            confidentiality).
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">4. Ownership and Delivery</h2>
        <p>
          The Photographer retains the copyright to the Media as defined in the
          original service agreement or quote (Quote #
          {quote.quoteNumber || quote.id.slice(0, 8)}), but waives the standard
          right to use the Media for promotional purposes in consideration of
          this Agreement. The Photographer will securely deliver the final Media
          to the Client and maintain any necessary backups privately for an
          agreed period, after which they may be deleted upon the Client's
          instruction.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">5. Term and Termination</h2>
        <p>
          The non-disclosure obligations set forth in this Agreement shall
          remain in effect perpetually, unless explicitly modified or terminated
          in writing by both Parties.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">6. Remedies</h2>
        <p>
          The Photographer acknowledges that any unauthorized disclosure or use
          of the Confidential Information may cause irreparable harm to the
          Client, for which monetary damages alone may not be an adequate
          remedy. The Client shall be entitled to seek injunctive relief to
          prevent such disclosure, in addition to any other legal or equitable
          remedies available.
        </p>
      </div>

      <div className="mt-16 pt-8 border-t border-slate-200">
        <p className="mb-8 font-bold">
          IN WITNESS WHEREOF, the Parties have executed this Non-Disclosure and
          Confidentiality Agreement as of the Effective Date.
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
              The Photographer
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

NDA.displayName = "NDA";
