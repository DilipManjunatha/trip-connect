# TripConnect - Contact & Group Management System

A comprehensive full-stack application for organizing contacts, creating trip groups, and managing volunteers. Built with modern web technologies for efficiency and scalability.

## 🚀 Features

### Core Functionality
- **Contact Management** - Add, edit, and organize contacts with custom fields
- **Custom Tagging System** - Create flexible tags (e.g., Language: Kannada, Skill: Photography)
- **Automatic Lists** - Dynamic lists generated based on contact tags
- **Trip Groups** - Create and manage travel groups with members from your contacts
- **Communication Hub** - Real-time messaging within trip groups
- **Volunteer Management** - Track volunteer skills and assign roles

### Advanced Features
- **Real-time Updates** - Live notifications and messaging with Socket.io
- **Smart Search** - Filter contacts by name, email, or tags
- **Role-based Access** - Different permission levels (Organizer, Member, Volunteer)
- **Trip Planning Tools** - Itineraries, expense tracking, and budget management
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Data Security** - JWT authentication and encrypted password storage

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** with Prisma ORM
- **JWT** for authentication
- **Socket.io** for real-time communication
- **bcryptjs** for password hashing

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for state management
- **React Hook Form** for form handling
- **Heroicons** for UI icons

## 📁 Project Structure

```
tripconnect/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Authentication & validation
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helper functions
│   ├── prisma/             # Database schema & migrations
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API calls
│   │   └── types/          # TypeScript types
│   └── package.json
└── shared/                 # Shared types and utilities
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd tripconnect
```

2. **Install PostgreSQL**
   - Download and install PostgreSQL from [https://www.postgresql.org/download/](https://www.postgresql.org/download/).
   - During installation, set a username and password for the database.
   - After installation, open the PostgreSQL shell or a database client and create the `tripconnect` database:
     ```sql
     CREATE DATABASE tripconnect;
     ```

3. **Backend Setup**
```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```
Example `.env` file:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/tripconnect"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:3000"
```

4. **Set up the database**
```bash
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Apply migrations
npm run db:seed      # Seed the database with sample data
```

5. **Frontend Setup**
```bash
cd ../frontend
npm install

# Create environment file (optional)
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
```

6. **Start the application**

- **Start the backend server**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

- **Start the frontend development server**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

7. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser.
   - Use demo credentials: `demo@tripconnect.com` / `demo123`.

## 🗄️ Database Schema

### Key Models
- **Users** - System users with authentication
- **Contacts** - People in your network with custom fields
- **Tags** - Flexible labeling system (name + optional value)
- **Lists** - Both manual and automatic contact groupings
- **TripGroups** - Travel groups with members and planning tools
- **Messages** - Real-time communication within groups

### Relationships
- Contacts can have multiple tags (many-to-many)
- Tags automatically generate corresponding lists
- Trip groups contain members (contacts or users)
- Groups have itineraries, expenses, and messages

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Contacts
- `GET /api/contacts` - List contacts with filtering
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Tags
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create new tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

### Lists
- `GET /api/lists` - List all contact lists
- `POST /api/lists` - Create manual list
- `POST /api/lists/:id/contacts` - Add contact to list

### Groups
- `GET /api/groups` - List trip groups
- `POST /api/groups` - Create new group
- `PUT /api/groups/:id` - Update group
- `POST /api/groups/:id/members` - Add members

### Messages
- `GET /api/messages` - Get messages (filtered by group)
- `POST /api/messages` - Send new message
- `DELETE /api/messages/:id` - Delete message

## 🔧 Development

### Environment Variables

**Backend (.env)**
```bash
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/tripconnect"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:3000"
```

**Frontend (.env.local)**
```bash
VITE_API_URL=http://localhost:5000/api
```

### Database Operations

```bash
# Generate Prisma client
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Push schema changes
npm run db:push

# Seed database with sample data
npm run db:seed
```

### Building for Production

**Backend**
```bash
cd backend
npm run build
npm start
```

**Frontend**
```bash
cd frontend
npm run build
# Serve from dist/ folder
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📱 Key Features in Detail

### 1. Contact Management
- Add contacts with name, email, phone, address
- Attach multiple custom tags to each contact
- Search and filter contacts by various criteria
- View contact history and group memberships

### 2. Tagging System
- Create tags with name and optional value (e.g., "Language: Spanish")
- Color-coded tags for visual organization
- Automatic list generation when tags are created
- Tag usage statistics and management

### 3. Smart Lists
- Automatic lists created based on tags
- Manual lists for custom groupings
- Real-time updates when contacts are modified
- Export capabilities for external use

### 4. Trip Groups
- Create groups with destinations, dates, and budgets
- Add contacts or system users as members
- Assign roles (Organizer, Co-Organizer, Member, Volunteer)
- Track confirmation status of members

### 5. Communication
- Real-time messaging within groups
- Announcement system for important updates
- Message history and search
- Socket.io for instant updates

### 6. Planning Tools
- Itinerary management with time and location
- Expense tracking with cost splitting
- Budget monitoring and alerts
- Document sharing capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Future Enhancements

- Mobile application (React Native)
- Advanced analytics and reporting
- Integration with external calendars
- Email notification system
- File upload and document management
- Advanced role-based permissions
- Multi-language support
- API rate limiting and caching

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@tripconnect.com
- Documentation: [Wiki](../../wiki)

---

**Built with ❤️ by the TripConnect Team**