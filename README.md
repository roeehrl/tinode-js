# @roeehrl/tinode-sdk

> Fork of [tinode-js](https://github.com/tinode/tinode-js) with React Native support and SQLite persistence

This is a **modified fork** of the official Tinode JavaScript SDK, specifically adapted for **React Native** applications. It adds persistent storage using SQLite and platform-specific file handling.

## What is Tinode?

[Tinode](https://github.com/tinode/chat) is an open-source instant messaging backend server. This SDK implements the client-side protocol for connecting to Tinode servers from JavaScript/TypeScript applications.

## Fork Overview

| Aspect | Original (tinode-js) | This Fork (@roeehrl/tinode-sdk) |
|--------|----------------------|----------------------------------|
| Storage | IndexedDB (browser only) | **SQLite via expo-sqlite** (React Native) |
| File Uploads | Blob API (browser only) | **File URI support** (React Native) |
| Platform | Web browsers | **React Native (iOS/Android)** |
| Persistence | Session-based (IndexedDB) | **Permanent** (SQLite database) |

## Key Changes

### 1. SQLite Storage (`storage-sqlite.js`)

**Problem:** Original SDK used IndexedDB, which doesn't exist in React Native.

**Solution:** Created `SQLiteStorage` class using `expo-sqlite` with the same API as the original `DB` class:

```typescript
import { Tinode, SQLiteStorage } from '@roeehrl/tinode-sdk';

// Create storage instance
const sqliteStorage = new SQLiteStorage('activon-chat.db');

// Set as storage provider BEFORE creating Tinode instance
Tinode.setStorageProvider(sqliteStorage);

// Now Tinode will persist all data to SQLite
const tinode = new Tinode({ host: '...', apiKey: '...' });
```

**Database Schema:**
- `topics` - Chat topics metadata
- `users` - User profiles
- `subscriptions` - Topic subscriptions
- `messages` - Chat messages
- `dellog` - Deletion log (for sync)

### 2. React Native Entry Point (`index.native.js`)

Metro bundler automatically selects this file for native platforms:

```javascript
// package.json exports field
"exports": {
  ".": {
    "react-native": "./src/index.native.js",  // ← Selected by Metro
    "browser": "./umd/tinode.prod.js"
  }
}
```

### 3. File Upload Support (`large-file.native.js`)

React Native doesn't have the Blob API. This fork provides `LargeFileHelperNative` that accepts **file URIs**:

```typescript
const { uri } = await DocumentPicker.getDocumentAsync({});
tinode.getLargeFileHelper().uploadUri(
  uri,
  'photo.jpg',
  'image/jpeg',
  size,
  null,
  (progress) => console.log(progress),
  (success) => console.log('Uploaded!'),
  (error) => console.error(error)
);
```

---

## Polyfill Requirements

The SDK requires several JavaScript polyfills because **Hermes** (React Native's JavaScript engine) doesn't provide all standard Web APIs.

### Required Polyfills

| Polyfill | Purpose | Why Needed |
|----------|---------|------------|
| `text-encoding-polyfill` | `TextEncoder` / `TextDecoder` | Hermes doesn't have these APIs |
| `core-js/stable/structured-clone` | `structuredClone()` | Hermes doesn't have this |
| `unicode-segmenter` | `Intl.Segmenter` | For text segmentation in Drafty parser |

### Installation

```bash
yarn add text-encoding-polyfill core-js unicode-segmenter
```

---

## Metro Configuration

**Critical:** Metro must have `package exports` enabled to properly resolve `.native.ts` files:

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// REQUIRED: Enable package exports for platform-specific module resolution
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
```

**Without this**, Metro will ignore the `exports` field in `package.json` and use the wrong entry point.

---

## Setup Guide

### Step 1: Install Dependencies

```bash
# Tinode SDK fork
yarn add @roeehrl/tinode-sdk@^0.25.1-sqlite.8

# Required peer dependency
yarn add expo-sqlite

# Polyfills
yarn add text-encoding-polyfill core-js unicode-segmenter
```

### Step 2: Import Polyfills First

**Before** any Tinode imports, import polyfills in your app's entry point:

```typescript
// App.tsx or index.tsx - TOP OF FILE
import 'text-encoding-polyfill';
import 'core-js/stable/structured-clone';
import 'unicode-segmenter/intl-polyfill';

// Now you can import Tinode
import { Tinode, SQLiteStorage } from '@roeehrl/tinode-sdk';
```

### Step 3: Configure SQLite Storage

```typescript
import { Tinode, SQLiteStorage } from '@roeehrl/tinode-sdk';

// Create SQLite storage instance
const sqliteStorage = new SQLiteStorage('activon-chat.db');

// Initialize database
await sqliteStorage.initDatabase();

// Set as storage provider
Tinode.setStorageProvider(sqliteStorage);
```

### Step 4: Create Tinode Instance

```typescript
const tinode = new Tinode({
  host: 'your-tinode-server.com',
  apiKey: 'your-api-key',
  secure: true // use wss:// for secure WebSocket
});
```

---

## EAS Build Configuration

For EAS (Expo Application Services) builds, ensure `expo-sqlite` is properly configured:

### app.config.js

```javascript
export default {
  expo: {
    plugins: [
      ['expo-sqlite', {
        // Optional: Enable database restoration on app launch
        enableRestore: true,
      }],
    ],
  },
};
```

### eas.json Configuration

```json
{
  "build": {
    "ios": {
      "bundleIdentifier": "com.yourapp"
    },
    "android": {
      "bundleIdentifier": "com.yourapp"
    }
  }
}
```

---

## Limitations & Known Issues

### 1. Database File Location

- **iOS:** `NSDocumentDirectory` (app's Documents folder)
- **Android:** App's internal storage
- Database file name: `activon-chat.db` (configurable)

### 2. Database Recovery

The SQLite storage includes automatic recovery for stale database handles after app lifecycle events. This handles cases where:
- App goes to background and comes back
- Device is locked/unlocked
- App is suspended and resumed

### 3. Hermes Limitations

These JavaScript APIs are **not available** in Hermes:
- `Blob` → Use file URIs instead
- `URL.createObjectURL()` → Not supported
- IndexedDB → Replaced by SQLite

### 4. Thread Safety

expo-sqlite is **not thread-safe**. All database operations must run on the JavaScript thread.

---

## Migration from Original SDK

If migrating from the original `tinode-js`:

### Before (Original)
```typescript
import { Tinode } from 'tinode-sdk';

// Uses IndexedDB (doesn't work in React Native)
const tinode = new Tinode({ host: '...', apiKey: '...' });
```

### After (This Fork)
```typescript
import 'text-encoding-polyfill';
import 'core-js/stable/structured-clone';
import 'unicode-segmenter/intl-polyfill';
import { Tinode, SQLiteStorage } from '@roeehrl/tinode-sdk';

// Setup SQLite storage
const storage = new SQLiteStorage('chat.db');
await storage.initDatabase();
Tinode.setStorageProvider(storage);

// Create Tinode instance
const tinode = new Tinode({ host: '...', apiKey: '...' });
```

---

## Platform-Specific Behavior

| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| SQLite Storage | ✅ expo-sqlite | ✅ expo-sqlite | ❌ Use IndexedDB |
| File Uploads | ✅ File URIs | ✅ File URIs | ✅ Blob API |
| WebSocket | ✅ WSS supported | ✅ WSS supported | ✅ WS supported |
| Polyfills Required | ✅ Yes | ✅ Yes | ❌ No |

---

## API Reference

### SQLiteStorage

```typescript
class SQLiteStorage {
  constructor(dbName: string, onError?: Function, logger?: Function)

  async initDatabase(): Promise<void>
  async deleteDatabase(): Promise<boolean>
  isReady(): boolean

  // Topics
  async updTopic(topic: Object): Promise<void>
  async remTopic(name: string): Promise<void>
  async mapTopics(callback: Function, context: Object): Promise<Array>

  // Users
  async updUser(uid: string, pub: Object): Promise<void>
  async remUser(uid: string): Promise<void>
  async mapUsers(callback: Function, context: Object): Promise<Array>

  // Messages
  async addMessage(msg: Object): Promise<void>
  async remMessages(topic: string, from?: number, to?: number): Promise<void>
  async readMessages(topic: string, query: Object, callback: Function, context: Object): Promise<Array>
}
```

### Tinode.setStorageProvider()

```typescript
static setStorageProvider(storage: SQLiteStorage): void
```

Sets the storage provider for all Tinode instances. Must be called **before** creating any Tinode instances.

---

## Troubleshooting

### "Cannot find module 'expo-sqlite'"

```bash
yarn add expo-sqlite
npx expo prebuild --clean
```

### "TextEncoder is not defined"

Make sure polyfills are imported **before** any Tinode imports:

```typescript
// WRONG
import { Tinode } from '@roeehrl/tinode-sdk';
import 'text-encoding-polyfill';

// RIGHT
import 'text-encoding-polyfill';
import { Tinode } from '@roeehrl/tinode-sdk';
```

### "setStorageProvider is not a function"

Make sure you're using the React Native entry point. Check that Metro is using `index.native.js`:

```javascript
// In metro.config.js
config.resolver.unstable_enablePackageExports = true; // ← MUST be true
```

---

## License

Apache-2.0 (Same as original Tinode SDK)

## Original Project

- [Tinode Server](https://github.com/tinode/chat)
- [Original SDK](https://github.com/tinode/tinode-js)
- [Documentation](http://tinode.github.io/js-api/)
