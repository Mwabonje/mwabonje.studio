import { Link, Navigate } from 'react-router-dom';
import { Camera, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useStore } from '@/store';
import { motion } from 'motion/react';

export default function Landing() {
  const userId = useStore((state) => state.userId);

  if (userId) {
    return <Navigate to="/dashboard" replace />;
  }

  const featuresList = [
    'Client Roster',
    'Premium Quotes',
    'Contracts & NDAs',
    'Invoicing & Payments',
    'Gear Inventory',
    'Studio Analytics'
  ];

  const cards = [
    {
      title: 'Client Management',
      desc: 'Keep track of all your clients in a beautifully centralized database.',
      img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=600'
    },
    {
      title: 'Beautiful Quotes',
      desc: 'Create and send sophisticated proposals that clients can review.',
      img: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=600'
    },
    {
      title: 'Secure Contracts',
      desc: 'Auto-generate and manage bulletproof contracts and NDAs.',
      img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=600'
    },
    {
      title: 'Seamless Invoicing',
      desc: 'Track invoices and ensure you get paid on time with zero friction.',
      img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=600'
    }
  ];

  return (
    <div className="min-h-screen bg-[#111111] font-sans text-white selection:bg-white selection:text-black pb-12">
      {/* Hero Section (Image Background) */}
      <div className="relative pt-6 px-4 sm:px-8 max-w-[1400px] mx-auto min-h-[600px] sm:min-h-[700px] flex flex-col rounded-t-[2.5rem] sm:rounded-t-[3rem] overflow-hidden mt-2 sm:mt-4">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1603574670812-d24560880210?auto=format&fit=crop&q=80&w=2000" 
            alt="Photographer background" 
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Navbar */}
        <nav className="flex items-center justify-between z-50 relative">
          <div className="flex items-center gap-2">
            <Camera className="h-7 w-7 text-white" />
            <span className="text-xl font-medium tracking-tight text-white">CaptureCRM</span>
          </div>
          <div className="hidden md:flex items-center gap-12 text-sm font-medium text-slate-200">
            <Link to="#" className="hover:text-white transition-colors">Features</Link>
            <Link to="#" className="hover:text-white transition-colors">Testimonials</Link>
            <Link to="#" className="hover:text-white transition-colors">Pricing</Link>
            <Link to="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-medium text-white hover:text-slate-200 transition-colors hidden sm:block">Sign In</Link>
            <Link to="/login" className="inline-flex items-center justify-center rounded-full bg-white text-black hover:bg-slate-200 px-6 h-10 text-sm font-medium transition-colors">
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex flex-col justify-center relative z-10 pt-12 pb-32 max-w-3xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-6xl sm:text-7xl lg:text-[5.5rem] font-semibold tracking-tight text-white mb-8 leading-[1.05]"
          >
            Focus on the art.<br />
            We'll handle the business.
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-[#e3eedd] text-[#2b3a24] text-sm font-medium">
              The New Standard for Photographers
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main White Canvas */}
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 relative z-20 -mt-16 sm:-mt-24">
        <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-12 lg:p-16 text-black shadow-xl">
          
          {/* Top block inside white canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-24">
            
            {/* Left list */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Services
              </div>
              
              <div className="flex flex-col gap-4">
                {featuresList.map((feature, i) => (
                  <div key={feature} className="flex items-center gap-3">
                    <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0"></span>
                    <span className="text-[15px] font-medium text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle Section */}
            <div className="lg:col-span-4 flex flex-col gap-4 pr-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Capabilities
              </div>
              <h3 className="text-2xl font-semibold leading-tight text-black mb-2">
                Studio Management
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Gain crystal-clear insights into your revenue, project completion rates, and business growth. Seamlessly manage clients and projects from start to finish.
              </p>
              <div>
                <Link to="/login" className="inline-flex items-center justify-center rounded-full bg-[#111111] text-white px-6 h-10 text-xs font-semibold transition-colors">
                  Explore Features
                </Link>
              </div>
            </div>

            {/* Right dark card */}
            <div className="lg:col-span-5">
              <div className="bg-[#1a1a1a] rounded-[2rem] p-10 text-white h-full flex flex-col justify-between relative overflow-hidden min-h-[300px]">
                <div className="relative z-10 max-w-lg">
                  <h2 className="text-3xl font-semibold leading-[1.1] mb-4">
                    Elevate your brand. Impress every client.
                  </h2>
                  <p className="text-slate-400 text-xs leading-relaxed mb-8 max-w-[80%]">
                    The ultimate studio operating system. Manage clients, send stunning proposals, sign contracts, and get paid seamlessly.
                  </p>
                  <Link to="/login" className="inline-flex items-center justify-center rounded-full bg-white text-black hover:bg-slate-200 px-5 h-10 text-xs font-semibold transition-colors">
                    Join the Platform
                  </Link>
                </div>
                
                {/* Abstract shape/image in the corner like the design */}
                <div className="absolute right-0 bottom-0 w-[70%] h-[90%] opacity-90 pointer-events-none rounded-tl-[3rem] overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-tr from-[#1a1a1a] via-[#1a1a1a]/80 to-transparent z-10"></div>
                   <img 
                     src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800" 
                     className="w-full h-full object-cover"
                     alt=""
                   />
                </div>
              </div>
            </div>
          </div>

          {/* Cards block inside white canvas */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Everything you need.</h2>
                <span className="px-3 py-1 bg-[#f0fdf4] text-[#166534] rounded-full text-xs font-semibold uppercase tracking-wider">Features</span>
              </div>
              <Link to="/login" className="inline-flex items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 px-5 h-10 text-xs font-semibold transition-colors">
                View All Features
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {cards.map((card, i) => (
                <div key={i} className="flex flex-col group cursor-pointer">
                  <div className="rounded-3xl overflow-hidden mb-6 h-[200px]">
                    <img 
                      src={card.img} 
                      alt={card.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 leading-tight">{card.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">{card.desc}</p>
                  
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center">
                        <ArrowUpRight className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-medium text-slate-500">Explore</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-[1400px] mx-auto px-8 pt-20 pb-8 text-white">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Camera className="h-6 w-6 text-white" />
              <span className="text-lg font-medium tracking-tight text-white">CaptureCRM</span>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-6">Features</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link to="#" className="hover:text-white transition-colors">Client Management</Link></li>
              <li><Link to="#" className="hover:text-white transition-colors">Invoicing</Link></li>
              <li><Link to="#" className="hover:text-white transition-colors">Contracts</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link to="#" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="#" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="#" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-white/10 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CaptureCRM. Crafted for visionary creatives.</p>
          <div className="flex items-center gap-6 mt-4 sm:mt-0">
             <Link to="#" className="hover:text-white transition-colors">Twitter</Link>
             <Link to="#" className="hover:text-white transition-colors">Instagram</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
