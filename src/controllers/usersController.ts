import {Request, Response, NextFunction} from 'express';
import userService from '../services/userService';
import ApiError from '../exceptions/ApiError';
import { usersQuery } from '../types/user';

class UsersController {
    async getUsers(req: Request, res: Response, next: NextFunction) {        
        try {
            const usersData = await userService.getUsers(req.query as usersQuery, req.originalUrl);
            // if (usersData.data.length < 1) {
            //     return res.json({message: 'Users not found'});
            // }            
            return res.json(usersData);
        }
            catch (err) {
            next(err);
        }
    }
  
    async getOneUser(req: Request, res: Response, next: NextFunction) {
        try {
            const _id = req.params._id;
            const user = await userService.getOneUser(_id);
            return res.json(user);
        }
            catch (err) {
            next(err);
        }
    }

    async editUser(req: Request, res: Response, next: NextFunction) {
        try {
            const _id = req.params._id;
            const {name, email, roles, password}: 
                {
                    name:string, 
                    email:string, 
                    roles:string[], 
                    password?:string
                } = req.body;

            const result = await userService.editUser(_id, name, email, roles, password,);
            if (result.modifiedCount !== 1) {
                throw ApiError.internal('Ошибка во время редактирования пользователя');
            }
            else {
                return res.sendStatus(200);
            }
        }
            catch (err) {
            next(err);
        }
    }

    async deleteOneUser(req: Request, res: Response, next: NextFunction) {
        try {
            const _id = req.params._id;
            const result = await userService.deleteOneUser(_id);
            if (result.deletedCount !== 1) {
                throw ApiError.internal('Ошибка во время удаления пользователя');
            }     
            else {
                return res.sendStatus(200);
            }
        }
            catch (err) {
            next(err);
        }
    }
}

export default new UsersController();