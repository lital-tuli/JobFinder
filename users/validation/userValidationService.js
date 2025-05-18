import Joi from "joi";

const registerSchema = Joi.object({
  name: Joi.object({
    first: Joi.string().min(2).max(256).required(),
    middle: Joi.string().min(0).max(256).allow(''),
    last: Joi.string().min(2).max(256).required(),
  }).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d{4,})(?=.*[!@%$#^&*\\-_*]).{8,}$'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, at least 4 numbers, and one special character (!@%$#^&*-_*)',
      'string.min': 'Password must be at least 8 characters long'
    }),
  role: Joi.string().valid('jobseeker', 'recruiter', 'admin').default('jobseeker'),
  bio: Joi.string().allow(''),
  profession: Joi.string().allow(''),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Schema for updating user profile
const updateProfileSchema = Joi.object({
  name: Joi.object({
    first: Joi.string().min(2).max(256),
    middle: Joi.string().min(0).max(256).allow(''),
    last: Joi.string().min(2).max(256),
  }),
  email: Joi.string().email(),
  bio: Joi.string().allow(''),
  profession: Joi.string().allow(''),
  // Don't allow role updates through regular profile update
});

// Schema for admin role updates
const updateRoleSchema = Joi.object({
  role: Joi.string().valid('jobseeker', 'recruiter', 'admin').required(),
});

// Schema for password change
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d{4,})(?=.*[!@%$#^&*\\-_*]).{8,}$'))
    .required()
    .messages({
      'string.pattern.base': 'New password must contain at least 8 characters, one uppercase letter, one lowercase letter, at least 4 numbers, and one special character (!@%$#^&*-_*)',
      'string.min': 'New password must be at least 8 characters long'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match'
    })
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

const validateProfileUpdate = (userData) => {
  const { error } = updateProfileSchema.validate(userData);
  if (error) return error.details[0].message;
  return "";
};

const validateRoleUpdate = (roleData) => {
  const { error } = updateRoleSchema.validate(roleData);
  if (error) return error.details[0].message;
  return "";
};

const validatePasswordChange = (passwordData) => {
  const { error } = changePasswordSchema.validate(passwordData);
  if (error) return error.details[0].message;
  return "";
};

export { 
  validateRegistration, 
  validateLogin, 
  validateProfileUpdate, 
  validateRoleUpdate,
  validatePasswordChange
};