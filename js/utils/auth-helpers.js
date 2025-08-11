/**
 * Authentication Helper Utilities - Layer 1 (Foundation)
 *
 * This module contains pure utility functions for authentication with NO dependencies.
 * These functions perform raw data access and validation without calling any services.
 *
 * ARCHITECTURAL RULES:
 * - NO imports from services or components
 * - NO state management - pure functions only
 * - NO async operations or API calls
 * - NO Vue reactivity or component access
 *
 * @module auth-helpers
 */

/**
 * Check if auth headers object has all required fields
 * @param {Object} authHeaders - Auth headers object to check
 * @returns {boolean} True if all required fields are present
 */
export function hasAllAuthFields(authHeaders) {
    return !!(authHeaders?.['x-account'] &&
              authHeaders?.['x-signature'] &&
              authHeaders?.['x-challenge'] &&
              authHeaders?.['x-pubkey']);
}

/**
 * Get a specific auth header field value
 * @param {Object} authHeaders - Auth headers object
 * @param {string} fieldName - Field name (e.g., 'x-account')
 * @returns {string|null} Field value or null if not found
 */
export function getAuthField(authHeaders, fieldName) {
    return authHeaders?.[fieldName] || null;
}

/**
 * Get the account from auth headers
 * @param {Object} authHeaders - Auth headers object
 * @returns {string|null} Account name or null
 */
export function getAuthAccount(authHeaders) {
    return getAuthField(authHeaders, 'x-account');
}

/**
 * Get the signature from auth headers
 * @param {Object} authHeaders - Auth headers object
 * @returns {string|null} Signature or null
 */
export function getAuthSignature(authHeaders) {
    return getAuthField(authHeaders, 'x-signature');
}

/**
 * Get the challenge from auth headers
 * @param {Object} authHeaders - Auth headers object
 * @returns {string|null} Challenge timestamp or null
 */
export function getAuthChallenge(authHeaders) {
    return getAuthField(authHeaders, 'x-challenge');
}

/**
 * Get the public key from auth headers
 * @param {Object} authHeaders - Auth headers object
 * @returns {string|null} Public key or null
 */
export function getAuthPubkey(authHeaders) {
    return getAuthField(authHeaders, 'x-pubkey');
}

/**
 * Calculate challenge age in seconds
 * @param {Object} authHeaders - Auth headers object
 * @returns {number|null} Age in seconds or null if invalid
 */
export function calculateChallengeAge(authHeaders) {
    const challenge = getAuthChallenge(authHeaders);
    if (!challenge) return null;

    const challengeNum = parseInt(challenge);
    if (isNaN(challengeNum)) return null;

    return Math.round((Date.now() / 1000) - challengeNum);
}

/**
 * Check if auth headers are expired (> 23 hours old)
 * @param {Object} authHeaders - Auth headers object
 * @returns {boolean} True if expired
 */
export function areAuthHeadersExpired(authHeaders) {
    const age = calculateChallengeAge(authHeaders);
    return age !== null && age > (23 * 60 * 60); // 23 hours in seconds
}

/**
 * Check if all auth header fields have non-empty values
 * @param {Object} authHeaders - Auth headers object
 * @returns {boolean} True if all fields are non-empty
 */
export function hasNonEmptyAuthFields(authHeaders) {
    if (!hasAllAuthFields(authHeaders)) return false;

    return !!(getAuthAccount(authHeaders)?.trim() &&
              getAuthSignature(authHeaders)?.trim() &&
              getAuthChallenge(authHeaders)?.trim() &&
              getAuthPubkey(authHeaders)?.trim());
}

