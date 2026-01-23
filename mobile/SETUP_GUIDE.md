# TripConnect Mobile App - Setup Guide

## Quick Start

### 1. Prerequisites

Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Android Studio** (for Android development)
- **Java Development Kit (JDK)** 11 or higher
- **React Native CLI** (optional, but recommended)

### 2. Install React Native CLI (if not already installed)

```bash
npm install -g react-native-cli
```

### 3. Install Project Dependencies

```bash
cd mobile
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the `mobile` directory:

```bash
cp .env.example .env
```

Edit `.env` with your backend URL:

**For Android Emulator:**
```env
API_URL=http://10.0.2.2:5000/api
WS_URL=http://10.0.2.2:5000
```

**For Physical Device (replace with your computer's IP):**
```env
API_URL=http://192.168.1.100:5000/api
WS_URL=http://192.168.1.100:5000
```

**To find your IP address:**
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` or `ip addr`

### 5. Start Metro Bundler

In the `mobile` directory:

```bash
npm start
```

Or with cache reset:

```bash
npm start -- --reset-cache
```

### 6. Run on Android

**Option 1: Using npm**
```bash
npm run android
```

**Option 2: Using React Native CLI**
```bash
react-native run-android
```

**Option 3: Using Android Studio**
1. Open Android Studio
2. Open the `mobile/android` folder
3. Wait for Gradle sync
4. Click Run button

## Troubleshooting

### Issue: Metro bundler won't start

**Solution:**
```bash
# Clear Metro cache
npm start -- --reset-cache

# Or delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Issue: Android build fails

**Solution:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Issue: Cannot connect to backend API

**Solutions:**
1. **For Emulator**: Use `10.0.2.2` instead of `localhost`
2. **For Physical Device**: 
   - Ensure device and computer are on same network
   - Use computer's local IP address
   - Check firewall settings
   - Ensure backend is running and accessible

### Issue: Socket.io connection fails

**Solutions:**
1. Verify WebSocket URL in `.env` file
2. Ensure backend Socket.io is configured correctly
3. Check backend CORS settings
4. Verify token is being sent correctly

### Issue: "Unable to resolve module" errors

**Solution:**
```bash
# Clear watchman
watchman watch-del-all

# Clear Metro cache
npm start -- --reset-cache

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue: Gradle build errors

**Solution:**
```bash
cd android
./gradlew clean
./gradlew --stop
cd ..
npm run android
```

## Development Tips

### Hot Reloading

The app supports Fast Refresh by default. Changes to code will automatically reload.

### Debugging

1. **React Native Debugger**: Install React Native Debugger app
2. **Chrome DevTools**: Shake device → "Debug"
3. **Flipper**: Install Flipper for advanced debugging

### Testing on Physical Device

1. Enable USB debugging on your Android device
2. Connect device via USB
3. Run `adb devices` to verify connection
4. Run `npm run android`

### Building Release APK

```bash
cd android
./gradlew assembleRelease
```

APK will be in `android/app/build/outputs/apk/release/`

## Project Structure Overview

```
mobile/
├── android/              # Android native code
├── src/
│   ├── screens/          # All screen components
│   ├── navigation/       # Navigation setup
│   ├── services/         # API and socket services
│   ├── context/          # React contexts
│   └── types/            # TypeScript types
├── package.json          # Dependencies
└── .env                  # Environment variables
```

## Common Commands

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (if on Mac)
npm run ios

# Clear cache and start
npm start -- --reset-cache

# Run tests
npm test

# Lint code
npm run lint
```

## Next Steps

1. **Test Authentication**: Try logging in with existing credentials
2. **Create Contacts**: Add some test contacts
3. **Create Tags**: Set up tags for organization
4. **Create Groups**: Set up a trip group
5. **Test Messaging**: Send messages in a group
6. **Explore Features**: Navigate through all screens

## Need Help?

- Check the main README.md in project root
- Review API documentation
- Check React Native documentation: https://reactnative.dev
- Review React Native Paper docs: https://callstack.github.io/react-native-paper

---

**Happy Coding! 🚀**
