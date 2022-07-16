import {IUser, IUserDto} from '../types/user';

class UserDto implements IUserDto {
  _id: string;
  name: string;
  email: string;
  roles: string[];
  isActivated: boolean;

  constructor(model: IUser) {
    this._id = model._id;
    this.name = model.name;
    this.email = model.email;
    this.roles = model.roles;
    this.isActivated = model.isActivated;
  }
}

export default UserDto;

// DTO - data transfer object