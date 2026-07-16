const { body } = require('express-validator');

const campaignValidator = [
  body('campaignName').trim().notEmpty().withMessage('Campaign name is required'),
  body('campaignType').isIn(['search', 'display', 'video', 'shopping', 'app', 'smart', 'performance_max']).withMessage('Invalid campaign type'),
  body('account').notEmpty().withMessage('Account is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('bidStrategy').isIn(['manual_cpc', 'maximize_clicks', 'maximize_conversions', 'target_cpa', 'target_roas', 'target_impression_share']).withMessage('Invalid bid strategy'),
  body('dailyBudget').isFloat({ min: 0 }).withMessage('Daily budget must be a positive number')
];

module.exports = { campaignValidator };
