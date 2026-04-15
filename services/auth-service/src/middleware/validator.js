/**
 * Auth Request Validation Schemas
 * 
 * Joi schemas for validating request body/params/query on auth routes.
 */

const Joi = require('joi');

const registerSchema = Joi.object({
  body: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.alphanum': 'Username can only contain letters and numbers',
        'string.min': 'Username must be at least 3 characters',
        'string.max': 'Username cannot exceed 50 characters',
        'any.required': 'Username is required',
      }),
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{6,14}$/)
      .required()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number (e.g., +919876543210)',
        'any.required': 'Phone number is required',
      }),
    email: Joi.string()
      .email()
      .optional()
      .messages({
        'string.email': 'Please provide a valid email address',
      }),
    password: Joi.string()
      .min(6)
      .max(128)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'string.max': 'Password cannot exceed 128 characters',
        'any.required': 'Password is required',
      }),
  }),
});

const loginSchema = Joi.object({
  body: Joi.object({
    login: Joi.string()
      .required()
      .messages({
        'any.required': 'Username or phone number is required',
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required',
      }),
  }),
});

const refreshSchema = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'any.required': 'Refresh token is required',
      }),
  }),
});

const logoutSchema = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string()
      .optional(),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
};
