const Joi = require('joi');

/**
 * Validation Middleware
 * @param {object} schema - Joi schema object
 * @param {string} property - Property to validate (body, query, params)
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const details = error.details.map(d => d.message).join(', ');
            return res.status(400).json({ error: `Validation Error: ${details}` });
        }
        next();
    };
};

module.exports = validate;
