import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { Button } from '../../components/Common/Button';
import { Modal } from '../../components/Common/Modal';
import { Input } from '../../components/Common/Input';
import { Plus, Trash2, Edit2, ShieldAlert, Sparkles, MapPin, Upload } from 'lucide-react';

export const ManageVehicles = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal toggle state
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [type, setType] = useState('car');
  const [pricePerDay, setPricePerDay] = useState(45);
  const [image, setImage] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [transmission, setTransmission] = useState('Automatic');
  const [fuel, setFuel] = useState('Electric');
  const [seats, setSeats] = useState(5);
  const [range, setRange] = useState('300 miles');
  const [uploading, setUploading] = useState(false);

  // Load owner's vehicles
  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/vehicles?pageSize=100&ownerId=${user?._id}`);
      setVehicles(data.vehicles || []);
    } catch (err) {
      console.error('Error fetching owner vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadVehicles();
    }
  }, [user]);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedVehicle(null);
    setName('');
    setBrand('');
    setType('car');
    setPricePerDay(45);
    setImage('');
    setUploadFile(null);
    setLocation('');
    setDescription('');
    setTransmission('Automatic');
    setFuel('Electric');
    setSeats(5);
    setRange('300 miles');
    setIsOpen(true);
  };

  const handleOpenEdit = (vehicle) => {
    setIsEditMode(true);
    setSelectedVehicle(vehicle);
    setName(vehicle.name);
    setBrand(vehicle.brand);
    setType(vehicle.type);
    setPricePerDay(vehicle.pricePerDay);
    setImage(vehicle.image);
    setUploadFile(null);
    setLocation(vehicle.location);
    setDescription(vehicle.description);
    setTransmission(vehicle.specs.transmission);
    setFuel(vehicle.specs.fuel);
    setSeats(vehicle.specs.seats);
    setRange(vehicle.specs.range);
    setIsOpen(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    let vehicleImage = image;

    // Handle image file upload to backend first if a file was selected
    if (uploadFile) {
      try {
        const formData = new FormData();
        formData.append('image', uploadFile);

        const uploadRes = await apiRequest('/upload', {
          method: 'POST',
          body: formData
        });
        vehicleImage = uploadRes.path;
      } catch (err) {
        console.error('Image upload failed:', err);
        alert('Image upload failed, using default placeholder.');
        vehicleImage = '/uploads/default-vehicle.png';
      }
    }

    if (!vehicleImage) {
      vehicleImage = (
        type === 'car' ? 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600' :
        type === 'scooter' ? 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=600' :
        'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=600'
      );
    }

    const payload = {
      name,
      brand,
      type,
      pricePerDay: Number(pricePerDay),
      image: vehicleImage,
      location,
      description,
      specs: { transmission, fuel, seats: Number(seats), range }
    };

    try {
      if (isEditMode && selectedVehicle) {
        await apiRequest(`/vehicles/${selectedVehicle._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiRequest('/vehicles', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setIsOpen(false);
      loadVehicles();
    } catch (err) {
      console.error('Error saving vehicle details:', err);
      alert(err.message || 'Error saving listing details.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this vehicle listing?')) {
      try {
        await apiRequest(`/vehicles/${id}`, {
          method: 'DELETE'
        });
        loadVehicles();
      } catch (err) {
        console.error('Error deleting listing:', err);
        alert(err.message || 'Could not delete listing.');
      }
    }
  };

  const toggleAvailability = async (id, currentAvail) => {
    try {
      await apiRequest(`/vehicles/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ availability: !currentAvail })
      });
      loadVehicles();
    } catch (err) {
      console.error('Error toggling listing availability:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      default: return 'neutral';
    }
  };

  return (
    <DashboardLayout role="owner">
      <div className="flex flex-col gap-8 text-left">
        {/* Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Your Vehicle Listings</h1>
            <p className="text-xs font-semibold text-slate-400">List and control the booking availability of your fleet items</p>
          </div>
          
          <Button variant="primary" size="sm" onClick={handleOpenAdd} className="shadow-xs cursor-pointer">
            <Plus className="w-4 h-4 shrink-0" />
            Add Vehicle
          </Button>
        </div>

        {/* Vehicles Grid */}
        {loading ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-400">Loading fleet inventory...</p>
          </div>
        ) : vehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <Card key={vehicle._id} className="flex flex-col overflow-hidden p-0 border border-slate-100" hoverable={false}>
                <div className="relative h-44 bg-slate-50 shrink-0">
                  <img 
                    src={vehicle.image.startsWith('http') ? vehicle.image : `http://localhost:5000${vehicle.image}`} 
                    alt={vehicle.name} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <Badge variant="primary" className="uppercase">{vehicle.type}</Badge>
                    <Badge variant={getStatusColor(vehicle.status)} className="capitalize">
                      {vehicle.status}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md text-white font-extrabold text-xs">
                    ₹{vehicle.pricePerDay}/day
                  </div>
                </div>

                <div className="p-5 text-left flex flex-col flex-grow justify-between">
                  <div className="flex flex-col gap-1.5 mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{vehicle.brand}</span>
                    <h3 className="text-base font-black text-slate-800 tracking-tight leading-none">{vehicle.name}</h3>
                    <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{vehicle.location}</span>
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex flex-col gap-3.5">
                    {/* Toggle Switch Availability */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Booking Status</span>
                      <button
                        onClick={() => toggleAvailability(vehicle._id, vehicle.availability)}
                        className={`
                          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                          ${vehicle.availability ? 'bg-primary' : 'bg-slate-200'}
                        `}
                      >
                        <span
                          className={`
                            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
                            ${vehicle.availability ? 'translate-x-5' : 'translate-x-0'}
                          `}
                        />
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(vehicle)} className="flex-1">
                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(vehicle._id)} className="flex-1 hover:border-red-200 hover:bg-red-50 text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center gap-4">
            <span className="text-4xl">🛵</span>
            <h3 className="text-base font-black text-slate-800">No vehicles listed</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              You haven't listed any vehicles yet. List your scooter, bike, or car to start receiving bookings!
            </p>
            <Button variant="primary" size="sm" onClick={handleOpenAdd}>
              List New Vehicle
            </Button>
          </div>
        )}
      </div>

      {/* Add / Edit Listing Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={isEditMode ? 'Edit Vehicle Info' : 'List New Vehicle'}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={uploading} className="font-bold">
              {uploading ? 'Processing...' : isEditMode ? 'Save Changes' : 'Submit Listing'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <Input label="Vehicle Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Model Y" />
          <Input label="Brand" required value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Tesla" />
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Vehicle Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-primary bg-white cursor-pointer"
            >
              <option value="car">🚗 Car</option>
              <option value="bike">🚲 Bicycle</option>
              <option value="scooter">🛵 Scooter</option>
            </select>
          </div>

          <Input label="Price Per Day (₹)" type="number" required value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} />
          <Input label="Location" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Srinagar Garhwal, Uttarakhand" />
          
          {/* File upload inputs */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Vehicle Picture</label>
            <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-lg p-2 transition-all">
              <Upload className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-primary/10 file:text-primary file:cursor-pointer" 
              />
            </div>
          </div>

          {/* Specs */}
          <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Vehicle Specifications</h4>
          </div>
          
          <Input label="Transmission" required value={transmission} onChange={(e) => setTransmission(e.target.value)} placeholder="e.g. 6-speed manual, auto" />
          <Input label="Fuel / Power Source" required value={fuel} onChange={(e) => setFuel(e.target.value)} placeholder="e.g. electric, gas" />
          <Input label="Seating Capacity" type="number" required value={seats} onChange={(e) => setSeats(e.target.value)} />
          <Input label="Estimated Range" required value={range} onChange={(e) => setRange(e.target.value)} placeholder="e.g. 300 miles, unlimited" />

          <div className="col-span-2 flex flex-col gap-1.5 mt-2">
            <label className="text-xs font-bold text-slate-700">Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of features, cleanliness, and charger options..."
              className="w-full text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none focus:border-primary p-3 h-20 bg-white text-slate-800 focus:ring-1 focus:ring-primary"
            />
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default ManageVehicles;