/**
 * Validate auth header structure without business logic
 * @param {Object} authHeaders - Auth headers object to validate
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
export function validateAuthHeaderStructure(authHeaders) {
    const errors = [];

    if (!authHeaders || typeof authHeaders !== 'object') {
        errors.push('Auth headers must be an object');
        return { valid: false, errors };
    }

    // Check required fields
    const requiredFields = ['x-account', 'x-signature', 'x-challenge', 'x-pubkey'];
    for (const field of requiredFields) {
        if (!authHeaders[field]) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    // Check for empty values
    if (errors.length === 0) {
        for (const field of requiredFields) {
            if (!authHeaders[field].trim()) {
                errors.push(`Empty value for field: ${field}`);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Check if auth headers match a specific account
 * @param {Object} authHeaders - Auth headers object
 * @param {string} expectedAccount - Expected account name
 * @returns {boolean} True if account matches
 */
export function authHeadersMatchAccount(authHeaders, expectedAccount) {
    if (!expectedAccount) return false;
    return getAuthAccount(authHeaders) === expectedAccount;
}

/**
 * Get a safe preview of auth headers for logging
 * @param {Object} authHeaders - Auth headers object
 * @returns {Object} Safe preview object
 */
export function getAuthHeadersPreview(authHeaders) {
    if (!authHeaders) return null;

    return {
        account: getAuthAccount(authHeaders),
        challengeAge: calculateChallengeAge(authHeaders),
        hasSignature: !!getAuthSignature(authHeaders),
        signaturePrefix: getAuthSignature(authHeaders)?.substring(0, 15),
        pubkeyPrefix: getAuthPubkey(authHeaders)?.substring(0, 12)
    };
}

/**
 * Compare two auth header objects for equality
 * @param {Object} headers1 - First auth headers object
 * @param {Object} headers2 - Second auth headers object
 * @returns {boolean} True if headers are equal
 */
export function areAuthHeadersEqual(headers1, headers2) {
    // Both null/undefined
    if (!headers1 && !headers2) return true;

    // One is null/undefined
    if (!headers1 || !headers2) return false;

    // Compare each field
    return getAuthAccount(headers1) === getAuthAccount(headers2) &&
           getAuthSignature(headers1) === getAuthSignature(headers2) &&
           getAuthChallenge(headers1) === getAuthChallenge(headers2) &&
           getAuthPubkey(headers1) === getAuthPubkey(headers2);
}

/**
 * Create auth headers object from individual fields
 * @param {string} account - Account name
 * @param {string} signature - Signature
 * @param {string} challenge - Challenge timestamp
 * @param {string} pubkey - Public key
 * @returns {Object|null} Auth headers object or null if any field is missing
 */
export function createAuthHeaders(account, signature, challenge, pubkey) {
    if (!account || !signature || !challenge || !pubkey) {
        return null;
    }

    return {
        'x-account': account,
        'x-signature': signature,
        'x-challenge': challenge,
        'x-pubkey': pubkey
    };
}

/**
 * Extract auth token object for WebSocket authentication
 * @param {Object} authHeaders - Auth headers object
 * @returns {Object|null} Token object or null if invalid
 */
export function extractAuthToken(authHeaders) {
    if (!hasAllAuthFields(authHeaders)) return null;

    return {
        account: getAuthAccount(authHeaders),
        signature: getAuthSignature(authHeaders),
        challenge: getAuthChallenge(authHeaders),
        pubkey: getAuthPubkey(authHeaders)
    };
}

/**
 * Get required auth header field names
 * @returns {string[]} Array of required field names
 */
export function getRequiredAuthFields() {
    return ['x-account', 'x-signature', 'x-challenge', 'x-pubkey'];
}

/**
 * Check if a value is a valid challenge timestamp
 * @param {string} challenge - Challenge value to check
 * @returns {boolean} True if valid timestamp
 */
export function isValidChallenge(challenge) {
    if (!challenge) return false;

    const challengeNum = parseInt(challenge);
    if (isNaN(challengeNum)) return false;

    // Check if it's a reasonable Unix timestamp (not too old or future)
    const now = Date.now() / 1000;
    const age = now - challengeNum;

    // Allow up to 30 days old and 5 minutes in the future
    return age < (30 * 24 * 60 * 60) && age > -300;
}
