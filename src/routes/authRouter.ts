import {Router} from 'express';
import authController from '../controllers/authController';
import authValidators from '../middlewares/validationMiddlewares/auth';
const authRouter = Router();

authRouter.post('/registration', authValidators.registration, authController.registration);
authRouter.post('/login', authValidators.login, authController.login);

authRouter.get('/logout', authController.logout);
authRouter.get('/activate/:link', authController.activateAccount); // активация аккаунта по ссылке которая будет приходить по почте
authRouter.get('/refresh', authController.refreshTokens); // перезапись access токена (с клиента отправляется refresh token и от сервера должны возвращаться новые access и refresh токены)
authRouter.post('/forgotPassword', authValidators.forgotPassword, authController.forgotPassword);
authRouter.patch('/resetPassword', authValidators.resetPassword, authController.resetPassword);

export default authRouter;