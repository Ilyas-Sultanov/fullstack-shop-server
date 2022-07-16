import { Router } from "express";
import usersController from "../controllers/usersController";
import authMiddleware from "../middlewares/authMiddleware";
import checkRoleMiddleware from "../middlewares/checkRolesMiddleware";
const usersRouter = Router();

const middlewares = [
    authMiddleware, 
    checkRoleMiddleware('admin'),
];

usersRouter.get('', middlewares, usersController.getUsers);
usersRouter.get('/:_id', middlewares, usersController.getOneUser);
usersRouter.patch('/:_id', middlewares, usersController.editUser);
usersRouter.delete('/:_id', middlewares, usersController.deleteOneUser);

export default usersRouter;