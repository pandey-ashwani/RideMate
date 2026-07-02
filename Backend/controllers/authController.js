import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  const { name, email, password, role, company, phone } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Assign admin role if this is the first user registering
    const isFirstUser = (await User.countDocuments({})) === 0;
    const finalRole = isFirstUser ? 'admin' : role || 'customer';

    // Validation for Owner specific fields
    if (finalRole === 'owner' && (!company || !phone)) {
      res.status(400);
      throw new Error('Company name and phone number are required for owner host profiles');
    }

    const user = await User.create({
      name,
      email,
      password,
      role: finalRole,
      company,
      phone,
      // First admin and customers are auto-verified, hosts await admin verification
      isVerified: finalRole !== 'owner'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        token: generateToken(user._id)
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data provided');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res, next) => {
  const { email, password, role } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // Role check to prevent mapping mismatch
    if (role && user.role !== role) {
      res.status(403);
      throw new Error(`Email is registered under '${user.role.toUpperCase()}', not '${role.toUpperCase()}'`);
    }

    const isMatch = await user.matchPassword(password);

    if (isMatch) {
      if (user.isBlocked) {
        res.status(403);
        throw new Error('Your account is blocked. Contact administrator');
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        token: generateToken(user._id)
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        company: user.company,
        phone: user.phone,
        avatar: user.avatar,
        joinedDate: user.joinedDate
      });
    } else {
      res.status(404);
      throw new Error('User profile not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.avatar = req.body.avatar || user.avatar;
      
      if (user.role === 'owner') {
        user.company = req.body.company || user.company;
        user.phone = req.body.phone || user.phone;
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        company: updatedUser.company,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        token: generateToken(updatedUser._id)
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};
