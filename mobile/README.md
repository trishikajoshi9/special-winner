# 📱 Lead Automation Mobile App - Setup & Architecture Guide

## Overview
**Full-stack React Native + TypeScript Android application** for lead management automation with WhatsApp/Aisensy integration and JustDial app tracking.

---

## 🏗️ Project Structure

```
/mobile
├── package.json                 # React Native dependencies
├── tsconfig.json               # TypeScript config
├── app.json                    # Expo configuration
├── .env.example                # Environment variables
│
├── android/
│   ├── AndroidManifest.xml     # Permissions & intents
│   ├── build.gradle            # Gradle config
│   └── JustDialModule/         # Native module for JustDial
│
└── src/
    ├── App.tsx                 # Main app component & navigation
    ├── types/
    │   └── index.ts            # TypeScript interfaces
    ├── store/
    │   └── index.ts            # Zustand state management
    ├── services/
    │   ├── api.ts              # API client for backend
    │   └── justdial.ts         # JustDial native integration
    ├── screens/
    │   ├── SplashScreen.tsx     # Splash & initialization
    │   ├── LoginScreen.tsx      # Email + Gmail OAuth login
    │   ├── DashboardScreen.tsx  # Main dashboard (hot leads, stats)
    │   ├── ChatListScreen.tsx   # Chat conversations list
    │   ├── ChatScreen.tsx       # Individual conversation (WhatsApp, AI)
    │   └── ConfigScreen.tsx     # Settings (JustDial, permissions, etc.)
    ├── components/
    │   ├── LeadCard.tsx         # Individual lead card
    │   ├── ChatBubble.tsx       # Message bubble UI
    │   ├── JustDialConfig.tsx   # JustDial setup UI
    │   └── PermissionCard.tsx   # Permission request UI
    ├── navigation/
    │   ├── RootNavigator.tsx    # Main navigation structure
    │   └── AppNavigator.tsx     # App stack navigation
    └── utils/
        ├── colors.ts           # Color constants
        ├── formatting.ts       # Format dates, numbers
        └── helpers.ts          # Utility functions
```

---

## 🔧 Key Features & Implementation

### 1. **Authentication** (Supabase + Gmail OAuth)
**Files**: `LoginScreen.tsx`, `api.ts`

```typescript
// Email login
const response = await apiService.loginWithEmail(email, password);

// Gmail OAuth
const response = await apiService.loginWithGmail(gmailCode);

// Auto-restore token from AsyncStorage on app start
```

### 2. **Dashboard** (Hot Leads & Metrics)
**Files**: `DashboardScreen.tsx`

- Display hot leads (score >= 70)
- Real-time stats: Total, Contacted, Converted, Revenue
- Quick actions: View lead, Send message, Start new chat
- Pull-to-refresh integration

### 3. **Chat System** (WhatsApp + AI)
**Files**: `ChatScreen.tsx`, `ChatBubble.tsx`

```typescript
// Features:
- Receive messages from customers (via Aisensy or Meta API)
- Manual reply from user
- AI auto-response (if enabled)
- Message history persistence
- Real-time notifications

// Architecture:
POST /api/webhooks/aisensy/message (backend receives customer messages)
→ Socket.io to mobile app (real-time update)
→ Display in ChatScreen
→ User taps "Send" or AI auto-replies
```

### 4. **Start New Chat** (WhatsApp List)
**Files**: `ChatListScreen.tsx`

- "+" button shows list of WhatsApp contacts (from Aisensy/Meta API)
- Select contact → Create new conversation
- Initialize with welcome message
- Track in database

### 5. **JustDial Integration** (App Tracking & Leads)
**Files**: `justdial.ts`, `JustDialConfig.tsx`, `ConfigScreen.tsx`

```typescript
// Architecture:
1. User grants permissions (READ_INSTALLED_PACKAGES, etc.)
2. App monitors JustDial notifications via Accessibility Service
3. When new lead/inquiry received:
   - Extract phone number from notification
   - Create lead in backend
   - Auto-score + auto-engage (via Ai sensy WhatsApp)
   - Log timestamp and details

// Implemented via:
- Native Android module (JustDialModule)
- Accessibility Service listener
- Notification interception
- Deep linking to JustDial app

// UI:
- Config screen: "Link JustDial"
- Permission card: Request needed permissions
- Toggle: Enable/disable JustDial monitoring
- View: Recent leads extracted from JustDial
```

