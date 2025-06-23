import Joi from "joi";

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

// Password validation schema with specific requirements
const passwordSchema = Joi.string()
  .min(8)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d{4,})(?=.*[!@%$#^&*\\-_*]).{8,}$'))
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, at least four numbers, and one special character (!@%$#^&*-_*)',
    'any.required': 'Password is required'
  });

// Email validation schema
const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  });

// Name validation schema
const nameSchema = Joi.string()
  .min(2)
  .max(50)
  .pattern(/^[a-zA-Z\s\-'\.]+$/)
  .required()
  .messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'string.pattern.base': 'Name can only contain letters, spaces, hyphens, apostrophes, and periods',
    'any.required': 'Name is required'
  });

// Role validation schema
const roleSchema = Joi.string()
  .valid('jobSeeker', 'recruiter', 'admin')
  .default('jobSeeker')
  .messages({
    'any.only': 'Role must be either jobSeeker, recruiter, or admin'
  });

// =============================================================================
// USER REGISTRATION VALIDATION
// =============================================================================

const userRegistrationSchema = Joi.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema.optional(),
  bio: Joi.string()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Bio cannot exceed 500 characters'
    }),
  location: Joi.string()
    .max(100)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Location cannot exceed 100 characters'
    }),
  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  skills: Joi.array()
    .items(
      Joi.string()
        .max(50)
        .messages({
          'string.max': 'Each skill cannot exceed 50 characters'
        })
    )
    .max(20)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 20 skills'
    }),
  company: Joi.object({
    name: Joi.string()
      .max(100)
      .allow('')
      .messages({
        'string.max': 'Company name cannot exceed 100 characters'
      }),
    description: Joi.string()
      .max(500)
      .allow('')
      .messages({
        'string.max': 'Company description cannot exceed 500 characters'
      }),
    website: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .allow('')
      .messages({
        'string.uri': 'Please provide a valid website URL'
      }),
    industry: Joi.string()
      .max(50)
      .allow('')
      .messages({
        'string.max': 'Industry cannot exceed 50 characters'
      }),
    size: Joi.string()
      .valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')
      .allow('')
  }).optional(),
  socialLinks: Joi.object({
    linkedin: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .pattern(/linkedin\.com/)
      .allow('')
      .messages({
        'string.uri': 'Please provide a valid LinkedIn URL',
        'string.pattern.base': 'LinkedIn URL must be from linkedin.com'
      }),
    github: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .pattern(/github\.com/)
      .allow('')
      .messages({
        'string.uri': 'Please provide a valid GitHub URL',
        'string.pattern.base': 'GitHub URL must be from github.com'
      }),
    portfolio: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .allow('')
      .messages({
        'string.uri': 'Please provide a valid portfolio URL'
      })
  }).optional(),
  notifications: Joi.object({
    email: Joi.object({
      jobAlerts: Joi.boolean().default(true),
      applicationUpdates: Joi.boolean().default(true),
      newsletter: Joi.boolean().default(false)
    }).optional(),
    push: Joi.object({
      jobAlerts: Joi.boolean().default(false),
      messages: Joi.boolean().default(true)
    }).optional()
  }).optional()
});

// =============================================================================
// USER LOGIN VALIDATION
// =============================================================================

const userLoginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// =============================================================================
// PROFILE UPDATE VALIDATION
// =============================================================================

const profileUpdateSchema = Joi.object({
  name: nameSchema.optional(),
  bio: Joi.string()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Bio cannot exceed 500 characters'
    }),
  location: Joi.string()
    .max(100)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Location cannot exceed 100 characters'
    }),
  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  skills: Joi.array()
    .items(
      Joi.string()
        .max(50)
        .messages({
          'string.max': 'Each skill cannot exceed 50 characters'
        })
    )
    .max(20)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 20 skills'
    }),
  company: Joi.object({
    name: Joi.string()
      .max(100)
      .allow('')
      .messages({
        'string.max': 'Company name cannot exceed 100 characters'
      }),
    description: Joi.string()
      .max(500)
      .allow('')
      .messages({
        'string.max': 'Company description cannot exceed 500 characters'
      }),
    website: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .allow('')
      .messages({
        'string.uri': 'Please provide a valid website URL'
      }),
    industry: Joi.string()
      .max(50)
      .allow('')
      .messages({
        'string.max': 'Industry cannot exceed 50 characters'
      }),
    size: Joi.string()
      .valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')
      .allow('')
  }).optional(),
  socialLinks: Joi.object({
    linkedin: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .pattern(/linkedin\.com/)
      .allow('')
      .messages({
        'string.uri': 'Please provide a valid LinkedIn URL',
        'string.pattern.base': 'LinkedIn URL must be from linkedin.com'
      }),
    github: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .pattern(/github\.com/)
      .allow('')
      .messages({
        'string.uri': 'Please provide a valid GitHub URL',
        'string.pattern.base': 'GitHub URL must be from github.com'
      }),
    portfolio: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .allow('')
      .messages({
        'string.uri': 'Please provide a valid portfolio URL'
      })
  }).optional(),
  notifications: Joi.object({
    email: Joi.object({
      jobAlerts: Joi.boolean(),
      applicationUpdates: Joi.boolean(),
      newsletter: Joi.boolean()
    }).optional(),
    push: Joi.object({
      jobAlerts: Joi.boolean(),
      messages: Joi.boolean()
    }).optional()
  }).optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// =============================================================================
