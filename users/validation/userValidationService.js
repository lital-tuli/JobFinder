import Joi from "joi";

const registerSchema = Joi.object({
  name: Joi.object({
    first: Joi.string().min(2).max(256).required(),
    middle: Joi.string().min(0).max(256).allow(''),
    last: Joi.string().min(2).max(256).required(),
  }).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(6)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d]{6,}$'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
  role: Joi.string().valid('jobseeker', 'recruiter').default('jobseeker'),
  bio: Joi.string().allow(''),
  profession: Joi.string().allow(''),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const validateRegistration = (user) => {
  const { error } = registerSchema.validate(user);
  if (error) return error.details[0].message;
  return "";
};

const validateLogin = (credentials) => {
  const { error } = loginSchema.validate(credentials);
  if (error) return error.details[0].message;
  return "";
};

export { validateRegistration, validateLogin };