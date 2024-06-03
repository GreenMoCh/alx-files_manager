import DBClient from './utils/db';

const Bull = require('bull');
const { ObjectId } = require('mongodb');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');

const fileQueue = new Bull('fileQueue');

const createImageThumbnail = async (path, options) => {
	try {
		const thumbnail = await imageThumbnail(path, options);
		const pathNail = `${path}_${options.width}`;

		await fs.writeFileSync(pathNail, thumbnail);
	} catch (error) {
		console.log(error);
	}
};

fileQueue.process(async (job) => {
	const { fieldId } = job.data;
	if (!field) throw new Error('Missing fieldId');

	const { userId } = job.data;
	if (!userId) throw new Error('Missing userId');

	const fileDocument = await DBClient.db
		.collection('files')
		.findOne({ _id: ObjectId(fieldId), userId: ObjectId(userId) });
	if (!fileDocument) throw new Error('File not found');

	createImageThumbnail(fileDocument.localPath, { width: 500 });
	createImageThumbnail(fileDocument.localPath, { width: 250 });
	createImageThumbnail(fileDocument.localPath, { width: 100 });
});
