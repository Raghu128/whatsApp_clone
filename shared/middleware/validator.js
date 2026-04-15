/**
 * Joi Request Validation Middleware
 * 
 * Validates req.body, req.params, and req.query against Joi schemas.
 * 
 * Usage:
 *   const { validate } = require('@whatsapp-clone/shared');
 *   const Joi = require('joi');
 * 
 *   const registerSchema = Joi.object({
 *     body: Joi.object({
 *       username: Joi.string().required(),
 *       password: Joi.string().min(6).required(),
 *     }),
 *   });
 * 
 *   router.post('/register', validate(registerSchema), controller.register);
 */

const { AppError } = require('./errorHandler');

/**
 * Creates a validation middleware for the given Joi schema.
 * 
 * @param {object} schema - Joi schema with optional body, params, query keys
 * @returns {function} Express middleware
 */
function validate(schema) {
  return (req, _res, next) => {
    const { error, value } = schema.validate(
      {
        body: req.body,
        params: req.params,
        query: req.query,
      },
      {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: { objects: true },
      }
    );

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));

      return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', details));
    }

    // Replace request data with validated/sanitized values
    if (value.body) req.body = value.body;
    if (value.params) req.params = value.params;
    if (value.query) req.query = value.query;

    next();
  };
}

module.exports = { validate };
