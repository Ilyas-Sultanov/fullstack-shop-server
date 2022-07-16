import {Schema, model} from 'mongoose';
import {IRole} from '../types/types';

const RoleSchema = new Schema(
  {
    value: {
      type: String, 
      unique: true, 
      default: 'user'
    },
  },
  /* options */
);

const RoleModel = model<IRole>('roles', RoleSchema); 
export default RoleModel;