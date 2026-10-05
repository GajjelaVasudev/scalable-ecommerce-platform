
const { redisClient } = require('../config/redis');

const PRODUCT_CACHE_TTL = 60; // seconds
const PRODUCT_LIST_CACHE_PREFIX = 'products:list:';

async function getCachedProductList(cacheKey) {
    const cachedData = await redisClient.get(
        `${PRODUCT_LIST_CACHE_PREFIX}${cacheKey}`
    );

    return cachedData ? JSON.parse(cachedData) : null;
}

async function cacheProductList(cacheKey, data) {
    await redisClient.set(
        `${PRODUCT_LIST_CACHE_PREFIX}${cacheKey}`,
        JSON.stringify(data),
        { EX: PRODUCT_CACHE_TTL }
    );
}


async function invalidateProductLists() {
    let cursor = 0;

    do {
        const result = await redisClient.scan(cursor, {
            MATCH: 'products:list:*',
            COUNT: 100
        });

        cursor = result.cursor;

        if (result.keys.length > 0) {
            await redisClient.del(result.keys);
        }
    } while (Number(cursor) !== 0);
}


module.exports = {
    getCachedProductList,
    cacheProductList,
    invalidateProductLists
};
