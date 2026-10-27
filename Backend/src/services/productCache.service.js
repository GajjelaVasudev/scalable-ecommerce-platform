const { redisClient } = require('../config/redis');

const PRODUCT_CACHE_TTL = 60; // seconds

const PRODUCT_LIST_CACHE_PREFIX = 'products:list:';
const PRODUCT_DETAIL_CACHE_PREFIX = 'products:detail:';

function isRedisReady() {
    return Boolean(redisClient && redisClient.isOpen);
}

// Get cached product listings
async function getCachedProductList(cacheKey) {
    if (!isRedisReady()) return null;

    try {
        const cachedData = await redisClient.get(
            `${PRODUCT_LIST_CACHE_PREFIX}${cacheKey}`
        );
        return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
        console.error('Redis product-list get failed:', error.message);
        return null;
    }
}

// Cache product listings
async function cacheProductList(cacheKey, data) {
    if (!isRedisReady()) return;

    try {
        await redisClient.set(
            `${PRODUCT_LIST_CACHE_PREFIX}${cacheKey}`,
            JSON.stringify(data),
            { EX: PRODUCT_CACHE_TTL }
        );
    } catch (error) {
        console.error('Redis product-list set failed:', error.message);
    }
}

// Invalidate all product listing caches
async function invalidateProductLists() {
    if (!isRedisReady()) return;

    try {
        if (typeof redisClient.scanIterator === 'function') {
            const keysToDelete = [];
            for await (const key of redisClient.scanIterator({
                MATCH: `${PRODUCT_LIST_CACHE_PREFIX}*`,
                COUNT: 100
            })) {
                keysToDelete.push(key);
            }
            if (keysToDelete.length > 0) {
                await redisClient.del(keysToDelete);
            }
            return;
        }

        let cursor = 0;
        do {
            const result = await redisClient.scan(cursor, {
                MATCH: `${PRODUCT_LIST_CACHE_PREFIX}*`,
                COUNT: 100
            });
            cursor = result.cursor;
            if (result.keys && result.keys.length > 0) {
                await redisClient.del(result.keys);
            }
        } while (Number(cursor) !== 0);
    } catch (error) {
        console.error('Redis product-list invalidation failed:', error.message);
    }
}

// Get cached individual product
async function getCachedProduct(productId) {
    if (!isRedisReady()) return null;

    try {
        const cachedData = await redisClient.get(
            `${PRODUCT_DETAIL_CACHE_PREFIX}${productId}`
        );
        return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
        console.error('Redis product-detail get failed:', error.message);
        return null;
    }
}

// Cache individual product
async function cacheProduct(productId, product) {
    if (!isRedisReady()) return;

    try {
        await redisClient.set(
            `${PRODUCT_DETAIL_CACHE_PREFIX}${productId}`,
            JSON.stringify(product),
            { EX: PRODUCT_CACHE_TTL }
        );
    } catch (error) {
        console.error('Redis product-detail set failed:', error.message);
    }
}

// Invalidate individual product cache
async function invalidateProduct(productId) {
    if (!isRedisReady()) return;

    try {
        await redisClient.del(
            `${PRODUCT_DETAIL_CACHE_PREFIX}${productId}`
        );
    } catch (error) {
        console.error('Redis product-detail invalidation failed:', error.message);
    }
}

module.exports = {
    getCachedProductList,
    cacheProductList,
    invalidateProductLists,
    getCachedProduct,
    cacheProduct,
    invalidateProduct
};
