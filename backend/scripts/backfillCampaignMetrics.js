const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Campaign = require('../models/Campaign');

// One-time backfill: ctr/cpc were never computed on sync, so existing
// documents have 0. Derives them from stored clicks/impressions/spend.
// Idempotent — safe to re-run.
const backfill = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await Campaign.updateMany({}, [
      {
        $set: {
          ctr: {
            $cond: [
              { $gt: ['$impressions', 0] },
              { $multiply: [{ $divide: ['$clicks', '$impressions'] }, 100] },
              0,
            ],
          },
          cpc: {
            $cond: [
              { $gt: ['$clicks', 0] },
              { $divide: ['$spend', '$clicks'] },
              0,
            ],
          },
        },
      },
    ]);

    console.log(`Matched ${result.matchedCount}, updated ${result.modifiedCount} campaigns`);
    process.exit(0);
  } catch (error) {
    console.error('Error backfilling campaign metrics:', error.message);
    process.exit(1);
  }
};

backfill();
