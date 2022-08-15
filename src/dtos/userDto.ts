import {IUser, IUserDto} from '../types/user';
import {PopulatedDoc, Document} from 'mongoose';
import { IShoppingCart } from '../types/shoppingCart';
import { IDBOrder } from '../types/order';

class UserDto implements IUserDto {
  _id: string
  name: string
  email: string
  roles: string[]
  isActivated: boolean
  shoppingCart: PopulatedDoc<IShoppingCart & Document>
  orders: Array<PopulatedDoc<IDBOrder & Document>>

  constructor(model: IUser) {
    this._id = model._id;
    this.name = model.name;
    this.email = model.email;
    this.roles = model.roles;
    this.isActivated = model.isActivated;
    this.shoppingCart = model.shoppingCart;
    this.orders = model.orders;
  }
}

export default UserDto;

// DTO - data transfer object