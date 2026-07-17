const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  googleAdsCustomerId: { type: String, default: null, index: true },
  sourceMccId: { type: String, default: null, index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  timezone: { type: String, required: true, default: 'Asia/Kolkata' },
  currency: { type: String, required: true, default: 'USD' },
  billingBudget: { type: Number, required: true, default: 2 },
  inviteEmail: { type: String, required: true, trim: true, lowercase: true },
  autoTagging: { type: Boolean, default: false },
  audienceUnknown: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'pending', 'suspended', 'paused'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

accountSchema.index({ status: 1 });
accountSchema.index({ inviteEmail: 1 });
accountSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Account', accountSchema);
