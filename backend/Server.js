import express from 'express';
const app = express()
import mongoose from 'mongoose';
import { APP_PORT, DB_URL } from './Config'
import errorHandler from './middlewares/errorHandler';
import router from './routres';

// Database connection
mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('DB connected...')
})

app.use(express.json())

app.use('/api', router)

app.use(errorHandler);

app.listen(APP_PORT, () => {
    console.log(`App listening on port ${APP_PORT}`)
})     