const mongoose = require('mongoose');
const Address = require('../models/address.model');

/**
 * Normalizes text for robust comparison.
 * Lowercases, collapses whitespace, and strips superfluous punctuation.
 */
function normalizeText(str) {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().replace(/[\s\-_,.]+/g, ' ').trim();
}

/**
 * Validates and normalizes an Indian phone number.
 * Accepts 10 digits starting with 6-9, or prefixed with 91 or +91.
 */
function sanitizePhone(phone) {
    if (!phone || typeof phone !== 'string') return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
        return `+91 ${digits}`;
    }
    if (digits.length === 12 && /^91[6-9]\d{9}$/.test(digits)) {
        return `+91 ${digits.slice(2)}`;
    }
    return null;
}

/**
 * Validates an Indian 6-digit postal PIN code (non-zero leading).
 */
function sanitizePostalCode(pin) {
    if (!pin || typeof pin !== 'string') return null;
    const clean = pin.trim();
    if (/^[1-9][0-9]{5}$/.test(clean)) {
        return clean;
    }
    return null;
}

/**
 * Validates mandatory fields and formats for an address payload.
 */
function validateAddressPayload(data, isUpdate = false) {
    const errors = [];
    const sanitized = {};

    if (!isUpdate || data.fullName !== undefined) {
        if (!data.fullName || typeof data.fullName !== 'string' || !data.fullName.trim()) {
            errors.push('Full name is required');
        } else if (data.fullName.trim().length > 100) {
            errors.push('Full name cannot exceed 100 characters');
        } else {
            sanitized.fullName = data.fullName.trim();
        }
    }

    if (!isUpdate || data.phone !== undefined) {
        const phone = sanitizePhone(data.phone);
        if (!phone) {
            errors.push('Valid 10-digit Indian mobile number is required (starting with 6-9)');
        } else {
            sanitized.phone = phone;
        }
    }

    if (!isUpdate || data.addressLine !== undefined) {
        if (!data.addressLine || typeof data.addressLine !== 'string' || !data.addressLine.trim()) {
            errors.push('Address line is required');
        } else if (data.addressLine.trim().length > 250) {
            errors.push('Address line cannot exceed 250 characters');
        } else {
            sanitized.addressLine = data.addressLine.trim();
        }
    }

    if (!isUpdate || data.city !== undefined) {
        if (!data.city || typeof data.city !== 'string' || !data.city.trim()) {
            errors.push('City is required');
        } else if (data.city.trim().length > 100) {
            errors.push('City cannot exceed 100 characters');
        } else {
            sanitized.city = data.city.trim();
        }
    }

    if (!isUpdate || data.state !== undefined) {
        if (!data.state || typeof data.state !== 'string' || !data.state.trim()) {
            errors.push('State is required');
        } else if (data.state.trim().length > 100) {
            errors.push('State cannot exceed 100 characters');
        } else {
            sanitized.state = data.state.trim();
        }
    }

    if (!isUpdate || data.postalCode !== undefined) {
        const pin = sanitizePostalCode(data.postalCode);
        if (!pin) {
            errors.push('Valid 6-digit Indian PIN code is required (cannot start with 0)');
        } else {
            sanitized.postalCode = pin;
        }
    }

    if (data.country !== undefined) {
        sanitized.country = typeof data.country === 'string' && data.country.trim() ? data.country.trim().slice(0, 50) : 'India';
    } else if (!isUpdate) {
        sanitized.country = 'India';
    }

    if (data.tag !== undefined) {
        const validTags = ['HOME', 'WORK', 'OTHER'];
        const tag = typeof data.tag === 'string' ? data.tag.trim().toUpperCase() : 'HOME';
        if (!validTags.includes(tag)) {
            errors.push("Tag must be one of: 'HOME', 'WORK', 'OTHER'");
        } else {
            sanitized.tag = tag;
        }
    } else if (!isUpdate) {
        sanitized.tag = 'HOME';
    }

    if (data.isDefault !== undefined) {
        sanitized.isDefault = Boolean(data.isDefault);
    }

    return { isValid: errors.length === 0, errors, sanitized };
}

