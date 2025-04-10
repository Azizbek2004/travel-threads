# Travel Threads

A social platform for travelers to share experiences, connect with other travelers, and discover events around the world.

## Features

- User authentication and profiles
- Post creation with location tagging
- Event creation and management
- Interactive maps
- Real-time messaging
- Social features (following, likes, comments)

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase account
- Google Maps API key

### Installation

1. Clone the repository
   \`\`\`
   git clone https://github.com/Azizbek2004/travel-threads.git
   cd travel-threads
   \`\`\`

2. Install dependencies
   \`\`\`
   npm install
   \`\`\`

4. Fill in your Firebase and Google Maps API credentials in the `.env` file

5. Start the development server
   \`\`\`
   npm run dev
   \`\`\`

## Project Structure

- `/src/components` - Reusable UI components
- `/src/pages` - Page components
- `/src/services` - Firebase and API services
- `/src/hooks` - Custom React hooks
- `/src/contexts` - React context providers
- `/src/types` - TypeScript type definitions
- `/src/utils` - Utility functions
- `/src/travel` - Travel-specific components

## Security Considerations

- API keys are stored in environment variables
- Authentication is required for sensitive operations
- Data validation is performed on both client and server
- Firebase security rules should be configured properly

## Deployment

This project can be deployed to Vercel, Netlify, or Firebase Hosting.

\`\`\`

These changes address the major security vulnerabilities, optimize performance, and finalize the event feature with proper error handling and a complete user experience.
