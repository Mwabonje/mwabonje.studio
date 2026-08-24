import React, { useEffect, useState, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useStore } from '@/store';

function FAQItem({ q, a }: { q: string, a: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`}>
      <button className="faq-q" onClick={() => setIsOpen(!isOpen)}>
        {q}<span className="plus">+</span>
      </button>
      <div 
        className="faq-a" 
        style={{ maxHeight: isOpen ? (contentRef.current?.scrollHeight + 'px') : '0px' }}
        ref={contentRef}
      >
        <p>{a}</p>
      </div>
    </div>
  );
}

export default function Landing() {
  const userId = useStore((state) => state.userId);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if(e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    
    setTimeout(() => {
      document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    }, 100);
    
    return () => io.disconnect();
  }, []);

  if (userId) {
    return <Navigate to="/dashboard" replace />;
  }

  const items = ["Services","Client Roster","Premium Quotes","Contracts & NDAs","Invoicing & Payments","Gear Inventory","Studio Analytics"];
  const ledgerDoubled = items.concat(items);

  const faqs = [
    { q: "Is CaptureCRM suitable for videographers and other creatives?", a: "Yes. CaptureCRM is built for any creative who quotes projects, signs contracts and gets paid: photographers, videographers, designers and more." },
    { q: "Can I customize the quotes and contracts with my own branding?", a: "Absolutely. Add your logo, colors and fonts to every quote, contract and invoice your clients see." },
    { q: "Is there a limit on how many clients or projects I can manage?", a: "No limits during the open beta — unlimited clients and projects on every account." },
    { q: "Do my clients need an account to view quotes or invoices?", a: "No. Clients view, comment on and approve everything through a secure link — no login required." }
  ];

  return (
    <div className="landing-root">
       <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

        .landing-root {
          --paper:#faf6ec;
          --paper-2:#f2ecdc;
          --ink:#1d2420;
          --ink-2:#3a423c;
          --muted:#6f6a5c;
          --line:#d8d0ba;
          --line-strong:#c3b89a;
          --stamp:#b0392b;
          --stamp-deep:#8c2c21;
          --ledger:#3f6659;
          --ledger-deep:#2e4c42;
          --mustard:#c99a3a;

          background:var(--paper);
          color:var(--ink);
          font-family:'Inter',sans-serif;
          -webkit-font-smoothing:antialiased;
          overflow-x:hidden;
          min-height: 100vh;
          width: 100%;
        }
        .landing-root a{color:inherit;text-decoration:none;}
        .landing-root ul{list-style:none;}
        .landing-root img, .landing-root svg{display:block;}
        .landing-root .wrap{max-width:1180px;margin:0 auto;padding:0 32px;}
        .landing-root h1, .landing-root h2, .landing-root h3{font-family:'Newsreader',serif;font-weight:500;letter-spacing:-0.01em;}
        .landing-root em{font-style:italic;color:var(--stamp);}
        .landing-root .eyebrow{
          font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;
          color:var(--ledger-deep);display:flex;align-items:center;gap:10px;
          margin-bottom: 0;
        }
        .landing-root .eyebrow::before{content:'§';color:var(--stamp);font-weight:600;}
        .landing-root .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 26px;border-radius:2px;font-weight:600;font-size:14px;border:1px solid transparent;cursor:pointer;transition:all .25s ease;white-space:nowrap;}
        .landing-root .btn-primary{background:var(--ink);color:var(--paper);}
        .landing-root .btn-primary:hover{background:var(--stamp);}
        .landing-root .btn-outline{border-color:var(--line-strong);color:var(--ink);}
        .landing-root .btn-outline:hover{border-color:var(--ink);background:var(--paper-2);}

        /* ledger rule background texture */
        .landing-root .ruled{
          background-image:repeating-linear-gradient(180deg, transparent, transparent 37px, var(--line) 38px);
        }

        /* ---------- header ---------- */
        .landing-root header{position:sticky;top:0;z-index:50;background:rgba(250,246,236,0.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);}
        .landing-root nav{display:flex;align-items:center;justify-content:space-between;padding:18px 32px;max-width:1180px;margin:0 auto;}
        .landing-root .logo{display:flex;align-items:center;gap:10px;font-family:'Newsreader',serif;font-size:20px;}
        .landing-root .seal{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--stamp);display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--stamp);flex:none;transform:rotate(-8deg);}
        .landing-root .nav-links{display:flex;gap:34px;font-size:14px;color:var(--muted); margin:0;}
        .landing-root .nav-links a:hover{color:var(--ink);}
        .landing-root .nav-actions{display:flex;align-items:center;gap:22px;font-size:14px;}
        .landing-root .nav-actions .signin{color:var(--muted);}
        .landing-root .nav-actions .signin:hover{color:var(--ink);}
        .landing-root .burger{display:none;background:none;border:none;color:var(--ink);font-size:22px;cursor:pointer;}

        /* ---------- hero ---------- */
        .landing-root .hero{padding:90px 0 54px;}
        .landing-root .hero-grid{display:grid;grid-template-columns:1.05fr 0.95fr;gap:60px;align-items:center;}
        .landing-root .hero h1{font-size:clamp(38px,5vw,58px);line-height:1.08;margin:20px 0 22px;}
        .landing-root .hero p.lede{font-size:17px;line-height:1.65;color:var(--ink-2);max-width:460px;margin-bottom:34px;}
        .landing-root .hero-ctas{display:flex;gap:14px;margin-bottom:50px;}

        .landing-root .ledger-row-wrap{overflow:hidden;border-top:1px solid var(--line-strong);border-bottom:1px solid var(--line-strong);padding:14px 0;}
        .landing-root .ledger-row{display:flex;gap:0;white-space:nowrap;width:max-content;animation:ledger-scroll 26s linear infinite;}
        .landing-root .ledger-row span{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--muted);padding:0 18px;border-right:1px solid var(--line);}
        @keyframes ledger-scroll{from{transform:translateX(0);}to{transform:translateX(-50%);}}

        /* ---------- receipt stack ---------- */
        .landing-root .receipts{position:relative;height:460px;}
        .landing-root .receipt{
          position:absolute;width:280px;background:#fffdf6;border:1px solid var(--line-strong);
          box-shadow:0 18px 40px rgba(29,36,32,0.14);padding:20px 20px 22px;
        }
        .landing-root .receipt::before{
          content:'';position:absolute;top:-1px;left:0;right:0;height:10px;
          background-image:radial-gradient(circle, var(--paper) 3.5px, transparent 3.6px);
          background-size:16px 10px;background-position:0 -5px;
        }
        .landing-root .r-head{display:flex;justify-content:space-between;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--muted);margin-bottom:14px;letter-spacing:.04em;}
        .landing-root .r-title{font-family:'IBM Plex Mono',monospace;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:5px;}
        .landing-root .r-client{font-family:'Newsreader',serif;font-size:19px;margin-bottom:14px;}
        .landing-root .r-line{display:flex;justify-content:space-between;font-size:13px;color:var(--ink-2);padding:6px 0;border-top:1px dashed var(--line-strong);}
        .landing-root .r-total{display:flex;justify-content:space-between;font-family:'IBM Plex Mono',monospace;font-size:16px;margin-top:8px;padding-top:10px;border-top:1px solid var(--ink);}
        .landing-root .stamp-mark{
          position:absolute;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.1em;
          border:2px solid var(--stamp);color:var(--stamp);padding:4px 12px;border-radius:3px;
          transform:rotate(-11deg);opacity:.85;
        }
        .landing-root .r-1{top:0;left:20px;z-index:1;transform:rotate(-4deg);}
        .landing-root .r-2{top:100px;left:150px;z-index:2;transform:rotate(3deg);}
        .landing-root .r-2 .stamp-mark{top:14px;right:14px;}
        .landing-root .r-3{top:236px;left:20px;z-index:3;transform:rotate(-1deg);}

        /* ---------- sections ---------- */
        .landing-root section{padding:104px 0;position:relative;}
        .landing-root .section-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:52px;gap:24px;flex-wrap:wrap;}
        .landing-root .section-head h2{font-size:clamp(30px,3.3vw,42px);margin-top:12px; margin-bottom: 0;}
        .landing-root .section-head .link-more{font-size:14px;color:var(--stamp);border-bottom:1px solid transparent;white-space:nowrap;}
        .landing-root .section-head .link-more:hover{border-color:var(--stamp);}

        /* ---------- capabilities ---------- */
        .landing-root .capabilities{background:var(--paper-2);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
        .landing-root .cap-grid{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center;}
        .landing-root .cap-grid p{color:var(--ink-2);line-height:1.75;font-size:16px;margin:22px 0 30px;max-width:460px;}
        .landing-root .ledger-card{background:#fffdf6;border:1px solid var(--line-strong);box-shadow:0 18px 40px rgba(29,36,32,0.1);}
        .landing-root .ledger-card .lc-head{display:flex;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--ink);font-family:'IBM Plex Mono',monospace;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);}
        .landing-root .lc-row{display:grid;grid-template-columns:1.3fr 1fr 0.8fr 0.8fr;gap:10px;padding:13px 22px;border-bottom:1px dashed var(--line-strong);font-size:13px;align-items:center;}
        .landing-root .lc-row:last-child{border-bottom:none;}
        .landing-root .lc-row.hd{font-family:'IBM Plex Mono',monospace;font-size:10px;text-transform:uppercase;color:var(--muted);letter-spacing:.06em;border-bottom:1px solid var(--ink);}
        .landing-root .lc-row .amt{font-family:'IBM Plex Mono',monospace;text-align:right;}
        .landing-root .status-dot{width:7px;height:7px;border-radius:50%;display:inline-block;margin-right:6px;}
        .landing-root .status-dot.paid{background:var(--ledger);}
        .landing-root .status-dot.pending{background:var(--mustard);}

        /* ---------- ink banner ---------- */
        .landing-root .banner{background:var(--ink);color:var(--paper);text-align:center;padding:100px 0;position:relative;}
        .landing-root .banner h2{font-size:clamp(30px,4vw,46px);max-width:720px;margin:0 auto 20px;color:var(--paper);}
        .landing-root .banner p{color:#c7cbc4;max-width:520px;margin:0 auto 34px;font-size:16px;line-height:1.65;}
        .landing-root .banner .btn-primary{background:var(--stamp);color:var(--paper);}
        .landing-root .banner .btn-primary:hover{background:var(--stamp-deep);}

        /* ---------- features ---------- */
        .landing-root .feat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;}
        .landing-root .feat-card{background:#fffdf6;border:1px solid var(--line-strong);border-top:4px solid var(--tab,var(--stamp));padding:26px 22px 24px;transition:transform .25s ease, box-shadow .25s ease;}
        .landing-root .feat-card:hover{transform:translateY(-4px);box-shadow:0 14px 30px rgba(29,36,32,0.12);}
        .landing-root .feat-card .tab-label{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-bottom:20px;}
        .landing-root .feat-icon{width:32px;height:32px;margin-bottom:18px;color:var(--tab,var(--stamp));}
        .landing-root .feat-card h3{font-size:19px;margin-bottom:10px;font-weight:500;}
        .landing-root .feat-card p{font-size:14px;color:var(--ink-2);line-height:1.6;margin-bottom:16px;}
        .landing-root .feat-card .explore{font-size:13px;color:var(--tab,var(--stamp));}

        /* ---------- testimonials ---------- */
        .landing-root .test-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
        .landing-root .test-card{background:var(--paper-2);border:1px solid var(--line);padding:30px 26px;}
        .landing-root .test-card p{font-family:'Newsreader',serif;font-style:italic;font-size:18px;line-height:1.55;margin-bottom:22px; margin-top: 0;}
        .landing-root .test-card .who{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--muted);letter-spacing:.03em;text-transform:uppercase;padding-top:14px;border-top:1px solid var(--line-strong);}

        /* ---------- pricing (single free voucher) ---------- */
        .landing-root .voucher-wrap{display:flex;justify-content:center;}
        .landing-root .voucher{
          position:relative;max-width:460px;width:100%;background:#fffdf6;border:1.5px dashed var(--line-strong);
          padding:40px 36px;text-align:center;
        }
        .landing-root .voucher::before, .landing-root .voucher::after{
          content:'';position:absolute;top:50%;width:26px;height:26px;background:var(--paper);border-radius:50%;transform:translateY(-50%);
        }
        .landing-root .voucher::before{left:-13px;}
        .landing-root .voucher::after{right:-13px;}
        .landing-root .voucher .v-stamp{
          display:inline-block;border:2px solid var(--ledger);color:var(--ledger-deep);font-family:'IBM Plex Mono',monospace;
          font-size:13px;letter-spacing:.12em;padding:6px 16px;border-radius:3px;transform:rotate(-6deg);margin-bottom:22px;
        }
        .landing-root .voucher h3{font-size:15px;font-family:'IBM Plex Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;}
        .landing-root .voucher .amt{font-family:'Newsreader',serif;font-size:52px;margin-bottom:6px;}
        .landing-root .voucher .per{font-size:13px;color:var(--muted);margin-bottom:26px;}
        .landing-root .voucher ul{margin:0; margin-bottom:28px;}
        .landing-root .voucher li{font-size:14px;color:var(--ink-2);padding:9px 0;border-top:1px dashed var(--line-strong);}
        .landing-root .voucher li:first-child{border-top:none;}
        .landing-root .price-note{text-align:center;color:var(--muted);font-size:14px;max-width:440px;margin:26px auto 0;line-height:1.6;}

        /* ---------- FAQ ---------- */
        .landing-root .faq-list{max-width:760px;}
        .landing-root .faq-item{border-top:1px solid var(--line-strong);}
        .landing-root .faq-item:last-child{border-bottom:1px solid var(--line-strong);}
        .landing-root .faq-q{width:100%;text-align:left;background:none;border:none;color:var(--ink);font-family:'Newsreader',serif;font-size:19px;padding:26px 0;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:20px;}
        .landing-root .faq-q .plus{font-family:'IBM Plex Mono',monospace;color:var(--stamp);font-size:20px;transition:transform .25s ease;flex:none;}
        .landing-root .faq-item.open .plus{transform:rotate(45deg);}
        .landing-root .faq-a{max-height:0;overflow:hidden;transition:max-height .3s ease;}
        .landing-root .faq-a p{color:var(--ink-2);font-size:15px;line-height:1.65;padding-bottom:26px;max-width:600px; margin: 0;}

        /* ---------- footer ---------- */
        .landing-root footer{background:var(--ink);color:var(--paper);padding:70px 0 0;}
        .landing-root .foot-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:40px;padding-bottom:60px;border-bottom:1px solid rgba(250,246,236,0.14);}
        .landing-root .foot-brand .logo{margin-bottom:14px;color:var(--paper);}
        .landing-root .foot-brand .seal{border-color:var(--mustard);color:var(--mustard);}
        .landing-root .foot-brand p{color:#a9ada4;font-size:14px;max-width:260px;line-height:1.6;margin-bottom:20px;}
        .landing-root .foot-social{display:flex;gap:14px;}
        .landing-root .foot-social a{width:32px;height:32px;border:1px solid rgba(250,246,236,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#c7cbc4;}
        .landing-root .foot-social a:hover{border-color:var(--mustard);color:var(--mustard);}
        .landing-root .foot-col h4{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#a9ada4;margin-bottom:18px;}
        .landing-root .foot-col a{display:block;color:#c7cbc4;font-size:14px;padding:7px 0;}
        .landing-root .foot-col a:hover{color:var(--paper);}
        .landing-root .foot-bottom{padding:26px 32px;text-align:center;font-family:'IBM Plex Mono',monospace;font-size:12px;color:#8b8f85;max-width:1180px;margin:0 auto;}

        .landing-root .reveal{opacity:0;transform:translateY(18px);transition:opacity .6s ease, transform .6s ease;}
        .landing-root .reveal.in{opacity:1;transform:translateY(0);}

        @media (max-width:960px){
          .landing-root .wrap{padding:0 24px;}
          .landing-root section{padding:80px 0;}
          .landing-root .hero{padding:60px 0 40px;}
          .landing-root .nav-links{display:none;position:absolute;top:100%;left:0;right:0;background:rgba(250,246,236,0.98);backdrop-filter:blur(8px);flex-direction:column;padding:24px;border-bottom:1px solid var(--line);box-shadow:0 10px 20px rgba(0,0,0,0.05);gap:24px;align-items:center;}
          .landing-root .nav-links.open{display:flex;}
          .landing-root .nav-actions{display:none;}
          .landing-root .burger{display:block;padding:8px;}
          .landing-root .hero-grid{grid-template-columns:1fr;}
          .landing-root .receipts{height:440px;margin-top:40px;}
          .landing-root .r-1{left:10%;top:0;transform:rotate(-4deg) scale(0.95);}
          .landing-root .r-2{left:40%;top:90px;transform:rotate(3deg) scale(0.95);}
          .landing-root .r-3{left:15%;top:210px;transform:rotate(-1deg) scale(0.95);}
          .landing-root .cap-grid{grid-template-columns:1fr;}
          .landing-root .feat-grid{grid-template-columns:1fr 1fr;}
          .landing-root .test-grid{grid-template-columns:1fr;}
          .landing-root .foot-grid{grid-template-columns:1fr 1fr;}
          .landing-root .lc-row{grid-template-columns:1.2fr 1fr 0.8fr;}
          .landing-root .lc-row span:nth-child(3){display:none;}
        }
        @media (max-width:560px){
          .landing-root .wrap{padding:0 16px;}
          .landing-root section{padding:60px 0;}
          .landing-root .hero{padding:40px 0 30px;}
          .landing-root .section-head{margin-bottom:32px;}
          .landing-root .btn{padding:12px 16px;font-size:13px;white-space:nowrap;}
          .landing-root .hero-ctas{flex-direction:row;gap:10px;width:100%;}
          .landing-root .hero-ctas .btn{flex:1;justify-content:center;padding:12px 8px;}
          .landing-root .feat-grid{grid-template-columns:1fr;}
          .landing-root .foot-grid{grid-template-columns:1fr;}
          .landing-root .receipt{width:280px;}
          .landing-root .receipts{height:400px;margin-top:30px;}
          .landing-root .r-1{left:50%;margin-left:-140px;top:0;transform:rotate(-3deg) scale(0.85);}
          .landing-root .r-2{left:50%;margin-left:-110px;top:90px;transform:rotate(4deg) scale(0.85);}
          .landing-root .r-3{left:50%;margin-left:-145px;top:190px;transform:rotate(-1deg) scale(0.85);}
          .landing-root .voucher{padding:32px 22px;}
        }
        @media (prefers-reduced-motion: reduce){
          .landing-root .reveal{transition:none;opacity:1;transform:none;}
          .landing-root .ledger-row{animation:none;}
        }
      `}} />

      <header>
        <nav>
          <Link to="/" className="logo"><span className="seal">CC</span>CaptureCRM</Link>
          <ul className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
            <li><a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a></li>
            <li><a href="#testimonials" onClick={() => setIsMenuOpen(false)}>Testimonials</a></li>
            <li><a href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a></li>
            <li><a href="#contact" onClick={() => setIsMenuOpen(false)}>Contact</a></li>
            {isMenuOpen && (
              <li style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '12px', paddingTop: '24px', borderTop: '1px dashed var(--line)' }}>
                <Link to="/login" className="btn btn-outline" style={{ width: '100%' }}>Sign In</Link>
                <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>Get Started</Link>
              </li>
            )}
          </ul>
          <div className="nav-actions">
            <Link to="/login" className="signin">Sign In</Link>
            <Link to="/login" className="btn btn-primary">Get Started</Link>
          </div>
          <button className="burger" onClick={() => setIsMenuOpen(!isMenuOpen)}>&#9776;</button>
        </nav>
      </header>

      <main>
        {/* HERO */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <p className="eyebrow">Ledger No. 001</p>
              <h1>Focus on the art.<br />We'll handle <em>the business.</em></h1>
              <p className="lede">CaptureCRM keeps every quote, contract and invoice in one clean ledger — so your studio looks as sharp on paper as it does behind the lens.</p>
              <div className="hero-ctas">
                <Link to="/login" className="btn btn-primary">Join the Platform</Link>
                <a href="#features" className="btn btn-outline">Explore Features</a>
              </div>
            </div>

            <div className="receipts">
              <div className="receipt r-1">
                <div className="r-head"><span>NO. Q-2026-014</span><span>QUOTE</span></div>
                <div className="r-title">Client</div>
                <div className="r-client">Baraka Films</div>
                <div className="r-line"><span>Full-day coverage</span><span>$1,800.00</span></div>
                <div className="r-line"><span>Edited delivery</span><span>$650.00</span></div>
                <div className="r-total"><span>Total</span><span>$2,450.00</span></div>
              </div>
              <div className="receipt r-2">
                <div className="stamp-mark">PAID</div>
                <div className="r-head"><span>NO. INV-1042</span><span>INVOICE</span></div>
                <div className="r-title">Client</div>
                <div className="r-client">Zawadi Bridal Co.</div>
                <div className="r-line"><span>Wedding package</span><span>$1,180.00</span></div>
                <div className="r-total"><span>Amount paid</span><span>$1,180.00</span></div>
              </div>
              <div className="receipt r-3">
                <div className="r-head"><span>NO. C-0098</span><span>CONTRACT</span></div>
                <div className="r-title">Client</div>
                <div className="r-client">Nyota Weddings</div>
                <div className="r-line"><span>Service agreement</span><span>Signed</span></div>
                <div className="r-line"><span>NDA</span><span>Signed</span></div>
              </div>
            </div>
          </div>

          <div className="ledger-row-wrap">
            <div className="ledger-row">
              {ledgerDoubled.map((t, i) => (
                <span key={i} style={i === ledgerDoubled.length - 1 ? { borderRight: 'none' } : {}}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* CAPABILITIES */}
        <section className="capabilities">
          <div className="wrap cap-grid">
            <div className="reveal">
              <p className="eyebrow">Capabilities</p>
              <h2>Studio Management</h2>
              <p>Gain crystal-clear insight into your revenue, project completion rate, and studio growth. Manage every client and project from first inquiry to final delivery, without switching tabs.</p>
              <a href="#features" className="btn btn-outline">Explore Features</a>
            </div>
            <div className="reveal">
              <div className="ledger-card">
                <div className="lc-head"><span>Studio Ledger</span><span>This Month</span></div>
                <div className="lc-row hd"><span>Client</span><span>Type</span><span>Status</span><span className="amt">Amount</span></div>
                <div className="lc-row"><span>Baraka Films</span><span>Quote</span><span><span className="status-dot pending"></span>Sent</span><span className="amt">$2,450.00</span></div>
                <div className="lc-row"><span>Zawadi Bridal Co.</span><span>Invoice</span><span><span className="status-dot paid"></span>Paid</span><span className="amt">$1,180.00</span></div>
                <div className="lc-row"><span>Nyota Weddings</span><span>Contract</span><span><span className="status-dot paid"></span>Signed</span><span className="amt">—</span></div>
                <div className="lc-row"><span>Amara Studios</span><span>Invoice</span><span><span className="status-dot pending"></span>Due 09/02</span><span className="amt">$860.00</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* INK BANNER */}
        <section className="banner">
          <div className="wrap">
            <h2>Elevate your brand. Impress every client.</h2>
            <p>The ultimate studio operating system. Manage clients, send stunning proposals, sign contracts, and get paid, seamlessly.</p>
            <Link to="/login" className="btn btn-primary">Join the Platform</Link>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features">
          <div className="wrap">
            <div className="section-head reveal">
              <div>
                <p className="eyebrow">Features</p>
                <h2>Everything you need.</h2>
              </div>
              <Link to="/login" className="link-more">View all features →</Link>
            </div>

            <div className="feat-grid">
              <div className="feat-card reveal" style={{ '--tab': 'var(--stamp)' } as React.CSSProperties}>
                <div className="tab-label">Tab · Clients</div>
                <svg className="feat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>
                <h3>Client Management</h3>
                <p>Keep every client, past and prospective, in one beautifully organized roster.</p>
                <Link to="/login" className="explore">Explore →</Link>
              </div>
              <div className="feat-card reveal" style={{ '--tab': 'var(--mustard)' } as React.CSSProperties}>
                <div className="tab-label">Tab · Quotes</div>
                <svg className="feat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><path d="M5 3h11l3 3v15H5z"/><path d="M9 9h6M9 13h6M9 17h3"/></svg>
                <h3>Beautiful Quotes</h3>
                <p>Send sophisticated proposals that clients can review and approve online.</p>
                <Link to="/login" className="explore">Explore →</Link>
              </div>
              <div className="feat-card reveal" style={{ '--tab': 'var(--ledger)' } as React.CSSProperties}>
                <div className="tab-label">Tab · Contracts</div>
                <svg className="feat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><path d="M4 4h16v16H4z"/><path d="M9 14l2 2 4-5"/></svg>
                <h3>Secure Contracts</h3>
                <p>Auto-generate and manage bulletproof contracts and NDAs, signed in minutes.</p>
                <Link to="/login" className="explore">Explore →</Link>
              </div>
              <div className="feat-card reveal" style={{ '--tab': 'var(--stamp)' } as React.CSSProperties}>
                <div className="tab-label">Tab · Invoices</div>
                <svg className="feat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}><path d="M3 12l4-8h10l4 8-9 9-9-9z"/><path d="M3 12h18"/></svg>
                <h3>Seamless Invoicing</h3>
                <p>Track every invoice and get paid on time, with zero back-and-forth.</p>
                <Link to="/login" className="explore">Explore →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials">
          <div className="wrap">
            <div className="section-head reveal">
              <div>
                <p className="eyebrow">Testimonials</p>
                <h2>Signed, sealed, delivered.</h2>
              </div>
            </div>
            <div className="test-grid">
              <div className="test-card reveal">
                <p>CaptureCRM turned my inbox chaos into an actual business. Clients sign faster because everything just looks premium.</p>
                <div className="who">Amara K. — Wedding Photographer, Nairobi</div>
              </div>
              <div className="test-card reveal">
                <p>I stopped chasing invoices by WhatsApp. Now payments land while I'm still on location.</p>
                <div className="who">Dennis O. — Documentary Filmmaker, Mombasa</div>
              </div>
              <div className="test-card reveal">
                <p>The contracts alone paid for the subscription. Every NDA is signed before I even unpack the gear.</p>
                <div className="who">Faiza R. — Portrait Studio, Lamu</div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing">
          <div className="wrap">
            <div className="section-head reveal">
              <div>
                <p className="eyebrow">Pricing</p>
                <h2>Free while we're in beta.</h2>
              </div>
            </div>
            <div className="voucher-wrap">
              <div className="voucher reveal">
                <span className="v-stamp">OPEN BETA</span>
                <h3>Full Access</h3>
                <div className="amt">Free</div>
                <div className="per">no card required, free while in beta</div>
                <ul>
                  <li>Unlimited clients &amp; projects</li>
                  <li>Quotes &amp; invoicing</li>
                  <li>Contracts &amp; NDAs</li>
                  <li>Gear inventory tracking</li>
                  <li>Studio analytics</li>
                  <li>Custom branding</li>
                </ul>
                <Link to="/login" className="btn btn-primary">Join the Platform</Link>
              </div>
            </div>
            <p className="price-note reveal">CaptureCRM is free for every studio during our open beta. Paid plans will launch later — early members keep a founding discount for life.</p>
          </div>
        </section>

        {/* FAQ */}
        <section id="contact">
          <div className="wrap">
            <div className="section-head reveal">
              <div>
                <p className="eyebrow">Frequently Asked Questions</p>
                <h2>Everything you need to know.</h2>
              </div>
            </div>
            <div className="faq-list reveal">
              {faqs.map((faq, idx) => (
                <FAQItem key={idx} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer>
        <div className="wrap foot-grid">
          <div className="foot-brand">
            <Link to="/" className="logo"><span className="seal">CC</span>CaptureCRM</Link>
            <p>The studio ledger for visionary creatives. Crafted for photographers and filmmakers who'd rather be shooting.</p>
            <div className="foot-social">
              <a href="#" aria-label="Twitter"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23 4.9c-.8.4-1.7.7-2.6.8.9-.6 1.6-1.5 2-2.5-.9.5-1.9.9-2.9 1.1A4.6 4.6 0 0 0 16 3c-2.5 0-4.5 2-4.5 4.5 0 .4 0 .7.1 1A13 13 0 0 1 2 4.2a4.5 4.5 0 0 0 1.4 6 4.5 4.5 0 0 1-2-.6v.1c0 2.2 1.6 4 3.6 4.4-.4.1-.8.1-1.2.1-.3 0-.6 0-.8-.1.6 1.8 2.3 3.1 4.3 3.1A9.2 9.2 0 0 1 1 19.5 13 13 0 0 0 8 21.5c8.4 0 13-7 13-13v-.6c.9-.6 1.6-1.4 2-2.4Z"/></svg></a>
              <a href="#" aria-label="Instagram"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg></a>
            </div>
          </div>
          <div className="foot-col">
            <h4>Features</h4>
            <a href="#">Client Management</a>
            <a href="#">Invoicing</a>
            <a href="#">Contracts</a>
          </div>
          <div className="foot-col">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Careers</a>
            <a href="#">Contact</a>
          </div>
          <div className="foot-col">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
        <div className="foot-bottom">© 2026 CaptureCRM. Crafted for visionary creatives.</div>
      </footer>
    </div>
  );
}