/**
 * Runs operations within a MongoDB transaction if replica sets are active,
 * or gracefully without a transaction session on standalone environments.
 */
async function withOptionalTransaction(workFn) {
    let session = null;
    let useTransaction = false;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
            session = await mongoose.startSession();
            session.startTransaction();
            useTransaction = true;
        } catch {
            useTransaction = false;
            if (session) {
                try { await session.endSession(); } catch {}
                session = null;
            }
        }
    }

    try {
        const result = await workFn(useTransaction ? session : null);
        if (useTransaction && session) {
            await session.commitTransaction();
        }
        return result;
    } catch (err) {
        if (useTransaction && session) {
            try { await session.abortTransaction(); } catch {}
        }
        throw err;
    } finally {
        if (session) {
            try { await session.endSession(); } catch {}
        }
    }
}

/**
 * GET /api/addresses
 * Retrieve all saved addresses for the authenticated customer.
 * Includes database self-healing logic for single default address consistency.
 */
async function getAddresses(req, res) {
    try {
        let addresses = await Address.find({ user: req.user.id })
            .sort({ isDefault: -1, createdAt: -1 });

        // Self-healing 1: if customer has addresses but none is default, promote the first one
        if (addresses.length > 0 && !addresses.some((a) => a.isDefault)) {
            addresses[0].isDefault = true;
            await Address.updateOne({ _id: addresses[0]._id }, { isDefault: true });
        }

        // Self-healing 2: if multiple addresses are marked default, keep only the first (newest) default
        const defaults = addresses.filter((a) => a.isDefault);
        if (defaults.length > 1) {
            const primaryDefaultId = defaults[0]._id;
            await Address.updateMany(
                { user: req.user.id, _id: { $ne: primaryDefaultId } },
                { isDefault: false }
            );
            addresses = addresses.map((a) => {
                if (a._id.toString() !== primaryDefaultId.toString()) {
                    a.isDefault = false;
                }
                return a;
            });
        }

        const formatted = addresses.map((addr) => {
            const obj = typeof addr.toObject === 'function' ? addr.toObject() : addr;
            return {
                ...obj,
                id: (obj._id || addr._id).toString()
            };
        });

        return res.status(200).json(formatted);
    } catch (error) {
        console.error('getAddresses error:', error.message);
        return res.status(500).json({ message: 'Failed to retrieve addresses' });
    }
}

/**
 * POST /api/addresses
 * Create a new delivery address for the authenticated customer.
 * Protected by MongoDB partial unique index and transaction rollback.
 */
async function createAddress(req, res) {
    const { isValid, errors, sanitized } = validateAddressPayload(req.body, false);
    if (!isValid) {
        return res.status(400).json({ message: errors.join(', '), errors });
    }

    const requestedDefault = Boolean(sanitized.isDefault);

    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const address = await withOptionalTransaction(async (session) => {
                const countOpts = session ? { session } : {};
                const existingCount = await Address.countDocuments({ user: req.user.id }, countOpts);

                const shouldBeDefault = existingCount === 0 || requestedDefault;

                if (shouldBeDefault && existingCount > 0) {
                    await Address.updateMany(
                        { user: req.user.id, isDefault: true },
                        { isDefault: false },
                        session ? { session } : {}
                    );
                }

                const docToCreate = {
                    ...sanitized,
                    isDefault: shouldBeDefault,
                    user: req.user.id
                };

                let createdDoc;
                if (session) {
                    const createdArray = await Address.create([docToCreate], { session });
                    createdDoc = createdArray[0];
                } else {
                    createdDoc = await Address.create(docToCreate);
                }

                return createdDoc;
            });

            return res.status(201).json(address);
        } catch (error) {
            const isDuplicateKey = error.code === 11000;
            const isTransient = error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError');

            if ((isDuplicateKey || isTransient) && attempt < maxRetries) {
                // If a concurrent creation took the default slot or transaction conflict occurred, retry
                continue;
            }

            console.error('createAddress error:', error.message);
            return res.status(500).json({ message: 'Failed to save address' });
        }
    }
}

