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
  
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91') && /^[6-9]/.test(cleaned.substring(2))) {
    return `+${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('0') && /^[6-9]/.test(cleaned.substring(1))) {
    return `+91${cleaned.substring(1)}`;
  }
  return null;
};

// @desc    Register a new user & trigger OTP
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  const {
    name,
    email,
    password,
    role,
    company,
    phone,
    avatar
  } = req.body;

  try {
    const normalizedEmail = (email || '').toLowerCase().trim();

    // ============================================================
    // BASIC VALIDATION
    // ============================================================

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      res.status(400);
      throw new Error('Valid email address is required');
    }

    if (!password || password.length < 6) {
      res.status(400);
      throw new Error(
        'Password must be at least 6 characters long'
      );
    }

    // Admin registration is disabled
    if (role === 'admin') {
      res.status(400);
      throw new Error(
        'Public registration as Admin is disabled'
      );
    }

    const finalRole =
      role === 'owner' ? 'owner' : 'customer';

    // ============================================================
    // NORMALIZE PHONE
    // ============================================================

    let normalizedPhone = null;

    if (phone) {
      normalizedPhone = normalizeIndianPhone(phone);

      if (!normalizedPhone) {
        res.status(400);
        throw new Error(
          'Invalid Indian mobile number. Please enter a valid 10-digit mobile number.'
        );
      }
    }

    // Owner requirements
    if (
      finalRole === 'owner' &&
      (!company || !normalizedPhone)
    ) {
      res.status(400);
      throw new Error(
        'Company name and valid mobile number are required for owner profiles'
      );
    }

    // ============================================================
    // CHECK EXISTING EMAIL ACCOUNT
    // ============================================================

    let user = await User.findOne({
      email: normalizedEmail
    });

    // ============================================================
    // EXISTING VERIFIED ACCOUNT
    // ============================================================

    if (user && user.emailVerified) {
      res.status(400);
      throw new Error(
        'User account already exists with this email address'
      );
    }

    // ============================================================
    // CHECK PHONE
    // ============================================================

    if (normalizedPhone) {
      const phoneExists = await User.findOne({
        phone: normalizedPhone,
        ...(user
          ? { _id: { $ne: user._id } }
          : {})
      });

      if (phoneExists) {
        res.status(400);
        throw new Error(
          'A user account is already registered with this mobile number'
        );
      }
    }

    // ============================================================
    // EXISTING UNVERIFIED ACCOUNT
    // ============================================================

    if (user && !user.emailVerified) {

      // Update the existing unverified account
      user.name = name;
      user.password = password;
      user.role = finalRole;
      user.company = company;
      user.phone = normalizedPhone || undefined;
      user.avatar = avatar || undefined;

      // Keep account unverified
      user.emailVerified = false;
      user.phoneVerified = false;

      // Preserve your existing owner/customer verification logic
      user.isVerified = finalRole !== 'owner';

      user.verificationStatus =
        finalRole === 'owner'
          ? 'pending'
          : 'approved';

      await user.save();

    } else {

      // ==========================================================
      // BRAND NEW ACCOUNT
      // ==========================================================

      user = await User.create({
        name,
        email: normalizedEmail,
        password,
        role: finalRole,
        company,
        phone: normalizedPhone || undefined,
        avatar: avatar || undefined,

        phoneVerified: false,
        emailVerified: false,

        isVerified: finalRole !== 'owner',

        verificationStatus:
          finalRole === 'owner'
            ? 'pending'
            : 'approved'
      });
    }

    // ============================================================
    // GENERATE NEW OTP
    // ============================================================

    const rawOtp = crypto
      .randomInt(100000, 999999)
      .toString();

    const salt = await bcrypt.genSalt(10);

    const otpHash = await bcrypt.hash(
      rawOtp,
      salt
    );

    // ============================================================
    // INVALIDATE PREVIOUS OTPs
    // ============================================================

    await OTPVerification.updateMany(
      {
        email: normalizedEmail,
        used: false
      },
      {
        used: true
      }
    );

    // ============================================================
    // CREATE NEW OTP RECORD
    // ============================================================

    await OTPVerification.create({
      user: user._id,
      email: normalizedEmail,
      identifier: normalizedEmail,
      type: 'email',
      otpHash,

      expiresAt: new Date(
        Date.now() + 10 * 60 * 1000
      ),

      attempts: 0,
      lastSentAt: new Date(),
      resendCount: 0,

      purpose: 'verification',

      used: false
    });

    // ============================================================
    // EMAIL CONTENT
    // ============================================================

    const subject =
      'Your RideMate Verification Code';

    const text = `Hello ${user.name},

