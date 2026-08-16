import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar/navbar';
import { Footer } from '../Footer/footer';
import { ShieldCheck, Mail, Phone, MapPin, FileText, Lock } from 'lucide-react';

export const TermsContent = ({ activeTab: initialTab = 'terms' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'terms'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5 inline mr-1.5" />
          Terms & Conditions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'privacy'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5 inline mr-1.5" />
          Privacy Policy
        </button>
      </div>

      {activeTab === 'terms' ? (
        <div className="flex flex-col gap-6 text-slate-700 text-xs leading-relaxed">
          {/* Intro Box */}
          <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl">
            <h4 className="text-sm font-bold text-primary mb-1">RideMate Terms & Conditions</h4>
            <p className="text-slate-600">
              Welcome to RideMate. Please read these Terms & Conditions carefully before using our platform.
              By creating a RideMate account or using our services, you agree to comply with and be bound by these terms.
            </p>
          </div>

          {/* Section 1 */}
          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">1. About RideMate</h5>
            <p>
              RideMate is a local vehicle-rental marketplace connecting customers with vehicle owners. RideMate provides the platform for discovering vehicles and submitting rental requests.
            </p>
          </section>

          {/* Section 2 */}
          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">2. User Account</h5>
            <p>
              Users must provide accurate information when registering and are responsible for keeping their account credentials secure. False or misleading information may result in immediate account suspension.
            </p>
          </section>

          {/* Section 3 */}
          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">3. Customer Requirements</h5>
            <p>
              Customers must provide accurate registration details, possess an appropriate valid driving licence, provide required licence information/documents after owner acceptance, provide accurate pickup information, and adhere strictly to all applicable traffic and safety laws.
            </p>
          </section>

          {/* Section 4 */}
          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">4. Booking Process</h5>
            <p>
              The RideMate booking flow is structured as follows:
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg text-[11px] font-bold text-slate-700 my-1">
              Request Booking → Owner Accepts → Customer submits required documents/pickup details → Booking Confirmed
            </div>
            <p className="text-amber-700 font-semibold">
              Note: An initial booking request is NOT a confirmed rental.
            </p>
          </section>

          {/* Section 5 */}
          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">5. Vehicle Owners</h5>
            <p>
              Owners must provide accurate vehicle information and ensure their vehicles and rental operations comply with applicable registration, insurance, permit, safety, and other legal requirements.
            </p>
            <p>
              Owners are solely responsible for vehicle condition, maintenance, pricing, availability, handover/return arrangements, and applicable legal requirements.
            </p>
          </section>

          {/* Section 6 */}
          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">6. Vehicle Rental</h5>
            <p>
              The actual vehicle rental and handover are between the customer and vehicle owner. Rental conditions such as damage, traffic violations, fuel, late return, security deposit, and similar matters are governed by the applicable rental agreement/owner terms.
            </p>
          </section>

          {/* Section 7 */}
          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">7. Payments and Charges</h5>
            <p>
              Rental prices are provided by owners unless otherwise stated. Any RideMate platform fees, commissions, deposits, or online payment charges will be clearly displayed before the applicable transaction.
            </p>
          </section>

          {/* Section 8 */}
          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">8. Cancellation</h5>
            <p>
              Cancellation and refund conditions will follow the applicable rental/owner policy and will be displayed where applicable.
            </p>
          </section>

          {/* Section 9 */}
          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">9. Personal Information and Documents</h5>
            <p>
              RideMate may collect information required for account management, verification, booking processing, safety, fraud prevention, and support, including name, contact information, booking information, driving licence information/document, and pickup information.
            </p>
            <p className="font-semibold text-slate-800">
              Users must not upload documents belonging to another person without authorization.
            </p>
          </section>

          {/* Section 10 */}
          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">10. Prohibited Activities</h5>
            <p>
              Users must not provide fake information, upload fraudulent documents, conduct illegal activities, misuse accounts, manipulate bookings/reviews, attempt unauthorized system access, or misuse the platform in any manner.
            </p>
          </section>

          {/* Section 11 */}
          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">11. Reviews</h5>
            <p>
              Customers may submit genuine reviews based on actual rental experiences. False, abusive, threatening, unlawful, or inappropriate reviews may be removed.
            </p>
          </section>

          {/* Section 12 */}
          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">12. Platform Availability</h5>
            <p>
              RideMate aims to provide reliable service but does not guarantee uninterrupted or error-free availability. Temporary suspension may occur for maintenance, security, or technical reasons.
            </p>
          </section>

          {/* Section 13 */}
          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">13. RideMate's Platform Role</h5>
            <p>
              RideMate facilitates connections between customers and vehicle owners. RideMate does not own every vehicle listed on the platform and does not directly control the condition, maintenance, or operation of independently listed vehicles.
            </p>
            <p>
              This statement is provided to clarify platform operations and does not attempt to remove consumer rights or liabilities that cannot legally be excluded under applicable laws.
            </p>
          </section>

          {/* Section 14 */}
          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">14. Account Suspension</h5>
            <p>
              RideMate may suspend, restrict, or terminate accounts for violations of these Terms, fraudulent documents, fraudulent/unsafe activity, illegal activity, or platform misuse.
            </p>
          </section>

          {/* Section 15 */}
          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">15. Changes to Terms</h5>
            <p>
              RideMate may update these Terms when necessary and publish the updated version on the platform.
            </p>
          </section>

          {/* Section 16 */}
          <section className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-200/60 rounded-xl mt-2">
            <h5 className="text-sm font-bold text-slate-800">16. Contact Information</h5>
            <div className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span>Email: <strong className="text-slate-800">support@ridemate.com</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span>Phone: <strong className="text-slate-800">+91 98765 43210</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Location: <strong className="text-slate-800">Srinagar Garhwal, Uttarakhand, India</strong></span>
              </div>
            </div>
          </section>
        </div>
      ) : (
        /* Privacy Policy Tab */
        <div className="flex flex-col gap-6 text-slate-700 text-xs leading-relaxed">
          <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl">
            <h4 className="text-sm font-bold text-emerald-800 mb-1">RideMate Privacy Policy</h4>
            <p className="text-slate-600">
              RideMate is committed to protecting your privacy and personal data. This policy explains how we collect, use, and safeguard your information.
            </p>
          </div>

          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">1. Information We Collect</h5>
            <p>
              We collect information you provide directly to us when registering, booking, or updating your profile, including your name, email address, phone number, company name (for owners), driving licence number, and uploaded licence document photos.
            </p>
          </section>

          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">2. How We Use Information</h5>
            <p>
              Your information is used strictly to facilitate vehicle search, rental requests, identity & driving licence verification, booking management, owner communication, and safety enforcement on RideMate.
            </p>
          </section>

          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">3. Document Protection & Sharing</h5>
            <p>
              Driving licence documents and pickup details are shared with the vehicle owner only after the owner accepts the booking request. We do not sell or monetize user personal data.
            </p>
          </section>

          <section className="flex flex-col gap-1.5">
            <h5 className="text-sm font-bold text-slate-800">4. Security & Data Retention</h5>
            <p>
              We implement reasonable technical and organizational security measures to protect your credentials and identity documents against unauthorized access.
            </p>
          </section>

          <section className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-200/60 rounded-xl mt-2">
            <h5 className="text-sm font-bold text-slate-800">Contact Support</h5>
            <div className="flex flex-col gap-1.5 text-xs text-slate-600">
              <span>Email: <strong>support@ridemate.com</strong></span>
              <span>Location: <strong>Srinagar Garhwal, Uttarakhand, India</strong></span>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export const TermsPage = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'terms';

  return (
    <div className="flex flex-col min-h-screen text-slate-800 bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-6 sm:p-10">
          <TermsContent activeTab={tabParam} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsPage;