### 6. **Config Screen** (Settings & Integrations)
**Files**: `ConfigScreen.tsx`

- Installed apps list (with icons)
- Link/Unlink JustDial
- Enable/disable auto-reply
- AI response settings
- WhatsApp provider selection (Aisensy vs Meta)
- Notification preferences
- Sync interval settings

---

## 📦 Dependencies

### Main Libraries
```json
{
  "react-native": "^0.72.0",
  "expo": "^49.0.0",
  "@react-navigation/native": "^6.1.6",
  "@supabase/supabase-js": "^2.38.4",
  "zustand": "^4.5.0",
  "axios": "^1.5.0",
  "react-native-permissions": "^3.10.0",
  "react-native-device-info": "^10.10.0",
  "react-native-contacts": "^7.0.3",
  "@react-native-firebase/messaging": "^18.3.0"
}
```

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
cd /home/madhusudan/Pictures/special-winner/mobile

# Install with Expo
npm install

# Or with yarn
yarn install
```

### Step 2: Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
EXPO_PUBLIC_API_URL=http://your-backend-api.com
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_key
GOOGLE_CLIENT_ID=your_gmail_client_id
AISENSY_API_KEY=your_aisensy_key
```

### Step 3: Set Up Android Emulator (Vivo Device Profile)

```bash
# 1. Open Android Studio
open -a "Android Studio"

# 2. Configure AVD (Android Virtual Device)
#    - Click "Virtual Device Manager"
#    - Create New Device
#    - Select: Vivo X70 Pro (or similar Vivo device)
#    - Choose API Level: 33 or 34 (Android 13/14)
#    - Allocate: 4GB RAM, 2GB storage
#    - Finish

# 3. Start emulator
$ANDROID_HOME/emulator/emulator -avd vivo_device &

# 4. Verify emulator started
adb devices
```

### Step 4: Run App on Emulator

```bash
# Start Expo development server
npm start

# Press 'a' for Android emulator
# Or manually run:
expo run:android

# Metro bundler will compile and deploy to emulator
```

### Step 5: Generate APK for Testing

```bash
# Create production APK
eas build --platform android --local

# Or using Gradle directly
cd android && ./gradlew assembleRelease
```

---

## 🔐 Permissions Required

**Android Manifest** automatically includes:

```xml
<!-- Network -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Contacts & Messages -->
<uses-permission android:name="android.permission.READ_CONTACTS" />
<uses-permission android:name="android.permission.READ_SMS" />

<!-- Storage -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<!-- JustDial Tracking -->
<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" />

<!-- Notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Accessibility (for JustDial notification monitoring) -->
<uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE" />
```

**Runtime Permissions**:
- Request in `ConfigScreen` → "Link JustDial"
- User must approve each permission
- Stored in device settings

---

## 🔌 Backend Integration

### API Endpoints Used

```typescript
// Auth
POST   /api/auth/signin
POST   /api/auth/gmail/mobile

// Leads
GET    /api/leads
POST   /api/leads
GET    /api/leads/{id}
PUT    /api/leads/{id}
POST   /api/leads/score

// Chat
GET    /api/conversations
POST   /api/conversations
GET    /api/conversations/{id}
POST   /api/messages

// WhatsApp
GET    /api/integrations/whatsapp/contacts
POST   /api/integrations/whatsapp/send
GET    /api/integrations/aisensy/contacts

// JustDial
POST   /api/integrations/justdial/link
GET    /api/integrations/justdial/leads

// Dashboard
GET    /api/dashboard/stats
GET    /api/analytics
```

### Real-time Updates (Socket.io - Optional)

```typescript
// Listen for incoming messages
socket.on('message:received', (message) => {
  useChatStore.addMessage(conversationId, message);
});

// Listen for auto-engagement
socket.on('lead:engaged', (lead) => {
  useLeadStore.updateLead(lead);
});
```

---

## 📱 Vivo Device Emulator Setup (Detailed)

### AVD Profile Configuration

