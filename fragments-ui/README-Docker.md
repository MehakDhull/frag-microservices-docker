# Fragments UI - Docker Development Setup

This is a simplified version of the fragments UI that works directly with the fragments API without requiring authentication login flow. Perfect for local development with Docker.

## Features

- 🚀 Direct fragment management (no login required)
- 📝 Create, edit, and delete fragments
- 🖼️ Support for text and image fragments
- 🔄 Fragment type conversion
- 📱 Offline support with IndexedDB
- 🐳 Docker-ready for easy deployment

## Quick Start with Docker

### Prerequisites

- Docker and Docker Compose installed
- A running fragments API service on port 8080

### Method 1: Using Docker Compose (Recommended)

```bash
# Build and run the UI
docker-compose up --build

# The UI will be available at http://localhost:3000
```

### Method 2: Manual Docker Build

```bash
# Build the image
docker build -t fragments-ui .

# Run the container
docker run -p 3000:80 -e REACT_APP_API_URL=http://localhost:8080 fragments-ui
```

## Development Setup (without Docker)

If you prefer to run the development server locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The UI will be available at http://localhost:3000
```

## Configuration

The application uses hardcoded credentials for local development:
- **Username**: `user1@email.com`
- **Password**: `password1`

These credentials are automatically used when the application starts. No login UI is shown.

## API Configuration

By default, the UI expects the fragments API to be running on `http://localhost:8080`. You can change this by:

1. Setting the `REACT_APP_API_URL` environment variable
2. Or modifying the default value in `src/services/fragmentService.js`

## Supported Fragment Types

### Text Fragments
- Plain text (.txt)
- Markdown (.md)
- HTML (.html)
- CSV (.csv)
- JSON (.json)
- YAML (.yaml)

### Image Fragments
- PNG (.png)
- JPEG (.jpg)
- WebP (.webp)
- GIF (.gif)
- AVIF (.avif)

## Fragment Operations

### Create Fragment
1. Click "Create Fragment" tab
2. Select fragment type
3. Enter content or upload file (for images)
4. Click "Create Fragment"

### View Fragments
1. Click "My Fragments" tab
2. Use the search box to filter fragments
3. Click "Refresh" to reload the list

### Edit Fragment
1. Click "Edit" on any fragment card
2. Modify the content
3. Optionally convert to a different type
4. Click "Update Fragment"

### Delete Fragment
1. Click "Delete" on any fragment card
2. Confirm the deletion

### Download Fragment
1. Click "Download" on any fragment card
2. The fragment will be downloaded to your computer

## Offline Support

The application includes offline functionality:
- Fragments are cached locally using IndexedDB
- Actions performed offline are queued and synced when connection is restored
- Offline status indicator shows when you're disconnected

## Building for Production

```bash
# Install dependencies
npm install

# Build for production
npm run build

# The built files will be in the 'dist' directory
```

## Docker Configuration Details

### Multi-stage Build
The Dockerfile uses a multi-stage build:
1. **Build stage**: Uses Node.js to install dependencies and build the application
2. **Runtime stage**: Uses nginx Alpine to serve the built application

### Nginx Configuration
- Serves static files efficiently
- Handles client-side routing
- Includes CORS headers for API communication
- Enables gzip compression
- Sets appropriate cache headers

## Environment Variables

- `REACT_APP_API_URL`: URL of the fragments API (default: `http://localhost:8080`)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server (serves built files)
npm start

# Run linter
npm run lint

# Run tests
npm test
```

## Troubleshooting

### API Connection Issues
- Ensure your fragments API is running on the correct port
- Check that CORS is properly configured on your API
- Verify the `REACT_APP_API_URL` environment variable

### Docker Issues
- Make sure Docker is running
- Check that port 3000 is not already in use
- Rebuild the image if you make changes: `docker-compose up --build`

### Authentication Issues
The app uses basic HTTP authentication with hardcoded credentials. If your API expects different authentication, modify the `setBasicAuth` call in `src/index.js`.

## Files Modified for Docker Support

- `src/index.html` - Removed login UI elements
- `src/index.js` - Removed authentication flow, added direct API connection
- `src/services/fragmentService.js` - Updated API URL for local development
- `webpack.config.js` - Updated default API URL
- `Dockerfile` - Added for containerization
- `docker-compose.yml` - Added for easy development
- `nginx.conf` - Added nginx configuration

## Original Features Removed

- AWS Cognito authentication
- Login/logout UI
- User management
- Token-based authentication flow

The simplified version focuses purely on fragment management operations.
