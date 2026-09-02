import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vehicle from '../models/Vehicle.js';
import { uploadToCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

// Load environment variables from Backend/.env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '..', 'uploads');

const isDryRun = process.argv.includes('--dry-run');

async function runMigration() {
  console.log('====================================================');
  console.log(` RideMate Local Images -> Cloudinary Migration Script`);
  console.log(` Mode: ${isDryRun ? '🔍 DRY-RUN (No changes will be made)' : '🚀 LIVE MIGRATION'}`);
  console.log(` Uploads Directory: ${uploadsDir}`);
  console.log('====================================================\n');

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ Error: MONGO_URI is not set in environment variables.');
    process.exit(1);
  }

  if (!isDryRun && !isCloudinaryConfigured()) {
    console.error('❌ Error: Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (or CLOUDINARY_URL).');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, { dbName: 'ridemate' });
    console.log('✅ Connected to MongoDB Atlas successfully.\n');

    // Find all vehicles with image starting with /uploads/
    const vehicles = await Vehicle.find({ image: { $regex: '^/uploads/' } });
    console.log(`Found ${vehicles.length} vehicle(s) with local "/uploads/..." image paths.\n`);

    let migrated = 0;
    let skippedMissing = 0;
    let failed = 0;

    for (const vehicle of vehicles) {
      const filename = path.basename(vehicle.image);
      const localFilePath = path.join(uploadsDir, filename);
      const fileExists = fs.existsSync(localFilePath);

      if (isDryRun) {
        if (fileExists) {
          console.log(`[DRY-RUN: READY] Vehicle: "${vehicle.name}" (ID: ${vehicle._id})`);
          console.log(`  Current DB image: ${vehicle.image}`);
          console.log(`  Found local file: ${localFilePath}`);
          migrated++;
        } else {
          console.log(`[DRY-RUN: SKIPPED] Vehicle: "${vehicle.name}" (ID: ${vehicle._id})`);
          console.log(`  Current DB image: ${vehicle.image}`);
          console.log(`  Local file missing: ${localFilePath} (Will leave DB record untouched)`);
          skippedMissing++;
        }
      } else {
        if (!fileExists) {
          console.log(`[SKIPPED - MISSING] Vehicle: "${vehicle.name}" (ID: ${vehicle._id})`);
          console.log(`  File not found at: ${localFilePath}`);
          console.log(`  Leaving database record unchanged for frontend fallback.\n`);
          skippedMissing++;
          continue;
        }

        try {
          console.log(`[UPLOADING] Vehicle: "${vehicle.name}" (${filename})...`);
          const result = await uploadToCloudinary(localFilePath, { folder: 'vehicles' });
          
          vehicle.image = result.secure_url;
          await vehicle.save();

          console.log(`[SUCCESS] Migrated "${vehicle.name}" (ID: ${vehicle._id})`);
          console.log(`  New Cloudinary URL: ${result.secure_url}\n`);
          migrated++;
        } catch (err) {
          console.error(`[FAILED] Failed to migrate "${vehicle.name}" (ID: ${vehicle._id}): ${err.message}\n`);
          failed++;
        }
      }
    }

    console.log('====================================================');
    console.log('                 MIGRATION SUMMARY                  ');
    console.log('====================================================');
    console.log(`Total /uploads/ records found: ${vehicles.length}`);
    if (isDryRun) {
      console.log(`Ready for migration (file exists): ${migrated}`);
      console.log(`Skipped (file missing on disk):    ${skippedMissing}`);
    } else {
      console.log(`Successfully migrated:             ${migrated}`);
      console.log(`Skipped (file missing on disk):    ${skippedMissing}`);
      console.log(`Failed:                            ${failed}`);
    }
    console.log('====================================================\n');
  } catch (err) {
    console.error('Fatal Migration Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runMigration();
