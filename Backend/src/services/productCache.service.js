
const { redisClient } = require('../config/redis');

const PRODUCT_CACHE_TTL = 60; // seconds

const PRODUCT_LIST_CACHE_PREFIX = 'products:list:';
const PRODUCT_DETAIL_CACHE_PREFIX = 'products:detail:';

// Get cached product listings
async function getCachedProductList(cacheKey) {
    const cachedData = await redisClient.get(
        `${PRODUCT_LIST_CACHE_PREFIX}${cacheKey}`
    );

    return cachedData ? JSON.parse(cachedData) : null;
}

// Cache product listings
async function cacheProductList(cacheKey, data) {
    await redisClient.set(
        `${PRODUCT_LIST_CACHE_PREFIX}${cacheKey}`,
        JSON.stringify(data),
        { EX: PRODUCT_CACHE_TTL }
    );
}

// Invalidate all product listing caches
async function invalidateProductLists() {
    let cursor = 0;

    do {
        const result = await redisClient.scan(cursor, {
            MATCH: `${PRODUCT_LIST_CACHE_PREFIX}*`,
            COUNT: 100
        });

        cursor = result.cursor;

        if (result.keys.length > 0) {
            await redisClient.del(result.keys);
        }
    } while (Number(cursor) !== 0);
}

// Get cached individual product
async function getCachedProduct(productId) {
    const cachedData = await redisClient.get(
        `${PRODUCT_DETAIL_CACHE_PREFIX}${productId}`
    );

    return cachedData ? JSON.parse(cachedData) : null;
}

// Cache individual product
async function cacheProduct(productId, product) {
    await redisClient.set(
        `${PRODUCT_DETAIL_CACHE_PREFIX}${productId}`,
        JSON.stringify(product),
        { EX: PRODUCT_CACHE_TTL }
    );
}

// Invalidate individual product cache
async function invalidateProduct(productId) {
    await redisClient.del(
        `${PRODUCT_DETAIL_CACHE_PREFIX}${productId}`
    );
}

module.exports = {
    getCachedProductList,
    cacheProductList,
    invalidateProductLists,
    getCachedProduct,
    cacheProduct,
    invalidateProduct
};
