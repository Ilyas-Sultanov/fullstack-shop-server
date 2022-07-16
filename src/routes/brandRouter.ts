import { Router } from 'express';
import brandController from '../controllers/brandController';
import authMiddleware from '../middlewares/authMiddleware';

const brandRouter = Router();

brandRouter.post('', /** authMiddleware */ brandController.create);
brandRouter.get('/:_id', brandController.getOne);
brandRouter.get('', brandController.getAll);
brandRouter.put('/:_id', /** authMiddleware */ brandController.edit);
brandRouter.delete('/:_id', /** authMiddleware */ brandController.delete);

export default brandRouter;