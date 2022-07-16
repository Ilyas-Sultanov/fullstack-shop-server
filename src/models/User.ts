import {Schema, model} from 'mongoose';
import RoleModel from './Role'
import {IUser} from '../types/user';

const UserSchema = new Schema(
  {
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    roles: [{type: String, ref: RoleModel}],
    isActivated: {type: Boolean, default: false}, // активировался по почте или нет
    // activationLink: {type: String}, // ссылка для активации
    // link: {type: String}, // ссылка для активации или изменения пароля
    // expireLink: Date,
  },
  {
    timestamps: true,
  }
);

const UserModel = model<IUser>('users', UserSchema); 
// строка users - это название модели, но также это и название коллекции 
// обрати внимание, если указать user то имя коллекции все равно будет users
export default UserModel;