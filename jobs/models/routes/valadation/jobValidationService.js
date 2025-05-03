import Joi from "joi";

const jobValidationSchema = Joi.object({
  title: Joi.string()
    .min(2)
    .max(256)
    .required()
    .messages({
      'string.min': 'Title must be at least 2 characters',
      'string.max': 'Title cannot exceed 256 characters',
      'any.required': 'Title is required'
    }),
  company: Joi.string()
    .min(2)
    .max(256)
    .required()
    .messages({
      'string.min': 'Company name must be at least 2 characters',
      'string.max': 'Company name cannot exceed 256 characters',
      'any.required': 'Company name is required'
    }),
  description: Joi.string()
    .min(2)
    .max(1024)
    .required()
    .messages({
      'string.min': 'Description must be at least 2 characters',
      'string.max': 'Description cannot exceed 1024 characters',
      'any.required': 'Description is required'
    }),
  requirements: Joi.string()
    .min(2)
    .max(1024)
    .required()
    .messages({
      'string.min': 'Requirements must be at least 2 characters',
      'string.max': 'Requirements cannot exceed 1024 characters',
      'any.required': 'Requirements are required'
    }),
  location: Joi.string()
    .min(2)
    .max(256)
    .required()
    .messages({
      'string.min': 'Location must be at least 2 characters',
      'string.max': 'Location cannot exceed 256 characters',
      'any.required': 'Location is required'
    }),
  salary: Joi.string().allow(''),
  jobType: Joi.string()
    .valid("Full-time", "Part-time", "Contract", "Internship", "Remote")
    .required()
    .messages({
      'any.only': 'Job type must be one of: Full-time, Part-time, Contract, Internship, Remote',
      'any.required': 'Job type is required'
    }),
  contactEmail: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Contact email must be a valid email address',
      'any.required': 'Contact email is required'
    }),
  postedBy: Joi.string().allow(null),
  applicants: Joi.array().items(Joi.string()).default([]),
  isActive: Joi.boolean().default(true)
});

const validateJob = (job) => {
  const { error } = jobValidationSchema.validate(job);
  if (error) return error.details[0].message;
  return "";
};

export default validateJob;