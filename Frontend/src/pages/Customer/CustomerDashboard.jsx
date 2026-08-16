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
  const [drivingLicense, setDrivingLicense] = useState(user?.drivingLicense || '');
  const [licenseDoc, setLicenseDoc] = useState(user?.licenseDoc || '');
  const [dlFile, setDlFile] = useState(null);
  const [uploadingDl, setUploadingDl] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Step 3 Confirmation Modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedBookingForConfirm, setSelectedBookingForConfirm] = useState(null);
  const [confirmDl, setConfirmDl] = useState(user?.drivingLicense || '');
  const [confirmDocUrl, setConfirmDocUrl] = useState(user?.licenseDoc || '');
  const [confirmDocFile, setConfirmDocFile] = useState(null);
  const [confirmPickupLocation, setConfirmPickupLocation] = useState('');
  const [confirmPickupNotes, setConfirmPickupNotes] = useState('');
  const [confirmingLoading, setConfirmingLoading] = useState(false);
  const [confirmSuccessMsg, setConfirmSuccessMsg] = useState(false);

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

  // Profile picture file state
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess(false);

    let avatarPath = avatar;
    let docUrl = licenseDoc;

    if (profileAvatarFile) {
      try {
        const formData = new FormData();
        formData.append('image', profileAvatarFile);
        const res = await apiRequest('/upload', {
          method: 'POST',
          body: formData
        });
        avatarPath = res.path;
        setAvatar(avatarPath);
      } catch (err) {
        console.error('Profile picture upload failed:', err);
        alert('Profile picture upload failed.');
      }
    }

    if (dlFile) {
      setUploadingDl(true);
      try {
        const formData = new FormData();
        formData.append('image', dlFile);
        const res = await apiRequest('/upload', {
          method: 'POST',
          body: formData
        });
        docUrl = res.path;
        setLicenseDoc(docUrl);
      } catch (err) {
        console.error('DL upload failed:', err);
        alert('Driving license image upload failed.');
      } finally {
        setUploadingDl(false);
      }
    }

    const res = await updateProfile({ 
      name, 
      email, 
      avatar: avatarPath, 
      drivingLicense, 
      licenseDoc: docUrl 
    });

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

  const handleOpenConfirmModal = (booking) => {
    setSelectedBookingForConfirm(booking);
    setConfirmDl(user?.drivingLicense || '');
    setConfirmDocUrl(user?.licenseDoc || '');
    setConfirmDocFile(null);
    setConfirmPickupLocation(booking.vehicleId?.location || '');
    setConfirmPickupNotes('');
    setConfirmSuccessMsg(false);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingForConfirm) return;
    setConfirmingLoading(true);

    let docPath = confirmDocUrl;

    if (confirmDocFile) {
      try {
        const formData = new FormData();
        formData.append('image', confirmDocFile);
        const uploadRes = await apiRequest('/upload/protected', {
          method: 'POST',
          body: formData
        });
        docPath = uploadRes.path;
        setConfirmDocUrl(docPath);
      } catch (err) {
        console.error('License document upload failed:', err);
        alert('Driving license document upload failed.');
        setConfirmingLoading(false);
        return;
      }
    }

    if (!confirmDl || !docPath || !confirmPickupLocation) {
      alert('Driving License Number, Driving License photo document, and Pickup Location are required.');
      setConfirmingLoading(false);
      return;
    }

    try {
      await apiRequest(`/bookings/${selectedBookingForConfirm._id}/confirm`, {
        method: 'PUT',
        body: JSON.stringify({
          drivingLicense: confirmDl,
          licenseDoc: docPath,
          pickupLocation: confirmPickupLocation,
          pickupNotes: confirmPickupNotes
        })
      });

      setConfirmSuccessMsg(true);
      loadBookings();
      setTimeout(() => {
        setIsConfirmModalOpen(false);
        setSelectedBookingForConfirm(null);
      }, 2000);
    } catch (err) {
      console.error('Error confirming booking details:', err);
      alert(err.message || 'Failed to confirm booking.');
    } finally {
      setConfirmingLoading(false);
    }
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
      case 'confirmed':
      case 'approved': return 'success';
      case 'owner_accepted': return 'warning';
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
            src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`) : 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
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

                      {/* Status Notices */}
                      {booking.status === 'pending' && (
                        <p className="text-xs font-semibold text-amber-600 bg-amber-50/70 p-2 rounded-lg border border-amber-200/50 mt-1">
                          ⏳ Booking request sent. Waiting for Owner confirmation.
                        </p>
                      )}

                      {booking.status === 'rejected' && (
                        <p className="text-xs font-semibold text-red-600 bg-red-50/70 p-2 rounded-lg border border-red-200/50 mt-1">
                          ❌ Owner rejected this booking request.
                        </p>
                      )}

                      {booking.status === 'owner_accepted' && (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <p className="text-xs font-bold text-amber-800">
                            🎉 Owner accepted your rental request. Please provide the required information to confirm your booking.
                          </p>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shrink-0"
                            onClick={() => handleOpenConfirmModal(booking)}
                          >
                            Submit & Confirm Booking
                          </Button>
                        </div>
                      )}

                      {(booking.status === 'confirmed' || booking.status === 'approved') && (
                        <div className="text-xs font-semibold text-emerald-700 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/50 mt-1">
                          <p className="font-extrabold">✓ Booking Confirmed</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Pickup Location: {booking.pickupLocation || booking.vehicleId?.location}</p>
                        </div>
                      )}
                    </div>

                    {/* Booking Status Badge & Actions */}
                    <div className="flex flex-col items-center md:items-end gap-3.5 shrink-0">
                      <Badge variant={getStatusBadgeVariant(booking.status)} className="capitalize px-3 py-1">
                        {booking.status === 'owner_accepted' ? 'Owner Accepted' : booking.status}
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
                <div className="flex flex-col gap-1.5">
                  <Input
                    label="Profile Picture URL (or upload photo below)"
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    icon={User}
                  />

                  <div className="flex flex-col gap-1.5 mt-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upload New Profile Picture (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setProfileAvatarFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
                    />
                  </div>
                </div>

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

                <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Driving License Verification</span>
                  <Input
                    label="Driving License Number"
                    type="text"
                    placeholder="e.g. DL-1420110012345"
                    value={drivingLicense}
                    onChange={(e) => setDrivingLicense(e.target.value)}
                    icon={User}
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upload Driving License Document Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setDlFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
                    />
                    {licenseDoc && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                        ✓ License Document Uploaded ({licenseDoc})
                      </span>
                    )}
                  </div>
                </div>

                <Button type="submit" variant="primary" disabled={uploadingDl} className="py-2.5 font-bold shadow-xs mt-2 w-fit">
                  {uploadingDl ? 'Uploading Document...' : 'Save Profile Changes'}
                </Button>
              </form>
            </Card>
          </div>
        )}
      </main>

      {/* Step 3 & 4 Confirmation Details Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Rental Booking"
        footer={
          confirmSuccessMsg ? null : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={handleConfirmSubmit} 
                disabled={confirmingLoading}
                className="font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {confirmingLoading ? 'Submitting Details...' : 'Submit & Confirm Booking'}
              </Button>
            </div>
          )
        }
      >
        {confirmSuccessMsg ? (
          <div className="text-center py-6 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">Booking Confirmed</h4>
            <p className="text-xs text-slate-500 font-semibold max-w-sm">
              Your rental details have been submitted and the booking is now confirmed. Have a safe journey!
            </p>
          </div>
        ) : (
          <form onSubmit={handleConfirmSubmit} className="flex flex-col gap-4 text-left">
            <p className="text-xs text-slate-600 font-semibold bg-amber-50 border border-amber-200/60 p-3 rounded-xl">
              Owner accepted your rental request. Please provide the following information to confirm your booking.
            </p>

            <Input
              label="Driving License Number"
              type="text"
              placeholder="e.g. DL-1420110012345"
              required
              value={confirmDl}
              onChange={(e) => setConfirmDl(e.target.value)}
              icon={User}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Driving License Document/Photo</label>
              <input
                type="file"
                accept="image/*"
                required={!confirmDocUrl}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setConfirmDocFile(e.target.files[0]);
                  }
                }}
                className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
              />
              {confirmDocUrl && (
                <span className="text-[10px] text-emerald-600 font-bold">
                  ✓ License photo attached ({confirmDocUrl})
                </span>
              )}
            </div>

            <Input
              label="Pickup Location"
              type="text"
              placeholder="e.g. Terminal 1 Counter / Downtown Station"
              required
              value={confirmPickupLocation}
              onChange={(e) => setConfirmPickupLocation(e.target.value)}
              icon={User}
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pickup Notes (Optional)</label>
              <textarea
                placeholder="e.g. Flight arrives at 4 PM, will pick up near main exit..."
                value={confirmPickupNotes}
                onChange={(e) => setConfirmPickupNotes(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-slate-200 p-3 h-20 focus:outline-none focus:border-primary bg-white text-slate-800"
              />
            </div>
          </form>
        )}
      </Modal>

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
