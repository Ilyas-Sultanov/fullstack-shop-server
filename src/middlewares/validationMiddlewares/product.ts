// import {body} from 'express-validator';
// import {IProductProperty} from '../../types/product';

// /** 
//  * НАПОМИНАНИЕ! 
//  * Не забывай вытащить ошибки из request в контроллере! 
//  * Не забывай добавить этот массив в middleware
//  * */

// const productValidators = [
//     body('name')
//         .isString().withMessage('Значение поля name не строковое')
//         .trim()
//         .isLength({min: 2, max: 75}).withMessage('Длина названия должна быть от 2 до 75 символов'),
//     body('description')
//         .isString().withMessage('Значение поля description не строковое')
//         .trim()
//         .isLength({max: 500}).withMessage('Длина описания не может быть больше 500 символов'),
//     body('brand')
//         .isString().withMessage('Значение поля brand не строковое')
//         .trim()
//         .isLength({min: 2, max: 75}).withMessage('Длина бренда должна быть от 2 до 75 символов'),
//     body('price')
//         .notEmpty()
//         .isNumeric().withMessage('Значение поля price должно быть числовым')
//         .isInt({ min:1, max: 999999}).withMessage('Значение поля price должно быть 1 - 999999'),
//     body('quantity')
//         .isNumeric().withMessage('Значение поля quantity должно быть числовым')
//         .isInt({ min:1, max: 999999}).withMessage('Значение поля quantity должно быть 1 - 999999'),
//     body('warranty')
//         .isNumeric().withMessage('Значение поля warranty должно быть числовым')
//         .isInt({ min:1, max: 999999}).withMessage('Значение поля warranty должно быть 1 - 999999'),
//     body('properties').custom((properties: IProductProperty[], { req }) => {
        

//         /** properties validation */
//         if (properties && properties.length > 0) {
//             const errors: string[] = [];
//             for (let i=0; i<properties.length; i+=1) {
//                 if ((properties[i].name as string).length < 2 || (properties[i].name as string).length > 75) {
//                     const msg = 'Длина названия свойства должна быть от 2 до 75 символов';
//                     if (!errors.includes(msg)) errors.push(msg);
//                 }
//                 if (!properties[i].value && properties[i].value !== 0) {
//                     const msg = 'Не указано значение свойства value';
//                     if (!errors.includes(msg)) errors.push(msg);
//                 }
//                 if (typeof properties[i].value === 'string' && (properties[i].value as string).length > 75) {
//                     const msg = 'Строковое значение поля value не может быть больше 75 символов';
//                     if (!errors.includes(msg)) errors.push(msg);
//                 }
//                 if (!isNaN(Number(properties[i].value)) && ( (properties[i].value as number) > 999999) || (properties[i].value as number) < 1 ) {
//                     const msg = 'Числовое значение поля value должно быть 1 - 999999';
//                     if (!errors.includes(msg)) errors.push(msg);
//                 }
//                 if (typeof properties[i].value === 'number' && !properties[i].unit) {
//                     const msg = 'Для числового значения свойства, нужно указать единицу измерения';
//                     if (!errors.includes(msg)) errors.push(msg);
//                 }
//             }
//             if (errors.length > 0) throw new Error(errors.join('|'));
//             return true; // Indicates the success of this synchronous custom validator
//         }
//         else {
//             return true; // если пропсов нет, значит валидировать не нужно и поле properties валидно
//         }
//     })/*.withMessage('aaaaaa'),*/
        
// ];

// export default productValidators;