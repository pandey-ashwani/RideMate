import mongoose from 'mongoose';
import User from '../models/User.js';

const seedAdmin = async () => {
  try {
    const adminEmail = 'admin@ridemate.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      await User.create({
        name: 'RideMate Admin',
        email: adminEmail,
        password: 'adminpassword123',
        role: 'admin',
        isVerified: true,
        verificationStatus: 'approved'
      });
      console.log('Hardcoded Admin created (admin@ridemate.com / adminpassword123)');
    }

    // Fix any non-hardcoded users who were assigned 'admin' role by previous isFirstUser logic
    const misconfiguredAdmins = await User.find({ role: 'admin', email: { $ne: adminEmail } });
    for (const u of misconfiguredAdmins) {
      u.role = 'owner';
      u.isVerified = true;
      u.verificationStatus = 'approved';
      await u.save();
      console.log(`Reassigned misconfigured admin account (${u.email}) back to 'owner' role`);
    }
  } catch (err) {
    console.error('Error seeding admin user:', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Drop stale indexes if they exist (e.g. username_1 on users collection)
    try {
      await User.collection.dropIndex('username_1');
      console.log('Successfully dropped stale username_1 index');
    } catch (idxErr) {
      // Index username_1 did not exist or was already dropped
    }

    try {
      await User.syncIndexes();
      console.log('User model indexes synchronized');
    } catch (syncErr) {
      console.warn('User index sync warning:', syncErr.message);
    }

    // Seed default admin & correct roles
    await seedAdmin();
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
