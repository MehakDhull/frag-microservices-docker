# Fragments UI - Web Application

A modern, responsive web application for managing fragments in the Fragments Microservice.

## Features

- 🔐 **Authentication**: Supports both Amazon Cognito (production) and HTTP Basic Auth (development)
- 📱 **Progressive Web App (PWA)**: Works offline with data synchronization
- 🎨 **Modern UI**: Beautiful, responsive design built with vanilla JavaScript and CSS
- 📄 **Fragment Management**: Create, read, update, and delete fragments
- 🔄 **File Conversion**: Convert between different fragment formats (Markdown → HTML, PNG → JPEG, etc.)
- 📴 **Offline Support**: Works without internet connection using IndexedDB
- 📊 **Multiple Formats**: Support for text, JSON, YAML, CSV, and image fragments

## Supported Fragment Types

### Text Formats
- Plain Text (.txt)
- Markdown (.md) - converts to HTML
- HTML (.html)
- CSV (.csv) - converts to JSON
- JSON (.json) - converts to YAML
- YAML (.yaml)

### Image Formats
- PNG (.png)
- JPEG (.jpeg/.jpg)
- WebP (.webp)
- GIF (.gif)
- AVIF (.avif)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A running Fragments API server

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fragments-ui
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory:
```env
REACT_APP_API_URL=http://your-fragments-api-url
```

4. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

```bash
npm run build
```

This creates a `dist/` directory with optimized files ready for deployment.

### Running Production Build

```bash
npm start
```

## Architecture

### Components

- **FragmentsApp**: Main application class
- **FragmentService**: API communication layer
- **AuthService**: Authentication handling (Cognito + Basic Auth)
- **OfflineService**: PWA offline functionality with IndexedDB

### PWA Features

- Service Worker for caching
- Offline data storage using IndexedDB
- Background sync when connection restored
- App-like experience on mobile devices

## Authentication

### Development Mode (localhost)
Uses HTTP Basic Auth with these default credentials:
- Username: `user1@email.com`
- Password: `password1`

### Production Mode
Uses Amazon Cognito OAuth 2.0 flow with Hosted UI.

## API Integration

The app connects to the Fragments API server and supports:

- `GET /v1/fragments` - List user fragments
- `POST /v1/fragments` - Create new fragment
- `GET /v1/fragments/:id` - Get fragment data
- `PUT /v1/fragments/:id` - Update fragment
- `DELETE /v1/fragments/:id` - Delete fragment
- `GET /v1/fragments/:id/info` - Get fragment metadata
- `GET /v1/fragments/:id.ext` - Convert fragment format

## Offline Functionality

When offline, the app:
- Shows cached fragments from IndexedDB
- Queues create/update/delete operations
- Syncs changes when connection is restored
- Displays offline status indicator

## Browser Support

- Chrome 80+
- Firefox 78+
- Safari 13+
- Edge 80+

## Development

### Project Structure

```
src/
├── index.js              # Main application entry
├── index.html            # HTML template
├── styles.css            # Application styles
├── manifest.json         # PWA manifest
└── services/
    ├── fragmentService.js # API communication
    ├── authService.js     # Authentication
    └── offlineService.js  # Offline/PWA functionality
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Serve production build
- `npm run lint` - Run ESLint

## Deployment

### Static Hosting
The built application can be deployed to any static hosting service:
- Netlify
- Vercel
- AWS S3 + CloudFront
- GitHub Pages

### Docker
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the UNLICENSED license.
