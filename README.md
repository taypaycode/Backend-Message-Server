# Backend Message Server

A simple Express.js backend server that provides message storage and retrieval functionality with image uploads, user authentication, and logging.

## Features

- RESTful API endpoints for message management
- MongoDB Atlas integration for cloud-based data storage
- JWT-based authentication for protected routes
- User registration and login system
- Role-based access control (user/admin)
- Secure image upload with validation and storage
- Comprehensive logging with Winston
- Form validation using Express Validator
- Error handling middleware
- Frontend with HTML, CSS, and JavaScript

## Tech Stack

- Node.js
- Express.js
- MongoDB Atlas (cloud-hosted MongoDB)
- JWT for authentication
- Bcrypt for password hashing
- Multer for image uploads
- Winston for logging
- Express Validator for form validation
- dotenv for environment variables

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/taypaycode/Backend-Message-Server.git
   cd Backend-Message-Server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up MongoDB Atlas:
   - Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   - Set up a new cluster
   - Create a database user with password
   - Get your connection string
   - Copy `.env.example` to a new file called `.env`
   - Update the `.env` file with your MongoDB Atlas connection details and JWT secret:
     ```
     MONGODB_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER-URL>/messageDB?retryWrites=true&w=majority
     JWT_SECRET=your_super_secure_jwt_secret_key
     ```
   - Replace `<USERNAME>`, `<PASSWORD>`, and `<CLUSTER-URL>` with your actual values
   
   > **Important**: Never commit your `.env` file to version control. It is already added to `.gitignore` to prevent accidental commits.

4. Start the server:
   ```
   npm start
   ```

5. The server will be running at http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info (requires authentication)

### Messages
- `POST /api/messages` - Save a new message
- `GET /api/messages` - Retrieve all messages

### Images
- `POST /api/upload` - Upload an image (requires authentication)
- `GET /api/images` - Get all images (requires authentication)
- `GET /api/images/:id` - Get a specific image by ID

### Other
- `GET /api/hello` - Simple hello world endpoint
- `GET /api/hello2` - Another hello world endpoint
- `GET /api/hello3` - Third hello world endpoint
- `GET /api/protected` - Protected route example (requires JWT)
- `GET /api/admin` - Admin-only route (requires JWT and admin role)

## Authentication

Authentication is handled using JWT (JSON Web Tokens). To access protected routes:

1. Register or login to get a token
2. Include the token in your requests in the Authorization header:
   ```
   Authorization: Bearer YOUR_TOKEN_HERE
   ```

## Image Upload

The server supports image uploads with the following features:
- Only allows image files (jpg, jpeg, png, gif, webp)
- Limits file size to 5MB
- Generates unique filenames
- Stores image metadata in the database
- Returns URLs to access the uploaded images

## Logging

Comprehensive logging is implemented using Winston:
- Requests and responses are logged with unique IDs
- Errors are logged with detailed information
- Logs are stored in files (in the `logs` directory) and output to console
- Different log levels (info, error) are used appropriately

## Frontend

The project includes a simple frontend with:
- HTML interface
- CSS styling
- JavaScript for AJAX requests to the backend

## License

ISC 