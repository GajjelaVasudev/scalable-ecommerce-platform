const { test, describe, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Address = require('../src/models/address.model');
const {
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    syncAddresses,
    sanitizePhone,
    sanitizePostalCode,
    validateAddressPayload
} = require('../src/controllers/address.controller');

describe('OMIZON Address Book — Backend Unit & Integration Tests', () => {
    function createMockRes() {
        return {
            statusCode: null,
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

    const originalFind = Address.find;
    const originalFindOne = Address.findOne;
    const originalCountDocuments = Address.countDocuments;
    const originalUpdateMany = Address.updateMany;
    const originalCreate = Address.create;
    const originalDeleteOne = Address.deleteOne;

    after(() => {
        Address.find = originalFind;
        Address.findOne = originalFindOne;
        Address.countDocuments = originalCountDocuments;
        Address.updateMany = originalUpdateMany;
        Address.create = originalCreate;
        Address.deleteOne = originalDeleteOne;
    });

    const userA_Id = new mongoose.Types.ObjectId().toString();
    const userB_Id = new mongoose.Types.ObjectId().toString();

    // -------------------------------------------------------------------------
    // 1. Phone & PIN Code Validation Tests
    // -------------------------------------------------------------------------
    test('sanitizePhone accepts 10-digit Indian numbers starting with 6-9', () => {
        assert.equal(sanitizePhone('9820123456'), '+91 9820123456');
        assert.equal(sanitizePhone('6123456789'), '+91 6123456789');
        assert.equal(sanitizePhone('+91 98201 23456'), '+91 9820123456');
        assert.equal(sanitizePhone('919820123456'), '+91 9820123456');
    });

    test('sanitizePhone rejects invalid phone numbers (short, long, invalid starting digit)', () => {
        assert.equal(sanitizePhone('1234567890'), null); // Starts with 1
        assert.equal(sanitizePhone('5555555555'), null); // Starts with 5
        assert.equal(sanitizePhone('982012345'), null); // 9 digits
        assert.equal(sanitizePhone('9820123456789'), null); // too long
        assert.equal(sanitizePhone(''), null);
        assert.equal(sanitizePhone(null), null);
    });

    test('sanitizePostalCode accepts valid 6-digit Indian PIN codes', () => {
        assert.equal(sanitizePostalCode('400013'), '400013');
        assert.equal(sanitizePostalCode('110001'), '110001');
        assert.equal(sanitizePostalCode(' 560066 '), '560066');
    });

    test('sanitizePostalCode rejects invalid PIN codes', () => {
        assert.equal(sanitizePostalCode('012345'), null); // Starts with 0
        assert.equal(sanitizePostalCode('40001'), null); // 5 digits
        assert.equal(sanitizePostalCode('4000133'), null); // 7 digits
        assert.equal(sanitizePostalCode('ABCDEF'), null);
        assert.equal(sanitizePostalCode(''), null);
    });

    test('validateAddressPayload enforces mandatory fields', () => {
        const invalidPayload = {
            fullName: '',
            phone: 'bad_phone',
            addressLine: '',
            city: '',
            state: '',
            postalCode: '123'
        };
        const result = validateAddressPayload(invalidPayload, false);
        assert.equal(result.isValid, false);
        assert.ok(result.errors.length >= 5);
    });

    test('validateAddressPayload validates tag enum and defaults to HOME', () => {
        const validPayload = {
            fullName: 'Rajesh Singhania',
            phone: '9820123456',
            addressLine: 'Flat 402, Highmont Residences',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400013',
            tag: 'WORK'
        };
        const result = validateAddressPayload(validPayload, false);
        assert.equal(result.isValid, true);
        assert.equal(result.sanitized.tag, 'WORK');

        const badTagPayload = { ...validPayload, tag: 'INVALID_TAG' };
        const badResult = validateAddressPayload(badTagPayload, false);
        assert.equal(badResult.isValid, false);
    });

    // -------------------------------------------------------------------------
    // 2. Controller Address CRUD & Ownership Tests
    // -------------------------------------------------------------------------
    test('getAddresses retrieves only addresses belonging to the authenticated user', async () => {
        const mockUserAddresses = [
            {
                _id: new mongoose.Types.ObjectId(),
                user: userA_Id,
                fullName: 'User A Address',
                isDefault: true,
                addressLine: 'A Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                postalCode: '400001'
            }
        ];

        Address.find = (query) => {
            assert.equal(query.user, userA_Id);
            return {
                sort: () => [...mockUserAddresses]
            };
        };

        const req = { user: { id: userA_Id } };
        const res = createMockRes();

        await getAddresses(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.length, 1);
        assert.equal(res.body[0].fullName, 'User A Address');
        assert.ok(res.body[0].id);
    });

    test('createAddress automatically assigns isDefault: true for the user first address', async () => {
        Address.countDocuments = async (query) => {
            assert.equal(query.user, userA_Id);
            return 0; // First address
        };

        let createdPayload = null;
        Address.create = async (doc) => {
            createdPayload = doc;
            return { ...doc, _id: new mongoose.Types.ObjectId() };
        };

        const req = {
            user: { id: userA_Id },
            body: {
                fullName: 'First Address',
                phone: '9820123456',
                addressLine: 'Flat 101, Sea View',
                city: 'Mumbai',
                state: 'Maharashtra',
                postalCode: '400050',
                isDefault: false // Client sent false, but must be forced true
            }
        };
        const res = createMockRes();

        await createAddress(req, res);

        assert.equal(res.statusCode, 201);
        assert.equal(createdPayload.isDefault, true);
        assert.equal(createdPayload.user, userA_Id);
    });

    test('createAddress un-sets other defaults when isDefault: true is specified for subsequent address', async () => {
        Address.countDocuments = async () => 2; // User already has 2 addresses
        let updateManyCalled = false;

        Address.updateMany = async (filter, update) => {
            assert.equal(filter.user, userA_Id);
            assert.equal(update.isDefault, false);
            updateManyCalled = true;
        };

        Address.create = async (doc) => ({ ...doc, _id: new mongoose.Types.ObjectId() });

        const req = {
            user: { id: userA_Id },
            body: {
                fullName: 'Second Default Address',
                phone: '9820123456',
                addressLine: 'Office Floor 5',
                city: 'Mumbai',
                state: 'Maharashtra',
                postalCode: '400051',
                tag: 'WORK',
                isDefault: true
            }
        };
        const res = createMockRes();

        await createAddress(req, res);

        assert.equal(res.statusCode, 201);
        assert.equal(updateManyCalled, true);
    });

    test('updateAddress rejects invalid MongoDB ObjectId with 400', async () => {
        const req = {
            user: { id: userA_Id },
            params: { id: 'invalid-id' },
            body: { fullName: 'Test' }
        };
        const res = createMockRes();

        await updateAddress(req, res);

        assert.equal(res.statusCode, 400);
        assert.match(res.body.message, /invalid address id/i);
    });

    test('updateAddress enforces ownership: returns 404 when modifying another user address', async () => {
        const targetId = new mongoose.Types.ObjectId().toString();

        Address.findOne = async (query) => {
            // User B trying to access address owned by User A -> returns null
            if (query.user === userB_Id) return null;
            return { _id: targetId, user: userA_Id };
        };

        const req = {
            user: { id: userB_Id }, // Authenticated as User B
            params: { id: targetId },
            body: { fullName: 'Hacked Address' }
        };
        const res = createMockRes();

        await updateAddress(req, res);

        assert.equal(res.statusCode, 404);
        assert.match(res.body.message, /not found/i);
    });

    test('deleteAddress deletes address and automatically reassigns default if deleted address was default', async () => {
        const deleteId = new mongoose.Types.ObjectId();
        const fallbackId = new mongoose.Types.ObjectId();

        const mockAddressToDelete = {
            _id: deleteId,
            user: userA_Id,
            isDefault: true
        };

        Address.findOne = async (query) => {
            if (query._id === deleteId.toString()) {
                return mockAddressToDelete;
            }
            return {
                _id: fallbackId,
                user: userA_Id,
                isDefault: false,
                save: async function () { this.isDefault = true; }
            };
        };

        let deletedFilter = null;
        Address.deleteOne = async (filter) => {
            deletedFilter = filter;
        };

        const req = {
            user: { id: userA_Id },
            params: { id: deleteId.toString() }
        };
        const res = createMockRes();

        await deleteAddress(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(deletedFilter._id, deleteId.toString());
        assert.equal(res.body.reassignedDefaultId, fallbackId.toString());
    });

    test('setDefaultAddress marks selected address as default and unsets others', async () => {
        const targetId = new mongoose.Types.ObjectId();
        let unSetCalled = false;

        Address.findOne = async (query) => {
            if (query._id === targetId.toString()) {
                return {
                    _id: targetId,
                    user: userA_Id,
                    isDefault: false,
                    save: async function () { this.isDefault = true; }
                };
            }
            return null;
        };

        Address.updateMany = async (filter, update) => {
            assert.equal(filter.user, userA_Id);
            assert.equal(filter.isDefault, true);
            assert.equal(update.isDefault, false);
            unSetCalled = true;
        };

        const req = {
            user: { id: userA_Id },
            params: { id: targetId.toString() }
        };
        const res = createMockRes();

        await setDefaultAddress(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(unSetCalled, true);
        assert.equal(res.body.isDefault, true);
    });

    test('syncAddresses migrates local addresses, skips duplicates and demo addresses', async () => {
        const existingDocs = [
            {
                _id: new mongoose.Types.ObjectId(),
                user: userA_Id,
                fullName: 'Duplicate',
                city: 'Mumbai',
                addressLine: 'Existing Street 10',
                postalCode: '400010',
                isDefault: true
            }
        ];

        Address.find = () => {
            const query = Promise.resolve([...existingDocs]);
            query.sort = () => Promise.resolve([...existingDocs]);
            return query;
        };

        const createdDocs = [];
        Address.create = async (doc) => {
            createdDocs.push(doc);
            return { ...doc, _id: new mongoose.Types.ObjectId() };
        };

        const req = {
            user: { id: userA_Id },
            body: {
                addresses: [
                    // Demo address -> should be skipped
                    {
                        id: 'addr_01',
                        fullName: 'Demo User',
                        phone: '9820123456',
                        addressLine: 'Demo Lane',
                        city: 'Mumbai',
                        state: 'Maharashtra',
                        postalCode: '400001'
                    },
                    // Duplicate address -> should be skipped
                    {
                        id: 'addr_local_01',
                        fullName: 'Duplicate',
                        phone: '9820123456',
                        addressLine: 'Existing Street 10',
                        city: 'Mumbai',
                        state: 'Maharashtra',
                        postalCode: '400010'
                    },
                    // Valid new address -> should be saved
                    {
                        id: 'addr_local_02',
                        fullName: 'New Migration',
                        phone: '9820123456',
                        addressLine: 'Unique New Street 42',
                        city: 'Mumbai',
                        state: 'Maharashtra',
                        postalCode: '400042',
                        tag: 'HOME'
                    }
                ]
            }
        };
        const res = createMockRes();

        await syncAddresses(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.syncedCount, 1);
        assert.equal(createdDocs.length, 1);
        assert.equal(createdDocs[0].addressLine, 'Unique New Street 42');
    });

    test('getAddresses self-heals when no address is marked default by promoting first address', async () => {
        const id1 = new mongoose.Types.ObjectId();
        const id2 = new mongoose.Types.ObjectId();
        const docs = [
            { _id: id1, user: userA_Id, isDefault: false, fullName: 'Addr 1' },
            { _id: id2, user: userA_Id, isDefault: false, fullName: 'Addr 2' }
        ];

        let updateOneCalled = false;
        Address.updateOne = async (filter, update) => {
            assert.equal(filter._id.toString(), id1.toString());
            assert.equal(update.isDefault, true);
            updateOneCalled = true;
        };

        Address.find = () => ({
            sort: () => [...docs]
        });

        const req = { user: { id: userA_Id } };
        const res = createMockRes();

        await getAddresses(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(updateOneCalled, true);
        assert.equal(res.body[0].isDefault, true);
    });

    test('getAddresses self-heals when multiple addresses are marked default by keeping only one', async () => {
        const id1 = new mongoose.Types.ObjectId();
        const id2 = new mongoose.Types.ObjectId();
        const docs = [
            { _id: id1, user: userA_Id, isDefault: true, fullName: 'Default 1' },
            { _id: id2, user: userA_Id, isDefault: true, fullName: 'Default 2' }
        ];

        let updateManyCalled = false;
        Address.updateMany = async (filter, update) => {
            assert.equal(filter.user, userA_Id);
            assert.equal(filter._id.$ne.toString(), id1.toString());
            assert.equal(update.isDefault, false);
            updateManyCalled = true;
        };

        Address.find = () => ({
            sort: () => [...docs]
        });

        const req = { user: { id: userA_Id } };
        const res = createMockRes();

        await getAddresses(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(updateManyCalled, true);
        assert.equal(res.body[0].isDefault, true);
        assert.equal(res.body[1].isDefault, false);
    });

    test('validateAddressPayload rejects excessively long strings', () => {
        const longName = 'A'.repeat(101);
        const longLine = 'B'.repeat(251);

        const res1 = validateAddressPayload({
            fullName: longName,
            phone: '9820123456',
            addressLine: 'Valid Line',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400013'
        });
        assert.equal(res1.isValid, false);
        assert.ok(res1.errors.some((e) => e.includes('100 characters')));

        const res2 = validateAddressPayload({
            fullName: 'Valid Name',
            phone: '9820123456',
            addressLine: longLine,
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400013'
        });
        assert.equal(res2.isValid, false);
        assert.ok(res2.errors.some((e) => e.includes('250 characters')));
    });

    // -------------------------------------------------------------------------
    // 3. Concurrency & Deduplication Invariant Tests
    // -------------------------------------------------------------------------
    test('Simultaneous createAddress operations race gracefully and yield exactly one default address', async () => {
        let insertAttempts = 0;
        const storedAddresses = [];

        Address.countDocuments = async () => storedAddresses.length;

        Address.updateMany = async (filter, update) => {
            for (const addr of storedAddresses) {
                if (addr.user === filter.user) {
                    addr.isDefault = update.isDefault;
                }
            }
        };

        Address.create = async (doc) => {
            insertAttempts++;
            if (insertAttempts === 2 && doc.isDefault) {
                // Simulate MongoDB partial unique index E11000 violation on concurrent default insertion
                const err = new Error('E11000 duplicate key error collection: addresses index: user_1 dup key');
                err.code = 11000;
                throw err;
            }
            const created = { ...doc, _id: new mongoose.Types.ObjectId() };
            storedAddresses.push(created);
            return created;
        };

        const req1 = {
            user: { id: userA_Id },
            body: {
                fullName: 'User A Address 1',
                phone: '9820123456',
                addressLine: 'Flat 101, Building 1',
                city: 'Mumbai',
                state: 'Maharashtra',
                postalCode: '400001'
            }
        };
        const res1 = createMockRes();

        const req2 = {
            user: { id: userA_Id },
            body: {
                fullName: 'User A Address 2',
                phone: '9820123456',
                addressLine: 'Flat 102, Building 1',
                city: 'Mumbai',
                state: 'Maharashtra',
                postalCode: '400001'
            }
        };
        const res2 = createMockRes();

        await Promise.all([
            createAddress(req1, res1),
            createAddress(req2, res2)
        ]);

        assert.equal(res1.statusCode, 201);
        assert.equal(res2.statusCode, 201);
        assert.equal(storedAddresses.length, 2);
        const defaults = storedAddresses.filter((a) => a.isDefault);
        assert.equal(defaults.length, 1);
    });

    test('Simultaneous setDefaultAddress calls resolve race conditions gracefully', async () => {
        const id1 = new mongoose.Types.ObjectId();
        const id2 = new mongoose.Types.ObjectId();
        const storedAddresses = [
            { _id: id1, user: userA_Id, isDefault: true, save: async function () { this.isDefault = true; } },
            { _id: id2, user: userA_Id, isDefault: false, save: async function () { this.isDefault = true; } }
        ];

        Address.findOne = async (query) => {
            return storedAddresses.find((a) => a._id.toString() === query._id.toString() && a.user === query.user) || null;
        };

        Address.updateMany = async (filter, update) => {
            for (const a of storedAddresses) {
                if (a.user === filter.user) {
                    a.isDefault = update.isDefault;
                }
            }
        };

        const req1 = { user: { id: userA_Id }, params: { id: id2.toString() } };
        const res1 = createMockRes();

        await setDefaultAddress(req1, res1);

        assert.equal(res1.statusCode, 200);
        assert.equal(storedAddresses.find((a) => a._id.toString() === id2.toString()).isDefault, true);
        assert.equal(storedAddresses.find((a) => a._id.toString() === id1.toString()).isDefault, false);
    });

    test('syncAddresses preserves distinct flats/apartments in the same building and PIN code while deduplicating exact matches', async () => {
        const existingDocs = [];
        Address.find = () => {
            const query = Promise.resolve([...existingDocs]);
            query.sort = () => Promise.resolve([...existingDocs]);
            return query;
        };

        Address.create = async (doc) => {
            const created = { ...doc, _id: new mongoose.Types.ObjectId() };
            existingDocs.push(created);
            return created;
        };

        const syncPayload = {
            addresses: [
                {
                    id: 'local_401',
                    fullName: 'Rajesh Singhania',
                    phone: '9820123456',
                    addressLine: 'Flat 401, Highmont Residences, Lower Parel',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    postalCode: '400013',
                    tag: 'HOME'
                },
                {
                    id: 'local_402',
                    fullName: 'Rajesh Singhania',
                    phone: '9820123456',
                    addressLine: 'Flat 402, Highmont Residences, Lower Parel',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    postalCode: '400013',
                    tag: 'HOME'
                },
                {
                    id: 'local_401_dup',
                    fullName: 'rajesh singhania',
                    phone: '9820123456',
                    addressLine: 'Flat 401, Highmont Residences, Lower Parel.',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    postalCode: '400013',
                    tag: 'HOME'
                }
            ]
        };

        const req = { user: { id: userA_Id }, body: syncPayload };
        const res = createMockRes();

        await syncAddresses(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.syncedCount, 2);
        assert.equal(existingDocs.length, 2);
        assert.ok(existingDocs.some((d) => d.addressLine.includes('Flat 401')));
        assert.ok(existingDocs.some((d) => d.addressLine.includes('Flat 402')));
    });

    test('syncAddresses is completely idempotent on repeated executions', async () => {
        const existingDocs = [
            {
                _id: new mongoose.Types.ObjectId(),
                user: userA_Id,
                fullName: 'Rajesh Singhania',
                phone: '+91 98201 23456',
                addressLine: 'Flat 401, Highmont Residences',
                city: 'Mumbai',
                state: 'Maharashtra',
                postalCode: '400013',
                isDefault: true
            }
        ];

        Address.find = () => {
            const query = Promise.resolve([...existingDocs]);
            query.sort = () => Promise.resolve([...existingDocs]);
            return query;
        };

        let createCallCount = 0;
        Address.create = async (doc) => {
            createCallCount++;
            return { ...doc, _id: new mongoose.Types.ObjectId() };
        };

        const req = {
            user: { id: userA_Id },
            body: {
                addresses: [
                    {
                        id: 'local_repeat',
                        fullName: 'Rajesh Singhania',
                        phone: '9820123456',
                        addressLine: 'Flat 401, Highmont Residences',
                        city: 'Mumbai',
                        state: 'Maharashtra',
                        postalCode: '400013'
                    }
                ]
            }
        };
        const res = createMockRes();

        await syncAddresses(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.syncedCount, 0);
        assert.equal(createCallCount, 0);
    });
});
