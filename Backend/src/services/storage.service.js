const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Storage Abstraction for OMIZON Avatar Media
 *
 * Current implementation: LocalDiskStorageProvider.
 * Cloud Provider Compatibility:
 *   To connect to Amazon S3, Cloudflare R2, or Google Cloud Storage, set:
 *   STORAGE_PROVIDER=s3
 *   AWS_ACCESS_KEY_ID=<key>
 *   AWS_SECRET_ACCESS_KEY=<secret>
 *   AWS_S3_BUCKET=<bucket>
 *   AWS_REGION=<region>
 */

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

const SUPPORTED_MIME_TYPES = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

const UPLOAD_ROOT = path.join(__dirname, '../../uploads');
const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');
const RETURNS_DIR = path.join(UPLOAD_ROOT, 'returns');

// Ensure upload directories exist
try {
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
    fs.mkdirSync(RETURNS_DIR, { recursive: true });
} catch (e) {
    console.error('Failed to create upload directories:', e.message);
}

/**
 * Verifies magic bytes to prevent file extension / MIME spoofing.
 */
function verifyMagicBytes(buffer, mimeType) {
    if (!buffer || buffer.length < 4) return false;

    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (mimeType === 'image/png') {
        return (
            buffer[0] === 0x89 &&
            buffer[1] === 0x50 &&
            buffer[2] === 0x4e &&
            buffer[3] === 0x47
        );
    }
    if (mimeType === 'image/webp') {
        const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
        const isWebp = buffer.length >= 12 && buffer.toString('ascii', 8, 12) === 'WEBP';
        return isRiff && isWebp;
    }
    return false;
}

/**
 * Validates an image buffer and MIME type.
 * Returns { isValid: boolean, error?: string, extension?: string }
 */
function validateAvatar(buffer, mimeType) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
        return { isValid: false, error: 'Invalid or missing file buffer' };
    }

    if (buffer.length === 0) {
        return { isValid: false, error: 'File is empty' };
    }

    if (buffer.length > MAX_AVATAR_SIZE_BYTES) {
        return {
            isValid: false,
            error: `File size exceeds the 2MB limit (received ${(buffer.length / (1024 * 1024)).toFixed(2)}MB)`
        };
    }

    const normalizedMime = (mimeType || '').toLowerCase().trim();
    const extension = SUPPORTED_MIME_TYPES[normalizedMime];
    if (!extension) {
        return {
            isValid: false,
            error: `Unsupported image format. Allowed formats: ${Object.keys(SUPPORTED_MIME_TYPES).join(', ')}`
        };
    }

    if (!verifyMagicBytes(buffer, normalizedMime)) {
        return {
            isValid: false,
            error: 'File content does not match the specified image MIME type'
        };
    }

    return { isValid: true, extension };
}

/**
 * Saves an avatar to the local storage directory.
 * Returns relative URL path: `/uploads/avatars/<filename>`
 */
async function saveAvatar(userId, buffer, mimeType) {
    const validation = validateAvatar(buffer, mimeType);
    if (!validation.isValid) {
        const err = new Error(validation.error);
        err.statusCode = 400;
        throw err;
    }

    const safeUserId = String(userId).replace(/[^a-zA-Z0-9]/g, '');
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(4).toString('hex');
    const filename = `avatar-${safeUserId}-${timestamp}-${randomHex}${validation.extension}`;
    const filePath = path.join(AVATAR_DIR, filename);

    await fs.promises.writeFile(filePath, buffer);
    return `/uploads/avatars/${filename}`;
}

/**
 * Safely removes a local avatar file if it exists.
 */
async function deleteAvatar(avatarUrl) {
    if (!avatarUrl || typeof avatarUrl !== 'string') return;

    // Only allow deletion within /uploads/avatars/
    if (!avatarUrl.startsWith('/uploads/avatars/')) return;

    const filename = path.basename(avatarUrl);
    const filePath = path.join(AVATAR_DIR, filename);

    try {
        await fs.promises.unlink(filePath);
    } catch (e) {
        // Silently ignore if file doesn't exist
    }
}

/**
 * Validates a return evidence file buffer and MIME type (up to 5MB).
 */
function validateReturnEvidence(buffer, mimeType) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
        return { isValid: false, error: 'Invalid or missing file buffer' };
    }
    if (buffer.length === 0) {
        return { isValid: false, error: 'File is empty' };
    }
    const MAX_EVIDENCE_SIZE = 5 * 1024 * 1024;
    if (buffer.length > MAX_EVIDENCE_SIZE) {
        return {
            isValid: false,
            error: `File size exceeds 5MB limit (received ${(buffer.length / (1024 * 1024)).toFixed(2)}MB)`
        };
    }
    const normalizedMime = (mimeType || '').toLowerCase().trim();
    const extension = SUPPORTED_MIME_TYPES[normalizedMime];
    if (!extension) {
        return {
            isValid: false,
            error: `Unsupported image format. Allowed formats: ${Object.keys(SUPPORTED_MIME_TYPES).join(', ')}`
        };
    }
    if (!verifyMagicBytes(buffer, normalizedMime)) {
        return {
            isValid: false,
            error: 'File content does not match the specified image MIME type'
        };
    }
    return { isValid: true, extension };
}

/**
 * Saves a return evidence image to uploads/returns/
 * Returns `/uploads/returns/<filename>`
 */
async function saveReturnEvidence(userId, buffer, mimeType) {
    const validation = validateReturnEvidence(buffer, mimeType);
    if (!validation.isValid) {
        const err = new Error(validation.error);
        err.statusCode = 400;
        throw err;
    }

    const safeUserId = String(userId).replace(/[^a-zA-Z0-9]/g, '');
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(4).toString('hex');
    const filename = `evidence-${safeUserId}-${timestamp}-${randomHex}${validation.extension}`;
    const filePath = path.join(RETURNS_DIR, filename);

    await fs.promises.writeFile(filePath, buffer);
    return `/uploads/returns/${filename}`;
}

module.exports = {
    validateAvatar,
    saveAvatar,
    deleteAvatar,
    validateReturnEvidence,
    saveReturnEvidence,
    MAX_AVATAR_SIZE_BYTES,
    SUPPORTED_MIME_TYPES
};
