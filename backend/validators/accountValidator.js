const { body } = require('express-validator');

const accountValidator = [
  body('name').trim().notEmpty().withMessage('Account name is required'),
  body('inviteEmail').optional().isEmail().withMessage('Please provide a valid email'),
  body('timezone').optional().trim().notEmpty().withMessage('Timezone cannot be empty'),
  body('currency').optional().trim().notEmpty().withMessage('Currency cannot be empty'),
  body('billingBudget').optional().isNumeric().withMessage('Billing budget must be a number'),
  body('country').optional().trim().notEmpty().withMessage('Country cannot be empty'),
  body('autoTagging').optional().isBoolean().withMessage('Auto tagging must be a boolean'),
  body('audienceUnknown').optional().isBoolean().withMessage('Audience unknown must be a boolean'),
];

module.exports = { accountValidator };
