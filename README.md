# Backend Message Server

A modern backend messaging server with a responsive dashboard for managing messages, users, image uploads, and system logs.

## Features

- **User Authentication**: Secure login and registration system with JWT
- **Messaging**: Real-time message sending and retrieval
- **Image Uploads**: Upload and view images with secure storage
- **API Testing**: Built-in API testing interface
- **System Logs**: View and filter system logs (admin only)
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **File Uploads**: Multer
- **Logging**: Winston

## Getting Started

### Prerequisites

- Node.js (v12 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/backend-message-server.git
cd backend-message-server
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

4. Start the server
```bash
npm start
```

The server will start on http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user info (authenticated)

### Messages
- `GET /api/messages` - Get all messages
- `POST /api/messages` - Create a new message

### Images
- `GET /api/images` - Get all images (authenticated)
- `GET /api/images/:id` - Get image by ID (authenticated)
- `POST /api/images/upload` - Upload a new image (authenticated)

### System
- `GET /api/protected` - Protected route example
- `GET /api/admin` - Admin-only route
- `GET /api/logs` - Get system logs (admin only)

## Dashboard

The dashboard provides a user-friendly interface for interacting with all the features of the backend server. To access:

1. Start the server
2. Navigate to http://localhost:3000 in your browser
3. Register for an account or login
4. Explore the interface tabs: Messages, Images, API Testing, and Logs

## License

MIT

## Author

Your Name 