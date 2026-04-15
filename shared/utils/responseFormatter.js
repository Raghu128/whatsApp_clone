/**
 * Standardized API Response Formatter
 * 
 * Ensures all services return consistent response shapes.
 * 
 * Success: { success: true, data: {...}, message: '...' }
 * Error:   { success: false, error: { code, message, details } }
 * Paginated: { success: true, data: [...], pagination: { page, limit, total, totalPages } }
 */

/**
 * Format a successful response.
 * 
 * @param {object} res - Express response object
 * @param {*} data - Response payload
 * @param {string} [message='Success'] - Human-readable message
 * @param {number} [statusCode=200] - HTTP status code
 */
function success(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Format an error response.
 * 
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} [statusCode=500] - HTTP status code
 * @param {string} [code='INTERNAL_ERROR'] - Machine-readable error code
 * @param {*} [details=null] - Additional error details (validation errors, etc.)
 */
function error(res, message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
  const response = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
}

/**
 * Format a paginated response.
 * 
 * @param {object} res - Express response object
 * @param {Array} data - Array of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} [message='Success'] - Human-readable message
 */
function paginated(res, data, page, limit, total, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
}

module.exports = { success, error, paginated };
