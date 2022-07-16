import {body} from 'express-validator';
import UserModel from '../../models/User';

const authValidators = {
    registration: [
        body('name', 'Не указано имя пользователя')
            .trim()
            .notEmpty().withMessage('Не указано имя пользователя')
            .isLength({min: 2, max: 15}).withMessage('Длина имени должна быть от 2 до 15 символов'),
            
        body('email')
            .trim()
            .notEmpty().withMessage('Не указан email')
            .isEmail().not().withMessage('Не валидный email'),
                    
        body('password')
            .trim()
            .notEmpty().withMessage('Не указан пароль')
            .isLength({min: 5, max: 25}).withMessage('Длина пароля должна быть от 5 до 25 символов'),
    ],
    login: [
        body('email', 'Не указан email')
            .trim()
            .notEmpty().withMessage('Не указан email')
            .isEmail().not().withMessage('Не валидный email'),
        
        body('password')
            .trim()
            .notEmpty().withMessage('Не указан пароль')
            .isLength({min: 5, max: 25}).withMessage('Длина пароля должна быть от 5 до 25 символов'),
    ],
    forgotPassword: [
        body('email')
            .trim()
            .notEmpty().withMessage('Не указан email')
            .isEmail().not().withMessage('Не валидный email'),
    ],
    resetPassword: [
        body('newPassword')
            .trim()
            .notEmpty().withMessage('Не указан пароль')
            .isLength({min: 5, max: 25}).withMessage('Длина пароля должна быть от 5 до 25 символов'),
    ]
}



export default authValidators;