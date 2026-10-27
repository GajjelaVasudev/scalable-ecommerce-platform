const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const authMiddleware = require('../src/middlewares/auth.middleware');
const authorize = require('../src/middlewares/authorize.middleware');

describe('Phase 1 - Auth Middleware & Authorization Unit Tests', () => {
    const originalSecret = process.env.JWT_SECRET;

    before(() => {
        process.env.JWT_SECRET = 'test-secret-key-12345';
    });

    after(() => {
        process.env.JWT_SECRET = originalSecret;
    });

    test('authMiddleware rejects request with no token', async () => {
        const req = { cookies: {}, headers: {} };
        let statusCode = null;
        let responseJson = null;
        const res = {
            status(code) {
                statusCode = code;
                return this;
            },
            json(data) {
                responseJson = data;
                return this;
            }
        };
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        await authMiddleware(req, res, next);

        assert.equal(statusCode, 401);
        assert.equal(responseJson.message, 'Unauthorized');
        assert.equal(nextCalled, false);
    });

    test('authMiddleware rejects request with invalid token', async () => {
        const req = { cookies: { token: 'invalid.jwt.token' }, headers: {} };
        let statusCode = null;
        let responseJson = null;
        const res = {
            status(code) {
                statusCode = code;
                return this;
            },
            json(data) {
                responseJson = data;
                return this;
            }
        };
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        await authMiddleware(req, res, next);

        assert.equal(statusCode, 401);
        assert.equal(responseJson.message, 'Invalid or expired token');
        assert.equal(nextCalled, false);
    });

    test('authMiddleware accepts valid token from cookies', async () => {
        const token = jwt.sign({ id: 'user123', role: 'buyer' }, process.env.JWT_SECRET);
        const req = { cookies: { token }, headers: {} };
        const res = {};
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        await authMiddleware(req, res, next);

        assert.equal(nextCalled, true);
        assert.equal(req.user.id, 'user123');
        assert.equal(req.user.role, 'buyer');
    });

    test('authMiddleware accepts valid Bearer token from headers', async () => {
        const token = jwt.sign({ id: 'admin456', role: 'admin' }, process.env.JWT_SECRET);
        const req = { cookies: {}, headers: { authorization: `Bearer ${token}` } };
        const res = {};
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        await authMiddleware(req, res, next);

        assert.equal(nextCalled, true);
        assert.equal(req.user.id, 'admin456');
        assert.equal(req.user.role, 'admin');
    });

    test('authorize middleware handles rest arguments', () => {
        const middleware = authorize('admin', 'seller');
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        // Authorized
        const req1 = { user: { role: 'admin' } };
        let res1Called = false;
        const res1 = { status: () => ({ json: () => { res1Called = true; } }) };
        middleware(req1, res1, next);
        assert.equal(nextCalled, true);

        // Unauthorized
        nextCalled = false;
        const req2 = { user: { role: 'buyer' } };
        let statusCode = null;
        const res2 = {
            status(c) {
                statusCode = c;
                return this;
            },
            json() { return this; }
        };
        middleware(req2, res2, next);
        assert.equal(nextCalled, false);
        assert.equal(statusCode, 403);
    });

    test('authorize middleware handles array argument (fixes category & order routes bug)', () => {
        const middleware = authorize(['admin']);
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        // Admin passes
        const req1 = { user: { role: 'admin' } };
        middleware(req1, {}, next);
        assert.equal(nextCalled, true);

        // Buyer is forbidden
        nextCalled = false;
        const req2 = { user: { role: 'buyer' } };
        let statusCode = null;
        const res2 = {
            status(c) {
                statusCode = c;
                return this;
            },
            json() { return this; }
        };
        middleware(req2, res2, next);
        assert.equal(nextCalled, false);
        assert.equal(statusCode, 403);
    });
});
