/**
 * @file Large file upload/download utilities for React Native.
 * Provides file upload support using file URIs instead of Blob objects.
 *
 * This file is only imported in React Native environments via index.native.js.
 * Metro bundler handles platform-specific resolution automatically.
 *
 * @copyright 2015-2025 Tinode LLC, Activon
 * @license Apache 2.0
 */
'use strict';

import CommError from './comm-error.js';
import {
  isUrlRelative
} from './utils.js';

/**
 * @class LargeFileHelperNative - utilities for uploading and downloading files out of band in React Native.
 * Don't instantiate this class directly. Use {Tinode.getLargeFileHelper} instead.
 * @memberof Tinode
 *
 * @param {Tinode} tinode - the main Tinode object.
 * @param {string} version - protocol version, i.e. '0'.
 */
export default class LargeFileHelperNative {
  constructor(tinode, version) {
    this._tinode = tinode;
    this._version = version;

    this._apiKey = tinode._apiKey;
    this._authToken = tinode.getAuthToken();

    // Ongoing requests (using AbortController for fetch).
    this._abortControllers = [];
  }

  /**
   * Build the upload URL.
   * @private
   */
  _buildUploadUrl(baseUrl) {
    let url = `/v${this._version}/file/u/`;
    if (baseUrl) {
      let base = baseUrl;
      if (base.endsWith('/')) {
        base = base.slice(0, -1);
      }
      if (base.startsWith('http://') || base.startsWith('https://')) {
        url = base + url;
      } else {
        throw new Error(`Invalid base URL '${baseUrl}'`);
      }
    }
    return url;
  }

  /**
   * Build headers for upload request.
   * @private
   */
  _buildHeaders() {
    const headers = {
      'X-Tinode-APIKey': this._apiKey,
    };
    if (this._authToken) {
      headers['X-Tinode-Auth'] = `Token ${this._authToken.token}`;
    }
    return headers;
  }

  /**
   * Start uploading a file from a URI (React Native).
   *
   * @memberof Tinode.LargeFileHelperNative#
   *
   * @param {string} uri - File URI (e.g., 'file:///path/to/audio.m4a')
   * @param {string} filename - Filename for the upload
   * @param {string} mimetype - MIME type of the file
   * @param {number} size - File size in bytes (optional, for progress calculation)
   * @param {string} avatarFor - Topic name if the upload represents an avatar
   * @param {function} onProgress - Progress callback. Takes one {float} parameter 0..1
   * @param {function} onSuccess - Success callback. Called with server control message.
   * @param {function} onFailure - Failure callback. Called with error or null.
   *
   * @returns {Promise<string>} Promise resolved with the upload URL.
   */
  uploadUri(uri, filename, mimetype, size, avatarFor, onProgress, onSuccess, onFailure) {
    const baseUrl = (this._tinode._secure ? 'https://' : 'http://') + this._tinode._host;
    return this.uploadUriWithBaseUrl(baseUrl, uri, filename, mimetype, size, avatarFor, onProgress, onSuccess, onFailure);
  }

