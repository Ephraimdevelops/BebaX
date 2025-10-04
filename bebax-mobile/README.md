# BebaX Mobile App - React Native

The official BebaX mobile application built with React Native and Expo for iOS and Android app stores.

## 🚀 Features

- **Multi-Role Authentication**: Customer, Driver, and Admin dashboards
- **Location Services**: GPS-based pickup and dropoff locations
- **Real-time Updates**: Live ride status tracking
- **Native Mobile Experience**: Optimized for iOS and Android
- **Push Notifications**: Ride updates and alerts
- **Camera Integration**: Driver document upload
- **Offline Storage**: AsyncStorage for user persistence

## 📱 App Store Ready

This app is configured for deployment to:
- 📱 **Apple App Store** (iOS)
- 🤖 **Google Play Store** (Android)

## 🛠 Tech Stack

- **Framework**: React Native with Expo Managed Workflow
- **Navigation**: React Navigation v7
- **State Management**: React Hooks + AsyncStorage
- **UI Components**: React Native + React Native Vector Icons
- **Location**: Expo Location
- **Camera**: Expo Camera
- **Notifications**: Expo Notifications
- **Backend**: Connects to existing Next.js API

## 📋 Prerequisites

Before running the app, make sure you have:

1. **Node.js** (v18 or higher)
2. **Expo CLI**: `npm install -g @expo/cli`
3. **EAS CLI** (for building): `npm install -g eas-cli`
4. **Expo Go App** on your device (for development)

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd bebax-mobile
npm install
```

### 2. Start Development Server
```bash
npx expo start
```

### 3. Run on Device/Simulator
- **Android**: Press `a` in terminal or scan QR code with Expo Go
- **iOS**: Press `i` in terminal or scan QR code with Expo Go (iOS)
- **Web**: Press `w` for web version

## 🏗 Building for App Stores

### Setup EAS Build (First Time)
```bash
# Login to Expo
eas login

# Configure the project
eas build:configure
```

### Build for Android (APK/AAB)
```bash
# Development build
eas build --platform android --profile development

# Production build for Play Store
eas build --platform android --profile production
```

### Build for iOS (IPA)
```bash
# Development build
eas build --platform ios --profile development

# Production build for App Store
eas build --platform ios --profile production
```

## 📱 App Store Submission

### Android (Google Play Console)
```bash
# Submit to Google Play Store
eas submit --platform android
```

### iOS (App Store Connect)
```bash
# Submit to Apple App Store
eas submit --platform ios
```

## 🔧 Configuration

### App Identifiers
- **iOS Bundle ID**: `com.bebax.movingtrucks`
- **Android Package**: `com.bebax.movingtrucks`

### Permissions
- **Location**: For pickup/dropoff locations
- **Camera**: For driver document upload
- **Notifications**: For ride updates

### API Configuration
The app connects to your backend at:
```
API_BASE_URL = 'https://cargomate-4.preview.emergentagent.com/api'
```

Update this URL in `/App.js` to point to your production API.

## 📁 Project Structure

```
bebax-mobile/
├── App.js                 # Main app entry point
├── src/
│   └── screens/
│       ├── AuthScreen.js           # Login/Register
│       ├── CustomerDashboard.js    # Customer main screen
│       ├── DriverDashboard.js      # Driver main screen
│       ├── AdminDashboard.js       # Admin main screen
│       ├── BookRideScreen.js       # Ride booking
│       ├── RideDetailsScreen.js    # Ride details
│       └── ProfileScreen.js        # User profile
├── app.json              # Expo configuration
├── eas.json              # EAS Build configuration
└── package.json          # Dependencies

