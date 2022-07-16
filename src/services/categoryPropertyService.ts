import { ICreatePropertyObj, IDBProperty } from '../types/categoryProperty';
import CategoryPropertyModel from '../models/CategoryProperty';
import {ClientSession} from 'mongoose';

class CategoryPropertyService {
    async create(properties: ICreatePropertyObj[], mongooseSession: ClientSession) {
        const result: IDBProperty[] = await CategoryPropertyModel.create(properties, {session: mongooseSession});
        return result;
    }
}

export default new CategoryPropertyService();