import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import { Navbar } from '../../components/Navbar/navbar';
import { Footer } from '../../Footer/footer';
import { Card } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { Button } from '../../components/Common/Button';
import { Input } from '../../components/Common/Input';
import { StarRating } from '../../components/Common/StarRating';
import { Modal } from '../../components/Common/Modal';
import { Calendar, User, Mail, ShieldCheck, Star, MessageSquare } from 'lucide-react';

export const CustomerDashboard = () => {
  const { user, updateProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('bookings');
  const navigate = useNavigate();

  // Bookings list state
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Sync tab with search parameters
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'profile' || tabParam === 'bookings') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Fetch bookings from backend
  const loadBookings = async () => {
    setLoadingBookings(true);
    try {
      const data = await apiRequest('/bookings/my-bookings');
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching customer bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    setProfileSuccess(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess(false);

    const res = await updateProfile({ name, email, avatar });
    if (res.success) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
  };

  const handleOpenReviewModal = (booking) => {
    setSelectedBooking(booking);
    setIsReviewModalOpen(true);
    setRating(5);
    setReviewText('');
    setReviewSuccess(false);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;

    try {
      await apiRequest(`/vehicles/${selectedBooking.vehicleId._id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          text: reviewText
        })
      });

      setReviewSuccess(true);
      setTimeout(() => {
        setIsReviewModalOpen(false);
        setSelectedBooking(null);
      }, 2000);
    } catch (err) {
      console.error('Error submitting review:', err);
      alert(err.message || 'Could not save review.');
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'completed': return 'info';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-800 bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        {/* User Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-6 mb-8 flex flex-col sm:flex-row items-center gap-5 text-left">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-16 h-16 rounded-full object-cover ring-4 ring-primary/10"
          />
          <div>
            <h2 className="text-xl font-black text-slate-800">{user?.name}</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">Rider since {user?.joinedDate?.split('T')[0]}</p>
          </div>

          {/* Navigation tabs inside dashboard header */}
          <div className="sm:ml-auto flex gap-2">
            <button
              onClick={() => handleTabChange('bookings')}
              className={`
                px-4 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer
                ${activeTab === 'bookings'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }
              `}
            >
              My Bookings
            </button>
            
            <button
              onClick={() => handleTabChange('profile')}
              className={`
                px-4 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer
                ${activeTab === 'profile'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }
              `}
            >
              Profile Settings
            </button>
          </div>
        </div>

        {/* Tab contents */}
        {activeTab === 'bookings' ? (
          <div className="text-left flex flex-col gap-6">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Your Rental History</h3>
            
            {loadingBookings ? (
              <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
                <p className="text-xs font-semibold text-slate-400">Loading rentals queue...</p>
              </div>
            ) : bookings.length > 0 ? (
              <div className="flex flex-col gap-4">
                {bookings.map((booking) => (
                  <Card key={booking._id} className="flex flex-col md:flex-row items-center gap-5 p-5 border border-slate-100" hoverable={false}>
                    {/* Vehicle image */}
                    <img
                      src={booking.vehicleId?.image.startsWith('http') ? booking.vehicleId.image : `http://localhost:5000${booking.vehicleId?.image}`}
                      alt={booking.vehicleId?.name}
                      className="w-32 h-20 object-cover rounded-xl border border-slate-100 shrink-0"
                    />

                    {/* Booking metadata */}
                    <div className="flex-grow flex flex-col gap-1.5 md:text-left text-center">
                      <span className="text-[10px] font-bold text-slate-400">BOOKING ID: {booking._id}</span>
                      <h4 className="text-base font-black text-slate-800 tracking-tight leading-none">{booking.vehicleId?.name}</h4>
                      
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {booking.pickupDate?.split('T')[0]} to {booking.dropoffDate?.split('T')[0]}
                        </span>
                        <span>•</span>
                        <span className="text-primary font-bold">Total cost: ₹{booking.totalCost}</span>
                      </div>
                    </div>

                    {/* Booking Status & Action Button */}
                    <div className="flex flex-col items-center md:items-end gap-3.5 shrink-0">
                      <Badge variant={getStatusBadgeVariant(booking.status)} className="capitalize px-3 py-1">
                        {booking.status}
                      </Badge>
                      
                      {booking.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-bold border-primary text-primary hover:bg-primary/5"
                          onClick={() => handleOpenReviewModal(booking)}
                        >
                          Write Review
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center gap-4">
                <span className="text-4xl">🚗</span>
                <h3 className="text-base font-black text-slate-800">No rentals found</h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  You haven't requested any vehicle rentals yet. Hop over to the catalog to find your first ride!
                </p>
                <Button variant="primary" size="sm" onClick={() => navigate('/vehicles')}>
                  Browse Fleet
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Profile Settings */
          <div className="max-w-xl text-left flex flex-col gap-6">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Account Settings</h3>
            
            <Card className="p-6 border border-slate-100" hoverable={false}>
              {profileSuccess && (
                <div className="mb-5 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-lg text-xs font-semibold">
                  <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                <Input
                  label="Profile Picture URL"
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  icon={User}
                />

                <Input
                  label="Full Name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={User}
                />

                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={Mail}
                />

                <Button type="submit" variant="primary" className="py-2.5 font-bold shadow-xs mt-2 w-fit">
                  Save Changes
                </Button>
              </form>
            </Card>
          </div>
        )}
      </main>

      {/* Review Dialog Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`Write review for ${selectedBooking?.vehicleId?.name}`}
        footer={
          reviewSuccess ? null : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>Cancel</Button>
              <Button variant="secondary" onClick={handleSubmitReview} className="font-bold text-primary-dark">Submit Review</Button>
            </div>
          )
        }
      >
        {reviewSuccess ? (
          <div className="text-center py-6 flex flex-col items-center gap-4 animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">Review Submitted!</h4>
            <p className="text-xs text-slate-500 font-semibold">
              Thank you for sharing your experience. Your feedback is visible in the vehicle catalog page.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="flex flex-col gap-5 text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Rating</label>
              <StarRating rating={rating} size="lg" interactive={true} onChange={setRating} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Review</label>
              <textarea
                placeholder="Share detail experience about cleanliness, pickup comfort, and vehicle performance..."
                required
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary p-3.5 h-28 focus:outline-none placeholder-slate-400 bg-white"
              />
            </div>
          </form>
        )}
      </Modal>

      <Footer />
    </div>
  );
};

export default CustomerDashboard;
