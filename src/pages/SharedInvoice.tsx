import React, { useRef, useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Invoice, Project, Client, Settings } from '@/store';
import { Button } from '@/components/ui/button';
import { Printer, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function SharedInvoice() {
  const [searchParams] = useSearchParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [quote, setQuote] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const uid = searchParams.get('uid');
        const invoiceId = searchParams.get('id');

        if (uid && invoiceId) {
          // Fetch invoice
          const invoiceDoc = await getDoc(doc(db, `users/${uid}/invoices`, invoiceId));
          if (invoiceDoc.exists()) {
            const invData = invoiceDoc.data() as Invoice;
            setInvoice(invData);
            
            // Fetch client
            if (invData.clientId) {
              const clientDoc = await getDoc(doc(db, `users/${uid}/clients`, invData.clientId));
              if (clientDoc.exists()) {
                setClient(clientDoc.data() as Client);
              }
            }
            
            // Fetch project
            if (invData.projectId) {
              const projectDoc = await getDoc(doc(db, `users/${uid}/projects`, invData.projectId));
              if (projectDoc.exists()) {
                setProject(projectDoc.data() as Project);
              }
            }

            // Fetch quote
            if (invData.quoteId && invData.quoteId !== 'none') {
              const quoteDoc = await getDoc(doc(db, `users/${uid}/quotes`, invData.quoteId));
              if (quoteDoc.exists()) {
                setQuote(quoteDoc.data());
              }
            }
          } else {
            setError("Invoice not found.");
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
        } else {
          setError("No invoice data found in the link.");
        }
      } catch (err) {
        console.error("Failed to fetch invoice data:", err);
        setError("The invoice link appears to be invalid or corrupted.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error || !invoice || !settings) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] p-4">
        <h1 className="text-2xl font-serif text-slate-800 mb-2">Invoice Not Found</h1>
        <p className="text-slate-500 mb-6">{error || "Loading invoice data..."}</p>
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

  const renderDescription = (description: string) => {
    if (!description) return <div className="item-name">Item description</div>;
    
    // Check if description matches "Title (Item 1, Item 2)" format
    const match = description.match(/^(.*?)\s*\((.*)\)$/);
    if (match) {
      const [_, title, inclusionsStr] = match;
      const inclusions = inclusionsStr.split(',').map(s => s.trim()).filter(Boolean);
      return (
        <div>
          <div className="item-name">{title}</div>
          {inclusions.length > 0 && (
            <ul className="item-desc" style={{ listStyleType: 'square', paddingLeft: '1.25rem', marginTop: '0.25rem', marginBottom: '0' }}>
              {inclusions.map((inc, i) => (
                <li key={i} style={{ paddingLeft: '0.25rem', marginBottom: '0.25rem' }}>{inc}</li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    
    return <div className="item-name">{description}</div>;
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    const originalScrollPos = window.scrollY;
    window.scrollTo(0, 0);

    try {
      const element = invoiceRef.current;
      const originalStyle = element.style.cssText;
      const originalClass = element.className;

      element.className = element.className.replace('mx-auto', '').replace('max-w-[760px]', '').replace('w-full', '') + ' pdf-export';
      element.style.width = '760px';
      element.style.minWidth = '760px';
      element.style.maxWidth = '760px';
      element.style.margin = '0px';
      element.style.padding = '0px';
      element.style.boxShadow = 'none';
      
      // Allow layout to recalculate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const safeTitle = (project?.title || 'Invoice').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      const htmlToImage = await import('html-to-image');
      const jsPDFModule = await import('jspdf');
      const jsPDF = ('default' in jsPDFModule ? jsPDFModule.default : jsPDFModule) as any;

      const dataUrl = await htmlToImage.toPng(element, { 
        quality: 1, 
        pixelRatio: 2,
        backgroundColor: '#FAF8F4',
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
      
      pdf.save(`Invoice_${safeTitle}.pdf`);
      
      element.style.cssText = originalStyle;
      element.className = originalClass;
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to generate PDF: ${errorMessage}. Please try again or use the Print option.`);
    } finally {
      window.scrollTo(0, originalScrollPos);
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const balance = invoice.totalAmount - invoice.amountPaid;

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0 font-sans text-slate-800">
      <style dangerouslySetInnerHTML={{ __html: `
        .invoice-root {
          --cream: #FAF8F4;
          --warm-white: #F5F2EC;
          --gold: #B8965A;
          --gold-light: #D4AC6E;
          --ink: #1C1C1C;
          --ink-mid: #3A3A3A;
          --ink-soft: #888880;
          --rule: #DDD8CE;
          --red: #C0392B;
          --green: #2E7D52;
          background: var(--cream);
          color: var(--ink);
          font-family: 'Jost', sans-serif;
          font-weight: 300;
          line-height: 1.6;
          text-align: left;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .invoice-root.theme-modern {
          --cream: #FFFFFF;
          --warm-white: #F8FAFC;
          --gold: #3B82F6;
          --gold-light: #60A5FA;
          --ink: #0F172A;
          --ink-mid: #334155;
          --ink-soft: #64748B;
          --rule: #E2E8F0;
          --red: #EF4444;
          --green: #22C55E;
          font-family: 'Inter', sans-serif;
        }
        .invoice-root.theme-modern .header { align-items: flex-end; padding-bottom: 24px; border-bottom: 2px solid var(--rule); }
        .invoice-root.theme-modern .header-left .studio-name { font-family: 'Inter', sans-serif; font-weight: 700; letter-spacing: -0.5px; text-transform: none; font-size: 24px; }
        .invoice-root.theme-modern .header-right { text-align: right; }
        .invoice-root.theme-modern .invoice-label { font-family: 'Inter', sans-serif; font-weight: 800; font-size: 36px; letter-spacing: -1px; margin-bottom: 4px; }
        .invoice-root.theme-modern .invoice-label em { font-style: normal; color: var(--gold); }
        .invoice-root.theme-modern .meta-wrap { background: var(--warm-white); border-radius: 8px; border: 1px solid var(--rule); padding: 16px; margin-bottom: 40px; }
        .invoice-root.theme-modern .meta-block { padding: 12px; border: none; }
        .invoice-root.theme-modern .meta-block.accent { border-left: 2px solid var(--gold); }
        .invoice-root.theme-modern .items-table { outline: 1px solid var(--rule); border-radius: 8px; overflow: hidden; margin-bottom: 32px; }
        .invoice-root.theme-modern .items-table thead tr { background: var(--warm-white); border-bottom: 1px solid var(--rule); }
        .invoice-root.theme-modern .items-table tbody tr { border-bottom: 1px solid var(--rule); }
        .invoice-root.theme-modern .items-table tbody tr:last-child { border-bottom: none; }
        .invoice-root.theme-modern .items-table thead th { padding: 16px 20px; }
        .invoice-root.theme-modern .items-table tbody td { padding: 16px 20px; }
        .invoice-root.theme-modern .item-name { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px; }
        .invoice-root.theme-modern .items-table tbody td:last-child { font-family: 'Inter', sans-serif; font-weight: 600; }
        .invoice-root.theme-modern .totals-block { border-top: 2px solid var(--rule); }
        .invoice-root.theme-modern .totals-row.grand .amount { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 24px; }
        .invoice-root.theme-minimal {
          --cream: #FFFFFF;
          --warm-white: #F0F0F0;
          --gold: #000000;
          --gold-light: #333333;
          --ink: #000000;
          --ink-mid: #222222;
          --ink-soft: #666666;
          --rule: #000000;
          --red: #000000;
          --green: #000000;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        .invoice-root.theme-minimal .header { flex-direction: column; border-bottom: none; gap: 24px; padding-bottom: 0; margin-bottom: 48px; }
        .invoice-root.theme-minimal .header-right { text-align: left; }
        .invoice-root.theme-minimal .invoice-label { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 400; font-size: 24px; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 8px;}
        .invoice-root.theme-minimal .invoice-label em { font-style: normal; font-weight: 700; color: var(--ink); }
        .invoice-root.theme-minimal .header-left .studio-name { font-weight: 700; margin-bottom: 0; color: var(--ink); }
        .invoice-root.theme-minimal .meta-wrap { grid-template-columns: 1fr 1fr; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); padding: 24px 0; gap: 24px; margin-bottom: 48px; }
        .invoice-root.theme-minimal .meta-block, .invoice-root.theme-minimal .meta-block.accent { border: none; padding: 0; background: transparent; }
        .invoice-root.theme-minimal .meta-line { display: flex; justify-content: space-between; max-width: 300px; }
        .invoice-root.theme-minimal .items-table { border-top: 1px solid var(--ink); border-bottom: 1px solid var(--ink); }
        .invoice-root.theme-minimal .items-table thead tr { border-bottom: 1px solid var(--ink); }
        .invoice-root.theme-minimal .items-table thead th { font-weight: 700; color: var(--ink); }
        .invoice-root.theme-minimal .items-table tbody tr { border-bottom: 1px solid var(--rule); }
        .invoice-root.theme-minimal .items-table thead th { padding: 12px 0; }
        .invoice-root.theme-minimal .items-table tbody td { padding: 12px 0; }
        .invoice-root.theme-minimal .item-name { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 700; text-transform: uppercase; font-size: 12px; }
        .invoice-root.theme-minimal .items-table tbody td:last-child { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        .invoice-root.theme-minimal .totals-block { border-top: none; }
        .invoice-root.theme-minimal .totals-row.grand { border-top: 1px solid var(--ink); border-bottom: 1px double var(--ink); padding: 12px 0; margin-top: 8px; }
        .invoice-root.theme-minimal .totals-row.grand .amount { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: 700; font-size: 18px; }
        .invoice-root.theme-minimal .note { background: transparent; padding: 16px 0; border-left: none; border-top: 1px solid var(--ink); margin-top: 48px; }

        .invoice-root * { box-sizing: border-box; }

        .invoice-root .page {
          max-width: 760px;
          margin: 0 auto;
          padding: 64px 48px 80px;
        }

        /* ── HEADER ── */
        .invoice-root .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 40px;
          border-bottom: 1px solid var(--rule);
          margin-bottom: 40px;
          margin-top: 0;
        }

        .invoice-root .header-left .studio-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 400;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--ink);
          margin-bottom: 4px;
          margin-top: 0;
        }

        .invoice-root .header-left .studio-tagline {
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--gold);
          margin: 0;
        }

        .invoice-root .header-right {
          text-align: right;
        }

        .invoice-root .invoice-label {
          font-family: 'Cormorant Garamond', serif;
          font-size: 42px;
          font-weight: 300;
          color: var(--ink);
          line-height: 1;
          letter-spacing: -1px;
          margin: 0;
        }

        .invoice-root .invoice-label em {
          font-style: italic;
          color: var(--gold);
        }

        .invoice-root .invoice-number {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 2px;
          color: var(--ink-soft);
          margin-top: 6px;
          margin-bottom: 0;
        }

        /* ── STATUS BADGE ── */
        .invoice-root .status-badge {
          display: inline-block;
          margin-top: 10px;
          padding: 4px 14px;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 2.5px;
          text-transform: uppercase;
        }

        .invoice-root .status-unpaid   { background: #FEF3CD; color: #7A5700; border: 1px solid #F0D070; }
        .invoice-root .status-partial  { background: #EAF4FE; color: #0C5FA8; border: 1px solid #B0D4FA; }
        .invoice-root .status-paid     { background: #E8F4EC; color: var(--green); border: 1px solid #A8D8B4; }

        /* ── META GRID ── */
        .invoice-root .meta-wrap {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 48px;
        }

        .invoice-root .meta-block {
          padding: 22px 26px;
          background: var(--warm-white);
          border-left: 3px solid var(--rule);
        }

        .invoice-root .meta-block.accent { border-left-color: var(--gold); }

        .invoice-root .meta-block-title {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin-bottom: 12px;
          margin-top: 0;
        }

        .invoice-root .meta-line {
          font-size: 13px;
          color: var(--ink-mid);
          font-weight: 300;
          line-height: 1.8;
          margin: 0;
        }

        .invoice-root .meta-line strong {
          font-weight: 500;
          color: var(--ink);
        }

        /* ── SECTION LABEL ── */
        .invoice-root .section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 3.5px;
          text-transform: uppercase;
          color: var(--ink-soft);
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
          margin-top: 0;
        }

        .invoice-root .section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--rule);
        }

        /* ── LINE ITEMS TABLE ── */
        .invoice-root .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0;
          text-indent: 0;
        }

        .invoice-root .items-table thead tr {
          border-bottom: 1px solid var(--ink);
        }

        .invoice-root .items-table thead th {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: var(--ink-soft);
          padding: 0 0 12px;
          text-align: left;
        }

        .invoice-root .items-table thead th:last-child { text-align: right; }
        .invoice-root .items-table thead th.center { text-align: center; }

        .invoice-root .items-table tbody tr {
          border-bottom: 1px solid var(--rule);
        }

        .invoice-root .items-table tbody tr:last-child {
          border-bottom: none;
        }

        .invoice-root .items-table tbody td {
          padding: 14px 0;
          font-size: 13.5px;
          color: var(--ink-mid);
          font-weight: 300;
          vertical-align: top;
        }

        .invoice-root .items-table tbody td:last-child {
          text-align: right;
          font-weight: 400;
          color: var(--ink);
        }

        .invoice-root .items-table tbody td.center { text-align: center; }

        .invoice-root .item-name {
          font-weight: 500;
          color: var(--ink);
          margin-bottom: 2px;
          margin-top: 0;
        }

        .invoice-root .item-desc {
          font-size: 12px;
          color: var(--ink-soft);
          font-weight: 300;
          line-height: 1.5;
          margin: 0;
        }

        /* ── TOTALS ── */
        .invoice-root .totals-wrap {
          margin-top: 4px;
          display: flex;
          justify-content: flex-end;
        }

        .invoice-root .totals-block {
          width: 300px;
          border-top: 1px solid var(--rule);
          padding-top: 16px;
        }

        .invoice-root .totals-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: var(--ink-soft);
          font-weight: 300;
          padding: 5px 0;
        }

        .invoice-root .totals-row.discount { color: var(--green); }

        .invoice-root .totals-row.grand {
          border-top: 2px solid var(--ink);
          margin-top: 10px;
          padding-top: 14px;
          font-size: 15px;
          font-weight: 500;
          color: var(--ink);
        }

        .invoice-root .totals-row.grand .amount {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 400;
          color: var(--ink);
          line-height: 1;
        }

        .invoice-root .totals-row.deposit-due {
          margin-top: 6px;
          padding: 10px 12px;
          background: var(--warm-white);
          border-left: 3px solid var(--gold);
          font-weight: 400;
          color: var(--ink-mid);
        }

        .invoice-root .totals-row.deposit-due .amount {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 400;
          color: var(--gold);
          line-height: 1;
        }

        .invoice-root .totals-row.balance-due {
          padding: 8px 0;
          font-weight: 400;
          color: var(--ink-mid);
        }

        /* ── PAYMENT SECTION ── */
        .invoice-root .payment {
          margin-top: 48px;
          padding: 28px 32px;
          background: var(--warm-white);
          border-top: 2px solid var(--ink);
        }

        .invoice-root .payment-title {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--ink);
          margin-bottom: 16px;
          margin-top: 0;
        }

        .invoice-root .payment-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 40px;
          font-size: 13px;
          color: var(--ink-soft);
          font-weight: 300;
        }

        .invoice-root .payment-grid > div {
          margin: 0;
          word-break: break-word;
        }

        /* ── NOTE ── */
        .invoice-root .note {
          margin-top: 28px;
          padding: 18px 24px;
          border-left: 3px solid var(--gold);
          background: #fff;
        }

        .invoice-root .note-label {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 0;
        }

        .invoice-root .note-label::before { content: '✦'; font-size: 8px; }

        .invoice-root .note-body {
          font-size: 13px;
          color: var(--ink-mid);
          font-weight: 400;
          line-height: 1.7;
          margin: 0;
        }

        /* ── SIGNATURE ── */
        .invoice-root .signature {
          margin-top: 48px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        .invoice-root .sig-block {
          padding-top: 16px;
          border-top: 1px solid var(--rule);
        }

        .invoice-root .sig-label {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin-bottom: 32px;
          margin-top: 0;
        }

        .invoice-root .sig-line {
          border-bottom: 1px solid var(--ink-soft);
          margin-bottom: 6px;
        }

        .invoice-root .sig-name {
          font-size: 12px;
          color: var(--ink-soft);
          font-weight: 300;
          margin: 0;
        }

        /* ── FOOTER ── */
        .invoice-root .footer {
          margin-top: 52px;
          padding-top: 24px;
          border-top: 1px solid var(--rule);
          text-align: center;
        }

        .invoice-root .footer-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 400;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--ink);
          margin-bottom: 5px;
          margin-top: 0;
        }

        .invoice-root .footer-contact {
          font-size: 12px;
          font-weight: 300;
          color: var(--ink-soft);
          letter-spacing: 0.5px;
          line-height: 1.9;
          margin: 0;
        }

        @media print {
          .invoice-root { background: white; box-shadow: none; font-size: 90% }
          .invoice-root .page { padding: 0 32px; max-width: 100%; }
        }

        @media (max-width: 640px) {
          .invoice-root:not(.pdf-export) .page { padding: 32px 20px 48px; }
          .invoice-root:not(.pdf-export) .header h1 { font-size: 36px; }
          .invoice-root:not(.pdf-export) .meta-wrap { grid-template-columns: 1fr; gap: 16px; margin-bottom: 32px; }
          .invoice-root:not(.pdf-export) .meta-block { padding: 20px; }
          
          /* Responsive Table */
          .invoice-root:not(.pdf-export) .items-table,
          .invoice-root:not(.pdf-export) .items-table tbody,
          .invoice-root:not(.pdf-export) .items-table tr,
          .invoice-root:not(.pdf-export) .items-table td { display: block; width: 100%; }
          .invoice-root:not(.pdf-export) .items-table thead { display: none; }
          .invoice-root:not(.pdf-export) .items-table tr { padding: 20px 0; border-bottom: 1px solid var(--rule) !important; }
          .invoice-root:not(.pdf-export) .items-table td { padding: 6px 0; text-align: left !important; border: none !important; }
          .invoice-root:not(.pdf-export) .items-table td:nth-child(1) { padding-bottom: 12px; }
          .invoice-root:not(.pdf-export) .items-table td:nth-child(2)::before { content: "Qty: "; color: var(--ink-soft); font-size: 13px; margin-right: 4px; }
          .invoice-root:not(.pdf-export) .items-table td:nth-child(3)::before { content: "Price: "; color: var(--ink-soft); font-size: 13px; margin-right: 4px; }
          .invoice-root:not(.pdf-export) .items-table td:nth-child(4) { margin-top: 8px; padding-top: 12px; border-top: 1px dashed var(--rule) !important; font-weight: 500; font-size: 15px; font-family: 'Cormorant Garamond', serif; }
          .invoice-root:not(.pdf-export) .items-table td:nth-child(4)::before { content: "Total "; font-family: 'Jost', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: var(--ink-soft); margin-right: 8px; font-weight: 600; }
          
          .invoice-root:not(.pdf-export) .totals-wrap { justify-content: flex-start; }
          .invoice-root:not(.pdf-export) .totals-block { width: 100%; border-top: none; padding-top: 12px; }
          .invoice-root:not(.pdf-export) .payment { padding: 20px; }
          .invoice-root:not(.pdf-export) .payment-grid { grid-template-columns: 1fr; gap: 12px; }
          .invoice-root:not(.pdf-export) .signature { grid-template-columns: 1fr; gap: 24px; }
        }
      ` }} />
      <div className="max-w-4xl mx-auto">
        
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center mb-8 gap-4 print:hidden">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <Button onClick={handlePrint} variant="outline" className="text-slate-600 bg-white shadow-sm rounded-none border-slate-300 w-full sm:w-auto">
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="bg-slate-900 hover:bg-slate-800 text-white rounded-none px-6 shadow-sm w-full sm:w-auto">
              {isGeneratingPDF ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" /> Download PDF</>
              )}
            </Button>
          </div>
        </div>

        {/* Invoice Document */}
        <div ref={invoiceRef} className={`invoice-root theme-${settings?.documentTheme || 'classic'} max-w-[760px] mx-auto`}>
          <div className="page">
            
            {/* HEADER */}
            <header className="header">
              <div className="header-left">
                <div className="studio-name">{settings.companyName || 'Mwabonje Photography'}</div>
                <div className="studio-tagline">{settings.companyAddress || 'Malindi, Kenya'}</div>
              </div>
              <div className="header-right">
                <div className="invoice-label">In<em>voice</em></div>
                <div className="invoice-number">INV · {invoice.date ? format(new Date(invoice.date), 'yyyy') : new Date().getFullYear()} · {invoice.id.slice(0, 3).toUpperCase()}</div>
                <div className={`status-badge ${invoice.amountPaid === 0 ? 'status-unpaid' : invoice.amountPaid < invoice.totalAmount ? 'status-partial' : 'status-paid'}`}>
                  {invoice.amountPaid === 0 ? 'Awaiting Payment' : invoice.amountPaid < invoice.totalAmount ? 'Partially Paid' : 'Paid in Full'}
                </div>
              </div>
            </header>

            {/* META */}
            <div className="meta-wrap">

              <div className="meta-block accent">
                <div className="meta-block-title">Billed To</div>
                <div className="meta-line"><strong>{client?.name || 'Client Name'}</strong></div>
                {client?.email && <div className="meta-line">{client.email}</div>}
                {client?.phone && <div className="meta-line">{client.phone}</div>}
                <div className="meta-line">—</div>
              </div>

              <div className="meta-block">
                <div className="meta-block-title">Invoice Details</div>
                <div className="meta-line"><strong>Invoice No.</strong> &nbsp;{invoice.quoteId ? (quote?.quoteNumber || invoice.quoteId.slice(0, 8).toUpperCase()) : invoice.id.slice(0, 8).toUpperCase()}</div>
                <div className="meta-line"><strong>Issue Date</strong> &nbsp;&nbsp;{invoice.date ? format(new Date(invoice.date), 'dd · MM · yyyy') : 'N/A'}</div>
                {invoice.dueDate && <div className="meta-line"><strong>Due Date</strong> &nbsp;&nbsp;{format(new Date(invoice.dueDate), 'dd · MM · yyyy')}</div>}
                {project?.title && <div className="meta-line"><strong>Project</strong> &nbsp;&nbsp;&nbsp;&nbsp;{project.title}</div>}
              </div>

            </div>

            {/* LINE ITEMS */}
            <div className="section-label">Services</div>

            <table className="items-table mb-12">
              <thead>
                <tr>
                  <th style={{ width: '55%' }}>Description</th>
                  <th className="center" style={{ width: '15%' }}>Qty</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.lineItems || []).map((item, index) => (
                  <tr key={index}>
                    <td>
                      {renderDescription(item.description)}
                    </td>
                    <td className="center">1</td>
                    <td style={{ textAlign: 'right' }}>KES {(item.price || 0).toLocaleString()}</td>
                    <td>KES {(item.price || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TOTALS */}
            <div className="totals-wrap">
              <div className="totals-block">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <span>KES {invoice.totalAmount.toLocaleString()}</span>
                </div>
                {invoice.amountPaid > 0 && (
                  <div className="totals-row discount">
                    <span>Amount Paid</span>
                    <span>-KES {invoice.amountPaid.toLocaleString()}</span>
                  </div>
                )}
                <div className="totals-row grand">
                  <span>Total</span>
                  <span className="amount">KES {invoice.totalAmount.toLocaleString()}</span>
                </div>
                {balance > 0 && (
                  <div className="totals-row deposit-due">
                    <span>Balance Due</span>
                    <span className="amount">KES {balance.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* PAYMENT DETAILS */}
            {settings.paymentDetails && (
              <div className="payment">
                <div className="payment-title">Payment Details</div>
                <div className="payment-grid">
                  {(() => {
                    const lines = settings.paymentDetails
                      .split('\n')
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

            {/* SIGNATURE */}
            <div className="signature">
              <div className="sig-block">
                <div className="sig-label">Authorised — {settings.companyName || 'Photography Studio'}</div>
                <div className="sig-line"></div>
                <div className="sig-name">{settings.companyEmail || ''}</div>
              </div>
              <div className="sig-block">
                <div className="sig-label">Client Acknowledgement</div>
                <div className="sig-line"></div>
                <div className="sig-name">{client?.name || 'Client'}</div>
              </div>
            </div>

            {/* FOOTER */}
            <footer className="footer">
              <div className="footer-name">{settings.companyName || 'Photography Studio'}</div>
              <div className="footer-contact">
                {settings.companyEmail} {settings.companyAddress ? `· ${settings.companyAddress}` : ''}<br/>
                {settings.companyWebsite} {settings.companyPhone ? `· ${settings.companyPhone}` : ''}
              </div>
            </footer>

          </div>
        </div>
      </div>
    </div>
  );
}