Welcome to RideMate!

Your 6-digit verification code is: ${rawOtp}

This code expires in 10 minutes.
Do not share this code with anyone.

RideMate Team`;

    const html = `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 480px;
        margin: 0 auto;
        padding: 24px;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background-color: #ffffff;
      ">

        <h2 style="
          color: #0284c7;
          text-align: center;
          margin-top: 0;
        ">
          RideMate Verification Code
        </h2>

        <p style="color: #334155;">
          Hello ${user.name},
        </p>

        <p style="color: #334155;">
          Welcome to RideMate! Your 6-digit email
          verification code is:
        </p>

        <div style="
          background-color: #f1f5f9;
          padding: 16px;
          text-align: center;
          border-radius: 8px;
          font-size: 32px;
          font-weight: 800;
          letter-spacing: 8px;
          color: #0f172a;
          margin: 20px 0;
        ">
          ${rawOtp}
        </div>

        <p style="
          color: #64748b;
          font-size: 13px;
        ">
          This code expires in
          <strong>10 minutes</strong>.
          Do not share this code with anyone.
        </p>

        <hr style="
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 20px 0;
        " />

        <p style="
          font-size: 11px;
          color: #94a3b8;
          text-align: center;
        ">
          RideMate Ecosystem • Vehicle Rentals Simplified
        </p>

      </div>
    `;

    // ============================================================
    // SEND OTP
    // ============================================================

    setImmediate(async () => {
      try {

        if (user.phone) {
          await sendSMS(
            user.phone,
            `RideMate OTP: Your verification code is ${rawOtp}. Valid for 10 minutes.`
          );
        }

        await sendEmail({
          to: user.email,
          subject,
          text,
          html
        });

      } catch (error) {
        console.error(
          'OTP delivery error:',
          error
        );
      }
    });

    // ============================================================
    // DEVELOPMENT OTP
    // ============================================================

    const isDev =
      process.env.NODE_ENV !== 'production';

    // ============================================================
    // RESPONSE
    // ============================================================

    return res.status(201).json({
      success: true,

      message:
        'Verification code sent successfully',

      _id: user._id,

      name: user.name,

      email: user.email,

      role: user.role,

      phone: user.phone,

      phoneVerified:
        user.phoneVerified,

      emailVerified:
        user.emailVerified,

      isVerified:
        user.isVerified,

      verificationStatus:
        user.verificationStatus,

      requiresOtp: true,

      // Development only
      devOtp: isDev
        ? rawOtp
        : undefined

      // IMPORTANT:
      // No JWT token here.
    });

  } catch (error) {
  // MongoDB duplicate key error
  if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || {})[0];

    if (duplicateField === 'email') {
      return res.status(400).json({
        success: false,
        message:
          'Email already exists. Please use a different email or log in.'
      });
    }

    if (duplicateField === 'phone') {
      return res.status(400).json({
        success: false,
        message:
          'Mobile number already exists. Please use a different number.'
      });
    }

    return res.status(400).json({
      success: false,
      message:
        'An account with these details already exists.'
    });
  }

  next(error);
}
};

// @desc    Send Email OTP Verification Code
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOTP = async (req, res, next) => {
  const { email, purpose = 'verification' } = req.body;

  try {
    if (!email || !email.includes('@')) {
      res.status(400);
      throw new Error('Please enter a valid email address');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Enforce 60-second resend cooldown
    const existingOTP = await OTPVerification.findOne({
      email: normalizedEmail,
      used: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (existingOTP && existingOTP.lastSentAt) {
      const timeElapsed = (Date.now() - new Date(existingOTP.lastSentAt).getTime()) / 1000;
      if (timeElapsed < 60) {
        const remainingSeconds = Math.ceil(60 - timeElapsed);
        res.status(429);
        throw new Error(`Please wait ${remainingSeconds} seconds before requesting a new verification code.`);
      }
    }

    // Generate 6-digit cryptographic OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    // Invalidate old unverified OTPs for this email
    await OTPVerification.updateMany(
      { email: normalizedEmail, used: false },
      { used: true }
    );

    const existingUser = await User.findOne({ email: normalizedEmail });

    // Store in MongoDB with 10-minute expiration
    await OTPVerification.create({
      user: existingUser ? existingUser._id : undefined,
      email: normalizedEmail,
      identifier: normalizedEmail,
      type: 'email',
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      attempts: 0,
      lastSentAt: new Date(),
      resendCount: existingOTP ? (existingOTP.resendCount || 0) + 1 : 0,
      purpose,
      used: false
    });

    const subject = 'Your RideMate Verification Code';
    const text = `Hello,\n\nYour RideMate verification code is: ${rawOtp}\n\nThis code expires in 10 minutes.\nDo not share this code with anyone.\n\nRideMate Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0284c7; text-align: center; margin-top: 0;">RideMate Verification Code</h2>
        <p style="color: #334155;">Hello,</p>
        <p style="color: #334155;">Your 6-digit email verification code is:</p>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a; margin: 20px 0;">
          ${rawOtp}
        </div>
        <p style="color: #64748b; font-size: 13px;">This code expires in <strong>10 minutes</strong>. Do not share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">RideMate Ecosystem • Vehicle Rentals Simplified</p>
      </div>
    `;

    setImmediate(async () => {
      await sendEmail({ to: normalizedEmail, subject, text, html });
    });

    res.json({
      success: true,
      message: 'Verification code sent successfully',
      otp: rawOtp,
      devOtp: rawOtp
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 6-digit Email OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res, next) => {
  const { email, phone, identifier, otp, userId } = req.body;
  const rawEmail = (email || identifier || '').trim().toLowerCase();
  const rawOtp = (otp || '').trim();

  try {
    if (!rawOtp) {
      res.status(400);
      throw new Error('Please enter the 6-digit verification code');
    }

    let otpRecord = null;

    if (rawEmail) {
      otpRecord = await OTPVerification.findOne({
        email: rawEmail,
        used: false,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });
    } else if (userId || phone) {
      const searchPhone = phone ? normalizeIndianPhone(phone) : null;
      otpRecord = await OTPVerification.findOne({
        $or: [
          ...(userId ? [{ user: userId }] : []),
          ...(searchPhone ? [{ identifier: searchPhone }] : [])
        ],
        used: false,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });
    }

    if (!otpRecord) {
      res.status(400);
      throw new Error('Invalid or expired verification code. Please request a new code.');
    }

    // Maximum 5 incorrect attempts limit
    if (otpRecord.attempts >= 5) {
      otpRecord.used = true;
      await otpRecord.save();
      res.status(400);
      throw new Error('Too many failed attempts. This verification code is no longer valid. Please request a new code.');
    }

    const isMatch = await bcrypt.compare(rawOtp, otpRecord.otpHash);

    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;

      if (remaining <= 0) {
        otpRecord.used = true;
        await otpRecord.save();
        res.status(400);
        throw new Error('Maximum failed attempts reached. Please request a new verification code.');
      }

      res.status(400);
      throw new Error(`Invalid verification code. ${remaining} attempts remaining.`);
    }

    // Mark OTP as used to prevent reuse
    otpRecord.used = true;
    await otpRecord.save();

    const targetEmail = rawEmail || otpRecord.email;
    let user = await User.findOne({
      $or: [
        ...(targetEmail ? [{ email: targetEmail }] : []),
        ...(otpRecord.user ? [{ _id: otpRecord.user }] : [])
      ]
    });

    if (user) {
      user.emailVerified = true;
      user.phoneVerified = true;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        token: generateToken(user._id),
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          emailVerified: true,
          phoneVerified: true,
          isVerified: user.isVerified,
          verificationStatus: user.verificationStatus || (user.isVerified ? 'approved' : 'pending')
        }
      });
    } else {
      return res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        email: targetEmail
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP code with rate limiting & 60s cooldown
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res, next) => {
  const { email, phone, identifier } = req.body;
  const targetEmail = (email || identifier || '').trim().toLowerCase();

  try {
    if (!targetEmail || !targetEmail.includes('@')) {
      res.status(400);
      throw new Error('Valid email address is required');
    }

    // Check 60-second cooldown
    const lastOTP = await OTPVerification.findOne({
      email: targetEmail,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (lastOTP && lastOTP.lastSentAt) {
      const timeElapsed = (Date.now() - new Date(lastOTP.lastSentAt).getTime()) / 1000;
      if (timeElapsed < 60) {
        const remainingSeconds = Math.ceil(60 - timeElapsed);
        res.status(429);
        throw new Error(`Please wait ${remainingSeconds} seconds before requesting a new code.`);
      }
    }

    // Invalidate old OTPs
    await OTPVerification.updateMany(
      { email: targetEmail, used: false },
      { used: true }
    );

    // Generate new OTP & hash
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    const existingUser = await User.findOne({ email: targetEmail });

    await OTPVerification.create({
      user: existingUser ? existingUser._id : undefined,
      email: targetEmail,
      identifier: targetEmail,
      type: 'email',
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      attempts: 0,
      lastSentAt: new Date(),
      resendCount: lastOTP ? (lastOTP.resendCount || 0) + 1 : 0,
      purpose: 'verification',
      used: false
    });

    const subject = 'Your RideMate Verification Code';
    const text = `Hello,\n\nYour new RideMate verification code is: ${rawOtp}\n\nThis code expires in 10 minutes.\nDo not share this code with anyone.\n\nRideMate Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0284c7; text-align: center; margin-top: 0;">RideMate Verification Code</h2>
        <p style="color: #334155;">Hello,</p>
        <p style="color: #334155;">Your new 6-digit email verification code is:</p>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a; margin: 20px 0;">
          ${rawOtp}
        </div>
        <p style="color: #64748b; font-size: 13px;">This code expires in <strong>10 minutes</strong>. Do not share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">RideMate Ecosystem • Vehicle Rentals Simplified</p>
      </div>
    `;

    setImmediate(async () => {
      await sendEmail({ to: targetEmail, subject, text, html });
    });

    res.json({
      success: true,
      message: 'Verification code resent successfully',
      otp: rawOtp,
      devOtp: rawOtp
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
    const user = await User.findOne({ email: (email || '').toLowerCase().trim() });

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const isMatch = await user.matchPassword(password);

    if (isMatch) {
      if (user.isBlocked) {
        res.status(403);
        throw new Error('Your account is blocked. Contact administrator');
      }

      // Restrict Admin Login ONLY to Website / Web Admin Portal
      const clientPlatform = req.headers['x-client-platform'] || (req.body.isMobile ? 'mobile' : '');
      if (user.role === 'admin' && clientPlatform === 'mobile') {
        res.status(403);
        throw new Error('Administrator access is restricted to the Web Admin Portal. Please log in on the website.');
      }

      // Auto-verify contact status on password match so user can log in seamlessly
      if (!user.emailVerified && !user.phoneVerified) {
        user.emailVerified = true;
        user.phoneVerified = true;
        await user.save();
      }

      res.json({
        _id: user._id,
        id: user._id,
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
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        isVerified: user.isVerified,
        verificationStatus:
          user.verificationStatus ||
          (user.isVerified ? 'approved' : 'pending'),
        rejectionReason: user.rejectionReason || '',
        verificationDoc: user.verificationDoc || '',
        drivingLicense: user.drivingLicense || '',
        licenseDoc: user.licenseDoc || '',
        company: user.company,
        avatar: user.avatar
      });
    } else {
      res.status(404);
      throw new Error('User not found');
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
        id: updatedUser._id,
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

// @desc    Initiate Forgot Password (Send 6-digit Email OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    console.log('[FORGOT PASSWORD] 1 - Controller started');

    const { email } = req.body || {};
    console.log('[FORGOT PASSWORD] 2 - Email received:', email);

    if (!email || !email.includes('@')) {
      console.log('[FORGOT PASSWORD] Validation error: invalid email');
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('[FORGOT PASSWORD] 3 - Searching user for email:', normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail });
    console.log('[FORGOT PASSWORD] 4 - User search completed. Found user:', user ? user._id : 'null');

    if (!user) {
      console.log('[FORGOT PASSWORD] User not found, returning 404');
      return res.status(404).json({
        success: false,
        message: 'No user account found with this email address'
      });
    }

    console.log('[FORGOT PASSWORD] 5 - Generating OTP');
    // Generate secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);
    console.log('[FORGOT PASSWORD] 6 - OTP generated successfully');

    console.log('[FORGOT PASSWORD] 7 - Saving OTP');
    // Invalidate old password reset OTPs for this email
    await OTPVerification.updateMany(
      { email: normalizedEmail, purpose: 'forgot_password', used: false },
      { used: true }
    );

    // Create OTP record with 10-minute expiration
    const createdOtp = await OTPVerification.create({
      user: user._id,
      email: normalizedEmail,
      identifier: normalizedEmail,
      type: 'email',
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      lastSentAt: new Date(),
      resendCount: 0,
      purpose: 'forgot_password',
      used: false
    });
    console.log('[FORGOT PASSWORD] 8 - OTP saved to MongoDB with id:', createdOtp._id);

    console.log('[FORGOT PASSWORD] 9 - Sending HTTP response');
    return res.status(200).json({
      success: true,
      message: 'Password reset OTP generated',
      developmentOtp: rawOtp,
      devOtp: rawOtp,
      otp: rawOtp
    });
  } catch (error) {
    console.error('[FORGOT PASSWORD] ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// @desc    Verify Password Reset 6-digit OTP
// @route   POST /api/auth/verify-reset-otp
// @access  Public
export const verifyResetOtp = async (req, res) => {
  try {
    console.log('[VERIFY RESET OTP] Controller started');
    const { email, otp } = req.body || {};
    console.log('[VERIFY RESET OTP] Email received:', email, 'OTP received:', otp);

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and 6-digit verification code are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const rawOtp = otp.toString().trim();

    const otpRecord = await OTPVerification.findOne({
      email: normalizedEmail,
      purpose: 'forgot_password',
      used: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      console.log('[VERIFY RESET OTP] No valid active OTP record found');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset code. Please request a new code.'
      });
    }

    if (otpRecord.attempts >= 5) {
      otpRecord.used = true;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new password reset code.'
      });
    }

    const isMatch = await bcrypt.compare(rawOtp, otpRecord.otpHash);

    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = Math.max(0, 5 - otpRecord.attempts);

      if (remaining <= 0) {
        otpRecord.used = true;
        await otpRecord.save();
        return res.status(400).json({
          success: false,
          message: 'Maximum failed attempts reached. Please request a new password reset code.'
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${remaining} attempts remaining.`
      });
    }

    console.log('[VERIFY RESET OTP] OTP confirmed successfully');
    return res.status(200).json({
      success: true,
      message: 'Verification code confirmed. Please set your new password.'
    });
  } catch (error) {
    console.error('[VERIFY RESET OTP] ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error verifying reset code'
    });
  }
};

// @desc    Reset Password using 6-digit Email OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    console.log('[RESET PASSWORD] Controller started');
    const { email, otp, newPassword } = req.body || {};

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, 6-digit verification code, and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const rawOtp = otp.toString().trim();

    const otpRecord = await OTPVerification.findOne({
      email: normalizedEmail,
      purpose: 'forgot_password',
      used: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset code. Please request a new code.'
      });
    }

    const isMatch = await bcrypt.compare(rawOtp, otpRecord.otpHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code.'
      });
    }

    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();

    // Find and update user password
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    // Mongoose pre('save') will hash the new password with bcrypt
    user.password = newPassword;
    await user.save();
    console.log('[RESET PASSWORD] Password reset and saved in DB for user:', user._id);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('[RESET PASSWORD] ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error resetting password'
    });
  }
};

