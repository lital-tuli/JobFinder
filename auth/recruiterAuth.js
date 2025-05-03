import { createError } from "../utils/handleErrors.js";

const validateRecruiter = (req, res, next) => {
  try {
    if (req.user.role !== "recruiter") {
      const error = new Error("Authorization Error: Only recruiters can create job listings");
      error.status = 403;
      throw error;
    }
    next();
  } catch (error) {
    const errorObj = new Error(error.message);
    errorObj.status = error.status || 403;
    return createError("Authorization", errorObj);
  }
};

export default validateRecruiter;