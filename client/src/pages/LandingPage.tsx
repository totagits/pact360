import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, CheckCircle2, Shield, Calendar, Layers } from 'lucide-react';

const carouselImages = [
  {
    src: '/images/classroom.png',
    title: 'WASH and Education Deployments',
    desc: 'Empowering children and youth with digital resources in local schools.'
  },
  {
    src: '/images/fleet.png',
    title: 'Humanitarian Supply Chains',
    desc: 'Tracking and securing vehicles, motorcycles, and logistics.'
  },
  {
    src: '/images/office.png',
    title: 'Sustainable Infrastructure',
    desc: 'Asset management for country offices and rural solar generators.'
  }
];

export const LandingPage: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Plan International Logo" className="h-10 w-auto" />
          <div className="h-6 w-[1px] bg-slate-300"></div>
          <span className="text-xl font-bold tracking-tight text-brand-800">PACT<span className="text-brand-500">360</span></span>
        </div>
        <Link 
          to="/login" 
          className="bg-brand-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-brand-600 transition-colors shadow-sm"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-16 grid md:grid-cols-12 gap-12 items-center">
        {/* Left Info Column */}
        <div className="md:col-span-7 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-sm font-semibold w-fit">
            <Shield className="w-4 h-4" /> Track. Manage. Comply. Deliver.
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            PACT360 – Project Asset and Contract Tracking 360° Management System
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
            A secure, enterprise-grade web platform custom-built for **Plan International Liberia** to transition from Excel to a real-time, data-integrity-driven asset and contract lifecycle tracking platform.
          </p>

          <div className="flex items-center gap-4 mt-2">
            <Link 
              to="/login" 
              className="bg-brand-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-600 transition-colors flex items-center gap-2 group shadow-md"
            >
              Sign In to Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-slate-200">
            <div>
              <div className="text-3xl font-bold text-brand-700">100+</div>
              <div className="text-sm text-slate-500 font-medium">Assets Tracked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-700">20+</div>
              <div className="text-sm text-slate-500 font-medium">SLA Contracts</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-700">5</div>
              <div className="text-sm text-slate-500 font-medium">Field Offices</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-700">100%</div>
              <div className="text-sm text-slate-500 font-medium">Compliance</div>
            </div>
          </div>
        </div>

        {/* Right Carousel Column */}
        <div className="md:col-span-5 relative w-full h-[320px] md:h-[420px] rounded-2xl overflow-hidden shadow-2xl bg-slate-900 group">
          {/* Images */}
          {carouselImages.map((image, idx) => (
            <div 
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === activeSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <img 
                src={image.src} 
                alt={image.title} 
                className="w-full h-full object-cover brightness-[0.7]" 
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-6 text-white">
                <h3 className="text-xl font-bold mb-1">{image.title}</h3>
                <p className="text-sm text-slate-200">{image.desc}</p>
              </div>
            </div>
          ))}

          {/* Arrows */}
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute top-4 right-4 flex gap-1.5 z-25 bg-slate-950/40 p-2 rounded-full backdrop-blur-sm">
            {carouselImages.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${idx === activeSlide ? 'bg-brand-400 w-5' : 'bg-white/60'}`}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Feature Section */}
      <section className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Full Lifecycle Log</h4>
              <p className="text-sm text-slate-500">Track items from acquisition to registration, transfer, and disposal.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Donor Linkage</h4>
              <p className="text-sm text-slate-500">Link assets and contracts to specific grants, donors, and project codes.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Maintenance Calendar</h4>
              <p className="text-sm text-slate-500">Plan preventative schedules and track corrective generator/vehicle work orders.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Audit Trail</h4>
              <p className="text-sm text-slate-500">Keep complete transparency with user action logs and compliance reports.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 border-t border-slate-800 text-center text-sm">
        <p>© {new Date().getFullYear()} Plan International Liberia. PACT360: Project Asset & Contract Tracking System.</p>
      </footer>
    </div>
  );
};