/**
 * PUT /api/addresses/:id
 * Update an existing address belonging to the authenticated customer.
 */
async function updateAddress(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid address ID' });
    }

    const { isValid, errors, sanitized } = validateAddressPayload(req.body, true);
    if (!isValid) {
        return res.status(400).json({ message: errors.join(', '), errors });
    }

    try {
        const updatedDoc = await withOptionalTransaction(async (session) => {
            const findOpts = session ? { session } : {};
            const address = await Address.findOne({ _id: id, user: req.user.id }, null, findOpts);
            if (!address) {
                const err = new Error('Address not found');
                err.status = 404;
                throw err;
            }

            if (sanitized.isDefault === true) {
                await Address.updateMany(
                    { user: req.user.id, _id: { $ne: id }, isDefault: true },
                    { isDefault: false },
                    session ? { session } : {}
                );
                address.isDefault = true;
            } else if (sanitized.isDefault === false && address.isDefault) {
                // Cannot unset default if it is the only address
                const totalCount = await Address.countDocuments({ user: req.user.id }, findOpts);
                if (totalCount > 1) {
                    address.isDefault = false;
                    // Reassign default to another address
                    const alternate = await Address.findOne({ user: req.user.id, _id: { $ne: id } }, null, findOpts);
                    if (alternate) {
                        alternate.isDefault = true;
                        if (session) {
                            await alternate.save({ session });
                        } else {
                            await alternate.save();
                        }
                    }
                } else {
                    // Only 1 address exists; keep default true
                    sanitized.isDefault = true;
                }
            }

            Object.assign(address, sanitized);
            if (session) {
                await address.save({ session });
            } else {
                await address.save();
            }

            return address;
        });

        return res.status(200).json(updatedDoc);
    } catch (error) {
        if (error.status === 404) {
            return res.status(404).json({ message: error.message });
        }
        console.error('updateAddress error:', error.message);
        return res.status(500).json({ message: 'Failed to update address' });
    }
}

/**
 * DELETE /api/addresses/:id
 * Remove an address and reassign default atomically if the deleted address was default.
 */
async function deleteAddress(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid address ID' });
    }

    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await withOptionalTransaction(async (session) => {
                const findOpts = session ? { session } : {};
                const address = await Address.findOne({ _id: id, user: req.user.id }, null, findOpts);
                if (!address) {
                    const err = new Error('Address not found');
                    err.status = 404;
                    throw err;
                }

                const wasDefault = address.isDefault;
                await Address.deleteOne({ _id: id, user: req.user.id }, session ? { session } : {});

                let reassignedDefaultId = null;
                if (wasDefault) {
                    const nextAddress = await Address.findOne(
                        { user: req.user.id },
                        null,
                        session ? { session, sort: { createdAt: -1 } } : { sort: { createdAt: -1 } }
                    );
                    if (nextAddress) {
                        await Address.updateMany(
                            { user: req.user.id, isDefault: true },
                            { isDefault: false },
                            session ? { session } : {}
                        );
                        nextAddress.isDefault = true;
                        if (session) {
                            await nextAddress.save({ session });
                        } else {
                            await nextAddress.save();
                        }
                        reassignedDefaultId = nextAddress._id.toString();
                    }
                }

                return { reassignedDefaultId };
            });

            return res.status(200).json({
                message: 'Address deleted successfully',
                reassignedDefaultId: result.reassignedDefaultId
            });
        } catch (error) {
            if (error.status === 404) {
                return res.status(404).json({ message: error.message });
            }

            const isDuplicateKey = error.code === 11000;
            const isTransient = error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError');
            if ((isDuplicateKey || isTransient) && attempt < maxRetries) {
                continue;
            }

            console.error('deleteAddress error:', error.message);
            return res.status(500).json({ message: 'Failed to delete address' });
        }
    }
}

/**
 * PATCH /api/addresses/:id/default
 * Set a specific address as default for the authenticated customer.
 * Unsets any existing default atomically within a transaction.
 */