  /**
   * Start uploading a file from a URI to a specific base URL.
   *
   * @memberof Tinode.LargeFileHelperNative#
   *
   * @param {string} baseUrl - Base URL of upload server.
   * @param {string} uri - File URI (e.g., 'file:///path/to/audio.m4a')
   * @param {string} filename - Filename for the upload
   * @param {string} mimetype - MIME type of the file
   * @param {number} size - File size in bytes (optional)
   * @param {string} avatarFor - Topic name if the upload represents an avatar
   * @param {function} onProgress - Progress callback
   * @param {function} onSuccess - Success callback
   * @param {function} onFailure - Failure callback
   *
   * @returns {Promise<string>} Promise resolved with the upload URL.
   */
  uploadUriWithBaseUrl(baseUrl, uri, filename, mimetype, size, avatarFor, onProgress, onSuccess, onFailure) {
    const instance = this;
    const url = this._buildUploadUrl(baseUrl);
    const headers = this._buildHeaders();

    // Create AbortController for cancellation
    const abortController = new AbortController();
    this._abortControllers.push(abortController);

    return new Promise((resolve, reject) => {
      try {
        // Build FormData with file URI (React Native specific)
        const formData = new FormData();

        // React Native FormData accepts objects with uri, type, and name
        formData.append('file', {
          uri: uri,
          type: mimetype,
          name: filename,
        });

        formData.append('id', this._tinode.getNextUniqueId());

        if (avatarFor) {
          formData.append('topic', avatarFor);
        }

        // Use fetch with upload progress via XMLHttpRequest
        // Note: fetch doesn't support upload progress, so we use XMLHttpRequest
        const xhr = new XMLHttpRequest();

        xhr.open('POST', url, true);

        // Set headers
        Object.keys(headers).forEach(key => {
          xhr.setRequestHeader(key, headers[key]);
        });

        // Handle abort
        abortController.signal.addEventListener('abort', () => {
          xhr.abort();
        });

        // Progress tracking
        if (onProgress || instance.onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const progress = e.loaded / e.total;
              if (onProgress) {
                onProgress(progress);
              }
              if (instance.onProgress) {
                instance.onProgress(progress);
              }
            } else if (size > 0) {
              // Use provided size if available
              const progress = Math.min(e.loaded / size, 1);
              if (onProgress) {
                onProgress(progress);
              }
              if (instance.onProgress) {
                instance.onProgress(progress);
              }
            }
          };
        }

        xhr.onload = function() {
          let pkt;
          try {
            pkt = JSON.parse(this.response);
          } catch (err) {
            instance._tinode.logger("ERROR: Invalid server response in LargeFileHelperNative", this.response);
            pkt = {
              ctrl: {
                code: this.status,
                text: this.statusText
              }
            };
          }

          if (this.status >= 200 && this.status < 300) {
            const uploadUrl = pkt.ctrl.params.url;
            resolve(uploadUrl);
            if (onSuccess) {
              onSuccess(pkt.ctrl);
            }
          } else if (this.status >= 400) {
            const error = new CommError(pkt.ctrl.text, pkt.ctrl.code);
            reject(error);
            if (onFailure) {
              onFailure(pkt.ctrl);
            }
          } else {
            instance._tinode.logger("ERROR: Unexpected server response status", this.status, this.response);
            reject(new Error(`Unexpected status: ${this.status}`));
          }
        };

        xhr.onerror = function(e) {
          const error = e || new Error("Upload failed");
          reject(error);
          if (onFailure) {
            onFailure(null);
          }
        };

        xhr.onabort = function() {
          const error = new Error("Upload cancelled by user");
          reject(error);
          if (onFailure) {
            onFailure(null);
          }
        };

        xhr.send(formData);

      } catch (err) {
        reject(err);
        if (onFailure) {
          onFailure(null);
        }
      }
    });
  }

  /**
   * Upload a Blob or File (for compatibility with web code).
   * In React Native, this converts the blob to a data URI if possible,
   * but it's recommended to use uploadUri instead.
   *
   * @memberof Tinode.LargeFileHelperNative#
   *
   * @param {Blob|File} data - Data to upload
   * @param {string} avatarFor - Topic name if avatar
   * @param {function} onProgress - Progress callback
   * @param {function} onSuccess - Success callback
   * @param {function} onFailure - Failure callback
   *
   * @returns {Promise<string>} Promise resolved with the upload URL.
   */
  upload(data, avatarFor, onProgress, onSuccess, onFailure) {
    // For React Native compatibility, try to handle File/Blob objects
    // This is mainly for backward compatibility - prefer uploadUri
    if (data && typeof data === 'object') {
      // Check if it has a uri property (React Native file object)
      if (data.uri) {
        return this.uploadUri(
          data.uri,
          data.name || 'file',
          data.type || 'application/octet-stream',
          data.size || 0,
          avatarFor,
          onProgress,
          onSuccess,
          onFailure
        );
      }

      // Check if it's a proper File object with arrayBuffer (unlikely in RN)
      if (typeof data.arrayBuffer === 'function') {
        // This won't work well in React Native, log warning
        console.warn('LargeFileHelperNative: Blob/File upload not fully supported in React Native. Use uploadUri instead.');
      }
    }

    const error = new Error('React Native requires file URI for upload. Use uploadUri instead of upload.');
    if (onFailure) {
      onFailure(null);
    }
    return Promise.reject(error);
  }

  /**
   * Download a file. Not fully implemented for React Native.
   * Use expo-file-system for downloads in React Native.
   *
   * @memberof Tinode.LargeFileHelperNative#
   *
   * @param {string} relativeUrl - URL to download from
   * @param {string} filename - Filename
   * @param {string} mimetype - MIME type
   * @param {function} onProgress - Progress callback
   * @param {function} onError - Error callback
   *
   * @returns {Promise<string>} Promise resolved with local file path.
   */
  async download(relativeUrl, filename, mimetype, onProgress, onError) {
    if (!isUrlRelative(relativeUrl)) {
      const error = `The URL '${relativeUrl}' must be relative, not absolute`;
      if (onError) {
        onError(error);
      }
      throw new Error(error);
    }

    if (!this._authToken) {
      const error = "Must authenticate first";
      if (onError) {
        onError(error);
      }
      throw new Error(error);
    }

    // For React Native, we need to use expo-file-system or react-native-fs
    // This is a placeholder that returns the authorized URL
    // The caller should use expo-file-system to download
    console.warn('LargeFileHelperNative.download: Use expo-file-system for file downloads in React Native');

    // Return the authorized URL for the caller to download
    const baseUrl = (this._tinode._secure ? 'https://' : 'http://') + this._tinode._host;
    const fullUrl = baseUrl + relativeUrl + '&asatt=1';

    return fullUrl;
  }

  /**
   * Get an authorized download URL for use with expo-file-system.
   *
   * @memberof Tinode.LargeFileHelperNative#
   *
   * @param {string} relativeUrl - Relative URL to the file
   * @returns {Object} Object with url and headers for download
   */
  getDownloadConfig(relativeUrl) {
    if (!isUrlRelative(relativeUrl)) {
      throw new Error(`The URL '${relativeUrl}' must be relative, not absolute`);
    }

    const baseUrl = (this._tinode._secure ? 'https://' : 'http://') + this._tinode._host;

    // Add asatt=1 to request content-disposition: attachment
    const separator = relativeUrl.includes('?') ? '&' : '?';
    const fullUrl = baseUrl + relativeUrl + separator + 'asatt=1';

    return {
      url: fullUrl,
      headers: this._buildHeaders(),
    };
  }

  /**
   * Try to cancel all ongoing uploads.
   * @memberof Tinode.LargeFileHelperNative#
   */
  cancel() {
    this._abortControllers.forEach(controller => {
      try {
        controller.abort();
      } catch (e) {
        // Ignore errors during abort
      }
    });
    this._abortControllers = [];
  }
}
