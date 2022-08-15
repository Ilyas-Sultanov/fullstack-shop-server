import {Router} from 'express';
import authRouter from './authRouter';
import usersRouter from './usersRouter';
import categoriesRouter from './categoriesRouter';
import rolesRouter from './rolesRouter';
import productsRouter from './productsRouter';
import brandRouter from './brandRouter';
import ordersRouter from './ordersRouter';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/roles', rolesRouter);
router.use('/categories', categoriesRouter);
router.use('/products', productsRouter);
router.use('/brand', brandRouter);
router.use('/orders', ordersRouter);

export default router;