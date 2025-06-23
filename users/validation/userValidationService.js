import Joi from "joi";

// =============================================================================
// PASSWORD VALIDATION SCHEMA 
// =============================================================================

// Password requirements from project specification:
// - At least one uppercase English letter
// - At least one lowercase English letter  
// - At least FOUR numbers (not just one digit)
// - At least one special character from: !@%$#^&*-_*
// - Minimum 8 characters total

const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*(?:\d.*){4,})(?=.*[!@%$#^&*\-_*]).{8,}$/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, four numbers, and one special character (!@%$#^&*-_*)',
    'any.required': 'Password is required'
  });

// =============================================================================
// EMAIL VALIDATION SCHEMA
// =============================================================================

const emailSchema = Joi.string()
  .email({ minDomainSegments: 2, tlds: { allow: true } })
  .required()
  .lowercase()
  .messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  });

// =============================================================================
// NAME VALIDATION SCHEMA
// =============================================================================

const nameSchema = Joi.string()
  .min(2)
  .max(50)
  .pattern(/^[a-zA-Z\s]+$/)
  .required()
  .messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'string.pattern.base': 'Name can only contain letters and spaces',
    'any.required': 'Name is required'
  });

// =============================================================================
// ROLE VALIDATION SCHEMA
// =============================================================================

const roleSchema = Joi.string()
  .valid('jobSeeker', 'recruiter', 'admin')
  .default('jobSeeker')
  .messages({
    'any.only': 'Role must be either jobSeeker, recruiter, or admin'
  });

// =============================================================================
// USER REGISTRATION VALIDATION SCHEMA
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
  skills: Joi.array()
    .items(Joi.string().max(50))
    .max(20)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 20 skills',
      'string.max': 'Each skill cannot exceed 50 characters'
    }),
  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  company: Joi.when('role', {
    is: 'recruiter',
    then: Joi.object({
      name: Joi.string()
        .max(100)
        .messages({
          'string.max': 'Company name cannot exceed 100 characters'
        }),
      description: Joi.string()
        .max(500)
        .messages({
          'string.max': 'Company description cannot exceed 500 characters'
        }),
      website: Joi.string()
        .uri()
        .messages({
          'string.uri': 'Please provide a valid website URL'
        }),
      industry: Joi.string()
        .max(50)
        .messages({
          'string.max': 'Industry cannot exceed 50 characters'
        }),
      size: Joi.string()
        .valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')
        .messages({
          'any.only': 'Company size must be one of: 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+'
        })
    }),
    otherwise: Joi.forbidden()
  })
});

// =============================================================================
// USER LOGIN VALIDATION SCHEMA
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
// PROFILE UPDATE VALIDATION SCHEMA
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
  skills: Joi.array()
    .items(Joi.string().max(50))
    .max(20)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 20 skills',
      'string.max': 'Each skill cannot exceed 50 characters'
    }),
  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  company: Joi.object({
    name: Joi.string()
      .max(100)
      .messages({
        'string.max': 'Company name cannot exceed 100 characters'
      }),
    description: Joi.string()
      .max(500)
      .messages({
        'string.max': 'Company description cannot exceed 500 characters'
      }),
    website: Joi.string()
      .uri()
      .messages({
        'string.uri': 'Please provide a valid website URL'
      }),
    industry: Joi.string()
      .max(50)
      .messages({
        'string.max': 'Industry cannot exceed 50 characters'
      }),
    size: Joi.string()
      .valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')
      .messages({
        'any.only': 'Company size must be one of: 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+'
      })
  }).optional(),
  socialLinks: Joi.object({
    linkedin: Joi.string()
      .uri()
      .pattern(/^https?:\/\/(www\.)?linkedin\.com\/.+/)
      .messages({
        'string.uri': 'Please provide a valid LinkedIn URL',
        'string.pattern.base': 'Please provide a valid LinkedIn URL'
      }),
    github: Joi.string()
      .uri()
      .pattern(/^https?:\/\/(www\.)?github\.com\/.+/)
      .messages({
        'string.uri': 'Please provide a valid GitHub URL',
        'string.pattern.base': 'Please provide a valid GitHub URL'
      }),
    portfolio: Joi.string()
      .uri()
      .messages({
        'string.uri': 'Please provide a valid portfolio URL'
      })
  }).optional()
}).min(1);

// =============================================================================
// PASSWORD CHANGE VALIDATION SCHEMA
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
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
});

// =============================================================================
// EMAIL CHANGE VALIDATION SCHEMA
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
// USER SEARCH VALIDATION SCHEMA
// =============================================================================

const userSearchSchema = Joi.object({
  query: Joi.string()
    .min(1)
    .max(100)
    .messages({
      'string.min': 'Search query must be at least 1 character long',
      'string.max': 'Search query cannot exceed 100 characters'
    }),
  role: Joi.string()
    .valid('jobSeeker', 'recruiter', 'admin')
    .messages({
      'any.only': 'Role must be either jobSeeker, recruiter, or admin'
    }),
  location: Joi.string()
    .max(100)
    .messages({
      'string.max': 'Location cannot exceed 100 characters'
    }),
  skills: Joi.array()
    .items(Joi.string().max(50))
    .messages({
      'string.max': 'Each skill cannot exceed 50 characters'
    }),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    })
});

// =============================================================================
// VALIDATION FUNCTIONS - FIXED TO MATCH AUTHROUTES EXPECTATIONS
// =============================================================================

// ✅ FIXED: User registration validation function
export const validateUser = (userData) => {
  const { error, value } = userRegistrationSchema.validate(userData, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    return { error };
  }

  return { value };
};

// ✅ FIXED: User login validation function  
export const validateLogin = (loginData) => {
  const { error, value } = userLoginSchema.validate(loginData, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    return { error };
  }

  return { value };
};

// Profile update validation function
export const validateProfileUpdate = (updateData) => {
  const { error, value } = profileUpdateSchema.validate(updateData, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    return { error };
  }

  return { value };
};

// Password change validation function
export const validatePasswordChange = (passwordData) => {
  const { error, value } = passwordChangeSchema.validate(passwordData, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    return { error };
  }

  return { value };
};

// =============================================================================
// FILE VALIDATION HELPER
// =============================================================================

export const validateFile = (file, allowedTypes, maxSize = 5 * 1024 * 1024) => {
  const errors = [];

  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }

  // Check file size (default 5MB)
  if (file.size > maxSize) {
    errors.push(`File size cannot exceed ${Math.round(maxSize / (1024 * 1024))}MB`);
  }

  // Check file type
  const fileType = file.mimetype || file.type;
  if (!allowedTypes.includes(fileType)) {
    const allowed = allowedTypes.join(', ');
    errors.push(`Invalid file type. Allowed types: ${allowed}`);
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

// =============================================================================
// DEFAULT EXPORT FOR EASY USE
// =============================================================================

export default validateUser;