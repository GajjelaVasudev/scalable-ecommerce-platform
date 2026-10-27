const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');

const createApp = require('../src/app');

describe('Phase 6 - Infrastructure, Observability, and Health Endpoints', () => {
    let app;

    before(() => {
        process.env.NODE_ENV = 'test';
        process.env.JWT_SECRET = 'test_secret';
        app = createApp();
    });

    test('GET /health returns 200 OK with uptime and timestamp', async () => {
        const res = await request(app).get('/health');

        assert.equal(res.status, 200);
        assert.equal(res.body.status, 'ok');
        assert.ok(typeof res.body.uptime === 'number');
        assert.ok(res.body.timestamp);
    });

    test('GET /ready returns 503 when database is disconnected', async () => {
        // Disconnected state: readyState = 0
        const originalReadyState = mongoose.connection.readyState;
        Object.defineProperty(mongoose.connection, 'readyState', {
            value: 0,
            configurable: true
        });

        const res = await request(app).get('/ready');

        Object.defineProperty(mongoose.connection, 'readyState', {
            value: originalReadyState,
            configurable: true
        });

        assert.equal(res.status, 503);
        assert.equal(res.body.status, 'unavailable');
        assert.equal(res.body.database, 'disconnected');
    });

    test('GET /ready returns 200 when database is connected', async () => {
        // Connected state: readyState = 1
        const originalReadyState = mongoose.connection.readyState;
        Object.defineProperty(mongoose.connection, 'readyState', {
            value: 1,
            configurable: true
        });

        const res = await request(app).get('/ready');

        Object.defineProperty(mongoose.connection, 'readyState', {
            value: originalReadyState,
            configurable: true
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.status, 'ready');
        assert.equal(res.body.database, 'connected');
    });

    test('Unknown route returns 404 JSON with descriptive message', async () => {
        const res = await request(app).get('/api/unknown-endpoint');

        assert.equal(res.status, 404);
        assert.match(res.body.message, /route not found/i);
    });
});
