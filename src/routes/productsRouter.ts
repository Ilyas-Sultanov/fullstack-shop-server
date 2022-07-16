import {Router} from 'express';
import productsController from '../controllers/productsController';
// import productValidators from '../middlewares/validationMiddlewares/product';

const productsRouter = Router();
productsRouter.post('', /*productValidators,*/ productsController.create);
productsRouter.get('', productsController.getMany);
productsRouter.get('/highestPrice', productsController.getHighestPrice); // Если поменять эти строки местами, то '/highestPrice' перестаёт работать
productsRouter.get('/:_id', productsController.getOne); // Если поменять эти строки местами, то '/highestPrice' перестаёт работать 
productsRouter.put('', productsController.edit);
productsRouter.delete('/:_id', productsController.delete);

export default productsRouter;