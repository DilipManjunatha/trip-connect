# TripConnect Mobile App

Android mobile application for TripConnect - Contact & Group Management System.

## Features

### ✅ Implemented Features

1. **Authentication**
   - User login and registration
   - JWT token management
   - Secure token storage with AsyncStorage
   - Auto-login on app restart

2. **Contact Management**
   - View all contacts with search functionality
   - Create, edit, and delete contacts
   - Contact details with tags, email, phone, address
   - Avatar display

3. **Tagging System**
   - View all tags
   - Create and edit tags with custom colors
   - Tag name and optional value support
   - Color-coded tag display

4. **Smart Lists**
   - View all smart lists (automatic and manual)
   - List details with member contacts
   - Automatic smart lists based on tags

5. **Trips**
   - View all trips
   - Create and edit trips
   - Group details with members, dates, budget
   - Status tracking (Planning, Confirmed, Ongoing, Completed, Cancelled)
   - Member roles (Organizer, Co-Organizer, Member, Volunteer)

6. **Real-time Messaging**
   - Group chat functionality
   - Real-time message updates via Socket.io
   - Message history
   - Send and receive messages instantly

7. **Itinerary Management**
   - View itinerary items for trips
   - Display time, location, and cost information

8. **Expense Tracking**
   - View expenses for trips
   - Total expense summary
   - Expense details with category, date, and split type

9. **Dashboard**
   - Overview statistics
   - Quick access to recent groups
   - User profile display

## Technology Stack

- **React Native 0.73.0** - Cross-platform mobile framework
- **TypeScript** - Type safety
- **React Navigation** - Navigation and routing
- **React Native Paper** - Material Design components
- **React Query (TanStack Query)** - Data fetching and caching
- **Socket.io Client** - Real-time communication
- **AsyncStorage** - Local storage for tokens
- **Axios** - HTTP client
- **date-fns** - Date formatting
- **React Hook Form** - Form handling

## Project Structure

```
mobile/
├── src/
│   ├── App.tsx                 # Main app component
│   ├── theme.ts                # Theme configuration
│   ├── types/                  # TypeScript type definitions
│   ├── services/               # API and socket services
│   │   ├── api.ts             # REST API client
│   │   └── socket.ts          # Socket.io client
│   ├── context/                # React contexts
│   │   └── AuthContext.tsx    # Authentication context
│   ├── navigation/             # Navigation setup
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   └── screens/                # Screen components
│       ├── auth/              # Authentication screens
│       ├── contacts/          # Contact management
│       ├── tags/              # Tag management
│       ├── lists/             # List management
│       ├── groups/            # Trip management
│       └── messages/          # Messaging
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- React Native development environment set up
- Android Studio (for Android development)
- Backend API running (see main README.md)

## Installation

1. **Navigate to mobile directory**
```bash
cd mobile
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` file:
```env
API_URL=http://your-backend-url:5000/api
WS_URL=http://your-backend-url:5000
```

For Android emulator, use:
```env
API_URL=http://10.0.2.2:5000/api
WS_URL=http://10.0.2.2:5000
```

For physical device, use your computer's IP address:
```env
API_URL=http://192.168.x.x:5000/api
WS_URL=http://192.168.x.x:5000
```

## Running the App

### Android

1. **Start Metro bundler**
```bash
npm start
```

2. **Run on Android emulator or device**
```bash
npm run android
```

Or use Android Studio to build and run the app.

## Configuration

### API Configuration

Update the API URL in `src/services/api.ts` or use environment variables:

```typescript
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
```

### Socket Configuration

Update the WebSocket URL in `src/services/socket.ts`:

```typescript
const WS_URL = process.env.WS_URL || 'http://localhost:5000';
```

## Features in Detail

### Authentication Flow

1. User logs in or registers
2. JWT token is stored securely in AsyncStorage
3. Token is automatically included in API requests
4. Socket connection is established with token authentication
5. User session persists across app restarts

### Contact Management

- **List View**: Displays all contacts with search functionality
- **Detail View**: Shows full contact information, tags, and actions
- **Form View**: Create or edit contacts with validation
- **Tags**: Visual tag display with color coding

### Real-time Messaging

- **Socket Connection**: Automatically connects when user logs in
- **Group Chat**: Join group rooms for messaging
- **Live Updates**: Messages appear instantly without refresh
- **Message History**: Loads previous messages on screen open

### Navigation Structure

- **Bottom Tabs**: Home, Contacts, Groups, Smart Lists, Tags
- **Stack Navigation**: Nested navigation for detail screens
- **Auth Stack**: Separate navigation for login/register

## API Integration

The app integrates with the TripConnect backend API:

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `GET /api/tags` - List tags
- `GET /api/lists` - List smart lists
- `GET /api/groups` - List trips
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message

## Socket Events

- `connect` - Socket connection established
- `joinGroup` - Join a group room
- `leaveGroup` - Leave a group room
- `sendMessage` - Send a message
- `message` - Receive new message
- `messageDeleted` - Message deleted notification

## Development Notes

### Adding New Screens

1. Create screen component in appropriate directory
2. Add route to navigation stack
3. Update types in `src/types/index.ts`
4. Add API methods if needed

### Styling

- Uses React Native Paper theme
- Material Design 3 components
- Consistent color scheme
- Responsive layouts

### State Management

- React Query for server state
- Context API for authentication
- Local state for forms and UI

## Troubleshooting

### Connection Issues

- Ensure backend API is running
- Check API_URL and WS_URL in .env
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For physical device, use your computer's local IP address

### Build Issues

- Clear Metro cache: `npm start -- --reset-cache`
- Clean Android build: `cd android && ./gradlew clean`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Socket Connection Issues

- Verify WebSocket URL is correct
- Check backend Socket.io configuration
- Ensure token is being sent in socket auth

## Future Enhancements

- [ ] Push notifications
- [ ] Offline mode with data sync
- [ ] Image upload for contacts and groups
- [ ] Dark mode support
- [ ] Biometric authentication
- [ ] Contact import/export
- [ ] Expense splitting calculator
- [ ] Calendar integration
- [ ] Map integration for locations
- [ ] File sharing in messages

## License

MIT License - see LICENSE file in project root

## Support

For issues and questions:
- Check the main project README.md
- Review API documentation
- Create an issue on GitHub

---

**Built with React Native for TripConnect**
