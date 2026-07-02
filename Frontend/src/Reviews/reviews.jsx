import React from 'react';
import { Card } from '../components/Common/Card';
import { StarRating } from '../components/Common/StarRating';
import { Quote } from 'lucide-react';

export const Reviews = () => {
  const testimonials = [
    {
      id: 't1',
      customerName: 'Alex Johnson',
      rating: 5,
      text: 'Amazing experience! The Vespa was in perfect shape and renting it directly from Sarah was super fast. Highly recommended!',
      date: '2026-06-12'
    },
    {
      id: 't2',
      customerName: 'Jessica Taylor',
      rating: 5,
      text: 'Tesla Model 3 was pristine. The pickup location was easy to access and autopilot was amazing for my highway drive.',
      date: '2026-05-28'
    },
    {
      id: 't3',
      customerName: 'Michael Brown',
      rating: 4,
      text: 'Rad Power utility bike made SF hills feel like flat ground. Very simple keyless checkout process!',
      date: '2026-04-14'
    }
  ];

  return (
    <section id="reviews" className="py-16 md:py-24 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="max-w-3xl mx-auto mb-16 text-center flex flex-col gap-3">
          <span className="text-sm font-extrabold text-primary uppercase tracking-widest">Testimonials</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">
            What our riders are saying.
          </h2>
          <div className="w-16 h-1 bg-accent mx-auto rounded-full mt-1"></div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((review) => (
            <Card
              key={review.id}
              className="relative flex flex-col justify-between p-8 border border-slate-100/50 hover:shadow-md"
              hoverable={true}
            >
              {/* Quote bubble decor */}
              <div className="absolute top-6 right-6 text-slate-100 pointer-events-none">
                <Quote className="w-12 h-12 fill-current" />
              </div>
              
              <div className="relative z-10 flex flex-col gap-4 text-left">
                {/* Stars */}
                <StarRating rating={review.rating} size="sm" />
                
                {/* Text */}
                <p className="text-slate-600 text-sm leading-relaxed italic">
                  "{review.text}"
                </p>
              </div>

              {/* Reviewer info */}
              <div className="flex items-center gap-3.5 mt-8 border-t border-slate-100/80 pt-5 text-left">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-extrabold text-primary text-sm shadow-xs uppercase select-none">
                  {review.customerName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 leading-none">{review.customerName}</h4>
                  <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Verified RideMate Customer</span>
                </div>
                <span className="ml-auto text-[10px] text-slate-400 font-bold">{review.date}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
