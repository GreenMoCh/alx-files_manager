import router from './routes/index';
const express = require('express');

const app = express();
const PORT = process.env.PORT ||5000;

router(app)

app.listen(PORT, () => {
    console.log(`Server runnign at http://localhost:${PORT}`);
});
