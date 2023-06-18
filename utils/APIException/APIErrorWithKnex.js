const httpStatus = require("http-status");
const ExtendableError = require("./ExtendableError");

/**
 * Class representing an API error.
 * @extends ExtendableError
 */
class APIErrorWithKnex extends ExtendableError {
  /**
   * Creates an API error.
   * @param {string} message - Error message.
   * @param {number} status - HTTP status code of error.
   * @param {boolean} isPublic - Whether the message should be visible to user or not.
   */
  constructor({ message, errors, stack, status = httpStatus.INTERNAL_SERVER_ERROR, isPublic = false }) {
    super({
      message,
      errors,
      status,
      isPublic,
      stack
    });

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor.name);
  }
}

module.exports = APIErrorWithKnex;
