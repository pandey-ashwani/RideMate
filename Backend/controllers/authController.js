import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import OTPVerification from '../models/OTPVerification.js';
import generateToken from '../utils/generateToken.js';
import sendSMS from '../services/smsService.js';
import sendEmail from '../services/emailService.js';

// Indian Mobile Number Validator & E.164 Normalizer
export const normalizeIndianPhone = (phoneInput) => {
  if (!phoneInput) return null;
  const cleaned = phoneInput.toString().replace(/\D/g, '');
  
  // 10 digits starting with 6, 7, 8, or 9
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  
  // 12 digits starting with 91 followed by 6-9
  if (cleaned.length === 12 && cleaned.startsWith('91') && /^[6-9]/.test(cleaned.substring(2))) {
    return `+${cleaned}`;
  }

  // 11 digits starting with 0 followed by 6-9
  if (cleaned.length === 11 && cleaned.startsWith('0') && /^[6-9]/.test(cleaned.substring(1))) {
    return `+91${cleaned.substring(1)}`;
  }

  return null;
};

// @desc    Register a new user & trigger OTP
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  const { name, email, password, role, company, phone, avatar } = req.body;

  try {
    const userExists = await User.findOne({ email: email.toLowerCase() });

    if (userExists) {
      res.status(400);
      throw new Error('User account already exists with this email address');
    }

    if (role === 'admin') {
      res.status(400);
      throw new Error('Public registration as Admin is disabled');
    }

    const finalRole = role === 'owner' ? 'owner' : 'customer';

    // Normalize phone number
    let normalizedPhone = null;
    if (phone) {
      normalizedPhone = normalizeIndianPhone(phone);
      if (!normalizedPhone) {
        res.status(400);
        throw new Error('Invalid Indian mobile number. Please enter a valid 10-digit mobile number.');
      }

      // Check if phone already registered
      const phoneExists = await User.findOne({ phone: normalizedPhone });
      if (phoneExists) {
        res.status(400);
        throw new Error('A user account is already registered with this mobile number');
      }
    }

    if (finalRole === 'owner' && (!company || !normalizedPhone)) {
      res.status(400);
      throw new Error('Company name and valid mobile number are required for owner profiles');
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: finalRole,
      company,
      phone: normalizedPhone || undefined,
      avatar: avatar || undefined,
      phoneVerified: false,
      emailVerified: false,
      isVerified: finalRole !== 'owner',
      verificationStatus: finalRole === 'owner' ? 'pending' : 'approved'
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid user data provided');
    }

    // Generate 6-digit cryptographic OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    // Create OTP record with 5-minute TTL
    await OTPVerification.deleteMany({ user: user._id }); // Clear stale OTPs
    await OTPVerification.create({
      user: user._id,
      identifier: user.email,
      type: 'email',
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      attempts: 0,
      lastSentAt: new Date(),
      resendCount: 0
    });

    // Post-response / Safe async OTP dispatch
    setImmediate(async () => {
      if (user.phone) {
        await sendSMS(user.phone, `RideMate OTP: Your verification code is ${rawOtp}. Valid for 5 minutes.`);
      }
      await sendEmail({
        to: user.email,
        subject: 'RideMate Account Verification OTP',
        text: `Welcome to RideMate! Your 6-digit verification OTP code is: ${rawOtp}. It is valid for 5 minutes.`
      });
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus,
      requiresOtp: true,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 6-digit OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      res.status(400);
      throw new Error('Email address and 6-digit OTP are required');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404);
      throw new Error('User account not found');
    }

    const otpRecord = await OTPVerification.findOne({ user: user._id });
    if (!otpRecord) {
      res.status(400);
      throw new Error('OTP has expired or is invalid. Please request a new OTP.');
    }

    // Check 5-minute expiration
    if (new Date() > otpRecord.expiresAt) {
      await OTPVerification.deleteOne({ _id: otpRecord._id });
      res.status(400);
      throw new Error('OTP code has expired. Please request a new OTP.');
    }

    // Check failed attempt limit (Max 5)
    if (otpRecord.attempts >= 5) {
      await OTPVerification.deleteOne({ _id: otpRecord._id });
      res.status(400);
      throw new Error('Maximum OTP verification attempts exceeded. Please request a new OTP.');
    }

    // Verify hash
    const isMatch = await bcrypt.compare(otp.toString().trim(), otpRecord.otpHash);

    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      res.status(400);
      throw new Error(`Invalid OTP code. ${5 - otpRecord.attempts} attempts remaining.`);
    }

    // OTP Verified successfully!
    await OTPVerification.deleteOne({ _id: otpRecord._id });

    user.emailVerified = true;
    user.phoneVerified = true;
    await user.save();

    res.json({
      success: true,
      message: 'Account contact details verified successfully!',
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP code with rate limiting & cooldown
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email) {
      res.status(400);
      throw new Error('Email address is required');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404);
      throw new Error('User account not found');
    }

    const now = new Date();
    const existingOtp = await OTPVerification.findOne({ user: user._id });

    if (existingOtp) {
      // 60-second resend cooldown check
      const secondsSinceLastSent = (now - new Date(existingOtp.lastSentAt)) / 1000;
      if (secondsSinceLastSent < 60) {
        res.status(429);
        throw new Error(`Please wait ${Math.ceil(60 - secondsSinceLastSent)} seconds before requesting a new OTP.`);
      }

      // Max 3 resends per hour check
      if (existingOtp.resendCount >= 3) {
        const hoursSinceLastSent = (now - new Date(existingOtp.lastSentAt)) / (1000 * 60 * 60);
        if (hoursSinceLastSent < 1) {
          res.status(429);
          throw new Error('Maximum OTP resends reached for this hour. Please try again later.');
        }
      }
    }

    // Generate new OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    // Atomic update or insert
    const newResendCount = existingOtp ? existingOtp.resendCount + 1 : 0;
    await OTPVerification.deleteMany({ user: user._id });
    await OTPVerification.create({
      user: user._id,
      identifier: user.email,
      type: 'email',
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      lastSentAt: now,
      resendCount: newResendCount
    });

    // Safe async OTP dispatch
    setImmediate(async () => {
      if (user.phone) {
        await sendSMS(user.phone, `RideMate OTP: Your new verification code is ${rawOtp}. Valid for 5 minutes.`);
      }
      await sendEmail({
        to: user.email,
        subject: 'RideMate New Verification OTP',
        text: `Your new 6-digit RideMate verification OTP code is: ${rawOtp}. It is valid for 5 minutes.`
      });
    });

    res.json({
      success: true,
      message: 'A new 6-digit OTP code has been sent to your email and phone.'
    });
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
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

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
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus || (user.isVerified ? 'approved' : 'pending'),
        rejectionReason: user.rejectionReason || '',
        verificationDoc: user.verificationDoc || '',
        drivingLicense: user.drivingLicense || '',
        licenseDoc: user.licenseDoc || '',
        company: user.company,
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
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus || (user.isVerified ? 'approved' : 'pending'),
        rejectionReason: user.rejectionReason || '',
        verificationDoc: user.verificationDoc || '',
        drivingLicense: user.drivingLicense || '',
        licenseDoc: user.licenseDoc || '',
        company: user.company,
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
      
      if (req.body.phone) {
        const norm = normalizeIndianPhone(req.body.phone);
        if (norm) user.phone = norm;
      }
      if (req.body.drivingLicense !== undefined) user.drivingLicense = req.body.drivingLicense;
      if (req.body.licenseDoc !== undefined) user.licenseDoc = req.body.licenseDoc;

      if (user.role === 'owner') {
        user.company = req.body.company || user.company;
        if (req.body.verificationDoc !== undefined) user.verificationDoc = req.body.verificationDoc;
        
        if (req.body.resubmitVerification) {
          user.verificationStatus = 'pending';
          user.isVerified = false;
          user.rejectionReason = '';
        }
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
        phone: updatedUser.phone,
        phoneVerified: updatedUser.phoneVerified,
        emailVerified: updatedUser.emailVerified,
        isVerified: updatedUser.isVerified,
        verificationStatus: updatedUser.verificationStatus || (updatedUser.isVerified ? 'approved' : 'pending'),
        rejectionReason: updatedUser.rejectionReason || '',
        verificationDoc: updatedUser.verificationDoc || '',
        drivingLicense: updatedUser.drivingLicense || '',
        licenseDoc: updatedUser.licenseDoc || '',
        company: updatedUser.company,
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
