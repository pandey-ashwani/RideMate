import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar/navbar';
import { Hero } from '../components/Hero/hero';
import { SearchBar } from '../SearchBar/searchbar';
import { WhyChooseUs } from '../WhyChooseUs/whyChooseUs';
import { PopularVehicles } from '../popularVehicles/popularvehicles';
import { Reviews } from '../Reviews/reviews';
import { Footer } from '../Footer/footer';
import { Modal } from '../components/Common/Modal';
import { Button } from '../components/Common/Button';
import { Input } from '../components/Common/Input';
import { apiRequest } from '../utils/api';
import { ShieldCheck, Info, Calendar } from 'lucide-react';

export const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [pickupDate, setPickupDate] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  const handleOpenBookModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsBookModalOpen(true);
    setBookingSuccess(false);
  };

  const handleCloseBookModal = () => {
    setSelectedVehicle(null);
    setIsBookModalOpen(false);
    setBookingSuccess(false);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login?redirect=book');
      return;
    }

    if (user.role !== 'customer') {
      alert('Only customers can book vehicles. Please log in as a customer.');
      return;
    }

    try {
      await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId: selectedVehicle._id,
          pickupDate,
          dropoffDate
        })
      });

      alert('Booking requested successfully! Redirecting to your dashboard...');
      setIsBookModalOpen(false);
      navigate('/dashboard?tab=bookings');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Booking request failed.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-800 bg-slate-50/50">
      <Navbar />
      
      {/* Hero section wrapping the search bar */}
      <Hero>
        <SearchBar />
      </Hero>

      {/* How it Works / Steps Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-16 flex flex-col gap-3">
            <span className="text-sm font-extrabold text-primary uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">
              Get moving in 3 simple steps.
            </h2>
            <div className="w-16 h-1 bg-accent mx-auto rounded-full mt-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center gap-4 group">
              <div className="w-16 h-16 rounded-2xl bg-primary text-accent flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition-transform duration-200">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-800 mt-2">Find Your Ride</h3>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                Enter your location and dates. Filter by cars, scooters, or bikes to find the perfect fit.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-4 group">
              <div className="w-16 h-16 rounded-2xl bg-accent text-primary flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition-transform duration-200">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-800 mt-2">Book Instantly</h3>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                Select your vehicle, fill in checkout details, and send a booking request to the verified owner.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-4 group">
              <div className="w-16 h-16 rounded-2xl bg-primary text-accent flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition-transform duration-200">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-800 mt-2">Unlock & Go</h3>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                Coordinate pickup with the host. Grab the keys or use keyless app unlock, and hit the road!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <WhyChooseUs />

      {/* Popular Vehicles */}
      <PopularVehicles onBookQuickly={handleOpenBookModal} />

      {/* Owner Host CTA Banner */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary-dark via-primary to-blue-800 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl -mr-16 pointer-events-none"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 flex flex-col items-center gap-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Earn extra income with your vehicle.
          </h2>
          <p className="text-slate-200 max-w-xl text-sm sm:text-base leading-relaxed">
            List your idle scooter, bike, or car on RideMate. Set your own pricing, manage availability, and let your vehicle work for you. Join thousands of verified hosts.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
            <Link to="/register?role=owner">
              <Button variant="secondary" size="lg" className="font-bold shadow-md hover:scale-105 duration-150">
                Become a Host
              </Button>
            </Link>
            <Link to="/login?role=owner">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:border-white font-semibold">
                Owner Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <Reviews />

      {/* Booking Dialog Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={handleCloseBookModal}
        title={bookingSuccess ? 'Booking Request Placed!' : `Rent ${selectedVehicle?.name}`}
        footer={
          bookingSuccess ? (
            <Button variant="primary" onClick={handleCloseBookModal}>
              Done
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleCloseBookModal}>
                Cancel
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleConfirmBooking} 
                disabled={!pickupDate || !dropoffDate}
                className="font-bold text-primary-dark"
              >
                {user ? 'Confirm Rental' : 'Login to Book'}
              </Button>
            </div>
          )
        }
      >
        {bookingSuccess ? (
          <div className="text-center py-6 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">Your request has been sent!</h4>
            <p className="text-sm text-slate-500 max-w-md">
              We have submitted your booking request to the vehicle host. You will receive an update on your dashboard once the owner approves or rejects the request.
            </p>
            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-left text-xs font-semibold text-slate-600 mt-4 flex flex-col gap-2">
              <div className="flex justify-between">
                <span>Vehicle:</span>
                <span className="text-slate-800">{createdBooking?.vehicleName}</span>
              </div>
              <div className="flex justify-between">
                <span>Rental Dates:</span>
                <span className="text-slate-800">{createdBooking?.pickupDate} to {createdBooking?.dropoffDate}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-sm text-slate-800">
                <span>Total Cost:</span>
                <span className="text-primary">₹{createdBooking?.totalCost}</span>
              </div>
            </div>
            <Link to="/dashboard?tab=bookings" className="mt-4" onClick={handleCloseBookModal}>
              <Button variant="primary" size="sm">
                Go to My Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            {selectedVehicle && (
              <div className="flex flex-col gap-5">
                {/* Vehicle mini details */}
                <div className="flex gap-4 items-center bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <img
                    src={selectedVehicle.image.startsWith('http') ? selectedVehicle.image : `http://localhost:5000${selectedVehicle.image}`}
                    alt={selectedVehicle.name}
                    className="w-20 h-14 object-cover rounded-lg border"
                  />
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                      {selectedVehicle.brand}
                    </span>
                    <h4 className="text-base font-black text-slate-800 leading-tight">
                      {selectedVehicle.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-bold mt-1">
                      Rate: <span className="text-primary">₹{selectedVehicle.pricePerDay}/day</span>
                    </p>
                  </div>
                </div>

                {!user && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200/50 p-4 rounded-xl text-amber-800 text-xs font-semibold">
                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>
                      You are not logged in. Confirming this rental will redirect you to the login screen where you can choose a role to complete your booking.
                    </p>
                  </div>
                )}

                {/* Booking Dates Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <Input
                    label="Pickup Date"
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    icon={Calendar}
                  />
                  
                  <Input
                    label="Return Date"
                    type="date"
                    required
                    min={pickupDate || new Date().toISOString().split('T')[0]}
                    value={dropoffDate}
                    onChange={(e) => setDropoffDate(e.target.value)}
                    icon={Calendar}
                  />
                </div>

                {pickupDate && dropoffDate && (
                  <div className="border-t border-slate-100 pt-4 flex flex-col gap-2 text-xs font-semibold text-slate-500">
                    <div className="flex justify-between">
                      <span>Daily rental fee:</span>
                      <span className="text-slate-800">${selectedVehicle.pricePerDay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="text-slate-800">
                        {Math.ceil((new Date(dropoffDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)) || 1} days
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-sm text-slate-800">
                      <span>Estimated Total Cost:</span>
                      <span className="text-primary">
                        ${(Math.ceil((new Date(dropoffDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)) || 1) * selectedVehicle.pricePerDay}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Footer />
    </div>
  );
};

export default Home;
