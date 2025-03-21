# Backend Message Server

A simple Express.js backend server that provides message storage and retrieval functionality.

## Features

- RESTful API endpoints for message management
- MongoDB Atlas integration for cloud-based data storage
- JWT-based authentication for protected routes
- File upload capabilities using Multer
- Form validation using Express Validator
- Error handling middleware
- Frontend with HTML, CSS, and JavaScript

## Tech Stack

- Node.js
- Express.js
- MongoDB Atlas (cloud-hosted MongoDB)
- JWT for authentication
- Multer for file uploads
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
   - Update the `.env` file with your MongoDB Atlas connection details:
     ```
     MONGODB_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER-URL>/messageDB?retryWrites=true&w=majority
     ```
   - Replace `<USERNAME>`, `<PASSWORD>`, and `<CLUSTER-URL>` with your actual values
   
   > **Important**: Never commit your `.env` file to version control. It is already added to `.gitignore` to prevent accidental commits.

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