import React from 'react';
import { Shield, Sparkles, Navigation } from 'lucide-react';
import { Button } from '../Common/Button';
import { Link } from 'react-router-dom';

export const Hero = ({ children }) => {
  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-primary-dark to-primary text-white overflow-hidden py-16 lg:py-24 border-b border-primary/20">
      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-light/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text content */}
          <div className="lg:col-span-7 flex flex-col text-left items-start gap-6 animate-fade-in-up">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-accent-light">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SF's Best Peer-to-Peer Vehicle Sharing</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Rent cars, bikes, and <br />
              <span className="text-accent">scooters</span> in minutes.
            </h1>

            {/* Description */}
            <p className="text-lg text-slate-200 max-w-xl leading-relaxed">
              RideMate connects you with verified local owners to offer the perfect vehicle for any trip. Affordable pricing, absolute convenience, and zero hassle.
            </p>

            {/* Quick stats and CTA */}
            <div className="flex flex-wrap items-center gap-6 mt-2">
              <Link to="/vehicles">
                <Button variant="secondary" size="lg" className="shadow-lg hover:scale-105 active:scale-95 duration-150">
                  <Navigation className="w-5 h-5 fill-current" />
                  Explore Vehicles
                </Button>
              </Link>
              
              <div className="flex items-center gap-4 text-xs text-slate-300 font-semibold border-l border-slate-700/60 pl-6">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-accent" />
                  <span>Fully Insured Rides</span>
                </div>
                <span>•</span>
                <div>
                  <span>24/7 Roadside Assist</span>
                </div>
              </div>
            </div>
          </div>

          {/* Graphic/Visual column */}
          <div className="lg:col-span-5 hidden lg:flex items-center justify-center relative select-none">
            {/* Animated circle container */}
            <div className="w-80 h-80 rounded-full border border-white/10 flex items-center justify-center relative animate-pulse duration-[3000ms]">
              <div className="w-64 h-64 rounded-full border border-white/5 bg-white/5 flex items-center justify-center">
                {/* Visual Graphic Brand Container */}
                <div className="w-48 h-48 rounded-full bg-accent/10 flex flex-col items-center justify-center text-accent text-center p-6 border border-accent/20">
                  <span className="text-3xl font-extrabold text-white leading-none mb-1">RIDE</span>
                  <span className="text-accent text-xs tracking-widest font-black uppercase mb-3">MATE</span>
                  <p className="text-[10px] text-slate-300 leading-normal font-medium">Safe. Clean. Ready when you are.</p>
                </div>
              </div>

              {/* Floating badges around circle */}
              <div className="absolute -top-4 left-6 bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
                <span className="text-sm">🚗</span>
                <span className="text-[11px] font-bold text-slate-200">Cars from $45/day</span>
              </div>
              
              <div className="absolute top-1/2 -right-8 bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                <span className="text-sm">🛵</span>
                <span className="text-[11px] font-bold text-slate-200">Scooters from $15/day</span>
              </div>

              <div className="absolute -bottom-4 left-16 bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                <span className="text-sm">🚲</span>
                <span className="text-[11px] font-bold text-slate-200">Bikes from $10/day</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search bar slots right here at the bottom of hero container */}
        <div className="mt-16 relative z-20">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Hero;
