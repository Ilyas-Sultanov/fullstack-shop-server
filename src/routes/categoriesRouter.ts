import {Router} from 'express';
import categoriesController from '../controllers/categoriesController';
import authMiddleware from "../middlewares/authMiddleware";
import checkRoleMiddleware from "../middlewares/checkRolesMiddleware";

const categoriesRouter = Router();

const middlewares = [
    authMiddleware, 
    checkRoleMiddleware('admin'),
];

categoriesRouter.post('', /*middlewares,*/ categoriesController.create);
categoriesRouter.get('', /*middlewares,*/ categoriesController.getAll);
categoriesRouter.get('/:_id', /*middlewares,*/ categoriesController.getOne);
categoriesRouter.put('/:_id', middlewares, categoriesController.edit);
categoriesRouter.delete('/:_id', middlewares, categoriesController.delete);

export default categoriesRouter;