import dotenv from 'dotenv'; // типы уже встроены
dotenv.config(); // это должно быть над всем кодом иначе переменные из process.env могут не правильно работать, такое случилось для nodemailer
import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multerWithOptions from './middlewares/multerWithOptions';
import mongoose from 'mongoose'; // типы уже встроены
import router from './routes/index';
import errorHandler from './middlewares/errorHandlerMiddleware';

const app = express();
app.disable("x-powered-by");
app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(`${__dirname}/public`));
app.use(multerWithOptions);
app.use('/api', router);
app.use(errorHandler);
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    /* Подключение к базе */
    await mongoose.connect(process.env.MONGO_URL as string, /* options */);
    console.log('DB connected');

    /* Запуск сервера */
    http.createServer(app).listen(PORT, function () {
      console.log(`Server started on port ${process.env.PORT}`);
    });
  }
  catch ({name, message}) {
    console.error(`${name}: ${message}`);
    process.exit(1);
  }
}

start();