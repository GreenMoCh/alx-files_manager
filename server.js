import express from 'express';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT ||5000;

app.use('/', routes);

app.listen(PORT, () => {
    console.log(`Server runnign on port ${PORT}`);
});