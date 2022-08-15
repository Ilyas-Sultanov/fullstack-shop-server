import {Request, Response, NextFunction} from 'express';
import userService from '../services/userService';
import ApiError from '../exceptions/ApiError';
import { usersQuery } from '../types/user';

class UsersController {
    async getUsers(req: Request, res: Response, next: NextFunction) {        
        try {
            const usersData = await userService.getUsers(req.query as usersQuery, req.originalUrl);
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

            await userService.editUser(_id, name, email, roles, password);
            return res.sendStatus(204);
        }
            catch (err) {
            next(err);
        }
    }

    async deleteOneUser(req: Request, res: Response, next: NextFunction) {
        try {
            const _id = req.params._id;
            await userService.deleteOneUser(_id);
            return res.sendStatus(204);
        }
            catch (err) {
            next(err);
        }
    }
}

export default new UsersController();