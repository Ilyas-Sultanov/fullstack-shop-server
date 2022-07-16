import {NextFunction, Request, Response} from 'express';
import ApiError from '../exceptions/ApiError';
import authService from '../services/authService';
import getValidationMessages from '../helpers/getValidationMessages';
import tokenService from '../services/tokenService';


class AuthController {
  async registration(req: Request, res: Response, next: NextFunction) {
    try {
      const validationMessages = getValidationMessages(req);
      if (validationMessages?.length) {
        throw ApiError.badRequest(JSON.stringify(validationMessages));
      }
      const {name, email, password}: {name: string, email: string, password: string} = req.body;
      const userData = await authService.registration(name, email, password);
      res.cookie(
        'refreshToken', 
        userData.refreshToken, 
        {maxAge: 30 * 24 * 60 * 1000, httpOnly: true, /* secure: true */}
      );

      return res.json(userData);
    }
    catch (err) {
      next(err);
    }
  }

  async activateAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const activationLink = req.params.link;
      await authService.activateAccount(activationLink);
      return res.redirect(process.env.CLIENT_URL as string);
    }
    catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validationMessages = getValidationMessages(req);
      if (validationMessages?.length) {
        throw ApiError.badRequest(JSON.stringify(validationMessages));
      }

      const {email, password}: {email: string, password: string} = req.body;
      const userData = await authService.login(email, password);

      if (userData) {
        res.cookie(
          'refreshToken', 
          userData.refreshToken, 
          {maxAge: 30 * 24 * 60 * 1000, httpOnly: true, /* secure: true */}
        );
          
        return res.json(userData);
      }
    }
    catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const {refreshToken}: {refreshToken: string} = req.cookies;
      await authService.logout(refreshToken);
      res.clearCookie('refreshToken');
      return res.json({message: 'Вы успешно вышли'});
    }
    catch (err) {
      next(err);
    }
  }

  
  async refreshTokens(req: Request, res: Response, next: NextFunction) { // обновление access токена при помощи refresh токена, но при этом и refresh токен обновляется
    try {
      const {refreshToken}: {refreshToken: string | undefined} = req.cookies;
      // console.log(refreshToken);
      

      if (!refreshToken) {
        throw ApiError.unauthorizedError('Пользователь не авторизован');
      }

      const userData = await tokenService.refreshTokens(refreshToken);

      if (userData) {
        res.cookie(
          'refreshToken', 
          userData.refreshToken, 
          {maxAge: 30 * 24 * 60 * 1000, httpOnly: true, /* secure: true */}
        );
  
        return res.json(userData);
      }
    }
    catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const {email}: {email: string} = req.body;
      await authService.forgotPassword(email);
      res.status(200).end();
    }
    catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { resetLink, newPassword }: { resetLink:string, newPassword: string } = req.body;
      const result = await authService.resetPassword(resetLink, newPassword);
      if (result.modifiedCount < 1) {
        throw ApiError.internal('Ошибка во время восстановления доступа');
      }
      res.status(200).end();
    }
    catch (err) {
      next(err);
    }
  }
}

export default new AuthController();