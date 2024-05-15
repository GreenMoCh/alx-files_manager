import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import mime from 'mime-types';;
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import Queue from 'bull';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const fileQueue = new Queue('fileQueue');

const FilesController = {
    async postUpload(req, res) {
        const token = req.headers['x-token'];
        const userId = await redisClient.get(`auth_${token}`);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name, type, parentId, isPublic, data } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Missing name or type'});
        }

        if (type !== 'folder' && !data) {
            return res.status(400).json({ error: 'Missing data' });
        }

        const newFile = {
            userId,
            name,
            type,
            parentId: parentId || 0,
            isPublic: isPublic || false,
            localPath: type !== 'folder' ? path.join(FOLDER_PATH, uuidv4()) : null, 
        };

        if (type !== 'folder') {
            await fs.readFile(newFile.localPath, Buffer.from(data, 'base64'));
        }

        const result = await dbClient.client.db().collection('files').insertOne(newFile);
        newFile.id = result.insertedId;

        if (type === 'image') {
            fileQueue.add({ userId, fileId: newFile.id });
        }

        return res.status(201).json(newFile);
    },

    async getShow(req, res) {
        const token = req.headers['x-token'];
        const fileId = req.params.id;

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const file = await dbClient.client.db().collection('files').findOne({ _id: fileId, userId });
            if (!file) {
                return res.status(404).json({ error: 'Not found' });
            }
            return res.status(200).json(file);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    async getIndex(req, res) {
        const token = req.headers['x-token'];
        const parentId = req.query.parentId || '0';
        const page = parentId(req.query.page, 10) || 0;

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const PAGE_SIZE = 20;

        try {
            const files = await dbClient.client.db().collection('files')
                .aggregate([
                    { $match: { parentId, userId } },
                    { $skip: page * PAGE_SIZE },
                    { $limit: PAGE_SIZE }
                ])
                .toArray();

            return res.status(200).json(files);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    async putPublish(req, res) {
        const token = req.headers['x-token'];
        const fileId = req.params.id;

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const file = await dbClient.client.db().collection('files').findOneAndUpdate(
                { _id: fileId, userId },
                { $set: { isPublic: true } },
                { returnOriginal: false }
            );

            if (!file.value) {
                return res.status(404).json({ error: 'Not found' });
            }

            return res.status(200).json(file.value);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    async putUnpublish(req, res) {
        const token = req.headers['x-token'];
        const fileId = req.params.id;

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'unauthorized' });
        }

        try {
            const file = await dbClient.client.db().collection('files').findOneAndUpdate(
                { _id: fileId, userId },
                { $set: { isPublic: false } },
                { returnOriginal: false }
            );

            if (!file.value) {
                return res.status(404).json({ error: 'Not found' });
            }

            return res.status(200).json(file.value);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    async getFile(req, res) {
        const token = req.headers['x-token'];
        const fileId = req.params.id;
        const size = req.query.size;

        try {
            const file = await dbClient.client.db().collection('files').findOne({ _id: fileId });

            if (!file) {
                return res.status(404).json({ error: 'Not found' });
            }

            if (file.type === 'folder') {
                return res.status(400).json({ error: "A folder doesn't have content" });
            }

            if (!file.isPublic) {
                if (!token) {
                    return res.status(404).json({ error: 'Not found' });
                }

                const userId = await redisClient.get(`auth_${token}`);
                if (!userId || file.userId !== userId) {
                    return res.status(404).json({ error: 'Not found' });
                }
            }

            let filePath = file.localPath;
            if (size) {
                filePath = `${filePath}_${size}`;
            }

            try {
                const fileContent = await fs.readFile(file.localPath);
                const mimeType = mime.lookup(file.name) || 'application/octet-stream';

                res.setHeader('Content-Type', mimeType);
                return res.status(200).send(fileContent);
            } catch (err) {
                return res.status(404).json({ error: 'Not found' });
            }

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

export default FilesController;
