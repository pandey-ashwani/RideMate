import Vehicle from '../models/Vehicle.js';
import Review from '../models/Review.js';
import User from '../models/User.js';

// @desc    Get all vehicles (Search, filter, paginate)
// @route   GET /api/vehicles
// @access  Public
export const getVehicles = async (req, res, next) => {
  try {
    const pageSize = Number(req.query.pageSize) || 6;
    const page = Number(req.query.page) || 1;

    // Filters
    const query = {};
    if (req.query.ownerId) {
      query.ownerId = req.query.ownerId;
    } else {
      query.status = 'approved'; // Public catalog shows approved vehicles only
    }

    // Keyword Search (brand, name, location)
    if (req.query.keyword) {
      query.$or = [
        { name: { $regex: req.query.keyword, $options: 'i' } },
        { brand: { $regex: req.query.keyword, $options: 'i' } },
        { location: { $regex: req.query.keyword, $options: 'i' } }
      ];
    }

    // Category type filter
    if (req.query.type && req.query.type !== 'all') {
      query.type = req.query.type;
    }

    // Brand filter
    if (req.query.brand && req.query.brand !== 'all') {
      query.brand = req.query.brand;
    }

    // Max Price per day
    if (req.query.maxPrice) {
      query.pricePerDay = { $lte: Number(req.query.maxPrice) };
    }

    // Availability status
    if (req.query.onlyAvailable === 'true') {
      query.availability = true;
    }

    const count = await Vehicle.countDocuments(query);
    const vehicles = await Vehicle.find(query)
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    res.json({
      vehicles,
      page,
      pages: Math.ceil(count / pageSize),
      totalVehicles: count
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Public
export const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.query.id || req.params.id)
      .populate('ownerId', 'name company email avatar phone joinedDate');

    if (vehicle) {
      // Get associated reviews
      const reviews = await Review.find({ vehicleId: vehicle._id }).sort({ createdAt: -1 });
      res.json({ vehicle, reviews });
    } else {
      res.status(404);
      throw new Error('Vehicle listing not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a vehicle listing
// @route   POST /api/vehicles
// @access  Private (Owner/Admin)
export const createVehicle = async (req, res, next) => {
  const { name, brand, type, pricePerDay, image, specs, location, description } = req.body;

  try {
    // If user is owner, check if verified
    const owner = await User.findById(req.user._id);
    const isApproved = owner.role === 'admin' || owner.isVerified;

    const vehicle = new Vehicle({
      name,
      brand,
      type,
      pricePerDay: Number(pricePerDay),
      image: image || '/uploads/default-vehicle.png',
      specs: specs || { transmission: 'Automatic', fuel: 'Electric', seats: 4, range: '250 miles' },
      ownerId: req.user._id,
      location,
      description,
      status: isApproved ? 'approved' : 'pending' // Pending validation if owner unverified
    });

    const createdVehicle = await vehicle.save();
    res.status(201).json(createdVehicle);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a vehicle listing
// @route   PUT /api/vehicles/:id
// @access  Private (Owner/Admin)
export const updateVehicle = async (req, res, next) => {
  const { name, brand, type, pricePerDay, image, specs, location, description, availability } = req.body;

  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (vehicle) {
      // Security: Only Listing Owner or Admin can update
      if (vehicle.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to edit this vehicle listing');
      }

      vehicle.name = name || vehicle.name;
      vehicle.brand = brand || vehicle.brand;
      vehicle.type = type || vehicle.type;
      vehicle.pricePerDay = pricePerDay !== undefined ? Number(pricePerDay) : vehicle.pricePerDay;
      vehicle.image = image || vehicle.image;
      vehicle.specs = specs || vehicle.specs;
      vehicle.location = location || vehicle.location;
      vehicle.description = description || vehicle.description;
      vehicle.availability = availability !== undefined ? availability : vehicle.availability;

      const updatedVehicle = await vehicle.save();
      res.json(updatedVehicle);
    } else {
      res.status(404);
      throw new Error('Vehicle not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a vehicle listing
// @route   DELETE /api/vehicles/:id
// @access  Private (Owner/Admin)
export const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (vehicle) {
      // Security: Only Listing Owner or Admin can delete
      if (vehicle.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to delete this vehicle listing');
      }

      await Vehicle.deleteOne({ _id: vehicle._id });
      res.json({ message: 'Vehicle listing removed successfully' });
    } else {
      res.status(404);
      throw new Error('Vehicle not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a vehicle review
// @route   POST /api/vehicles/:id/reviews
// @access  Private (Customer)
export const createVehicleReview = async (req, res, next) => {
  const { rating, text } = req.body;

  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (vehicle) {
      // Check if user already reviewed
      const alreadyReviewed = await Review.findOne({
        vehicleId: vehicle._id,
        customerId: req.user._id
      });

      if (alreadyReviewed) {
        res.status(400);
        throw new Error('Vehicle already reviewed by this user');
      }

      const review = new Review({
        vehicleId: vehicle._id,
        customerId: req.user._id,
        customerName: req.user.name,
        rating: Number(rating),
        text
      });

      await review.save();

      // Recalculate average rating
      const reviews = await Review.find({ vehicleId: vehicle._id });
      vehicle.reviewCount = reviews.length;
      const totalScore = reviews.reduce((sum, r) => sum + r.rating, 0);
      vehicle.rating = Number((totalScore / reviews.length).toFixed(1));

      await vehicle.save();
      res.status(201).json({ message: 'Review added successfully', review });
    } else {
      res.status(404);
      throw new Error('Vehicle not found');
    }
  } catch (error) {
    next(error);
  }
};
