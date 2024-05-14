import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const AuthController = {
    async getConnect(req, res) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Basic ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const encodedCreedentials = authHeader.split(' ')[1];
        const decodedCreedentials = Buffer.from(encodedCreedentials, 'base64').toString();
        const [email, password] = decodedCreedentials.split(':');

        const hashedPassword = sha1(password);
        const user = await dbClient.client.db().collection('users').findOne({ email, password: hashedPassword });
       
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = uuidv4();
        const key = `auth_${token}`;

        await redisClient.client.set(key, user._id.toString(), 'EX', 86400);

        return res.status(200).json({ token });
    },

    async getDisconnect(req, res) {
        const { 'x-token': token } = req.headers;

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const key = `auth_${token}`;
        const userId = await redisClient.client.get(key);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await redisClient.client.del(key);
        return res.status(204).send();
    }
};

export default AuthController;
