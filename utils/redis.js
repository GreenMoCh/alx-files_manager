import redis from 'redis';
/**
 * Redis Client
 */
class RedisClient {
    /**
     * Creates RedisClient
     */
    constructor() {
        this.client = redis.createClient();

        this.client.on('error', (err) => {
            console.error(`Redis client error: ${err}`);
        });
    }

    /**
     * Checks if the client is connected
     * @returns { boolean }
     */
    isAlive() {
        return this.client.connected;
    }

    /**
     * Retrieves the value of a given key
     * @param {String} key The key of the item to store
     * @returns {String | Object}
     */
    async get(key) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, value) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(value);
                }
            });
        });
    }

    /**
     * Stores a key and its value along with an expiration time
     * @param {String} key The key of the item to store
     * @param {String | Number | Boolean} value The item to store
     * @param {Number} duration The expiration time of the item
     */
    async set(key, value, duration) {
        this.client.setex(key, duration, value);
    }

    /**
     * Removes the value of a given key
     * @param {String} key The key of the item to remove
     */
    async del(key) {
        this.client.del(key);
    }
}

const redisClient = new RedisClient();
export default redisClient;
