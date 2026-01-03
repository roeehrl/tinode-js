/**
 * @file SQLite storage implementation for React Native.
 * Provides persistent storage using expo-sqlite, matching the DB class API.
 *
 * This file is only imported in React Native environments via index.native.js.
 * Metro bundler handles platform-specific resolution automatically.
 *
 * @copyright 2025 Activon
 * @license Apache 2.0
 */
'use strict';

// Direct import - this file is only loaded in React Native via index.native.js
import * as SQLite from 'expo-sqlite';

// Serializable topic fields (matching db.js)
const TOPIC_FIELDS = ['created', 'updated', 'deleted', 'touched', 'read', 'recv', 'seq',
  'clear', 'defacs', 'creds', 'public', 'trusted', 'private', '_aux', '_deleted'
];

// Serializable subscription fields
const SUBSCRIPTION_FIELDS = ['updated', 'mode', 'read', 'recv', 'clear', 'lastSeen', 'userAgent'];

// Serializable message fields
const MESSAGE_FIELDS = ['topic', 'seq', 'ts', '_status', 'from', 'head', 'content'];

/**
 * SQLite storage implementation for React Native.
 * Implements the Storage interface matching the DB class API.
 */
export default class SQLiteStorage {
  /**
   * Create SQLiteStorage instance.
   * @param {string} dbName - Database file name (default: 'tinode.db')
   * @param {function} onError - Error callback
   * @param {function} logger - Logger callback
   */
  constructor(dbName, onError, logger) {
    this._onError = function() {};
    this._logger = function() {};
    this._db = null;
    this._dbName = 'tinode.db';
    this._ready = false;

    if (typeof dbName === 'string') {
      this._dbName = dbName;
    } else if (typeof dbName === 'function') {
      // Handle case where dbName is actually onError (backwards compat)
      this._onError = dbName;
      this._logger = onError || this._logger;
    }
    if (typeof onError === 'function') {
      this._onError = onError;
    }
    if (typeof logger === 'function') {
      this._logger = logger;
    }
  }

  /**
   * Initialize the SQLite database and create tables.
   * @returns {Promise} Promise resolved when database is ready.
   */
  async initDatabase() {
    const self = this;
    try {
      self._db = await SQLite.openDatabaseAsync(self._dbName);

      // Enable WAL mode for better performance
      await self._db.execAsync('PRAGMA journal_mode = WAL');

      // Create all tables
      await self._createTables();

      self._ready = true;
      self._logger('SQLiteStorage', 'Database initialized:', self._dbName);
      return self._db;
    } catch (err) {
      self._logger('SQLiteStorage', 'initDatabase error:', err);
      self._onError(err);
      throw err;
    }
  }

