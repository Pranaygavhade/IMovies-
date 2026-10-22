const { body, validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return sendError(res, 'Validation failed', 400, extractedErrors);
  };
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name too long'),
  body('email').trim().isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

const movieValidation = [
  body('title').trim().notEmpty().withMessage('Movie title is required'),
  body('description').trim().notEmpty().withMessage('Movie description is required'),
  body('language').trim().notEmpty().withMessage('Language is required'),
];

const theatreValidation = [
  body('name').trim().notEmpty().withMessage('Theatre name is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
];

const showValidation = [
  body('movie').notEmpty().withMessage('Movie ID is required'),
  body('theatre').notEmpty().withMessage('Theatre ID is required'),
  body('screen').trim().notEmpty().withMessage('Screen name is required'),
];

const bookingValidation = [
  body('showId').notEmpty().withMessage('Show ID is required'),
  body('seatNumbers').isArray({ min: 1 }).withMessage('At least one seatNumber is required'),
];

const paymentInitiateValidation = [
  body('bookingId').notEmpty().withMessage('Booking ID is required'),
];

const paymentVerifyValidation = [
  body('orderId').notEmpty().withMessage('Order ID is required'),
];

const reviewValidation = [
  body('movieId').notEmpty().withMessage('Movie ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
  body('comment').trim().notEmpty().withMessage('Review comment is required'),
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  movieValidation,
  theatreValidation,
  showValidation,
  bookingValidation,
  paymentInitiateValidation,
  paymentVerifyValidation,
  reviewValidation,
};