```

## 🎨 User Interface

### Design System
- **Primary Colors**: Blue (#2563eb) for customers, Green (#16a34a) for drivers, Red (#dc2626) for admin
- **Typography**: System fonts with clear hierarchy
- **Icons**: Material Design Icons from React Native Vector Icons
- **Layout**: Mobile-first responsive design

### Navigation Structure
- **Stack Navigation**: For screen transitions
- **Tab Navigation**: For main app sections
- **Role-based Routing**: Different tabs per user role

## 📊 Features by User Role

### 👤 Customers
- ✅ Book rides with location services
- ✅ Track ride status in real-time
- ✅ View booking history
- ✅ Rate and review drivers

### 🚛 Drivers
- ✅ View available rides
- ✅ Accept/reject ride requests
- ✅ Update ride status (start/complete)
- ✅ Driver registration and verification

### 👨‍💼 Admins
- ✅ Dashboard with analytics
- ✅ Verify driver registrations
- ✅ Monitor all rides and users
- ✅ System overview and management

## 🔄 Backend Integration

The mobile app connects to the existing Next.js backend with full API compatibility:

- **Authentication**: `/api/auth/login`, `/api/auth/register`
- **Rides**: `/api/rides`, `/api/rides/accept`, `/api/rides/status`
- **Drivers**: `/api/drivers/register`, `/api/drivers/verify`
- **Users**: `/api/users`

## 📱 App Store Requirements

### Metadata Required
- **App Name**: BebaX
- **Description**: Your trusted moving partner in Tanzania
- **Keywords**: moving, trucks, transport, Tanzania, logistics
- **Category**: Business / Transportation
- **Content Rating**: 4+ (iOS) / Everyone (Android)

### Assets Needed
- **App Icon**: 1024x1024 PNG
- **Screenshots**: Various device sizes
- **App Store Screenshots**: iPhone, iPad, Android phones/tablets

### Store Descriptions

#### Short Description (150 chars)
"Connect with verified drivers for all your moving needs in Tanzania. Book trucks, track rides, and move with confidence."

#### Long Description
"BebaX is Tanzania's premier moving service platform that connects customers with verified drivers operating various types of moving vehicles. Whether you're moving furniture, boxes, or commercial goods, BebaX makes it easy to find the right vehicle for your needs.

Features:
• Book rides with tricycles, vans, trucks, or semi-trailers
• GPS-based pickup and delivery tracking  
• Real-time ride status updates
• Secure payment options including mobile money
• Rate and review drivers
• 24/7 customer support

For Drivers:
• Register and verify your vehicle
• Accept ride requests in your area
• Track earnings and ride history
• Build your reputation through ratings

Join thousands of satisfied customers and drivers across Tanzania who trust BebaX for their moving needs."

## 🚢 Deployment Checklist

### Pre-Deployment
- [ ] Update API URL to production
- [ ] Test all user flows
- [ ] Verify permissions work correctly
- [ ] Test on real devices (iOS/Android)
- [ ] Optimize app performance
- [ ] Add app icons and splash screens

### App Store Submission
- [ ] Create Apple Developer Account ($99/year)
- [ ] Create Google Play Developer Account ($25 one-time)
- [ ] Prepare app store assets (icons, screenshots)
- [ ] Write app descriptions and metadata
- [ ] Set up app store listings
- [ ] Submit for review

### Post-Launch
- [ ] Monitor crash reports
- [ ] Track user feedback and ratings
- [ ] Plan app updates and new features
- [ ] Monitor API usage and performance

## 🎯 Next Steps

1. **Test the app thoroughly** on real devices
2. **Update API URL** to your production backend
3. **Create app store accounts** (Apple Developer, Google Play)
4. **Prepare marketing assets** (screenshots, descriptions)
5. **Build production versions** using EAS Build
6. **Submit to app stores** for review

## 📞 Support

For development support or questions about the BebaX mobile app, please refer to:
- Expo Documentation: https://docs.expo.dev/
- React Native Documentation: https://reactnative.dev/
- EAS Build Guide: https://docs.expo.dev/build/introduction/

---

**BebaX Mobile** - Your trusted moving partner, now in your pocket! 🚛📱