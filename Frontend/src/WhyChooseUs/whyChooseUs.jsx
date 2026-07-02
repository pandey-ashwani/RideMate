import React from 'react';
import { ShieldCheck, Truck, CreditCard, Users, HeartHandshake } from 'lucide-react';
import { Card } from '../components/Common/Card';

export const WhyChooseUs = () => {
  const benefits = [
    {
      icon: ShieldCheck,
      title: 'Verified & Insured',
      description: 'Every rental owner is manually verified. All booked vehicles include complete physical damage coverage for your peace of mind.',
      color: 'text-primary'
    },
    {
      icon: HeartHandshake,
      title: 'Trusted P2P Community',
      description: 'Rent directly from local hosts in your city. Check real reviews and ratings written by other community members before booking.',
      color: 'text-primary'
    },
    {
      icon: CreditCard,
      title: 'No Hidden Fees',
      description: 'What you see is what you pay. Enjoy secure, encrypted payouts and clear security deposit policies with transparent bookings.',
      color: 'text-primary'
    },
    {
      icon: Users,
      title: '24/7 Roadside Support',
      description: 'Stuck on the road? Our dedicated support staff is available round the clock to arrange towing, replacements, or help.',
      color: 'text-primary'
    }
  ];

  return (
    <section id="why-choose-us" className="py-16 md:py-24 bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Title Block */}
        <div className="max-w-3xl mx-auto mb-16 text-center flex flex-col gap-3">
          <span className="text-sm font-extrabold text-primary uppercase tracking-widest">Why RideMate</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">
            The smartest way to rent a vehicle.
          </h2>
          <div className="w-16 h-1 bg-accent mx-auto rounded-full mt-1"></div>
          <p className="text-slate-500 mt-2 text-sm sm:text-base leading-relaxed">
            Forget about traditional rental counters and long lines. Enjoy quick keyless pickups, flexible dates, and friendly pricing from local owners.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <Card 
                key={i} 
                className="flex flex-col items-center text-center p-8 border-t-4 border-t-primary/20 hover:border-t-primary shadow-xs hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-200">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">{benefit.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{benefit.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
