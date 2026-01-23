# 🚀 Quick Start - TripConnect

## Fast Setup (5 Minutes)

### 1. Database Setup
```bash
# Create database in PostgreSQL
psql -U postgres
CREATE DATABASE tripconnect;
\q
```

### 2. Backend (Terminal 1)
```bash
cd backend
npm install

# Create .env file:
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tripconnect"
# JWT_SECRET="your-secret-key"
# JWT_EXPIRES_IN="7d"
# FRONTEND_URL="http://localhost:3000"
# PORT=5000

npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

### 3. Web App (Terminal 2)
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### 4. Mobile App (Terminal 3)
```bash
cd mobile
npm install

# Create .env file:
# API_URL=http://10.0.2.2:5000/api  (for emulator)
# WS_URL=http://10.0.2.2:5000

npm start
# In new terminal: npm run android
```

## Login Credentials
- Email: `demo@tripconnect.com`
- Password: `demo123`

## Verify Everything Works

✅ Backend: `http://localhost:5000/api/health`  
✅ Web: `http://localhost:5173`  
✅ Mobile: App launches on device/emulator

---

**Full guide:** See `STARTUP_GUIDE.md` for detailed instructions.
