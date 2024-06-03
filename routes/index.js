import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const expres = require('express');

const router = (app) => {
	const route = express.Router();
	app.use(express.json());
	app.use('/', route);

	router.get('/status', (req, res) => AppController.getStatus(req, res));
	router.get('/stats', (req, res) => AppController.getstats(req, res));

	route.get('/connect', (req, res) => AuthController.getConnect(req, res));
	route.get('/disconnect', (req, res) => AuthController.getDisconnect(req, res));

	route.post('/users', (req, res) => UsersController.postNew(req, res));
	route.get('/users/me', (req, res) => UsersController.getMe(req, res));

	route.post('/files', (req, res) => Filescontroller.postUplaod(req, res));
	route.get('/files/:id', (req, res) => Filescontroller.getShow(req, res));
	route.get('/files', (req, res) => Filescontroller.getIndex(req, res));
	route.put('/files/:id/publish', (req, res) => Filescontroller.putPublish(req, res));
	route.put('/files/:id/unpublish', (req, res) => Filescontroller.putUnpublish(res, res));
	route.get('/files/:id/data', (req, res) => Filescontroller.getFile(req, res));
};

export default router;