```
Device Name: vivo_device
Device Type: Phone (Not Tablet)
Target API: Android 13 (API 33) or higher
RAM: 4096 MB
Internal Storage: 2048 MB
SD Card: 512 MB
Device Frame: Enabled
Front Camera: Emulated
Back Camera: Emulated
Keyboard: Hardware Keyboard Present
Sensors: Accelerometer, Gyroscope, GPS
```

### For Specific Vivo Models

```
Vivo X70 Pro:
- Screen: 6.56" AMOLED (1440 x 3200)
- Processor: Snapdragon 888 (simulate via high API level)
- RAM: 12GB (use 4GB for emulator)
- API Level: 33+

Vivo Y73:
- Screen: 6.44" IPS (2400 x 1080)
- Processor: MediaTek Dimensity 700
- RAM: 8GB (use 4GB for emulator)
- API Level: 31+

Generic Vivo:
- Use default Phone profile
- API Level: 33+
```

### Emulator Performance Tips

```bash
# Disable animations for faster performance
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0

# Increase emulator RAM allocation
# Edit ~/.android/avd/vivo_device/config.ini:
# hw.ram.size=4096
# hw.gpu.enabled=yes

# Enable hardware acceleration
# Check: Intel HAXM or KVM (Linux) installed
```

---

## 🧪 Testing Checklist

- [ ] App launches without errors
- [ ] Login works (email + Gmail)
- [ ] Dashboard displays hot leads
- [ ] Chat: Send/receive messages works
- [ ] JustDial: Permissions requested & stored
- [ ] JustDial: Can detect app installation
- [ ] JustDial: Notification monitoring works
- [ ] WhatsApp contacts list loads
- [ ] Config screen shows all settings
- [ ] Notifications received in real-time
- [ ] App survives background/foreground transitions
- [ ] Memory usage reasonable (< 500MB)

---

## 🐛 Debugging

### View Logs

```bash
# Live logs from emulator
adb logcat | grep "ReactNativeJS"

# Save logs to file
adb logcat > app-logs.txt

# Filter by tag
adb logcat ReactNativeJS:V *:S
```

### Connect to Dev Tools

```bash
# Metro Debugger
# Shake device (or use menu) → "Debug"

# Remote debugging
# Chrome: chrome://inspect

# React Native Debugger
npm install -g react-native-debugger
react-native-debugger
```

---

## 📊 App Flow Diagram

```
┌─────────────────────────────────────────────┐
│        App Launch                           │
│   (Check token in AsyncStorage)             │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
   Token Found?         No Token
        │                    │
        ↓                    ↓
    Dashboard         LoginScreen
        │                    │
        ├─ Hot Leads    Email/Gmail
        ├─ Stats        ↓
        ├─ "+" New      Authenticated
        │               ↓
        ↓            AsyncStorage.setItem('token')
    ChatList              │
        │                 └────────┬─────────────┘
        ├─ Select Chat            │
        │  ↓                       │
        │  ChatScreen             │
        │  ├─ Message history     │
        │  ├─ Input field         │
        │  ├─ Send/AI reply       │
        │  └─ Notifications       │
        │                         │
        ├─ + New Chat            │
        │  ↓                      │
        │  Select WhatsApp        │
        │  Contact → Start Chat   │
        │                         │
        └─ Config                 │
           ├─ Link JustDial       │
           ├─ Permissions         │
           ├─ Settings            │
           └─ Logout → LoginScreen│
                      (clear token)
```

---

## 🚀 Next Steps

1. **Install dependencies**: `npm install`
2. **Setup emulator**: Android Studio → AVD Manager → Vivo Device
3. **Run app**: `npm start` → Press `a`
4. **Test auth**: Login with email/Gmail
5. **Link JustDial**: Config → "Link JustDial" → Grant permissions
6. **Test WhatsApp**: Dashboard → "+" → Select contact
7. **Receive messages**: Send via Aisensy/Meta API → See in app

---

## 📞 Support & Resources

- **Expo Docs**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/
- **Android Studio**: https://developer.android.com/studio
- **Firebase Cloud Messaging**: https://firebase.google.com/docs/cloud-messaging

---

**Status**: ✅ Framework & Structure Complete
**Ready for**: Component development & Native module integration
