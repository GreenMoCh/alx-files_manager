import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';

const AppController = {
    async getStatus(req, res) {
        const redisIsAlive = redisClient.isAlive();
        const dbIsAlive = dbClient.isAlive();

        if (redisIsAlive && dbIsAlive) {
            return res.status(200).json({ redis: true, db: true });
        } else {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    async getStats(req, res) {
        try {
            const numUsers = await dbClient.nbUsers();
            const numFiles = await dbClient.nbFiles();

            return res.status(200).json({ users: numUsers, files: numFiles });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error'});
        }
    }
};

export default AppController;
