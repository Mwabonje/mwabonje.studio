import React, { useRef, useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Quote, Settings } from "@/store";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Printer,
  ArrowLeft,
  Download,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getResolvedTheme } from "@/lib/theme";

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
        const uid = searchParams.get("uid");
        const quoteId = searchParams.get("id");
        const dataParam = searchParams.get("data"); // Fallback for old links

        if (uid && quoteId) {
          // Fetch quote
          const quoteDoc = await getDoc(
            doc(db, `users/${uid}/quotes`, quoteId),
          );
          if (quoteDoc.exists()) {
            setQuote(quoteDoc.data() as Quote);
          } else {
            setError("Quote not found.");
            setLoading(false);
            return;
          }

          // Fetch settings
          const settingsDoc = await getDoc(
            doc(db, `users/${uid}/settings`, "profile"),
          );
          if (settingsDoc.exists()) {
            setSettings(settingsDoc.data() as Settings);
          } else {
            // Fallback settings
            setSettings({
              logoUrl: "",
              companyName: "CaptureCRM",
              companyAddress: "",
              companyEmail: "",
              companyPhone: "",
              companyWebsite: "",
              colorScheme: "slate",
              paymentDetails: "",
            });
          }
        } else if (dataParam) {
          // Handle old encoded links
          const decodedString = decodeURIComponent(atob(dataParam));
          const parsedQuote = JSON.parse(decodedString) as Quote;
          setQuote(parsedQuote);
          setSettings({
            logoUrl: "",
            companyName: "CaptureCRM",
            companyAddress: "",
            companyEmail: "",
            companyPhone: "",
            companyWebsite: "",
            colorScheme: "slate",
            paymentDetails: "",
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
        <h1 className="text-2xl font-serif text-slate-800 mb-2">
          Quote Not Found
        </h1>
        <p className="text-slate-500 mb-6">
          {error || "Loading quote data..."}
        </p>
        <Button
          render={<Link to="/" />}
          variant="outline"
          className="rounded-none border-slate-300"
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      slate: "bg-slate-900",
      blue: "bg-blue-900",
      green: "bg-green-900",
      rose: "bg-rose-900",
      amber: "bg-amber-900",
      violet: "bg-violet-900",
    };
    return colors[color] || "bg-slate-900";
  };

  const handleDownloadPDF = async () => {
    if (!quoteRef.current || isGeneratingPDF) return;

    setIsGeneratingPDF(true);
    const originalScrollPos = window.scrollY;
    window.scrollTo(0, 0);

    try {
      const element = quoteRef.current;
      const originalStyle = element.style.cssText;
      const originalClass = element.className;
      
      element.className = element.className.replace('mx-auto', '').replace('max-w-[760px]', '').replace('w-full', '').replace('pb-10', '') + ' pdf-export';
      element.style.width = "760px";
      element.style.minWidth = "760px";
      element.style.maxWidth = "760px";
      element.style.padding = "0px";
      element.style.margin = "0px";
      element.style.boxShadow = "none";

      // Allow layout to recalculate
      await new Promise(resolve => setTimeout(resolve, 100));

      const safeTitle = (quote.projectTitle || "Quote")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

      const htmlToImage = await import("html-to-image");
      const jsPDFModule = await import("jspdf");
      const jsPDF = (
        "default" in jsPDFModule ? jsPDFModule.default : jsPDFModule
      ) as any;

      const dataUrl = await htmlToImage.toPng(element, {
        quality: 0.98,
        pixelRatio: 2,
        width: 760,
        style: {
          margin: '0',
          padding: '0',
          maxWidth: '760px',
          width: '760px',
          boxShadow: 'none',
        }
      });

      const pdfWidth = 210; // A4 width in mm
      const pdfHeightOriginal = (element.offsetHeight * pdfWidth) / 760;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeightOriginal]
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeightOriginal);

      pdf.save(`Proposal_${safeTitle}.pdf`);

      element.style.cssText = originalStyle;
      element.className = originalClass;
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      alert(
        `Failed to generate PDF: ${errorMessage}. Please try again or use the Print option.`,
      );
    } finally {
      window.scrollTo(0, originalScrollPos);
      setIsGeneratingPDF(false);
    }
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
            <Button
              onClick={handlePrint}
              variant="outline"
              className="text-slate-600 bg-white shadow-sm rounded-none border-slate-300 w-full sm:w-auto"
            >
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-none px-6 shadow-sm w-full sm:w-auto"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" /> Download PDF
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quote Document */}
        <div
          ref={quoteRef}
          className={`quote-root theme-${getResolvedTheme(settings?.documentTheme, settings?.companyEmail)} overflow-x-auto w-full mx-auto max-w-[760px] pb-10`}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
            .quote-root {
              --cream: #FAF8F4;
              --warm-white: #F5F2EC;
              --gold: #B8965A;
              --gold-light: #D4AC6E;
              --ink: #1C1C1C;
              --ink-mid: #3A3A3A;
              --ink-soft: #888880;
              --rule: #DDD8CE;
              --highlight: #F0EBE0;
              background: var(--cream);
              color: var(--ink);
              font-family: 'Jost', sans-serif;
              font-weight: 300;
              line-height: 1.6;
              text-align: left;
            }
            .quote-root.theme-modern {
              --cream: #FFFFFF;
              --warm-white: #F8FAFC;
              --gold: #3B82F6;
              --gold-light: #60A5FA;
              --ink: #0F172A;
              --ink-mid: #334155;
              --ink-soft: #64748B;
              --rule: #E2E8F0;
              --highlight: #F1F5F9;
              font-family: 'Inter', sans-serif;
            }
            .quote-root.theme-modern .header { text-align: center; display: grid; grid-template-columns: 1fr auto 1fr; align-items: baseline; gap: 24px; border-bottom: 2px solid var(--rule); padding-bottom: 32px; }
            .quote-root.theme-modern .header h1 { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 32px; letter-spacing: -1px; margin-bottom: 0; line-height: 1.2; text-align: center; }
            .quote-root.theme-modern .header h1 em { font-style: normal; color: var(--gold); }
            .quote-root.theme-modern .studio-name { margin-bottom: 0; letter-spacing: 2px; text-align: left; white-space: nowrap; }
            .quote-root.theme-modern .header-sub { margin-top: 0; text-align: right; white-space: nowrap; }
            .quote-root.theme-modern .package-card { border-radius: 12px; border: 1px solid var(--rule); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            .quote-root.theme-modern .premium-badge { border-radius: 0 0 8px 8px; right: 20px; }
            .quote-root.theme-modern .package-price { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 28px; letter-spacing: -0.5px; }
            .quote-root.theme-modern .total-amount { font-family: 'Inter', sans-serif; font-weight: 600; }
            .quote-root.theme-minimal {
              --cream: #FFFFFF;
              --warm-white: #FAFAFA;
              --gold: #000000;
              --gold-light: #555555;
              --ink: #000000;
              --ink-mid: #222222;
              --ink-soft: #666666;
              --rule: #E5E5E5;
              --highlight: #F5F5F5;
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            }
            .quote-root.theme-minimal .header { border-bottom: none; text-align: left; padding-bottom: 24px; margin-bottom: 32px; display: flex; flex-direction: column; }
            .quote-root.theme-minimal .header h1 { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 400; font-size: 24px; text-transform: uppercase; letter-spacing: 4px; margin-top: 16px; margin-bottom: 2px;}
            .quote-root.theme-minimal .header h1 em { font-style: normal; font-weight: 700; color: var(--ink); }
            .quote-root.theme-minimal .studio-name { font-weight: 700; margin-bottom: 0; color: var(--ink); }
            .quote-root.theme-minimal .package-card { padding: 32px; border: none; outline: 1px solid var(--rule); background: transparent; }
            .quote-root.theme-minimal .package-card.featured { outline: 2px solid var(--ink); background: transparent; }
            .quote-root.theme-minimal .package-card.featured .package-price, .quote-root.theme-minimal .package-card.featured .total-amount { color: var(--ink); }
            .quote-root.theme-minimal .package-card.featured .package-header { border-bottom-color: var(--rule); }
            .quote-root.theme-minimal .package-card.featured .total-row { border-top-color: var(--rule); color: var(--ink-soft); }
            .quote-root.theme-minimal .package-card.featured .inclusion-list li { color: var(--ink-mid); }
            .quote-root.theme-minimal .package-card.featured .package-tier { color: var(--ink); font-weight: 700; }
            .quote-root.theme-minimal .package-price { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 400; }
            .quote-root.theme-minimal .premium-badge { background: var(--ink); color: #fff; right: auto; left: 32px; top: -12px; padding: 4px 8px; }
            .quote-root.theme-minimal .total-amount { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 20px; }
            .quote-root * { box-sizing: border-box; margin: 0; padding: 0; }
            .quote-root .page { max-width: 760px; margin: 0 auto; padding: 64px 48px 80px; }

            /* ── HEADER ── */
            .quote-root .header { text-align: center; padding-bottom: 48px; border-bottom: 1px solid var(--rule); margin-bottom: 48px; }
            .quote-root .studio-name { font-family: 'Jost', sans-serif; font-weight: 500; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--gold); margin-bottom: 18px; }
            .quote-root .header h1 { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: 48px; line-height: 1.1; color: var(--ink); letter-spacing: -0.5px; margin-bottom: 8px; }
            .quote-root .header h1 em { font-style: italic; color: var(--gold); }
            .quote-root .header-sub { font-size: 13px; font-weight: 400; letter-spacing: 1px; color: var(--ink-soft); margin-top: 10px; }

            /* ── CLIENT META ── */
            .quote-root .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 40px; padding: 28px 32px; background: var(--warm-white); border-left: 3px solid var(--gold); margin-bottom: 52px; font-size: 13px; }
            .quote-root .meta-row { display: flex; gap: 8px; }
            .quote-root .meta-label { font-weight: 500; color: var(--ink-mid); min-width: 80px; }
            .quote-root .meta-value { color: var(--ink-soft); }

            /* ── SECTION LABEL ── */
            .quote-root .section-label { font-size: 10px; font-weight: 600; letter-spacing: 3.5px; text-transform: uppercase; color: var(--ink-soft); display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
            .quote-root .section-label::after { content: ''; flex: 1; height: 1px; background: var(--rule); }

            /* ── PACKAGES GRID ── */
            .quote-root .packages-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .quote-root .package-card { border: 1px solid var(--rule); padding: 28px 26px 22px; position: relative; background: #fff; }
            .quote-root .package-card.featured { border-color: var(--gold); background: var(--ink); grid-column: 1 / -1; }
            .quote-root .package-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; padding-bottom: 16px; border-bottom: 1px solid var(--rule); }
            .quote-root .package-card.featured .package-header { border-bottom-color: rgba(255,255,255,0.12); }
            .quote-root .package-tier { font-size: 10px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--ink-soft); }
            .quote-root .package-card.featured .package-tier { color: var(--gold-light); }
            .quote-root .package-price { font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 400; color: var(--ink); line-height: 1; }
            .quote-root .package-card.featured .package-price { color: #fff; }
            .quote-root .package-price span { font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 400; color: var(--ink-soft); vertical-align: middle; margin-right: 3px; border:none; padding:0; background:transparent;}
            .quote-root .package-card.featured .package-price span { color: rgba(255,255,255,0.5); }
            .quote-root .inclusions-label { font-size: 9px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--ink-soft); margin-bottom: 12px; }
            .quote-root .package-card.featured .inclusions-label { color: rgba(255,255,255,0.4); }
            .quote-root .inclusion-list { list-style: none; display: block; margin: 0; padding-left: 0; }
            .quote-root .inclusion-list li { font-size: 13.5px; font-weight: 300; color: var(--ink-mid); padding-left: 14px; position: relative; line-height: 1.45; margin-bottom: 9px; display: block; }
            .quote-root .inclusion-list li::before { content: '·'; position: absolute; left: 0; color: var(--gold); font-size: 18px; line-height: 1.1; }
            .quote-root .package-card.featured .inclusion-list li { color: rgba(255,255,255,0.75); }
            .quote-root .package-card.featured .inclusion-list li::before { color: var(--gold-light); }
            .quote-root .total-row { display: flex; justify-content: space-between; align-items: center; padding-top: 18px; margin-top: auto; border-top: 1px solid var(--rule); font-size: 11px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-soft); }
            .quote-root .package-card.featured .total-row { border-top-color: rgba(255,255,255,0.12); color: rgba(255,255,255,0.45); }
            .quote-root .total-amount { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 400; color: var(--ink); letter-spacing: 0; text-transform: none; }
            .quote-root .package-card.featured .total-amount { color: #fff; }
            .quote-root .premium-badge { position: absolute; top: -1px; right: 28px; background: var(--gold); color: #fff; font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; padding: 4px 12px; }

            /* ── FEATURED 2-COL BODY ── */
            .quote-root .featured-body { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px;}

            /* ── ADD-ON ── */
            .quote-root .addon { margin-top: 20px; padding: 20px 26px; border: 1px dashed var(--gold); background: var(--warm-white); display: flex; justify-content: space-between; align-items: center; gap: 24px; }
            .quote-root .addon-label { font-size: 10px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--gold); margin-bottom: 5px; }
            .quote-root .addon-desc { font-size: 13px; color: var(--ink-mid); font-weight: 300; line-height: 1.5; }
            .quote-root .addon-price { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 400; color: var(--ink); white-space: nowrap; }
            .quote-root .addon-price span { font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 400; color: var(--ink-soft); margin-right: 2px; vertical-align: middle; border:none; background:transparent;}
            .quote-root .addon-note { font-size: 11px; color: var(--ink-soft); margin-top: 4px; font-style: italic; }

            /* ── TERMS SECTION ── */
            .quote-root .terms { margin-top: 56px; }
            .quote-root .terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px 40px; margin-top: 4px; }
            .quote-root .term-block { padding-top: 20px; }
            .quote-root .term-title { font-size: 10px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--ink); margin-bottom: 8px; }
            .quote-root .term-body { font-size: 13px; font-weight: 300; color: var(--ink-soft); line-height: 1.65; white-space: pre-wrap; }

            /* ── PAYMENT DETAILS ── */
            .quote-root .payment { margin-top: 48px; padding: 28px 32px; background: var(--warm-white); border-top: 2px solid var(--ink); }
            .quote-root .payment-title { font-size: 10px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--ink); margin-bottom: 16px; }
            .quote-root .payment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 40px; font-size: 13px; color: var(--ink-soft); font-weight: 300; }
            .quote-root .payment-grid div { word-break: break-word; }

            /* ── NOTE ── */
            .quote-root .note { margin-top: 32px; padding: 18px 24px; border-left: 3px solid var(--gold); background: #fff; }
            .quote-root .note-label { font-size: 9px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
            .quote-root .note-label::before { content: '✦'; font-size: 8px; }
            .quote-root .note-body { font-size: 13px; color: var(--ink-mid); font-weight: 400; line-height: 1.7; white-space: pre-wrap; }

            /* ── FOOTER ── */
            .quote-root .footer { margin-top: 52px; padding-top: 24px; border-top: 1px solid var(--rule); text-align: center; }
            .quote-root .footer-name { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 400; letter-spacing: 3px; text-transform: uppercase; color: var(--ink); margin-bottom: 6px; }
            .quote-root .footer-contact { font-size: 12px; font-weight: 300; color: var(--ink-soft); letter-spacing: 0.5px; line-height: 1.8; }

            @media print {
              .quote-root { background: white; }
              .quote-root .page { padding: 32px; }
            }

            @media (max-width: 640px) {
              .quote-root:not(.pdf-export) .page { padding: 32px 20px 48px; }
              .quote-root:not(.pdf-export) .header h1 { font-size: 28px; }
              .quote-root.theme-modern:not(.pdf-export) .header { grid-template-columns: 1fr; text-align: center; gap: 12px; }
              .quote-root.theme-modern:not(.pdf-export) .studio-name { text-align: center; }
              .quote-root.theme-modern:not(.pdf-export) .header-sub { text-align: center; }
              .quote-root:not(.pdf-export) .meta { grid-template-columns: 1fr; gap: 12px; padding: 20px; margin-bottom: 32px; }
              .quote-root:not(.pdf-export) .packages-grid { grid-template-columns: 1fr; gap: 16px; }
              .quote-root:not(.pdf-export) .featured-body { grid-template-columns: 1fr; gap: 16px; }
              .quote-root:not(.pdf-export) .addon { flex-direction: column; align-items: flex-start; gap: 12px; }
              .quote-root:not(.pdf-export) .terms-grid { grid-template-columns: 1fr; gap: 24px; }
              .quote-root:not(.pdf-export) .payment { padding: 20px; }
              .quote-root:not(.pdf-export) .payment-grid { grid-template-columns: 1fr; gap: 12px; }
            }
          `,
            }}
          />
          <div className="page">
            {/* HEADER */}
            <header className="header">
              <div className="studio-name">
                {settings.companyName || "Mwabonje Photography"}
              </div>
              <h1>
                {quote.projectTitle ? (
                  <>
                    {quote.projectTitle.replace(/quotation$/i, '').trim()}{" "}
                    <em>Quotation</em>
                  </>
                ) : (
                  <>
                    Project <em>Quotation</em>
                  </>
                )}
              </h1>
              <div className="header-sub">Quote No. {quote.quoteNumber}</div>
            </header>

            {/* CLIENT META */}
            <div className="meta">
              <div className="meta-row">
                <span className="meta-label">Client</span>
                <span className="meta-value">
                  {quote.clientName || "Client Name"}
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Date</span>
                <span className="meta-value">
                  {quote.issueDate
                    ? format(new Date(quote.issueDate), "dd · MM · yyyy")
                    : "N/A"}
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Project</span>
                <span className="meta-value">
                  {quote.projectTitle || "N/A"}
                </span>
              </div>
              {quote.eventDate && (
                <div className="meta-row">
                  <span className="meta-label">Event Date</span>
                  <span className="meta-value">
                    {format(new Date(quote.eventDate), "dd · MM · yyyy")}
                  </span>
                </div>
              )}
              {quote.shootingTime && (
                <div className="meta-row">
                  <span className="meta-label">Shooting Time</span>
                  <span className="meta-value">
                    {quote.shootingTime.includes("-") && quote.shootingTime.split("-")[1].trim()
                      ? `from ${quote.shootingTime}`
                      : quote.shootingTime}
                  </span>
                </div>
              )}
              {quote.location && (
                <div className="meta-row">
                  <span className="meta-label">Location</span>
                  <span className="meta-value">{quote.location}</span>
                </div>
              )}
              {quote.photographers && quote.photographers.split('\n').map((line, idx) => {
                if (!line.trim()) return null;
                
                const parts = line.split(':');
                if (parts.length > 1) {
                  return (
                    <div className="meta-row" key={`crew-${idx}`}>
                      <span className="meta-label">{parts[0].trim()}</span>
                      <span className="meta-value">{parts.slice(1).join(':').trim()}</span>
                    </div>
                  );
                }
                
                const parenMatch = line.match(/^(.*?)\s*\((.*?)\)$/);
                if (parenMatch) {
                  return (
                    <div className="meta-row" key={`crew-${idx}`}>
                      <span className="meta-label">{parenMatch[2].trim()}</span>
                      <span className="meta-value">{parenMatch[1].trim()}</span>
                    </div>
                  );
                }

                return (
                  <div className="meta-row" key={`crew-${idx}`}>
                    <span className="meta-label">Crew</span>
                    <span className="meta-value">{line.trim()}</span>
                  </div>
                );
              })}
            </div>

            {/* PACKAGES */}
            {quote.packages && quote.packages.length > 0 && (
              <>
                <div className="section-label">Packages</div>
                <div className="packages-grid">
                  {quote.packages.map((pkg, index) => {
                    const isFeatured = pkg.isMostPopular;
                    return (
                      <div
                        key={pkg.id}
                        className={`package-card ${isFeatured ? "featured" : ""} flex flex-col`}
                      >
                        {isFeatured && (
                          <span className="premium-badge">Most Popular</span>
                        )}
                        <div className="package-header w-full">
                          <div>
                            <div className="package-tier">
                              {pkg.name || `Package ${index + 1}`}
                            </div>
                          </div>
                          <div className="package-price">
                            <span>Ksh</span>
                            {pkg.settlement.toLocaleString()}
                          </div>
                        </div>

                        {isFeatured ? (
                          <div className="featured-body w-full">
                            <div>
                              <div className="inclusions-label">Inclusions</div>
                              <ul className="inclusion-list">
                                {pkg.inclusions.filter(inc => inc.trim() !== "").slice(0, Math.ceil(pkg.inclusions.filter(inc => inc.trim() !== "").length / 2)).map((inc, i) => (<li key={i}>{inc}</li>))}
                              </ul>
                            </div>
                            <div>
                              <div className="inclusions-label">Extras</div>
                              <ul className="inclusion-list">
                                {pkg.inclusions
                                  .slice(Math.ceil(pkg.inclusions.length / 2))
                                  .map((inc, i) => (
                                    <li key={i}>{inc || "—"}</li>
                                  ))}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="inclusions-label">Inclusions</div>
                            <ul className="inclusion-list mb-auto w-full">
                              {pkg.inclusions.filter(inc => inc.trim() !== "").map((inc, i) => (<li key={i}>{inc}</li>))}
                            </ul>
                          </>
                        )}

                        <div className="total-row w-full mt-auto">
                          <span>Total Investment</span>
                          <span className="total-amount">
                            Ksh {pkg.settlement.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* NOTE */}
            {quote.note && (
              <div className="note">
                <div className="note-label">Note</div>
                <div className="note-body">{quote.note}</div>
              </div>
            )}

            {/* TERMS */}
            {(quote.retainerClause ||
              quote.fulfillmentSchedule ||
              quote.usageLicense ||
              quote.usageRights ||
              quote.transportLogistics ||
              quote.cancellationRescheduling ||
              quote.weatherConditions) && (
              <div className="terms">
                <div className="section-label">Terms of Engagement</div>
                <div className="terms-grid">
                  {quote.retainerClause && (
                    <div className="term-block">
                      <div className="term-title">Securing Your Session</div>
                      <div className="term-body">{quote.retainerClause}</div>
                    </div>
                  )}
                  {quote.fulfillmentSchedule && (
                    <div className="term-block">
                      <div className="term-title">Production & Delivery</div>
                      <div className="term-body">
                        {quote.fulfillmentSchedule}
                      </div>
                    </div>
                  )}
                  {quote.usageLicense && (
                    <div className="term-block">
                      <div className="term-title">Usage License</div>
                      <div className="term-body">{quote.usageLicense}</div>
                    </div>
                  )}
                  {quote.usageRights && (
                    <div className="term-block">
                      <div className="term-title">Usage Rights</div>
                      <div className="term-body">{quote.usageRights}</div>
                    </div>
                  )}
                  {quote.transportLogistics && (
                    <div className="term-block">
                      <div className="term-title">Transport & Logistics</div>
                      <div className="term-body">
                        {quote.transportLogistics}
                      </div>
                    </div>
                  )}
                  {quote.cancellationRescheduling && (
                    <div className="term-block">
                      <div className="term-title">Cancellation Policy</div>
                      <div className="term-body">
                        {quote.cancellationRescheduling}
                      </div>
                    </div>
                  )}
                  {quote.weatherConditions && (
                    <div className="term-block">
                      <div className="term-title">Weather & Conditions</div>
                      <div className="term-body">
                        {quote.weatherConditions}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PAYMENT DETAILS */}
            {(quote.paymentDetails || settings.paymentDetails) && (
              <div className="payment">
                <div className="payment-title">Payment Details</div>
                <div className="payment-grid">
                  {(() => {
                    const lines = (
                      quote.paymentDetails ||
                      settings.paymentDetails ||
                      ""
                    )
                      .split("\n")
                      .filter((line: string) => line.trim());
                    const mid = Math.ceil(lines.length / 2);
                    const col1 = lines.slice(0, mid);
                    const col2 = lines.slice(mid);

                    const renderLine = (line: string, i: number) => {
                      const parts = line.split(":");
                      if (parts.length > 1) {
                        return (
                          <div key={i} style={{ marginBottom: "4px" }}>
                            <span style={{ color: "var(--ink-soft)" }}>{parts[0].trim()}:</span>{" "}
                            <span style={{ color: "var(--ink)" }}>{parts.slice(1).join(":").trim()}</span>
                          </div>
                        );
                      }
                      return <div key={i} style={{ marginBottom: "4px" }}>{line}</div>;
                    };

                    return (
                      <>
                        <div className="payment-col">
                          {col1.map(renderLine)}
                        </div>
                        <div className="payment-col">
                          {col2.map(renderLine)}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* FOOTER */}
            <footer className="footer">
              <div className="footer-name">
                {settings.companyName || "Mwabonje Photography"}
              </div>
              <div className="footer-contact">
                {settings.companyEmail} ·{" "}
                {settings.companyAddress || "Malindi, Kenya"}
                <br />
                {settings.companyWebsite} · {settings.companyPhone}
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
