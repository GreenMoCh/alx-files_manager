import Queue from 'bull';
import { promises as fs } from 'fs';
import path from 'path';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job, done) => {
    const { userId, fileId } = job.data;

    if (!userId) {
        return done(new Error('Missing userId'));
    }

    try {
        const file = await dbClient.client.db().collection('files').findOne({ _id: fileId, userId });

        if (!file) {
            return done(new Error('File not found'));
        }

        const sizes = [500, 250, 100];
        const filePath = file.localPath;

        for (const size of sizes) {
            const options = { width: size };
            const thumbnail = await imageThumbnail(filePath, options);
            await fs.readFile(`${filePath}_${size}`, thumbnail);
        }

        done();
    } catch (error) {
        done(error);
    }
});

fileQueue.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
});

fileQueue.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed: ${err.message}`);
});
