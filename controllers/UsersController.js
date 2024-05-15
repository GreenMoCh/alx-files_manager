import sha1 from 'sha1';
import dbClient from '../utils/db.js';

const UsersController = {
    async postNew(req, res) {
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Missing email' });
        }
        if (!password) {
            return res.status(400).json({ error: 'Missing password' });
        }

        try {
            const existingUser = await dbClient.client.db().collection('users').findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'Already exist' });
            }

            const hashedPassword = sha1(password);
            const result = await dbClient.client.db().collection('users').insertOne({ email, password: hashedPassword});

            return res.status(201).json({ id: result.insertId, email });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error'});
        }
    },

    async getMe(req, res) {
        const { user } = req;
        res.status(200).json({ email: user.email, id: user._id.toString() });
    }
};

export default UsersController;
