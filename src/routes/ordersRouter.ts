import { Router } from 'express';
import ordersController from '../controllers/ordersController';
import authMiddleware from '../middlewares/authMiddleware';

const ordersRouter = Router();

ordersRouter.post('', authMiddleware, ordersController.create);
ordersRouter.get('/', ordersController.getMany);
ordersRouter.get('/:_id', ordersController.getOne);
ordersRouter.delete('/:_id', authMiddleware, ordersController.deleteOne);
ordersRouter.put('/:_id', authMiddleware, ordersController.editOne);

export default ordersRouter;