# Backend Message Server

A simple Express.js backend server that provides message storage and retrieval functionality.

## Features

- RESTful API endpoints for message management
- MongoDB integration for data storage
- JWT-based authentication for protected routes
- File upload capabilities using Multer
- Form validation using Express Validator
- Error handling middleware
- Frontend with HTML, CSS, and JavaScript

## Tech Stack

- Node.js
- Express.js
- MongoDB (with Mongoose)
- JWT for authentication
- Multer for file uploads
- Winston for logging
- Express Validator for form validation

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

3. Make sure MongoDB is running locally on port 27017.

4. Start the server:
   ```
   npm start
   ```

5. The server will be running at http://localhost:3000

## API Endpoints

- `GET /api/hello` - Simple hello world endpoint
- `GET /api/hello2` - Another hello world endpoint
- `GET /api/hello3` - Third hello world endpoint
- `POST /api/messages` - Save a new message
- `GET /api/messages` - Retrieve all messages
- `GET /api/protected` - Protected route example (requires JWT)
- `POST /api/user` - User registration with validation
- `POST /api/upload` - File upload endpoint

## Frontend

The project includes a simple frontend with:
- HTML interface
- CSS styling
- JavaScript for AJAX requests to the backend

## License

ISC 