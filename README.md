# JobFinder - Job Portal Application

A comprehensive job portal application built with React, Node.js, Express, and MongoDB that connects job seekers with recruiters and employers.

## 🌟 Features

### For Job Seekers
- **User Registration & Authentication** - Secure signup and login with JWT tokens
- **Job Search & Filtering** - Advanced search with location, job type, and keyword filters
- **Job Applications** - Apply to jobs with application tracking
- **Save Jobs** - Bookmark jobs for later viewing
- **Profile Management** - Update personal information and bio
- **Application Dashboard** - Track application status and history

### For Recruiters
- **Job Posting** - Create and publish job listings
- **Application Management** - View and manage job applications
- **Job Management** - Edit, update, or remove job postings
- **Company Branding** - Showcase company information

### For Administrators
- **User Management** - Manage user accounts and permissions
- **System Analytics** - View system statistics and insights
- **Content Moderation** - Manage job postings and user content
- **Admin Dashboard** - Comprehensive system overview

## 🚀 Technology Stack

### Frontend
- **React 19** - Modern React with hooks and context
- **React Router v7** - Client-side routing
- **Bootstrap 5** - Responsive UI framework
- **Axios** - HTTP client for API requests
- **Formik & Yup** - Form handling and validation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **Joi** - Server-side validation
- **Bcrypt** - Password hashing

## 📁 Project Structure

```
jobfinder/
├── JobFinder/                  # Frontend React application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── pages/              # Page components
│   │   ├── context/            # React context providers
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API service functions
│   │   └── assets/             # Styles and images
├── config/                     # Configuration files
├── jobs/                       # Job-related backend modules
├── users/                      # User-related backend modules
├── auth/                       # Authentication middleware
├── admin/                      # Admin functionality
├── DB/                         # Database models and connection
├── utils/                      # Utility functions
└── server.js                   # Main server file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jobfinder
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   PORT=8000
   SECRET=your_jwt_secret_key
   ATLAS_CONNECTION_STRING=your_mongodb_connection_string
   NODE_ENV=development
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd JobFinder
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the JobFinder directory:
   ```env
   VITE_API_URL=http://localhost:8000/api
   NODE_ENV=development
   ```

4. **Start the frontend development server**
   ```bash
   npm run dev
   ```

## 🌐 Application URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Health Check**: http://localhost:8000/health

## 👥 Default User Accounts

The application seeds with default accounts for testing:

### Admin User
- **Email**: admin@jobfinder.com
- **Password**: Admin123
- **Role**: Administrator

### Recruiter User
- **Email**: recruiter@example.com
- **Password**: Recruiter123  
- **Role**: Recruiter

### Job Seeker User
- **Email**: jobseeker@example.com
- **Password**: Seeker123
- **Role**: Job Seeker

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt for secure password storage
- **Input Validation** - Both client and server-side validation
- **Rate Limiting** - API request rate limiting (bonus feature)
- **Auto-logout** - Automatic logout after 4 hours of inactivity (bonus feature)
- **Role-based Access Control** - Different permissions for different user types

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop computers (1200px+)
- Tablets (768px - 1199px)
- Mobile phones (below 768px)

## 🔍 API Endpoints

### Authentication
- `POST /api/users/login` - User login
- `POST /api/users` - User registration
- `GET /api/users/check-auth` - Verify authentication

### Jobs
- `GET /api/jobs` - Get all jobs (with filtering)
- `GET /api/jobs/:id` - Get specific job
- `POST /api/jobs` - Create new job (recruiters only)
- `PUT /api/jobs/:id` - Update job (recruiters only)
- `DELETE /api/jobs/:id` - Delete job (recruiters only)
- `POST /api/jobs/:id/apply` - Apply for job
- `POST /api/jobs/:id/save` - Save/unsave job

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/saved-jobs` - Get saved jobs
- `GET /api/users/:id/applied-jobs` - Get applied jobs

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/jobs` - Get all jobs
- `GET /api/admin/stats` - Get system statistics
- `PUT /api/admin/users/:id/role` - Update user role
- `DELETE /api/admin/users/:id` - Delete user

## 🚀 Deployment

### Backend Deployment
1. Set `NODE_ENV=production` in environment variables
2. Configure production MongoDB database
3. Update CORS settings for production domain
4. Deploy to platforms like Heroku, Railway, or DigitalOcean

### Frontend Deployment
1. Build the production version:
   ```bash
   cd JobFinder
   npm run build
   ```
2. Deploy the `dist` folder to Netlify, Vercel, or similar platforms
3. Update API URL environment variable for production

## 🧪 Testing

### Test User Accounts
Use the default seeded accounts or create new ones through the registration process.

### API Testing
Use tools like Postman or Thunder Client to test API endpoints:
1. Register/login to get authentication token
2. Include token in Authorization header: `x-auth-token: <token>`
3. Test CRUD operations on jobs and users

## 🔧 Troubleshooting

### Common Issues

1. **Memory Issues**
   - Increase Node.js heap size: `node --max-old-space-size=4096 server.js`

2. **Database Connection**
   - Verify MongoDB is running locally or Atlas connection string is correct
   - Check network connectivity and firewall settings

3. **CORS Errors**
   - Ensure frontend URL is included in CORS configuration
   - Check API URL in frontend environment variables

4. **Authentication Issues**
   - Verify JWT secret is set in environment variables
   - Check token expiration and storage

## 📈 Performance Optimization

- **Database Indexing** - Optimized MongoDB queries with proper indexing
- **Pagination** - Large data sets are paginated
- **Image Optimization** - Optimized images and lazy loading
- **Code Splitting** - React components are split for better loading
- **Caching** - API responses cached where appropriate

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Bootstrap team for the excellent UI framework
- MongoDB team for the robust database solution
- React team for the powerful frontend library
- All open-source contributors whose libraries made this project possible

---

**Built with ❤️ by [Lital Gehman]**