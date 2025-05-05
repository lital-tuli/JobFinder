// utils/seedDB.js
import User from "../DB/models/User.js";
import Job from "../DB/models/Job.js";
import { generatePassword } from "../users/helpers/bcrypt.js";

const seedData = async () => {
  try {
    // Check if we already have users
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      console.log("No users found, seeding database with initial data...");
      
      // Create sample users
      const users = [
        {
          name: {
            first: "Admin",
            middle: "",
            last: "User"
          },
          email: "admin@jobfinder.com",
          password: generatePassword("Admin123"),
          role: "recruiter",
          isAdmin: true,
          profession: "System Administrator",
          bio: "JobFinder platform administrator"
        },
        {
          name: {
            first: "John",
            middle: "",
            last: "Recruiter"
          },
          email: "recruiter@example.com",
          password: generatePassword("Recruiter123"),
          role: "recruiter",
          profession: "HR Manager",
          bio: "Experienced HR manager looking for talented individuals"
        },
        {
          name: {
            first: "Jane",
            middle: "",
            last: "JobSeeker"
          },
          email: "jobseeker@example.com",
          password: generatePassword("Seeker123"),
          role: "jobseeker",
          profession: "Software Developer",
          bio: "Experienced software developer looking for new opportunities"
        }
      ];
      
      const createdUsers = await User.insertMany(users);
      console.log("Sample users created");
      
      // Create sample jobs
      const jobs = [
        {
          title: "Frontend Developer",
          company: "Tech Solutions Inc.",
          description: "We are looking for a skilled Frontend Developer to join our team. The ideal candidate should have experience with JavaScript, React, and CSS.",
          requirements: "At least 2 years of experience with React and modern JavaScript. Experience with state management libraries (Redux, Zustand). Knowledge of responsive design and CSS preprocessors.",
          location: "Tel Aviv, Israel",
          salary: "$80,000 - $100,000",
          jobType: "Full-time",
          contactEmail: "jobs@techsolutions.com",
          postedBy: createdUsers[1]._id // Recruiter
        },
        {
          title: "Backend Developer",
          company: "Tech Solutions Inc.",
          description: "We are seeking a Backend Developer to build and maintain our server-side applications and APIs.",
          requirements: "Experience with Node.js and Express. Knowledge of MongoDB or other NoSQL databases. Understanding of RESTful APIs and microservices architecture.",
          location: "Jerusalem, Israel",
          salary: "$85,000 - $110,000",
          jobType: "Full-time",
          contactEmail: "jobs@techsolutions.com",
          postedBy: createdUsers[1]._id // Recruiter
        },
        {
          title: "UX/UI Designer",
          company: "Creative Minds",
          description: "Join our design team to create exceptional user experiences for web and mobile applications.",
          requirements: "Portfolio showcasing UI/UX projects. Proficiency with design tools (Figma, Sketch, Adobe XD). Understanding of user-centered design principles.",
          location: "Remote",
          salary: "$70,000 - $90,000",
          jobType: "Contract",
          contactEmail: "careers@creativeminds.com",
          postedBy: createdUsers[0]._id // Admin
        }
      ];
      
      await Job.insertMany(jobs);
      console.log("Sample jobs created");
      
      console.log("Database seeded successfully!");
    } else {
      console.log("Database already contains users, skipping seed process");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

export default seedData;