// PASSWORD CHANGE VALIDATION
// =============================================================================

const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: passwordSchema,
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match new password',
      'any.required': 'Password confirmation is required'
    })
});

// =============================================================================
// EMAIL VALIDATION
// =============================================================================

const emailChangeSchema = Joi.object({
  newEmail: emailSchema,
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required to change email'
    })
});

// =============================================================================
// SEARCH VALIDATION
// =============================================================================

const userSearchSchema = Joi.object({
  q: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Search query must be at least 1 character',
      'string.max': 'Search query cannot exceed 100 characters'
    }),
  role: Joi.string()
    .valid('jobSeeker', 'recruiter', 'admin')
    .optional(),
  location: Joi.string()
    .max(100)
    .optional(),
  skills: Joi.string()
    .max(500)
    .optional(),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional(),
  sortBy: Joi.string()
    .valid('name', 'createdAt', 'lastLogin', 'location')
    .default('createdAt')
    .optional(),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .optional()
});

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

// Validate user registration
export const validateUser = (userData) => {
  return userRegistrationSchema.validate(userData, { abortEarly: false });
};

// Validate user login
export const validateLogin = (loginData) => {
  return userLoginSchema.validate(loginData, { abortEarly: false });
};

// Validate profile update
export const validateProfileUpdate = (updateData) => {
  return profileUpdateSchema.validate(updateData, { abortEarly: false });
};

// Validate password change
export const validatePasswordChange = (passwordData) => {
  return passwordChangeSchema.validate(passwordData, { abortEarly: false });
};

// Validate email change
export const validateEmailChange = (emailData) => {
  return emailChangeSchema.validate(emailData, { abortEarly: false });
};

// Validate search parameters
export const validateUserSearch = (searchData) => {
  return userSearchSchema.validate(searchData, { abortEarly: false });
};

// =============================================================================
// CUSTOM VALIDATION HELPERS
// =============================================================================

// Check if email is valid format
export const isValidEmail = (email) => {
  return emailSchema.validate(email).error === undefined;
};

// Check if password meets requirements
export const isValidPassword = (password) => {
  return passwordSchema.validate(password).error === undefined;
};

// Get password strength
export const getPasswordStrength = (password) => {
  if (!password) return { strength: 'none', score: 0 };

  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d{4,}/.test(password),
    special: /[!@%$#^&*\-_*]/.test(password)
  };

  Object.values(checks).forEach(check => {
    if (check) score++;
  });

  let strength = 'weak';
  if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'medium';

  return { strength, score, checks };
};

// Validate file upload
export const validateFileUpload = (file, type = 'image') => {
  const errors = [];

  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }

  // File size limits
  const maxSizes = {
    image: 5 * 1024 * 1024, // 5MB
    resume: 10 * 1024 * 1024 // 10MB
  };

  const maxSize = maxSizes[type] || maxSizes.image;
  if (file.size > maxSize) {
    errors.push(`File size cannot exceed ${maxSize / (1024 * 1024)}MB`);
  }

  // File type validation
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };

  const allowed = allowedTypes[type] || allowedTypes.image;
  if (!allowed.includes(file.type)) {
    errors.push(`Invalid file type. Allowed types: ${allowed.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// =============================================================================
// EXPORT ALL SCHEMAS FOR DIRECT USE
// =============================================================================

export {
  userRegistrationSchema,
  userLoginSchema,
  profileUpdateSchema,
  passwordChangeSchema,
  emailChangeSchema,
  userSearchSchema,
  passwordSchema,
  emailSchema,
  nameSchema,
  roleSchema
};