/**
 * Pure-JS validation middleware (zero extra dependencies).
 *
 * Usage:
 *   validate({ email: 'email', password: 'string:min6', full_name: 'string:min2',
 *              user_type: 'enum:supplier,government_entity' })
 *
 * Supported rule tokens:
 *   'string'           – must be a non-empty string
 *   'string:minN'      – string with length >= N
 *   'email'            – basic RFC-5322 local@domain check
 *   'enum:a,b,c'       – value must be one of the listed options
 *
 * Returns 400 with { errors: { field: 'reason', ... } } when validation fails.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate a single field value against a rule string.
 * @param {string} field  – field name (for error messages)
 * @param {*}      value  – value from req.body
 * @param {string} rule   – rule descriptor
 * @returns {string|null} error message or null when valid
 */
function validateField(field, value, rule) {
  const [type, param] = rule.split(":");

  switch (type) {
    case "email": {
      if (typeof value !== "string" || !value.trim()) {
        return `${field} is required`;
      }
      if (!EMAIL_RE.test(value.trim())) {
        return `${field} must be a valid email address`;
      }
      return null;
    }

    case "string": {
      if (typeof value !== "string" || !value.trim()) {
        return `${field} is required`;
      }
      if (param && param.startsWith("min")) {
        const min = parseInt(param.slice(3), 10);
        if (value.trim().length < min) {
          return `${field} must be at least ${min} characters`;
        }
      }
      return null;
    }

    case "enum": {
      if (value === undefined || value === null || value === "") {
        return `${field} is required`;
      }
      const allowed = param ? param.split(",") : [];
      if (!allowed.includes(String(value))) {
        return `${field} must be one of: ${allowed.join(", ")}`;
      }
      return null;
    }

    default:
      // Unknown rule — treat as optional; don't block the request
      return null;
  }
}

/**
 * Returns an Express middleware that validates req.body against the schema.
 *
 * @param {Record<string, string>} schema
 * @returns {import('express').RequestHandler}
 */
function validate(schema) {
  return function validationMiddleware(req, res, next) {
    const errors = {};

    for (const [field, rule] of Object.entries(schema)) {
      const error = validateField(field, req.body ? req.body[field] : undefined, rule);
      if (error) {
        errors[field] = error;
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  };
}

module.exports = validate;
