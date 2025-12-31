/**
 * @file Tinode SDK - React Native Entry Point
 *
 * This is the entry point for React Native (iOS/Android) environments.
 * Metro bundler automatically picks this file for native platforms.
 *
 * Exports SQLiteStorage for persistent storage using expo-sqlite.
 *
 * @module tinode-sdk
 * @copyright 2015-2025 Tinode LLC, Activon
 * @license Apache 2.0
 */
'use strict';

// Re-export everything from tinode.js
export {
  Tinode,
  AccessMode,
  DB,
  Drafty
}
from './tinode.js';

// Default export is Tinode class
export {
  Tinode as
  default
}
from './tinode.js';

// Export SQLiteStorage for React Native persistence
export {
  default as SQLiteStorage
}
from './storage-sqlite.js';
