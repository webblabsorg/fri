# Frith AI Mobile App

React Native mobile app for Frith AI Legal Tools.

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

## Setup

```bash
cd mobile
npm install
```

## Development

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Features

- **Home**: Dashboard with usage stats and quick actions
- **Tools**: Browse and search all available legal tools
- **Tool Detail**: Run tools with custom input
- **History**: View past tool runs
- **Profile**: Account settings and logout

## Push Notifications

The app supports push notifications via Expo Notifications. To enable:

1. Configure FCM for Android in `app.json`
2. Configure APNs for iOS in your Apple Developer account
3. Register device tokens via the `/api/mobile/devices` endpoint

## Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## App Store Submission

1. Configure `app.json` with your app details
2. Build production binaries with EAS Build
3. Submit to App Store Connect (iOS) or Google Play Console (Android)

## License

Proprietary - Frith AI
