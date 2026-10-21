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
  body('genre').notEmpty().withMessage('At least one genre is required'),
  body('language').trim().notEmpty().withMessage('Language is required'),
  body('duration').isNumeric().withMessage('Duration must be a number in minutes'),
  body('releaseDate').notEmpty().withMessage('Release date is required'),
];

const showValidation = [
  body('movie').notEmpty().withMessage('Movie ID is required'),
  body('theatre').notEmpty().withMessage('Theatre ID is required'),
  body('screen').trim().notEmpty().withMessage('Screen name is required'),
  body('date').trim().notEmpty().withMessage('Date (YYYY-MM-DD) is required'),
  body('startTime').trim().notEmpty().withMessage('Start time is required'),
  body('endTime').trim().notEmpty().withMessage('End time is required'),
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  movieValidation,
  showValidation,
};
