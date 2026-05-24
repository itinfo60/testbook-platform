# Testbook Platform

Testbook Platform is a comprehensive, full-stack learning management system designed to provide a seamless educational experience for students, teachers, and administrators. It features interactive courses, mock tests, blogs, discussions, and a fully-featured admin dashboard.

## 🚀 Features

### For Students (Client)
- **Course Catalog & Enrollment**: Browse, search, and enroll in various courses and exam categories.
- **Interactive Learning**: Watch video lectures, read notes, and participate in course discussions.
- **Mock Tests & Quizzes**: Take timed tests and quizzes with real-time performance analytics.
- **Wishlist & Cart**: Save courses for later and manage purchases seamlessly.
- **Payment Integration**: Secure checkout process with support for discount coupons.
- **Leaderboard & Gamification**: Earn badges and compete with peers on the global leaderboard.
- **Blog Platform**: Read educational articles and stay updated with the latest news.

### For Administrators & Teachers (Admin)
- **Dashboard Analytics**: Comprehensive overview of platform metrics, revenue, and user engagement.
- **Course Management**: Create and manage courses, curriculum, videos, and study materials.
- **Test Management**: Build detailed tests and quizzes with various question types.
- **User Management**: Manage student and teacher accounts, roles, and permissions.
- **Revenue & Coupon Management**: Track sales and create promotional discount codes.

## 🛠 Tech Stack

### Frontend (Client & Admin)
- **Framework**: React.js powered by Vite
- **Styling**: Tailwind CSS & Framer Motion (for animations)
- **State Management**: Redux Toolkit
- **Routing**: React Router DOM
- **Icons**: React Icons (FontAwesome)

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Caching**: Redis
- **Real-time**: Socket.io (for notifications and live discussions)
- **File Storage**: Cloudinary integration for media and video uploads
- **Authentication**: JWT (JSON Web Tokens)

## 📂 Project Structure

```text
testbook-platform/
├── client/         # Student-facing React application
├── admin/          # Admin/Teacher dashboard React application
├── server/         # Node.js/Express REST API backend
├── shared/         # Shared utilities or types (if applicable)
└── docker-compose.yml # Docker configuration for local services
```

## 💻 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (running locally or a MongoDB Atlas URI)
- Redis (optional, but recommended for caching)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/itinfo60/testbook-platform.git
   cd testbook-platform
   ```

2. **Setup the Server:**
   ```bash
   cd server
   npm install
   # Create a .env file based on .env.example and fill in your database, cloudinary, and jwt secrets.
   npm run dev
   ```

3. **Setup the Client (Student Portal):**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```
   *The client will run on http://localhost:5173*

4. **Setup the Admin Dashboard:**
   ```bash
   cd ../admin
   npm install
   npm run dev
   ```

## 🐳 Docker Setup (Optional)
If you prefer running the infrastructure (like Redis and MongoDB) via Docker, you can use the provided Docker Compose file:
```bash
docker-compose up -d
```

## 📜 Scripts overview
- `npm run dev` - Starts the development server with hot-reloading.
- `npm run build` - Builds the application for production deployment.
- `npm start` - Starts the production server (Backend).

## 🔒 Security
- Rate limiting to prevent brute-force attacks.
- Secure HTTP headers using Helmet.
- Data sanitization against NoSQL query injection and XSS.
- Password hashing using bcrypt.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is proprietary and confidential. All rights reserved.

