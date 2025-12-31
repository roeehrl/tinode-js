/**
 * @file Tinode SDK - Web Entry Point
 *
 * This is the main entry point for web/browser environments.
 * Uses IndexedDB for storage via the DB class.
 *
 * For React Native, Metro bundler will use index.native.js instead.
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
