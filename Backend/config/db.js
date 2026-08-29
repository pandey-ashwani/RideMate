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
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://ashwani:ashwani123@cluster0.smjw1.mongodb.net/ridemate?retryWrites=true&w=majority';
    
    // Explicitly target 'ridemate' database to prevent defaulting to 'test' database
    const conn = await mongoose.connect(mongoUri, {
      dbName: 'ridemate'
    });
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Drop any stale/legacy indexes on users collection (e.g. username_1)
    try {
      const indexes = await User.collection.indexes();
      for (const idx of indexes) {
        if (idx.name.includes('username') && idx.name !== '_id_') {
          await User.collection.dropIndex(idx.name);
          console.log(`Dropped stale index: ${idx.name}`);
        }
      }
    } catch (idxErr) {
      // Ignore if collection doesn't exist yet
    }

    try {
      await User.syncIndexes();
      console.log('User model indexes synchronized');
    } catch (syncErr) {
      console.warn('User index sync warning:', syncErr.message);
    }

    // Seed default admin & correct roles
    await seedAdmin();

    // Auto-approve all existing vehicle listings in database
    try {
      const Vehicle = mongoose.model('Vehicle');
      const updateResult = await Vehicle.updateMany(
        { status: 'pending' },
        { status: 'approved' }
      );
      if (updateResult.modifiedCount > 0) {
        console.log(`Auto-approved ${updateResult.modifiedCount} existing vehicle listings.`);
      }
    } catch (vErr) {
      // Ignore if model not registered yet
    }
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
