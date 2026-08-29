import Vehicle from '../models/Vehicle.js';
import Review from '../models/Review.js';
import User from '../models/User.js';

// @desc    Get all vehicles (Search, filter, paginate)
// @route   GET /api/vehicles
// @access  Public
export const getVehicles = async (req, res, next) => {
  try {
    const pageSize = Number(req.query.pageSize) || 100;
    const page = Number(req.query.page) || 1;

    // Filters
    const query = {};
    if (req.query.ownerId) {
      query.ownerId = req.query.ownerId;
    }

    // Only exclude explicitly rejected vehicles
    query.status = { $ne: 'rejected' };

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
      .populate('ownerId', 'name company email phone isVerified verificationStatus')
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
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('ownerId', 'name company email phone isVerified verificationStatus');

    if (vehicle) {
      res.json(vehicle);
    } else {
      res.status(404);
      throw new Error('Vehicle not found');
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
      status: 'approved'
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
      if (availability !== undefined) vehicle.availability = availability;

      const updatedVehicle = await vehicle.save();
      res.json(updatedVehicle);
    } else {
      res.status(404);
      throw new Error('Vehicle listing not found');
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
      if (vehicle.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to delete this vehicle listing');
      }

      await vehicle.deleteOne();
      res.json({ message: 'Vehicle listing removed successfully' });
    } else {
      res.status(404);
      throw new Error('Vehicle listing not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create new review for a vehicle
// @route   POST /api/vehicles/:id/reviews
// @access  Private
export const createVehicleReview = async (req, res, next) => {
  const { rating, comment } = req.body;

  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (vehicle) {
      const alreadyReviewed = await Review.findOne({
        vehicleId: req.params.id,
        userId: req.user._id
      });

      if (alreadyReviewed) {
        res.status(400);
        throw new Error('You have already reviewed this vehicle');
      }

      const review = new Review({
        vehicleId: req.params.id,
        userId: req.user._id,
        userName: req.user.name,
        rating: Number(rating),
        comment
      });

      await review.save();

      // Recalculate average rating & review count
      const reviews = await Review.find({ vehicleId: req.params.id });
      vehicle.numReviews = reviews.length;
      vehicle.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

      await vehicle.save();
      res.status(201).json({ message: 'Review added successfully' });
    } else {
      res.status(404);
      throw new Error('Vehicle not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a vehicle
// @route   GET /api/vehicles/:id/reviews
// @access  Public
export const getVehicleReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ vehicleId: req.params.id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};
