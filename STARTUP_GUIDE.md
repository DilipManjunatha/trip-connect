# TripConnect - Complete Startup Guide

This guide will help you start both the **Web Application** and **Mobile Application** to see how they look and verify everything is working.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- ✅ **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- ✅ **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- ✅ **npm** or **yarn** (comes with Node.js)
- ✅ **Android Studio** (for mobile app) - [Download](https://developer.android.com/studio)
- ✅ **Java JDK 11+** (for Android development)

---

## 🗄️ Step 1: Database Setup

### 1.1 Install PostgreSQL
If not already installed:
1. Download from [PostgreSQL website](https://www.postgresql.org/download/)
2. Install with default settings
3. Remember the password you set for the `postgres` user

### 1.2 Create Database
Open PostgreSQL command line or pgAdmin and run:

```sql
CREATE DATABASE tripconnect;
```

Or using command line:
```bash
psql -U postgres
CREATE DATABASE tripconnect;
\q
```

---

## 🔧 Step 2: Backend Setup & Startup

### 2.1 Navigate to Backend Directory
```bash
cd backend
```

### 2.2 Install Dependencies
```bash
npm install
```

### 2.3 Create Environment File
Create a `.env` file in the `backend` directory:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Mac/Linux:**
```bash
cp .env.example .env
```

**Or manually create `.env` with:**
```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tripconnect"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:3000"
```

**⚠️ Important:** Replace `YOUR_PASSWORD` with your PostgreSQL password!

### 2.4 Set Up Database
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

### 2.5 Start Backend Server
```bash
npm run dev
```

**✅ Success Indicator:** You should see:
```
🚀 Server running on port 5000
```

**Backend is now running at:** `http://localhost:5000`

**Test it:** Open `http://localhost:5000/api/health` in browser - should return `{"status":"ok",...}`

---

## 🌐 Step 3: Web Frontend Setup & Startup

### 3.1 Open New Terminal Window
Keep the backend running, open a **new terminal window/tab**.

### 3.2 Navigate to Frontend Directory
```bash
cd frontend
```

### 3.3 Install Dependencies
```bash
npm install
```

### 3.4 Create Environment File (Optional)
Create `.env.local` in the `frontend` directory:

**Windows (PowerShell):**
```powershell
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
```

**Mac/Linux:**
```bash
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
```

### 3.5 Start Frontend Development Server
```bash
npm run dev
```

**✅ Success Indicator:** You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Frontend is now running at:** `http://localhost:5173` (or the port shown)

### 3.6 Access Web Application
1. Open your browser
2. Navigate to: `http://localhost:5173` (or the port shown in terminal)
3. You should see the **Login page**

### 3.7 Test Web App Login
**Demo Credentials:**
- Email: `demo@tripconnect.com`
- Password: `demo123`

**Or create a new account:**
- Click "Register" or "Sign Up"
- Fill in the registration form
- Login with your new credentials

---

## 📱 Step 4: Mobile App Setup & Startup

### 4.1 Prerequisites for Mobile
- **Android Studio** installed
- **Android SDK** configured
- **Android Emulator** set up OR **Physical Android device** connected

### 4.2 Navigate to Mobile Directory
Open a **new terminal window/tab**:

```bash
cd mobile
```

### 4.3 Install Dependencies
```bash
npm install
```

### 4.4 Configure Environment
Create `.env` file in the `mobile` directory:

**For Android Emulator:**
```env
API_URL=http://10.0.2.2:5000/api
WS_URL=http://10.0.2.2:5000
```

**For Physical Device (replace with your computer's IP):**
```env
API_URL=http://192.168.0.122:5000/api
WS_URL=http://192.168.0.122:5000
```

**To find your computer's IP:**
- **Windows:** Run `ipconfig` in CMD, look for "IPv4 Address"
- **Mac/Linux:** Run `ifconfig` or `ip addr`, look for inet address

### 4.5 Start Metro Bundler
```bash
npm start
```

**✅ Success Indicator:** You should see Metro bundler starting with QR code

### 4.6 Start Android App

**Option A: Using Command Line**
```bash
# In a new terminal (keep Metro running)
npm run android
```

**Option B: Using Android Studio**
1. Open Android Studio
2. Open the `mobile/android` folder
3. Wait for Gradle sync
4. Click the green "Run" button
5. Select your emulator or device

**✅ Success Indicator:** App should install and launch on your device/emulator

### 4.7 Test Mobile App Login
- Use the same credentials as web app
- Or create a new account
- Navigate through the app to see all features

---

## ✅ Step 5: Verification Checklist

### Backend Verification
- [ ] Backend server running on port 5000
- [ ] Health check works: `http://localhost:5000/api/health`
- [ ] Database connected (no errors in console)
- [ ] Socket.io ready (check console logs)

### Web App Verification
- [ ] Frontend server running (usually port 5173)
- [ ] Can access login page
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Dashboard loads (may show placeholder content)
- [ ] No console errors in browser DevTools

### Mobile App Verification
- [ ] Metro bundler running
- [ ] App installed on device/emulator
- [ ] App launches without crashes
- [ ] Can see login screen
- [ ] Can register/login
- [ ] Navigation works (bottom tabs)
- [ ] No errors in Metro bundler console

---

## 🎯 What to Check in Each App

### Web Application Features to Test:
1. **Login/Register** - Authentication works
2. **Dashboard** - Shows welcome message
3. **Navigation** - Sidebar/menu navigation
4. **Placeholder Pages** - Contacts, Tags, Lists, Groups, Messages (may show "coming soon")

### Mobile Application Features to Test:
1. **Login/Register** - Authentication works
2. **Dashboard** - Shows statistics and user profile
3. **Bottom Navigation** - 5 tabs (Home, Contacts, Groups, Lists, Tags)
4. **Contacts** - View, create, edit contacts
5. **Tags** - View and manage tags
6. **Lists** - View automatic and manual lists
7. **Groups** - View and manage trip groups
8. **Messaging** - Real-time chat in groups
9. **Itinerary** - View trip itinerary
10. **Expenses** - View group expenses

---

## 🐛 Troubleshooting

### Backend Issues

**Problem: Database connection error**
```bash
# Solution: Check DATABASE_URL in .env
# Make sure PostgreSQL is running
# Verify password is correct
```

**Problem: Port 5000 already in use**
```bash
# Solution: Change PORT in .env to another port (e.g., 5001)
# Update FRONTEND_URL accordingly
```

**Problem: JWT_SECRET error**
```bash
# Solution: Make sure .env file exists and has JWT_SECRET set
```

### Frontend Issues

**Problem: Cannot connect to API**
```bash
# Solution: 
# 1. Check backend is running
# 2. Verify VITE_API_URL in .env.local
# 3. Check browser console for CORS errors
```

**Problem: Port already in use**
```bash
# Solution: Vite will automatically use next available port
# Check terminal for actual port number
```

### Mobile App Issues

**Problem: Cannot connect to backend**
```bash
# Solution:
# 1. For emulator: Use 10.0.2.2 instead of localhost
# 2. For physical device: Use your computer's IP address
# 3. Make sure backend is running
# 4. Check firewall settings
```

**Problem: Metro bundler won't start**
```bash
# Solution:
npm start -- --reset-cache
```

**Problem: Build fails**
```bash
# Solution:
cd android
./gradlew clean
cd ..
npm run android
```

**Problem: App crashes on launch**
```bash
# Solution:
# 1. Check Metro bundler logs
# 2. Check Android Studio logs
# 3. Verify .env file exists and has correct URLs
# 4. Make sure backend is running
```

---

## 📸 Quick Visual Guide

### Web App Screens:
1. **Login Page** - Email/password form
2. **Register Page** - User registration form
3. **Dashboard** - Welcome message and stats
4. **Navigation** - Sidebar with menu items

### Mobile App Screens:
1. **Login Screen** - Material Design login form
2. **Register Screen** - Registration form
3. **Dashboard** - User profile, statistics cards
4. **Contacts** - List of contacts with search
5. **Groups** - Trip groups with status badges
6. **Messages** - Real-time chat interface
7. **Bottom Tabs** - 5 navigation tabs

---

## 🚀 Quick Start Commands Summary

**Terminal 1 - Backend:**
```bash
cd backend
npm install
# Create .env file (see Step 2.3)
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

**Terminal 2 - Web Frontend:**
```bash
cd frontend
npm install
# Create .env.local (optional)
npm run dev
# Open http://localhost:5173
```

**Terminal 3 - Mobile:**
```bash
cd mobile
npm install
# Create .env file (see Step 4.4)
npm start
# In another terminal: npm run android
```

---

## 📝 Notes

- **Keep all terminals running** while testing
- **Backend must be running** before starting frontend/mobile
- **Database must be set up** before backend can start
- **Mobile app needs backend URL** configured correctly
- **Web app is partially implemented** (Dashboard works, other pages are placeholders)
- **Mobile app is fully implemented** with all features

---

## 🎉 Success!

If everything is working:
- ✅ Backend API is running
- ✅ Web app is accessible in browser
- ✅ Mobile app is running on device/emulator
- ✅ You can login and see the interfaces

**Next Steps:**
- Explore the mobile app features (fully functional)
- Test creating contacts, groups, messages
- Check real-time messaging functionality
- Review the UI/UX of both platforms

---

**Need Help?** Check the main README.md or review error messages in the console logs.
