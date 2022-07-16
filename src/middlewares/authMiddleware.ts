import {Request, Response, NextFunction} from 'express';
import ApiError from '../exceptions/ApiError';
import tokenService from '../services/tokenService';
// import {IUserDto} from '../types/types';

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authorizationHeader = req.headers.authorization;
    
    if (!authorizationHeader) {
      return next(ApiError.unauthorizedError());
    }

    const accessToken = authorizationHeader?.split(' ')[1];
    
    if (!accessToken) {
      return next(ApiError.unauthorizedError());
    }

    const userData = tokenService.validateAccessToken(accessToken);
    if (!userData) {
      return next(ApiError.unauthorizedError());
    }

    req.user = userData; // внимание! здесь пришлось расширить типы объекта req, т.к. там нет объекта user. (в корне проекта смотри @types\express\index.d.ts)
    next();
  }
  catch (err) {
    return next(ApiError.unauthorizedError());
  }
}

export default authMiddleware;