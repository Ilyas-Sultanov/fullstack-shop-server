// import {body} from 'express-validator';
// import {CategoryRequestBodyType, CategoryStatusType} from '../../types/category';
// import {ICreatePropertyObj} from '../../types/categoryProperty';

// /** 
//  * НАПОМИНАНИЕ! 
//  * Не забывай вытащить ошибки из request в контроллере! 
//  * Не забывай добавить этот массив в middleware
//  * */

// const categoryValidators = [
//     // body('category.parentId')
//     // .optional()
//     // .trim()
//     // .isLength({min: 24, max: 24}).withMessage('Длина идентификатора родительской категории не корректна'),
    
//     body('category.name')
//         .isString().withMessage('Значение поля name не строковое')
//         .trim()
//         .isLength({min: 1, max: 50}).withMessage('Длина названия должна быть от 1 до 50 символов'),

//     body('category.status')
//         .isString().withMessage('Значение поля status name не строковое')
//         .trim()
//         .isIn(['root', 'branch', 'leaf']).withMessage('Указанный статус не корректен')
//         .custom((status: CategoryStatusType, { req }) => {
//             const body: CategoryRequestBodyType = req.body;
//             if ((status === 'root' || status === 'branch') && (body.properties && body.properties.length > 0)) { 
//                 return false;
//             }
//             return true;
//         }).withMessage('Только категории со статусом leaf могут иметь свойства')
//         .custom((status: CategoryStatusType, { req }) => {
//             const body: CategoryRequestBodyType = req.body;
//             if (status === 'root' && body.category.parentId) {
//                 return false;
//             }
//             return true;
//         }).withMessage('У категории со статусом root не может быть родительской категории')
//         .custom((status: CategoryStatusType, { req }) => {
//             const body: CategoryRequestBodyType = req.body;
//             if (status !== 'root' && !body.category.parentId) return false;
//             return true;
//         }).withMessage('У категорий со статусом branch или leaf должна быть родительская категория'),

//     body('category.description')
//         .isString().withMessage('Значение поля description name не строковое')
//         .trim()
//         .isLength({max: 500}).withMessage('Длина описания не может быть больше 500 символов'),
        
//     body('properties').custom((properties: ICreatePropertyObj[], { req }) => {
//         const errors: string[] = [];

//         /** properties validation */
//         if (properties && properties.length > 0) {
//             for (let i=0; i<properties.length; i+=1) {
//                 if (!properties[i].name) {
//                     const msg = 'У каждого свойства, должно быть название';
//                     if (!errors.includes(msg)) errors.push(msg);
//                 }
//                 if (properties[i].name.length < 1 || properties[i].name.length > 75) {
//                     const msg = 'Длина названия свойства должна быть от 1 до 75 символов';
//                     if (!errors.includes(msg)) errors.push(msg);
//                 }
//                 if (properties[i].input === undefined) {
//                     const msg = 'Нет свойства input';
//                     if (!errors.includes(msg)) errors.push(msg);
//                 }
//                 if (!properties[i].input?.inputType) {
//                     const msg = 'Не указан inputType';
//                     if (!errors.includes(msg)) errors.push(msg);
//                 }
//                 if (!properties[i].input?.isMultiselect) {
//                     const msg = 'Не указан isMultiselect';
//                     if (!errors.includes(msg)) errors.push(msg);
//                 }
//                 if (properties[i].input?.inputType === 'Number' && !properties[i].unit) {
//                     const msg = 'Для инпута типа Number, нужно указать единицу измерения';
//                     if (!errors.includes(msg)) errors.push(msg);
//                 }
//                 if (properties[i].unit === undefined) {
//                     const msg = 'Нет свойства unit';
//                     if (!errors.includes(msg)) errors.push(msg);
//                 }
//                 if (properties[i].unit && properties[i].unit!.length > 10) {
//                     const msg = 'Название единицы измерения, не может быть длиннее 10 символов';
//                     if (!errors.includes(msg)) errors.push(msg);
//                 }
//                 if (properties[i].filterable === undefined) {
//                     const msg = 'Нет свойства filterable';
//                     if (!errors.includes(msg)) errors.push(msg);
//                 }
//                 if (properties[i].filterable && (!properties[i].filterChoices || properties[i].filterChoices!.length < 1) ) {
//                     const msg = 'Для фильтруемого свойства, нужно указать хотябы один вариант фильтра';
//                     if (!errors.includes(msg)) errors.push(msg);
//                 }
             
//                 /** choices validation */
//                 if (properties[i].filterChoices && properties[i].filterChoices!.length > 0) {
//                     for (let j=0; j<properties[i].filterChoices!.length; j+=1) {
//                         if (!properties[i].filterChoices![j].name) {
//                             const msg = 'У каждого варианта фильтра, должно быть название';
//                             if (!errors.includes(msg)) errors.push(msg);
//                         }
//                         if (properties[i].filterChoices![j].name.length < 1 || properties[i].filterChoices![j].name.length > 75) {
//                             const msg = 'Длина названия варианта фильтра должна быть от 1 до 75 символов';
//                             if (!errors.includes(msg)) errors.push(msg);
//                         }
//                         if (!properties[i].filterChoices![j].value) {
//                             const msg = 'У каждого варианта фильтра, должно быть значение';
//                             if (!errors.includes(msg)) errors.push(msg);
//                         }
//                         if (
//                             typeof properties[i].filterChoices![j].value === 'string' && 
//                             ((properties[i].filterChoices![j].value as string).length < 1 || 
//                             (properties[i].filterChoices![j].value as string).length > 75)
//                         ) {
//                             const msg = 'Длина значения варианта фильтра должна быть от 1 до 75 символов';
//                             if (!errors.includes(msg)) errors.push(msg);
//                         }
//                         if (
//                             Array.isArray(properties[i].filterChoices![j].value) && 
//                             ((properties[i].filterChoices![j].value as [number, number])[0] > 999999 ||
//                             (properties[i].filterChoices![j].value as [number, number])[1] > 999999)
//                         ) {
//                             const msg = 'The value cannot be greater than 999999';
//                             if (!errors.includes(msg)) errors.push(msg);
//                         }
//                         if (properties[i].input.inputType === 'Number' && !properties[i].filterChoices![j].type) {
//                             const msg = 'Если тип свойства - Number, то нужно выбрать тип сравнения';
//                             if (!errors.includes(msg)) errors.push(msg);
//                         }
//                     }
//                 }
    
//                 if (errors.length > 0) throw new Error(errors.join('|'));
//                 return true; // Indicates the success of this synchronous custom validator
//             }
//         }
//         else {
//             return true; // если пропсов нет, значит валидировать не нужно и поле properties валидно
//         }
//     })/*.withMessage('aaaaaa'),*/
// ];

// export default categoryValidators;