import ApiError from '../utils/ApiError.js';

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = source === 'query' ? req.query
      : source === 'params' ? req.params
      : req.body;

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      throw ApiError.badRequest('Validation failed', errors);
    }

    // Replace with validated & sanitized values
    if (source === 'query') req.query = value;
    else if (source === 'params') req.params = value;
    else req.body = value;

    next();
  };
};

export default validate;
