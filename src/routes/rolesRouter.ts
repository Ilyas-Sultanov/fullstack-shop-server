import { Router } from "express";
import rolesController from '../controllers/rolesController';
import authMiddleware from "../middlewares/authMiddleware";
import checkRoleMiddleware from "../middlewares/checkRolesMiddleware";

const rolesRouter = Router();

const middlewares = [
    authMiddleware, 
    checkRoleMiddleware('admin'),
];

rolesRouter.get('', middlewares, rolesController.getRoles);

export default rolesRouter;