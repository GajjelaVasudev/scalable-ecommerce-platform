const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../src/models/user.model');
const { registerUser, loginUser, logoutUser } = require('../src/controllers/auth.controller');

describe('Phase 1 - Auth Controller Unit Tests (Mocked DB)', () => {
    const originalFindOne = User.findOne;
    const originalSave = User.prototype.save;
    const originalSecret = process.env.JWT_SECRET;

    before(() => {
        process.env.JWT_SECRET = 'test-jwt-secret';
    });

    after(() => {
        User.findOne = originalFindOne;
        User.prototype.save = originalSave;
        process.env.JWT_SECRET = originalSecret;
    });

    function createMockRes() {
        const res = {
            statusCode: null,
            body: null,
            cookies: {},
            clearedCookies: [],
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                this.body = data;
                return this;
            },
            cookie(name, val, opts) {
                this.cookies[name] = { val, opts };
                return this;
            },
            clearCookie(name, opts) {
                this.clearedCookies.push({ name, opts });
                return this;
            }
        };
        return res;
    }

    test('registerUser rejects missing or invalid inputs', async () => {
        const res = createMockRes();
        await registerUser({ body: { username: '', email: 'bad', password: '12' } }, res);
        assert.equal(res.statusCode, 400);
    });

    test('registerUser rejects privileged role escalation (admin role)', async () => {
        const res = createMockRes();
        await registerUser({
            body: {
                username: 'superhacker',
                email: 'hacker@example.com',
                password: 'password123',
                role: 'admin'
            }
        }, res);

        assert.equal(res.statusCode, 403);
        assert.match(res.body.message, /privileged/i);
    });

    test('registerUser rejects privileged role escalation (seller role)', async () => {
        const res = createMockRes();
        await registerUser({
            body: {
                username: 'sneaky_seller',
                email: 'seller@example.com',
                password: 'password123',
                role: 'seller'
            }
        }, res);

        assert.equal(res.statusCode, 403);
        assert.match(res.body.message, /privileged/i);
    });

    test('registerUser successfully registers buyer and NEVER leaks password hash', async () => {
        User.findOne = async () => null;
        User.prototype.save = async function() {
            this._id = 'mocked_user_id';
            this.createdAt = new Date();
            this.updatedAt = new Date();
            return this;
        };

        const res = createMockRes();
        await registerUser({
            body: {
                username: 'validbuyer',
                email: 'buyer@example.com',
                password: 'securepassword123'
            }
        }, res);

        assert.equal(res.statusCode, 201);
        assert.equal(res.body.user.username, 'validbuyer');
        assert.equal(res.body.user.role, 'buyer');
        assert.equal(res.body.user.password, undefined); // Password MUST NOT leak
    });

    test('loginUser rejects invalid password', async () => {
        const hashedPassword = await bcrypt.hash('correctpassword', 10);
        User.findOne = async () => ({
            _id: 'user_123',
            username: 'validbuyer',
            email: 'buyer@example.com',
            password: hashedPassword,
            role: 'buyer'
        });

        const res = createMockRes();
        await loginUser({
            body: {
                email: 'buyer@example.com',
                password: 'wrongpassword'
            }
        }, res);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Invalid credentials');
    });

    test('loginUser succeeds with correct credentials, sets secure cookie, and never leaks password hash', async () => {
        const hashedPassword = await bcrypt.hash('correctpassword', 10);
        User.findOne = async () => ({
            _id: 'user_123',
            username: 'validbuyer',
            email: 'buyer@example.com',
            password: hashedPassword,
            role: 'buyer',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const res = createMockRes();
        await loginUser({
            body: {
                email: 'buyer@example.com',
                password: 'correctpassword'
            }
        }, res);

        assert.equal(res.statusCode, 200);
        assert.ok(res.body.token);
        assert.ok(res.cookies.token);
        assert.equal(res.cookies.token.opts.httpOnly, true);
        assert.equal(res.body.user.password, undefined); // Password MUST NOT leak
        assert.equal(res.body.user.role, 'buyer');
    });

    test('logoutUser clears cookie', async () => {
        const res = createMockRes();
        await logoutUser({}, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.clearedCookies.length, 1);
        assert.equal(res.clearedCookies[0].name, 'token');
    });
});
