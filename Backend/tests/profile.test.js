const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../src/models/user.model');
const {
    getProfile,
    updateProfile,
    uploadAvatar,
    removeAvatar
} = require('../src/controllers/auth.controller');
const storageService = require('../src/services/storage.service');

describe('OMIZON Customer Profile Management — Backend Unit & Integration Tests', () => {
    function createMockRes() {
        return {
            statusCode: 200,
            body: null,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                this.body = data;
                return this;
            }
        };
    }

    const originalFindById = User.findById;
    const originalFindOne = User.findOne;
    const originalSave = User.prototype.save;

    after(() => {
        User.findById = originalFindById;
        User.findOne = originalFindOne;
        User.prototype.save = originalSave;
    });

    // Helper sample valid image buffers (magic bytes)
    const validPngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
    ]);
    const validJpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46
    ]);
    // RIFF....WEBPVP8
    const validWebpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20
    ]);

    // -------------------------------------------------------------------------
    // 1. Storage Service Validation & Management Tests
    // -------------------------------------------------------------------------
    describe('Avatar Storage Service', () => {
        test('validateAvatar approves valid PNG buffer with matching MIME', () => {
            const res = storageService.validateAvatar(validPngBuffer, 'image/png');
            assert.equal(res.isValid, true);
            assert.equal(res.extension, '.png');
        });

        test('validateAvatar approves valid JPEG buffer with matching MIME', () => {
            const res = storageService.validateAvatar(validJpegBuffer, 'image/jpeg');
            assert.equal(res.isValid, true);
            assert.equal(res.extension, '.jpg');
        });

        test('validateAvatar approves valid WebP buffer with matching MIME', () => {
            const res = storageService.validateAvatar(validWebpBuffer, 'image/webp');
            assert.equal(res.isValid, true);
            assert.equal(res.extension, '.webp');
        });

        test('validateAvatar rejects files larger than 2MB', () => {
            const largeBuffer = Buffer.alloc(2 * 1024 * 1024 + 1);
            largeBuffer.set(validPngBuffer, 0);
            const res = storageService.validateAvatar(largeBuffer, 'image/png');
            assert.equal(res.isValid, false);
            assert.match(res.error, /2MB/i);
        });

        test('validateAvatar rejects invalid/malicious MIME types (e.g. text/html, javascript)', () => {
            const fakeHtmlBuffer = Buffer.from('<script>alert("xss")</script>');
            const res = storageService.validateAvatar(fakeHtmlBuffer, 'text/html');
            assert.equal(res.isValid, false);
            assert.match(res.error, /unsupported/i);
        });

        test('validateAvatar rejects mismatched magic bytes (spoofed MIME type)', () => {
            const fakeImage = Buffer.from('this is plain text pretending to be png');
            const res = storageService.validateAvatar(fakeImage, 'image/png');
            assert.equal(res.isValid, false);
            assert.match(res.error, /match.*MIME/i);
        });

        test('saveAvatar writes avatar to disk and deleteAvatar safely removes it', async () => {
            const userId = 'test_user_storage_123';
            const savedUrl = await storageService.saveAvatar(userId, validPngBuffer, 'image/png');
            assert.ok(savedUrl.startsWith('/uploads/avatars/avatar-testuserstorage123-'));
            assert.ok(savedUrl.endsWith('.png'));

            // Verify file exists on disk
            const localPath = path.join(__dirname, '..', savedUrl.replace(/^\//, ''));
            assert.ok(fs.existsSync(localPath));

            // Clean up with deleteAvatar
            await storageService.deleteAvatar(savedUrl);
            assert.equal(fs.existsSync(localPath), false);
        });
    });

    // -------------------------------------------------------------------------
    // 2. GET /api/auth/profile Tests
    // -------------------------------------------------------------------------
    describe('GET /api/auth/profile', () => {
        test('getProfile returns 200 with sanitized profile and excludes sensitive credentials', async () => {
            const mockUser = {
                _id: '654321000000000000000001',
                username: 'rahul_verma',
                email: 'rahul@example.com',
                password: '$2b$10$hashedpasswordstringthatmustneverleak',
                role: 'buyer',
                firstName: 'Rahul',
                lastName: 'Verma',
                displayName: 'Rahul V.',
                phone: '+91 9820123456',
                altPhone: null,
                avatarUrl: '/uploads/avatars/avatar-test.jpg',
                gender: 'male',
                dateOfBirth: new Date('1992-05-15T00:00:00.000Z'),
                commLang: 'en',
                resetPasswordToken: 'supersecretresettoken',
                resetPasswordExpires: new Date(Date.now() + 3600000),
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-02T00:00:00.000Z'),
            };

            User.findById = async (id) => mockUser;

            const req = { user: { id: mockUser._id } };
            const res = createMockRes();

            await getProfile(req, res);

            assert.equal(res.statusCode, 200);
            assert.ok(res.body.user);
            const user = res.body.user;

            assert.equal(user.username, 'rahul_verma');
            assert.equal(user.email, 'rahul@example.com');
            assert.equal(user.firstName, 'Rahul');
            assert.equal(user.lastName, 'Verma');
            assert.equal(user.displayName, 'Rahul V.');
            assert.equal(user.phone, '+91 9820123456');
            assert.equal(user.gender, 'male');
            assert.equal(user.commLang, 'en');

            // Explicitly assert sensitive fields are NOT exposed
            assert.equal(user.password, undefined);
            assert.equal(user.resetPasswordToken, undefined);
            assert.equal(user.resetPasswordExpires, undefined);
            assert.equal(user.__v, undefined);
        });

        test('getProfile returns 401 when req.user is missing', async () => {
            const req = {};
            const res = createMockRes();

            await getProfile(req, res);
            assert.equal(res.statusCode, 401);
            assert.match(res.body.message, /not authenticated/i);
        });

        test('getProfile returns 404 when user is not found in database', async () => {
            User.findById = async () => null;

            const req = { user: { id: 'nonexistent_id' } };
            const res = createMockRes();

            await getProfile(req, res);
            assert.equal(res.statusCode, 404);
            assert.match(res.body.message, /not found/i);
        });
    });

    // -------------------------------------------------------------------------
    // 3. PUT /api/auth/profile Validation & Security Tests
    // -------------------------------------------------------------------------
    describe('PUT /api/auth/profile', () => {
        let mockDbUser;

        beforeEach(() => {
            mockDbUser = {
                _id: '654321000000000000000002',
                username: 'priya_sharma',
                email: 'priya@example.com',
                password: '$2b$10$existinghashedpassword',
                role: 'buyer',
                firstName: 'Priya',
                lastName: 'Sharma',
                displayName: 'Priya',
                phone: null,
                altPhone: null,
                avatarUrl: null,
                gender: 'prefer-not-to-say',
                dateOfBirth: null,
                commLang: 'en',
                save: async function() { return this; }
            };

            User.findById = async (id) => mockDbUser;
        });

        test('updateProfile successfully updates whitelisted profile fields', async () => {
            const req = {
                user: { id: mockDbUser._id },
                body: {
                    firstName: 'Priya',
                    lastName: 'Mehta',
                    displayName: 'Priya M.',
                    phone: '9820012345',
                    altPhone: '9820099999',
                    gender: 'female',
                    commLang: 'hi',
                    dobDay: '20',
                    dobMonth: '10',
                    dobYear: '1996'
                }
            };
            const res = createMockRes();

            await updateProfile(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.user.firstName, 'Priya');
            assert.equal(res.body.user.lastName, 'Mehta');
            assert.equal(res.body.user.displayName, 'Priya M.');
            assert.equal(res.body.user.phone, '+91 9820012345');
            assert.equal(res.body.user.altPhone, '+91 9820099999');
            assert.equal(res.body.user.gender, 'female');
            assert.equal(res.body.user.commLang, 'hi');
            assert.ok(res.body.user.dateOfBirth);
            assert.equal(new Date(res.body.user.dateOfBirth).getUTCFullYear(), 1996);
        });

        test('updateProfile normalizes 10-digit, +91, and 91 prefixed Indian phone numbers', async () => {
            const testCases = [
                { input: '9820123456', expected: '+91 9820123456' },
                { input: '+91 98201 23456', expected: '+91 9820123456' },
                { input: '919820123456', expected: '+91 9820123456' },
                { input: '+91-8765432109', expected: '+91 8765432109' }
            ];

            for (const { input, expected } of testCases) {
                const req = {
                    user: { id: mockDbUser._id },
                    body: { phone: input }
                };
                const res = createMockRes();
                await updateProfile(req, res);
                assert.equal(res.statusCode, 200);
                assert.equal(res.body.user.phone, expected);
            }
        });

        test('updateProfile rejects invalid Indian mobile numbers', async () => {
            const invalidNumbers = [
                '1234567890',  // starts with 1
                '5555555555',  // starts with 5
                '982012345',   // 9 digits
                '98201234567', // 11 digits
                'abcdefghij',  // letters
            ];

            for (const badPhone of invalidNumbers) {
                const req = {
                    user: { id: mockDbUser._id },
                    body: { phone: badPhone }
                };
                const res = createMockRes();
                await updateProfile(req, res);
                assert.equal(res.statusCode, 400);
                assert.match(res.body.message, /valid 10-digit Indian/i);
            }
        });

        test('updateProfile rejects future birth dates', async () => {
            const nextYear = new Date().getFullYear() + 1;
            const req = {
                user: { id: mockDbUser._id },
                body: { dateOfBirth: `${nextYear}-01-01` }
            };
            const res = createMockRes();
            await updateProfile(req, res);
            assert.equal(res.statusCode, 400);
            assert.match(res.body.message, /future/i);
        });

        test('updateProfile rejects birth dates before year 1900', async () => {
            const req = {
                user: { id: mockDbUser._id },
                body: { dateOfBirth: '1899-12-31' }
            };
            const res = createMockRes();
            await updateProfile(req, res);
            assert.equal(res.statusCode, 400);
            assert.match(res.body.message, /1900/i);
        });

        test('updateProfile rejects impossible calendar dates (e.g. Feb 30)', async () => {
            const req = {
                user: { id: mockDbUser._id },
                body: { dobDay: '30', dobMonth: '02', dobYear: '1995' }
            };
            const res = createMockRes();
            await updateProfile(req, res);
            assert.equal(res.statusCode, 400);
            assert.match(res.body.message, /valid calendar date/i);
        });

        test('updateProfile enforces maximum string length limits (>100 chars rejected)', async () => {
            const overlongString = 'A'.repeat(101);
            const req = {
                user: { id: mockDbUser._id },
                body: { firstName: overlongString }
            };
            const res = createMockRes();
            await updateProfile(req, res);
            assert.equal(res.statusCode, 400);
            assert.match(res.body.message, /100 characters/i);
        });

        test('updateProfile strictly prevents mass-assignment privilege escalation (role cannot be changed)', async () => {
            const req = {
                user: { id: mockDbUser._id },
                body: {
                    firstName: 'Legit',
                    role: 'admin',      // Privilege escalation attempt!
                    _id: 'tampered_id', // ID tampering attempt!
                }
            };
            const res = createMockRes();
            await updateProfile(req, res);

            assert.equal(res.statusCode, 200);
            // User role must remain 'buyer'
            assert.equal(mockDbUser.role, 'buyer');
            assert.equal(res.body.user.role, 'buyer');
            // User ID must remain unchanged
            assert.equal(mockDbUser._id, '654321000000000000000002');
        });

        test('updateProfile rejects attempts to change email address without verification', async () => {
            const req = {
                user: { id: mockDbUser._id },
                body: { email: 'unverified_new_email@omizon.in' }
            };
            const res = createMockRes();
            await updateProfile(req, res);
            assert.equal(res.statusCode, 400);
            assert.match(res.body.message, /verification/i);
        });

        test('updateProfile allows clearing optional phone number with null or empty string', async () => {
            mockDbUser.phone = '+91 9820123456';
            mockDbUser.altPhone = '+91 9820199999';

            const req = {
                user: { id: mockDbUser._id },
                body: { phone: null, altPhone: '' }
            };
            const res = createMockRes();
            await updateProfile(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(mockDbUser.phone, null);
            assert.equal(mockDbUser.altPhone, null);
        });
    });

    // -------------------------------------------------------------------------
    // 4. Avatar Upload & Removal Controller Tests
    // -------------------------------------------------------------------------
    describe('Avatar Upload & Removal Endpoints', () => {
        let mockDbUser;

        beforeEach(() => {
            mockDbUser = {
                _id: '654321000000000000000003',
                username: 'avatar_user',
                email: 'avatar@example.com',
                avatarUrl: null,
                save: async function() { return this; }
            };
            User.findById = async () => mockDbUser;
        });

        test('uploadAvatar rejects request without image or mimeType', async () => {
            const req = { user: { id: mockDbUser._id }, body: {} };
            const res = createMockRes();

            await uploadAvatar(req, res);
            assert.equal(res.statusCode, 400);
            assert.match(res.body.message, /image.*required/i);
        });

        test('uploadAvatar saves valid base64 PNG avatar and updates user record', async () => {
            const base64Png = validPngBuffer.toString('base64');
            const req = {
                user: { id: mockDbUser._id },
                body: {
                    image: `data:image/png;base64,${base64Png}`,
                    mimeType: 'image/png'
                }
            };
            const res = createMockRes();

            await uploadAvatar(req, res);

            assert.equal(res.statusCode, 200);
            assert.ok(mockDbUser.avatarUrl);
            assert.ok(mockDbUser.avatarUrl.startsWith('/uploads/avatars/avatar-654321000000000000000003-'));
            assert.ok(mockDbUser.avatarUrl.endsWith('.png'));

            // Clean up created file
            await storageService.deleteAvatar(mockDbUser.avatarUrl);
        });

        test('uploadAvatar rolls back newly written avatar file if database save fails', async () => {
            const base64Png = validPngBuffer.toString('base64');
            let savedAvatarPath = null;

            mockDbUser.save = async function() {
                savedAvatarPath = this.avatarUrl;
                throw new Error('Database constraint violation or timeout');
            };

            const req = {
                user: { id: mockDbUser._id },
                body: {
                    image: `data:image/png;base64,${base64Png}`,
                    mimeType: 'image/png'
                }
            };
            const res = createMockRes();

            await uploadAvatar(req, res);
            assert.equal(res.statusCode, 500);
            assert.match(res.body.message, /Database constraint violation/i);

            // Confirm that the newly written file on disk was unlinked during rollback
            assert.ok(savedAvatarPath);
            const localPath = path.join(__dirname, '..', savedAvatarPath.replace(/^\//, ''));
            assert.equal(fs.existsSync(localPath), false, 'Orphaned avatar file must be unlinked on DB error');
        });

        test('uploadAvatar rejects spoofed images with corrupted magic bytes', async () => {
            const badBuffer = Buffer.from('not an actual image');
            const req = {
                user: { id: mockDbUser._id },
                body: {
                    image: `data:image/jpeg;base64,${badBuffer.toString('base64')}`,
                    mimeType: 'image/jpeg'
                }
            };
            const res = createMockRes();

            await uploadAvatar(req, res);
            assert.equal(res.statusCode, 400);
            assert.match(res.body.message, /match.*MIME|magic/i);
        });

        test('removeAvatar clears avatarUrl and deletes file from disk', async () => {
            // First save an avatar
            const savedUrl = await storageService.saveAvatar(mockDbUser._id, validJpegBuffer, 'image/jpeg');
            mockDbUser.avatarUrl = savedUrl;

            const req = { user: { id: mockDbUser._id } };
            const res = createMockRes();

            await removeAvatar(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(mockDbUser.avatarUrl, null);
            assert.equal(res.body.user.avatarUrl, null);
        });
    });
});
