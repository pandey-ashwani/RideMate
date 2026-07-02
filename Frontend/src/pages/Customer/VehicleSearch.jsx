import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import { Navbar } from '../../components/Navbar/navbar';
import { Footer } from '../../Footer/footer';
import { Card } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { Button } from '../../components/Common/Button';
import { StarRating } from '../../components/Common/StarRating';
import { Modal } from '../../components/Common/Modal';
import { Input } from '../../components/Common/Input';
import { useAuth } from '../../context/AuthContext';
import { Search, SlidersHorizontal, MapPin, Gauge, User, Calendar, Info, Star, MessageSquare } from 'lucide-react';

export const VehicleSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fleet list states
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState(['all']);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [maxPrice, setMaxPrice] = useState(20000);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Modal details state
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [vehicleReviews, setVehicleReviews] = useState([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [pickupDate, setPickupDate] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  // Sync state from query parameters on load
  useEffect(() => {
    const typeParam = searchParams.get('type');
    const locationParam = searchParams.get('location');
    const idParam = searchParams.get('id');

    if (typeParam) setSelectedType(typeParam);
    if (locationParam) setSearchTerm(locationParam);
    
    if (idParam) {
      fetchSingleVehicle(idParam);
    }
  }, [searchParams]);

  // Load brands once on mount
  useEffect(() => {
    const fetchAllBrands = async () => {
      try {
        const data = await apiRequest('/vehicles?pageSize=100');
        const uniqueBrands = ['all', ...new Set((data.vehicles || []).map(v => v.brand))];
        setBrands(uniqueBrands);
      } catch (err) {
        console.error('Error fetching brand list:', err);
      }
    };
    fetchAllBrands();
  }, []);

  // Fetch filtered vehicles from backend
  useEffect(() => {
    const fetchFilteredVehicles = async () => {
      setLoading(true);
      try {
        const typeQuery = selectedType !== 'all' ? `&type=${selectedType}` : '';
        const brandQuery = selectedBrand !== 'all' ? `&brand=${selectedBrand}` : '';
        const keywordQuery = searchTerm ? `&keyword=${searchTerm}` : '';
        const priceQuery = `&maxPrice=${maxPrice}`;
        const availQuery = onlyAvailable ? `&onlyAvailable=true` : '';

        const data = await apiRequest(
          `/vehicles?pageSize=50${keywordQuery}${typeQuery}${brandQuery}${priceQuery}${availQuery}`
        );
        setVehicles(data.vehicles || []);
      } catch (err) {
        console.error('Error querying filtered vehicles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredVehicles();
  }, [searchTerm, selectedType, selectedBrand, maxPrice, onlyAvailable]);

  // Helper to open details modal when direct URL provided
  const fetchSingleVehicle = async (id) => {
    try {
      const data = await apiRequest(`/vehicles/${id}`);
      setActiveVehicle(data.vehicle);
      setVehicleReviews(data.reviews || []);
      setIsDetailModalOpen(true);
      setBookingSuccess(false);
      setPickupDate('');
      setDropoffDate('');
    } catch (err) {
      console.error('Error opening single vehicle details:', err);
    }
  };

  // Open Details Modal
  const handleOpenDetailModal = async (vehicle) => {
    setActiveVehicle(vehicle);
    setBookingSuccess(false);
    setPickupDate('');
    setDropoffDate('');
    
    try {
      const data = await apiRequest(`/vehicles/${vehicle._id}`);
      setVehicleReviews(data.reviews || []);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error('Error loading vehicle reviews:', err);
      alert('Could not retrieve vehicle details.');
    }
  };

  // Close Details Modal
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setActiveVehicle(null);
    setBookingSuccess(false);
    
    if (searchParams.has('id')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('id');
      setSearchParams(newParams);
    }
  };

  // Confirm booking
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login?redirect=book');
      return;
    }

    if (user.role !== 'customer') {
      alert('Only customers can book vehicles.');
      return;
    }

    try {
      await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId: activeVehicle._id,
          pickupDate,
          dropoffDate
        })
      });

      alert('Booking requested successfully! Redirecting to your dashboard...');
      setIsDetailModalOpen(false);
      navigate('/dashboard?tab=bookings');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Booking request failed.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-800 bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        {/* Header Title */}
        <div className="mb-8 text-left">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none mb-2">
            Available Rentals
          </h1>
          <p className="text-sm text-slate-400 font-semibold">
            Found {vehicles.length} vehicles matching your search criteria
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl shadow-xs p-6 h-fit text-left flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                Filters
              </span>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                  setSelectedBrand('all');
                  setMaxPrice(20000);
                  setOnlyAvailable(false);
                }}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                Reset All
              </button>
            </div>

            {/* Keyword Search */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Keyword</label>
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Srinagar Garhwal, Uttarakhand"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-slate-50/50"
                />
              </div>
            </div>

            {/* Vehicle Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary bg-slate-50/50 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="car">🚗 Cars</option>
                <option value="bike">🚲 Bicycles</option>
                <option value="scooter">🛵 Scooters</option>
              </select>
            </div>

            {/* Brand */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Brand</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary bg-slate-50/50 cursor-pointer capitalize"
              >
                {brands.map((b) => (
                  <option key={b} value={b}>{b === 'all' ? 'All Brands' : b}</option>
                ))}
              </select>
            </div>

            {/* Max Price */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500">
                <span>Max Price Per Day</span>
                <span className="text-primary font-black">₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="10"
                max="20000"
                step="5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>₹10</span>
                <span>₹20000</span>
              </div>
            </div>

            {/* Availability Checkbox */}
            <div className="flex items-center gap-2.5 pt-2">
              <input
                type="checkbox"
                id="avail"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer"
              />
              <label htmlFor="avail" className="text-xs font-bold text-slate-600 select-none cursor-pointer">
                Only show available rides
              </label>
            </div>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
                <p className="text-xs font-semibold text-slate-400">Searching inventory...</p>
              </div>
            ) : vehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((vehicle) => (
                  <Card
                    key={vehicle._id}
                    className="flex flex-col h-full overflow-hidden p-0 border border-slate-100/75"
                    hoverable={true}
                    onClick={() => handleOpenDetailModal(vehicle)}
                  >
                    <div className="relative h-44 overflow-hidden bg-slate-100 shrink-0">
                      <img
                        src={vehicle.image.startsWith('http') ? vehicle.image : `http://localhost:5000${vehicle.image}`}
                        alt={vehicle.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 flex gap-1.5 flex-col">
                        <Badge variant="primary" className="uppercase">{vehicle.type}</Badge>
                        {!vehicle.availability && <Badge variant="warning">Booked Out</Badge>}
                      </div>
                      <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md text-white font-extrabold text-xs">
                        ₹{vehicle.pricePerDay}/day
                      </div>
                    </div>

                    <div className="p-5 flex flex-col justify-between flex-grow text-left">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{vehicle.brand}</span>
                          {vehicle.rating > 0 && (
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                              <Star className="w-3 h-3 text-amber-400 fill-current" />
                              <span>{vehicle.rating}</span>
                            </div>
                          )}
                        </div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight leading-none mb-3 truncate">
                          {vehicle.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mb-4">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{vehicle.location}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 rounded-lg p-2.5 mb-4 border border-slate-100">
                        <Gauge className="w-4 h-4 text-slate-400" />
                        <span className="truncate">Specs: {vehicle.specs.fuel}</span>
                      </div>

                      <Button variant="primary" size="sm" className="w-full font-bold shadow-xs">
                        View & Rent
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center gap-4">
                <span className="text-4xl">🔍</span>
                <h3 className="text-lg font-black text-slate-800">No Vehicles Found</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  We couldn't find any approved vehicles matching your filters. Try resetting filters or broadening your search word.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedType('all');
                    setSelectedBrand('all');
                    setMaxPrice(150);
                    setOnlyAvailable(false);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Details & Booking Dialog Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        title={bookingSuccess ? 'Booking Placed!' : activeVehicle?.name}
        size="lg"
        footer={
          bookingSuccess ? (
            <Button variant="primary" onClick={handleCloseDetailModal}>Done</Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCloseDetailModal}>Close</Button>
              <Button 
                variant="secondary" 
                onClick={handleConfirmBooking}
                disabled={!pickupDate || !dropoffDate || !activeVehicle?.availability}
                className="font-bold text-primary-dark"
              >
                {user ? 'Request Ride' : 'Login to Book'}
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
            <h4 className="text-lg font-bold text-slate-800">Booking Requested!</h4>
            <p className="text-sm text-slate-500 max-w-md">
              Your booking request has been registered and is pending approval from the host. Check your dashboard to view history and status!
            </p>
            
            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-left text-xs font-semibold text-slate-600 mt-4 flex flex-col gap-2">
              <div className="flex justify-between">
                <span>Vehicle:</span>
                <span className="text-slate-800">{createdBooking?.vehicleName}</span>
              </div>
              <div className="flex justify-between">
                <span>Pickup/Return:</span>
                <span className="text-slate-800">{createdBooking?.pickupDate.split('T')[0]} to {createdBooking?.dropoffDate.split('T')[0]}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-sm text-slate-800">
                <span>Price:</span>
                <span className="text-primary">₹{createdBooking?.totalCost}</span>
              </div>
            </div>

            <Link to="/dashboard?tab=bookings" className="mt-4" onClick={handleCloseDetailModal}>
              <Button variant="primary" size="sm">Go to Dashboard</Button>
            </Link>
          </div>
        ) : (
          activeVehicle && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              {/* Left Column: Image and Reviews */}
              <div className="flex flex-col gap-6">
                <img
                  src={activeVehicle.image.startsWith('http') ? activeVehicle.image : `http://localhost:5000${activeVehicle.image}`}
                  alt={activeVehicle.name}
                  className="w-full h-64 object-cover rounded-xl border border-slate-100 shadow-xs"
                />
                
                {/* Description */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Description</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    {activeVehicle.description}
                  </p>
                </div>

                {/* Reviews List */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-4.5 h-4.5 text-primary" />
                    <h4 className="text-sm font-bold text-slate-800">User Reviews ({vehicleReviews.length})</h4>
                  </div>

                  {vehicleReviews.length > 0 ? (
                    <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                      {vehicleReviews.map((r) => (
                        <div key={r._id} className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-700">{r.customerName}</span>
                            <span className="text-[9px] text-slate-400 font-bold">{r.date.split('T')[0]}</span>
                          </div>
                          <StarRating rating={r.rating} size="sm" className="mb-2" />
                          <p className="text-slate-500 italic font-medium">"{r.text}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No reviews written for this vehicle yet.</p>
                  )}
                </div>
              </div>

              {/* Right Column: Spec badges & booking details */}
              <div className="flex flex-col gap-5 border-l border-slate-100 pl-0 md:pl-8">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{activeVehicle.brand}</span>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">{activeVehicle.name}</h3>
                  <p className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{activeVehicle.location}</span>
                  </p>
                </div>

                {/* Specifications Grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-semibold text-slate-600">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Transmission</span>
                    <span className="text-slate-800">{activeVehicle.specs.transmission}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Power Type</span>
                    <span className="text-slate-800">{activeVehicle.specs.fuel}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Capacity</span>
                    <span className="text-slate-800">{activeVehicle.specs.seats} Passenger(s)</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estimated Range</span>
                    <span className="text-slate-800">{activeVehicle.specs.range}</span>
                  </div>
                </div>

                {/* Booking Form Block */}
                <div className="border-t border-slate-100 pt-4 flex flex-col gap-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Rent this vehicle</h4>
                  
                  {activeVehicle.availability ? (
                    <div className="flex flex-col gap-4">
                      {!user && (
                        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200/50 p-3 rounded-lg text-amber-800 text-[10px] font-semibold">
                          <Info className="w-4 h-4 shrink-0 mt-0.5" />
                          <p>You must log in to submit a rental request.</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Pickup Date"
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          icon={Calendar}
                          className="!gap-1"
                        />
                        
                        <Input
                          label="Return Date"
                          type="date"
                          required
                          min={pickupDate || new Date().toISOString().split('T')[0]}
                          value={dropoffDate}
                          onChange={(e) => setDropoffDate(e.target.value)}
                          icon={Calendar}
                          className="!gap-1"
                        />
                      </div>

                      {pickupDate && dropoffDate && (
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 flex flex-col gap-2 text-xs font-semibold text-slate-500">
                          <div className="flex justify-between">
                            <span>Daily Price:</span>
                            <span className="text-slate-800">₹{activeVehicle.pricePerDay}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span className="text-slate-800">
                              {Math.ceil((new Date(dropoffDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)) || 1} day(s)
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-slate-200/50 pt-2 font-bold text-slate-800">
                            <span>Estimated cost:</span>
                            <span className="text-primary text-sm">₹{(Math.ceil((new Date(dropoffDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)) || 1) * activeVehicle.pricePerDay}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200/50 p-4 rounded-xl text-center text-red-800 font-bold text-xs">
                      ❌ Currently rented out by another rider.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </Modal>

      <Footer />
    </div>
  );
};

export default VehicleSearch;
