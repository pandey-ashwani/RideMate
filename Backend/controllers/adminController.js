import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';

// @desc    List all users
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req, res, next) => {
  try {
    const query = { role: { $in: ['customer', 'owner'] } };

    if (req.query.role) {
      query.role = req.query.role;
    }

    if (req.query.keyword) {
      query.$or = [
        { name: { $regex: req.query.keyword, $options: 'i' } },
        { email: { $regex: req.query.keyword, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle block user account status
// @route   PUT /api/admin/users/:id/block
// @access  Private (Admin)
export const toggleUserBlock = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role === 'admin') {
      res.status(400);
      throw new Error('Cannot block/unblock an administrator account');
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      message: `User ${user.name} has been ${user.isBlocked ? 'blocked' : 'unblocked'}`,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List pending host verifications
// @route   GET /api/admin/pending-hosts
// @access  Private (Admin)
export const getPendingHosts = async (req, res, next) => {
  try {
    const unverifiedHosts = await User.find({ role: 'owner', isVerified: false })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(unverifiedHosts);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify host account
// @route   PUT /api/admin/hosts/:id/verify
// @access  Private (Admin)
export const verifyHost = async (req, res, next) => {
  try {
    const host = await User.findById(req.params.id);

    if (!host || host.role !== 'owner') {
      res.status(404);
      throw new Error('Owner profile not found');
    }

    host.isVerified = true;
    await host.save();

    // Auto-approve all pre-existing listings of this host now that they are verified
    await Vehicle.updateMany({ ownerId: host._id }, { status: 'approved' });

    res.json({ message: `Owner ${host.name} verified successfully. Listed vehicles are approved`, host });
  } catch (error) {
    next(error);
  }
};

// @desc    Audit all bookings
// @route   GET /api/admin/bookings
// @access  Private (Admin)
export const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({})
      .populate('vehicleId', 'name brand type image pricePerDay location')
      .populate('customerId', 'name email avatar')
      .populate('ownerId', 'name company email')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard metrics & stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getDashboardStats = async (req, res, next) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const pendingHosts = await User.countDocuments({ role: 'owner', isVerified: false });
    const totalVehicles = await Vehicle.countDocuments({});
    
    // Payments statistics calculations
    const payments = await Payment.find({});
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalCommission = payments.reduce((sum, p) => sum + p.commission, 0);
    const totalPayouts = payments.reduce((sum, p) => sum + p.netPayout, 0);

    const commissionRate = Number(req.app.get('commissionRate')) || 10;

    // Get recent transaction records
    const recentPayments = await Payment.find({})
      .populate('customerId', 'name email')
      .populate('ownerId', 'name company')
      .limit(5)
      .sort({ createdAt: -1 });

    res.json({
      metrics: {
        totalCustomers,
        totalOwners,
        pendingHosts,
        totalVehicles,
        totalRevenue,
        totalCommission,
        totalPayouts,
        commissionRate
      },
      recentTransactions: recentPayments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Configure commission rate settings
// @route   PUT /api/admin/payments/commission
// @access  Private (Admin)
export const updateCommissionConfig = async (req, res, next) => {
  const { rate } = req.body;

  try {
    if (rate === undefined || rate < 0 || rate > 50) {
      res.status(400);
      throw new Error('Invalid commission rate. Must be between 0% and 50%');
    }

    req.app.set('commissionRate', Number(rate));
    res.json({
      message: `Commission rate successfully configured to ${rate}%`,
      rate: Number(rate)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all listings (approved + pending)
// @route   GET /api/admin/listings
// @access  Private (Admin)
export const getAllListings = async (req, res, next) => {
  try {
    const listings = await Vehicle.find({}).sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    next(error);
  }
};

// @desc    Approve vehicle listing
// @route   PUT /api/admin/listings/:id/approve
// @access  Private (Admin)
export const approveListing = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle listing not found');
    }

    vehicle.status = 'approved';
    await vehicle.save();

    res.json({ message: 'Listing approved successfully', vehicle });
  } catch (error) {
    next(error);
  }
};
