import {Request, Response, NextFunction} from 'express';
import ApiError from "../exceptions/ApiError";

function errorHandler(err: ApiError | Error, req: Request, res: Response, next: NextFunction) {
  console.error(err); // console.log() синхронная функция, поэтому на продакшене их нужно удалить иначе будут блокировать поток
  
  if (err instanceof ApiError) {
    return res.status(err.status).json({message: err.message});
  }
  else {
    return res.status(500).json({message: 'Unexpected error (Непредвиденная ошибка)!'});
  }
}

export default errorHandler;