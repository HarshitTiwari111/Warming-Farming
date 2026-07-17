const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  campaignName: { type: String, required: true, trim: true },
  googleAdsCampaignId: { type: String, default: null, index: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  status: { type: String, enum: ['active', 'paused', 'ended', 'draft'], default: 'active' },
  clicks: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  spend: { type: Number, default: 0 },
  cpc: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  device: { type: String, enum: ['all', 'mobile', 'desktop', 'tablet'], default: 'all' },
  country: { type: String, default: 'India' },
  dailyBudget: { type: Number, default: 30 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

campaignSchema.index({ account: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ country: 1 });
campaignSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Campaign', campaignSchema);