  /**
   * Create all required tables.
   */
  async _createTables() {
    const self = this;
    // Topics table - primary key is 'name'
    await self._db.execAsync(`
      CREATE TABLE IF NOT EXISTS topics (
        name TEXT PRIMARY KEY,
        created TEXT,
        updated TEXT,
        deleted TEXT,
        touched TEXT,
        read INTEGER DEFAULT 0,
        recv INTEGER DEFAULT 0,
        seq INTEGER DEFAULT 0,
        clear INTEGER DEFAULT 0,
        defacs TEXT,
        creds TEXT,
        public TEXT,
        trusted TEXT,
        private TEXT,
        _aux TEXT,
        _deleted INTEGER DEFAULT 0,
        tags TEXT,
        acs TEXT
      )
    `);

    // Users table - primary key is 'uid'
    await self._db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        public TEXT
      )
    `);

    // Subscriptions table - composite primary key (topic, uid)
    await self._db.execAsync(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        topic TEXT NOT NULL,
        uid TEXT NOT NULL,
        updated TEXT,
        mode TEXT,
        read INTEGER DEFAULT 0,
        recv INTEGER DEFAULT 0,
        clear INTEGER DEFAULT 0,
        lastSeen TEXT,
        userAgent TEXT,
        PRIMARY KEY (topic, uid)
      )
    `);

    // Messages table - composite primary key (topic, seq)
    await self._db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        topic TEXT NOT NULL,
        seq INTEGER NOT NULL,
        ts TEXT,
        _status INTEGER DEFAULT 0,
        from_uid TEXT,
        head TEXT,
        content TEXT,
        PRIMARY KEY (topic, seq)
      )
    `);

    // Delete log table - composite primary key (topic, low, hi)
    await self._db.execAsync(`
      CREATE TABLE IF NOT EXISTS dellog (
        topic TEXT NOT NULL,
        clear INTEGER NOT NULL,
        low INTEGER NOT NULL,
        hi INTEGER NOT NULL,
        PRIMARY KEY (topic, low, hi)
      )
    `);

    // Create index for efficient clear ID lookups
    await self._db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_dellog_topic_clear ON dellog(topic, clear)
    `);
  }

  /**
   * Delete the database.
   * @returns {Promise<boolean>} Promise resolved when database is deleted.
   */
  async deleteDatabase() {
    const self = this;
    try {
      if (self._db) {
        await self._db.closeAsync();
        self._db = null;
      }

      await SQLite.deleteDatabaseAsync(self._dbName);

      self._ready = false;
      self._logger('SQLiteStorage', 'Database deleted:', self._dbName);
      return true;
    } catch (err) {
      self._logger('SQLiteStorage', 'deleteDatabase error:', err);
      self._onError(err);
      throw err;
    }
  }

  /**
   * Check if database is ready.
   * @returns {boolean} True if database is initialized and ready.
   */
  isReady() {
    return this._ready && this._db !== null;
  }

  /**
   * Attempt to recover the database connection if it becomes stale.
   * This handles cases where the native database handle becomes invalid
   * after app lifecycle events or reconnections.
   * @returns {Promise<boolean>} True if recovery succeeded.
   */
  async _recoverDatabase() {
    const self = this;
    try {
      console.log('[SQLiteStorage] Attempting database recovery...');

      // Close existing connection if any
      if (self._db) {
        try {
          await self._db.closeAsync();
        } catch (closeErr) {
          // Ignore close errors - the handle may already be invalid
          console.log('[SQLiteStorage] Close during recovery failed (expected):', closeErr.message);
        }
        self._db = null;
      }

      // Re-open the database
      self._ready = false;
      await self.initDatabase();

      console.log('[SQLiteStorage] Database recovery successful');
      return true;
    } catch (err) {
      console.error('[SQLiteStorage] Database recovery failed:', err);
      return false;
    }
  }

  /**
   * Wrapper to execute database operations with automatic recovery.
   * If an operation fails with NullPointerException, attempts recovery and retry.
   * @param {function} operation - Async function to execute
   * @param {string} operationName - Name for logging
   * @returns {Promise<any>} Result of the operation
   */
  async _withRecovery(operation, operationName) {
    const self = this;
    try {
      return await operation();
    } catch (err) {
      // Check if this is a stale database handle error
      const isStaleHandle = err.message && (
        err.message.includes('NullPointerException') ||
        err.message.includes('prepareAsync') ||
        err.message.includes('database is not open') ||
        err.message.includes('SQLiteDatabase')
      );

      if (isStaleHandle) {
        console.warn('[SQLiteStorage]', operationName, 'failed with stale handle, attempting recovery...');
        const recovered = await self._recoverDatabase();
        if (recovered) {
          // Retry the operation once
          console.log('[SQLiteStorage] Retrying', operationName, 'after recovery...');
          return await operation();
        }
      }

      // Re-throw if not recoverable
      throw err;
    }
  }

  // ==================== Topics ====================

  /**
   * Save or update topic in the database.
   * @param {Object} topic - Topic object to save.
   * @returns {Promise} Promise resolved on completion.
   */
  async updTopic(topic) {
    const self = this;

    // Skip topics that haven't been confirmed by the server yet.
    // The _new flag is true for topics created locally but not yet subscribed.
    // Only persist after subscribe succeeds and server assigns the real topic name.
    if (topic?._new) {
      console.log('[SQLiteStorage] updTopic DEFERRED - topic not yet confirmed by server:', topic.name);
      return Promise.resolve();
    }

    if (!self.isReady()) {
      return Promise.resolve();
    }

    return self._withRecovery(async () => {
      // Get existing topic to merge data
      const existing = await self._db.getFirstAsync(
        'SELECT * FROM topics WHERE name = ?',
        [topic.name]
      );

      const data = self._serializeTopic(existing, topic);

      console.log('[SQLiteStorage] updTopic:', data.name, 'seq:', data.seq);

      // Use INSERT OR REPLACE for atomic upsert
      await self._db.runAsync(`
        INSERT OR REPLACE INTO topics (
          name, created, updated, deleted, touched,
          read, recv, seq, clear,
          defacs, creds, public, trusted, private,
          _aux, _deleted, tags, acs
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.name, data.created, data.updated, data.deleted, data.touched,
        data.read, data.recv, data.seq, data.clear,
        data.defacs, data.creds, data.public, data.trusted, data.private,
        data._aux, data._deleted, data.tags, data.acs
      ]);
      console.log('[SQLiteStorage] updTopic SUCCESS:', data.name);
    }, 'updTopic');
  }

  /**
   * Mark or unmark topic as deleted.
   * @param {string} name - Topic name.
   * @param {boolean} deleted - Deleted status.
   * @returns {Promise} Promise resolved on completion.
   */
  async markTopicAsDeleted(name, deleted) {
    const self = this;
    if (!self.isReady()) {
      return Promise.resolve();
    }

    return self._withRecovery(async () => {
      await self._db.runAsync(
        'UPDATE topics SET _deleted = ? WHERE name = ?',
        [deleted ? 1 : 0, name]
      );
    }, 'markTopicAsDeleted');
  }

  /**
   * Remove topic and all related data from database.
   * @param {string} name - Topic name to remove.
   * @returns {Promise} Promise resolved on completion.
   */
  async remTopic(name) {
    const self = this;
    if (!self.isReady()) {
      return Promise.resolve();
    }

    return self._withRecovery(async () => {
      // Delete topic, subscriptions, and messages in a transaction
      await self._db.withTransactionAsync(async function() {
        await self._db.runAsync('DELETE FROM topics WHERE name = ?', [name]);
        await self._db.runAsync('DELETE FROM subscriptions WHERE topic = ?', [name]);
        await self._db.runAsync('DELETE FROM messages WHERE topic = ?', [name]);
        await self._db.runAsync('DELETE FROM dellog WHERE topic = ?', [name]);
      });
    }, 'remTopic');
  }

  /**
   * Execute callback for each stored topic.
   * @param {function} callback - Callback for each topic.
   * @param {Object} context - Callback context.
   * @returns {Promise<Array>} Promise resolved with all topics.
   */
  async mapTopics(callback, context) {
    const self = this;
    if (!self.isReady()) {
      return [];
    }

    return self._withRecovery(async () => {
      const rows = await self._db.getAllAsync('SELECT * FROM topics');
      const topics = rows.map(function(row) {
        return self._deserializeTopicRow(row);
      });

      if (callback) {
        topics.forEach(function(topic) {
          callback.call(context, topic);
        });
      }

      return topics;
    }, 'mapTopics');
  }

  /**
   * Copy data from serialized object to topic.
   * @param {Object} topic - Target topic object.
   * @param {Object} src - Source data.
   */
  deserializeTopic(topic, src) {
    TOPIC_FIELDS.forEach(function(f) {
      if (src.hasOwnProperty(f)) {
        topic[f] = src[f];
      }
    });
    if (Array.isArray(src.tags)) {
      topic._tags = src.tags;
    }
    if (src.acs) {
      topic.setAccessMode(src.acs);
    }
    topic.seq |= 0;
    topic.read |= 0;
    topic.unread = Math.max(0, topic.seq - topic.read);
  }

  // ==================== Users ====================

  /**
   * Add or update user in database.
   * @param {string} uid - User ID.
   * @param {Object} pub - User's public data.
   * @returns {Promise} Promise resolved on completion.
   */
  async updUser(uid, pub) {
    const self = this;
    if (arguments.length < 2 || pub === undefined) {
      return;
    }
    if (!self.isReady()) {
      return Promise.resolve();
    }

    return self._withRecovery(async () => {
      await self._db.runAsync(
        'INSERT OR REPLACE INTO users (uid, public) VALUES (?, ?)',
        [uid, JSON.stringify(pub)]
      );
    }, 'updUser');
  }

  /**
   * Remove user from database.
   * @param {string} uid - User ID to remove.
   * @returns {Promise} Promise resolved on completion.
   */
  async remUser(uid) {
    const self = this;
    if (!self.isReady()) {
      return Promise.resolve();
    }

    return self._withRecovery(async () => {
      await self._db.runAsync('DELETE FROM users WHERE uid = ?', [uid]);
    }, 'remUser');
  }

  /**
   * Execute callback for each stored user.
   * @param {function} callback - Callback for each user.
   * @param {Object} context - Callback context.
   * @returns {Promise<Array>} Promise resolved with all users.
   */
  async mapUsers(callback, context) {
    const self = this;
    if (!self.isReady()) {
      return [];
    }

    return self._withRecovery(async () => {
      const rows = await self._db.getAllAsync('SELECT * FROM users');
      const users = rows.map(function(row) {
        return {
          uid: row.uid,
          public: self._parseJSON(row.public)
        };
      });

      if (callback) {
        users.forEach(function(user) {
          callback.call(context, user);
        });
      }

      return users;
    }, 'mapUsers');
  }

  /**
   * Get a single user from database.
   * @param {string} uid - User ID.
   * @returns {Promise<Object|undefined>} Promise resolved with user or undefined.
   */
  async getUser(uid) {
    const self = this;
    if (!self.isReady()) {
      return undefined;
    }

    return self._withRecovery(async () => {
      const row = await self._db.getFirstAsync(
        'SELECT * FROM users WHERE uid = ?',
        [uid]
      );

      if (!row) {
        return undefined;
      }

      return {
        uid: row.uid,
        public: self._parseJSON(row.public)
      };
    }, 'getUser');
  }

  // ==================== Subscriptions ====================

  /**
   * Add or update subscription in database.
   * @param {string} topicName - Topic name.
   * @param {string} uid - User ID.
   * @param {Object} sub - Subscription data.
   * @returns {Promise} Promise resolved on completion.
   */
  async updSubscription(topicName, uid, sub) {
    const self = this;
    if (!self.isReady()) {
      return Promise.resolve();
    }

    return self._withRecovery(async () => {
      // Get existing subscription
      const existing = await self._db.getFirstAsync(
        'SELECT * FROM subscriptions WHERE topic = ? AND uid = ?',
        [topicName, uid]
      );

      const data = self._serializeSubscription(existing, topicName, uid, sub);

      await self._db.runAsync(
        'INSERT OR REPLACE INTO subscriptions (topic, uid, updated, mode, read, recv, clear, lastSeen, userAgent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [data.topic, data.uid, data.updated, data.mode, data.read, data.recv, data.clear, data.lastSeen, data.userAgent]
      );
    }, 'updSubscription');
  }

  /**
   * Execute callback for each subscription in a topic.
   * @param {string} topicName - Topic name.
   * @param {function} callback - Callback for each subscription.
   * @param {Object} context - Callback context.
   * @returns {Promise<Array>} Promise resolved with subscriptions.
   */
  async mapSubscriptions(topicName, callback, context) {
    const self = this;
    if (!self.isReady()) {
      return [];
    }

    return self._withRecovery(async () => {
      const rows = await self._db.getAllAsync(
        'SELECT * FROM subscriptions WHERE topic = ?',
        [topicName]
      );

      const subs = rows.map(function(row) {
        return self._deserializeSubscriptionRow(row);
      });

      if (callback) {
        subs.forEach(function(sub) {
          callback.call(context, sub);
        });
      }

      return subs;
    }, 'mapSubscriptions');
  }

  // ==================== Messages ====================

  /**
   * Save message to database.
   * @param {Object} msg - Message to save.
   * @returns {Promise} Promise resolved on completion.
   */
  async addMessage(msg) {
    const self = this;
    if (!self.isReady()) {
      return Promise.resolve();
    }

    return self._withRecovery(async () => {
      const data = self._serializeMessage(null, msg);

      // Build params array explicitly, converting undefined to null for SQLite
      const params = [
        data.topic,
        data.seq,
        data.ts !== undefined ? data.ts : null,
        data._status !== undefined ? data._status : null,
        data.from !== undefined ? data.from : null,
        data.head !== undefined ? data.head : null,
        data.content !== undefined ? data.content : null
      ];

      await self._db.runAsync(
        `INSERT OR REPLACE INTO messages (topic, seq, ts, _status, from_uid, head, content) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        params
      );
      console.log('[SQLiteStorage] addMessage SUCCESS:', data.topic, data.seq);
    }, 'addMessage');
  }

  /**
   * Update message delivery status.
   * @param {string} topicName - Topic name.
   * @param {number} seq - Message sequence number.
   * @param {number} status - New status.
   * @returns {Promise} Promise resolved on completion.
   */
  async updMessageStatus(topicName, seq, status) {
    const self = this;
    if (!self.isReady()) {
      return Promise.resolve();
    }

    return self._withRecovery(async () => {
      await self._db.runAsync(
        'UPDATE messages SET _status = ? WHERE topic = ? AND seq = ?',
        [status, topicName, seq]
      );
    }, 'updMessageStatus');
  }

  /**
   * Remove messages from database.
   * @param {string} topicName - Topic name.
   * @param {number} from - Start of range (inclusive).
   * @param {number} to - End of range (exclusive).
   * @returns {Promise} Promise resolved on completion.
   */
  async remMessages(topicName, from, to) {
    const self = this;
    if (!self.isReady()) {
      return Promise.resolve();
    }

    return self._withRecovery(async () => {
      if (!from && !to) {
        // Delete all messages for topic
        await self._db.runAsync(
          'DELETE FROM messages WHERE topic = ?',
          [topicName]
        );
      } else if (to > 0) {
        // Delete range [from, to)
        await self._db.runAsync(
          'DELETE FROM messages WHERE topic = ? AND seq >= ? AND seq < ?',
          [topicName, from, to]
        );
      } else {
        // Delete single message
        await self._db.runAsync(
          'DELETE FROM messages WHERE topic = ? AND seq = ?',
          [topicName, from]
        );
      }
    }, 'remMessages');
  }

  /**
   * Read messages from database.
   * @param {string} topicName - Topic name.
   * @param {Object} query - Query parameters.
   * @param {function} callback - Callback for each message.
   * @param {Object} context - Callback context.
   * @returns {Promise<Array>} Promise resolved with messages.
   */
  async readMessages(topicName, query, callback, context) {
    const self = this;
    query = query || {};

    if (!self.isReady()) {
      return [];
    }

    return self._withRecovery(async () => {
      var result = [];

      // Handle individual message ranges
      if (Array.isArray(query.ranges)) {
        for (var i = 0; i < query.ranges.length; i++) {
          var range = query.ranges[i];
          var msgs;
          if (range.hi) {
            msgs = await self._db.getAllAsync(
              'SELECT * FROM messages WHERE topic = ? AND seq >= ? AND seq < ? ORDER BY seq DESC',
              [topicName, range.low, range.hi]
            );
          } else {
            msgs = await self._db.getAllAsync(
              'SELECT * FROM messages WHERE topic = ? AND seq = ?',
              [topicName, range.low]
            );
          }

          var deserialized = msgs.map(function(row) {
            return self._deserializeMessageRow(row);
          });

          if (callback) {
            callback.call(context, deserialized);
          }

          result = result.concat(deserialized);
        }
        return result;
      }

      // Handle single range query
      var since = query.since > 0 ? query.since : 0;
      var before = query.before > 0 ? query.before : Number.MAX_SAFE_INTEGER;
      var limit = query.limit | 0;

      var sql = 'SELECT * FROM messages WHERE topic = ? AND seq >= ? AND seq < ? ORDER BY seq DESC';
      var params = [topicName, since, before];

      if (limit > 0) {
        sql += ' LIMIT ?';
        params.push(limit);
      }

      var rows = await self._db.getAllAsync(sql, params);

      result = rows.map(function(row) {
        return self._deserializeMessageRow(row);
      });

      if (callback) {
        result.forEach(function(msg) {
          callback.call(context, msg);
        });
      }

      return result;
    }, 'readMessages');
  }

  // ==================== Delete Log ====================

  /**
   * Add records of deleted messages.
   * @param {string} topicName - Topic name.
   * @param {number} delId - Deletion transaction ID.
   * @param {Array} ranges - Deleted message ranges.
   * @returns {Promise} Promise resolved on completion.
   */
  async addDelLog(topicName, delId, ranges) {
    const self = this;
    if (!self.isReady()) {
      return Promise.resolve();
    }

    return self._withRecovery(async () => {
      // Use withTransactionAsync for proper transaction handling
      await self._db.withTransactionAsync(async function() {
        for (var i = 0; i < ranges.length; i++) {
          var r = ranges[i];
          await self._db.runAsync(
            'INSERT OR REPLACE INTO dellog (topic, clear, low, hi) VALUES (?, ?, ?, ?)',
            [topicName, delId, r.low, r.hi || (r.low + 1)]
          );
        }
      });
    }, 'addDelLog');
  }

  /**
   * Read deleted message records.
   * @param {string} topicName - Topic name.
   * @param {Object} query - Query parameters.
   * @returns {Promise<Array>} Promise resolved with deletion records.
   */
  async readDelLog(topicName, query) {
    const self = this;
    query = query || {};

    if (!self.isReady()) {
      return [];
    }

    return self._withRecovery(async () => {
      var result = [];

      // Handle individual message ranges
      if (Array.isArray(query.ranges)) {
        for (var i = 0; i < query.ranges.length; i++) {
          var range = query.ranges[i];
          var hi = range.hi || (range.low + 1);
          var entries = await self._db.getAllAsync(
            'SELECT * FROM dellog WHERE topic = ? AND low >= ? AND low < ? ORDER BY clear DESC',
            [topicName, range.low, hi]
          );

          for (var j = 0; j < entries.length; j++) {
            result.push({
              low: entries[j].low,
              hi: entries[j].hi
            });
          }
        }
        return result;
      }

      // Handle single range query
      var since = query.since > 0 ? query.since : 0;
      var before = query.before > 0 ? query.before : Number.MAX_SAFE_INTEGER;
      var limit = query.limit | 0;

      var sql = 'SELECT * FROM dellog WHERE topic = ? AND clear >= ? AND clear < ? ORDER BY clear DESC';
      var params = [topicName, since, before];

      if (limit > 0) {
        sql += ' LIMIT ?';
        params.push(limit);
      }

      var rows = await self._db.getAllAsync(sql, params);
      for (var k = 0; k < rows.length; k++) {
        result.push({
          low: rows[k].low,
          hi: rows[k].hi
        });
      }

      return result;
    }, 'readDelLog');
  }

  /**
   * Get maximum deletion ID for a topic.
   * @param {string} topicName - Topic name.
   * @returns {Promise<Object|undefined>} Promise resolved with max deletion entry.
   */
  async maxDelId(topicName) {
    const self = this;
    if (!self.isReady()) {
      return undefined;
    }

    return self._withRecovery(async () => {
      const row = await self._db.getFirstAsync(
        'SELECT * FROM dellog WHERE topic = ? ORDER BY clear DESC LIMIT 1',
        [topicName]
      );

      if (!row) {
        return undefined;
      }

      return {
        topic: row.topic,
        clear: row.clear,
        low: row.low,
        hi: row.hi
      };
    }, 'maxDelId');
  }

  // ==================== Private Helper Methods ====================

  /**
   * Safely parse JSON, returning null on error.
   */
  _parseJSON(str) {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  }

  /**
   * Serialize topic for storage.
   */
  _serializeTopic(dst, src) {
    const self = this;
    const res = dst ? Object.assign({}, dst) : {
      name: src.name
    };

    TOPIC_FIELDS.forEach(function(f) {
      if (src.hasOwnProperty(f)) {
        // JSON stringify complex objects
        if (typeof src[f] === 'object' && src[f] !== null) {
          res[f] = JSON.stringify(src[f]);
        } else {
          res[f] = src[f];
        }
      }
    });

    // Handle _deleted as integer
    if (typeof res._deleted === 'boolean') {
      res._deleted = res._deleted ? 1 : 0;
    }

    if (Array.isArray(src._tags)) {
      res.tags = JSON.stringify(src._tags);
    }

    if (src.acs) {
      res.acs = JSON.stringify(
        typeof src.getAccessMode === 'function' ?
        src.getAccessMode().jsonHelper() :
        src.acs
      );
    }

    return res;
  }

  /**
   * Deserialize topic row from database.
   */
  /**
   * Convert ISO string to Date if valid, otherwise return null.
   */
  _parseDate(str) {
    if (!str) return null;
    const date = new Date(str);
    return isNaN(date) ? null : date;
  }

  _deserializeTopicRow(row) {
    const self = this;
    const topic = {
      name: row.name,
      created: self._parseDate(row.created),
      updated: self._parseDate(row.updated),
      deleted: self._parseDate(row.deleted),
      touched: self._parseDate(row.touched),
      read: row.read || 0,
      recv: row.recv || 0,
      seq: row.seq || 0,
      clear: row.clear || 0,
      _deleted: row._deleted === 1
    };

    // Parse JSON fields
    if (row.defacs) topic.defacs = self._parseJSON(row.defacs);
    if (row.creds) topic.creds = self._parseJSON(row.creds);
    if (row.public) topic.public = self._parseJSON(row.public);
    if (row.trusted) topic.trusted = self._parseJSON(row.trusted);
    if (row.private) topic.private = self._parseJSON(row.private);
    if (row._aux) topic._aux = self._parseJSON(row._aux);
    if (row.tags) topic.tags = self._parseJSON(row.tags);
    if (row.acs) topic.acs = self._parseJSON(row.acs);

    return topic;
  }

  /**
   * Serialize subscription for storage.
   */
  _serializeSubscription(dst, topicName, uid, sub) {
    const res = dst ? Object.assign({}, dst) : {
      topic: topicName,
      uid: uid
    };

    SUBSCRIPTION_FIELDS.forEach(function(f) {
      if (sub.hasOwnProperty(f)) {
        res[f] = sub[f];
      }
    });

    return res;
  }

  /**
   * Deserialize subscription row from database.
   */
  _deserializeSubscriptionRow(row) {
    const self = this;
    return {
      topic: row.topic,
      uid: row.uid,
      updated: self._parseDate(row.updated),
      mode: row.mode,
      read: row.read || 0,
      recv: row.recv || 0,
      clear: row.clear || 0,
      lastSeen: self._parseDate(row.lastSeen),
      userAgent: row.userAgent
    };
  }

  /**
   * Serialize message for storage.
   */
  _serializeMessage(dst, msg) {
    const res = dst ? Object.assign({}, dst) : {};

    MESSAGE_FIELDS.forEach(function(f) {
      if (msg.hasOwnProperty(f)) {
        if (f === 'head' || f === 'content') {
          // JSON stringify head and content
          res[f] = typeof msg[f] === 'object' && msg[f] !== null ? JSON.stringify(msg[f]) : msg[f];
        } else if (f === 'ts') {
          // Convert Date objects to ISO string for SQLite
          res[f] = msg[f] instanceof Date ? msg[f].toISOString() : msg[f];
        } else {
          res[f] = msg[f];
        }
      }
    });

    return res;
  }

  /**
   * Deserialize message row from database.
   */
  _deserializeMessageRow(row) {
    const self = this;
    const msg = {
      topic: row.topic,
      seq: row.seq,
      ts: row.ts ? new Date(row.ts) : null, // Convert ISO string back to Date
      _status: row._status || 0,
      from: row.from_uid
    };

    if (row.head) msg.head = self._parseJSON(row.head);
    if (row.content) msg.content = self._parseJSON(row.content);

    return msg;
  }
}