async function setDefaultAddress(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid address ID' });
    }

    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const address = await withOptionalTransaction(async (session) => {
                const findOpts = session ? { session } : {};
                const target = await Address.findOne({ _id: id, user: req.user.id }, null, findOpts);
                if (!target) {
                    const err = new Error('Address not found');
                    err.status = 404;
                    throw err;
                }

                if (target.isDefault) {
                    return target;
                }

                // Unset all existing defaults for this customer
                await Address.updateMany(
                    { user: req.user.id, isDefault: true },
                    { isDefault: false },
                    session ? { session } : {}
                );

                // Set new default
                target.isDefault = true;
                if (session) {
                    await target.save({ session });
                } else {
                    await target.save();
                }

                return target;
            });

            return res.status(200).json(address);
        } catch (error) {
            if (error.status === 404) {
                return res.status(404).json({ message: error.message });
            }

            const isDuplicateKey = error.code === 11000;
            const isTransient = error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError');
            if ((isDuplicateKey || isTransient) && attempt < maxRetries) {
                continue;
            }

            console.error('setDefaultAddress error:', error.message);
            return res.status(500).json({ message: 'Failed to set default address' });
        }
    }
}

/**
 * POST /api/addresses/sync
 * Bulk-sync/migrate legacy local addresses into MongoDB without duplicates.
 * Distinguishes different flats/apartments within the same building and PIN code.
 */
async function syncAddresses(req, res) {
    try {
        const { addresses } = req.body;
        if (!Array.isArray(addresses)) {
            return res.status(400).json({ message: 'addresses must be an array' });
        }

        const rawExisting = await Address.find({ user: req.user.id });
        const existingAddresses = Array.isArray(rawExisting) ? [...rawExisting] : [];
        let currentDefaultExists = existingAddresses.some((a) => a.isDefault);

        const created = [];
        for (const item of addresses) {
            if (!item || typeof item !== 'object') continue;

            // Ignore sample demo addresses with dummy ids like 'addr_01', 'addr_02' or 'addr_demo_*'
            if (typeof item.id === 'string' && (item.id === 'addr_01' || item.id === 'addr_02' || item.id.includes('demo'))) {
                continue;
            }

            const { isValid, sanitized } = validateAddressPayload(item, false);
            if (!isValid) continue;

            // Accurate deduplication:
            // Checks recipient fullName, addressLine (preserving flat/unit distinction), city, and postalCode.
            const isDuplicate = existingAddresses.some((existing) => {
                const sameName = normalizeText(existing.fullName) === normalizeText(sanitized.fullName);
                const sameLine = normalizeText(existing.addressLine) === normalizeText(sanitized.addressLine);
                const sameCity = normalizeText(existing.city) === normalizeText(sanitized.city);
                const samePin = (existing.postalCode || '').trim() === (sanitized.postalCode || '').trim();
                return sameName && sameLine && sameCity && samePin;
            });

            if (!isDuplicate) {
                const isFirst = existingAddresses.length === 0 && created.length === 0;
                sanitized.isDefault = isFirst || (!currentDefaultExists && Boolean(sanitized.isDefault));
                if (sanitized.isDefault) currentDefaultExists = true;

                sanitized.user = req.user.id;
                const newDoc = await Address.create(sanitized);
                created.push(newDoc);
                existingAddresses.push(newDoc);
            }
        }

        // Return the full updated address list
        const allAddresses = await Address.find({ user: req.user.id })
            .sort({ isDefault: -1, createdAt: -1 });

        const formatted = allAddresses.map((addr) => {
            const obj = typeof addr.toObject === 'function' ? addr.toObject() : addr;
            return {
                ...obj,
                id: (obj._id || addr._id).toString()
            };
        });

        return res.status(200).json({
            message: `Synced ${created.length} new addresses`,
            syncedCount: created.length,
            addresses: formatted
        });
    } catch (error) {
        console.error('syncAddresses error:', error.message);
        return res.status(500).json({ message: 'Failed to sync addresses' });
    }
}

module.exports = {
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    syncAddresses,
    withOptionalTransaction,
    normalizeText,
    sanitizePhone,
    sanitizePostalCode,
    validateAddressPayload
};
