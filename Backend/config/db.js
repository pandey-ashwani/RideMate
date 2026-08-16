import mongoose from 'mongoose';
import User from '../models/User.js';

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
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
