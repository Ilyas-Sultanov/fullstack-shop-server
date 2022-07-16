import bcrypt from 'bcryptjs'; // в ubuntu обычный bcrypt не работает без бубна
import {v4} from 'uuid';
import ApiError from '../exceptions/ApiError';
import UserModel from "../models/User";
import RoleModel from '../models/Role';
import tokenService from './tokenService';
import linkService from './linkService';
import mailService from "./mailService";
import UserDto from '../dtos/userDto';
import LinkModel from '../models/Link';

class AuthService {
    async registration(name: string, email: string, password: string) {
        // const user = await UserModel.create(newUser);
        // console.log(user);
        
        // покачто нет роутов для создания ролей, поэтому временно создаём здесь
        // const userRole = new RoleModel();
        // const adminRole = new RoleModel({value: 'admin'});
        // await userRole.save();
        // await adminRole.save();
        
        const user = await UserModel.findOne({email: email}).lean();
        if (user) {
          throw ApiError.badRequest('Пользователь с таким email уже зарегистрирован');
        }
        const hashPassword = bcrypt.hashSync(password, 7);
        const link = v4(); // рандомный id для ссылки активации
        const userRole = await RoleModel.findOne({value: 'user'}).lean();
        const createdUser = await UserModel.create({
          name,
          email,
          password: hashPassword,
          roles: [userRole!.value],
          // link,
          // expireLink: Date.now() + (1000 * 60) * 10,
        });

        await linkService.createLink(createdUser._id, link);
    
        await mailService.sendActivationMail(email, `${process.env.API_URL}/api/auth/activate/${link}`); // Раскомментируй для отправки письма на email
    
        const userDto = new UserDto(createdUser);
        const tokens = tokenService.generateTokens({...userDto}); // метод generateTokens ожидает на вход обычный объект, а не экземпляр класса UserDto, поэтому использовали оператор spread
        await tokenService.saveRefreshToken(userDto._id, tokens.refreshToken);
        return {...tokens, user: userDto};
      }

      async activateAccount(activationLink: string) {
        const link = await LinkModel.findOne(
          { value: activationLink }
        );
        if (!link) throw ApiError.forbidden('Неверная ссылка, или её срок жизни истёк');
        const user = await UserModel.findOne({_id: link.userId});
        user!.isActivated = true;
        await user!.save();
        await linkService.deleteLink(link.value);
      }
    
    
      // async activateAccount(activationLink: string) {
      //   const user = await UserModel.findOne(
      //     { link: activationLink, expireLink: {$gt: new Date(Date.now())} }
      //   );
      //   if (!user) {
      //     throw ApiError.forbidden('Неверная ссылка активации, или её срок жизни истёк');
      //   }
      //   user.isActivated = true;
      //   user.link = null;
      //   user.expireLink = null;
      //   await user.save();
      // }
    
    
    
      async login(email: string, password: string) {
        const user = await UserModel.findOne({email: email}).lean();
        if (!user) {
          throw ApiError.badRequest('Пользователь с таким email не найден');
        }
    
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
          throw ApiError.badRequest('Не верный пароль');
        }
    
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});
        await tokenService.saveRefreshToken(userDto._id, tokens.refreshToken);
        return {...tokens, user: userDto};
      }
    
      async logout(refreshToken: string) {
        const result = await tokenService.removeRefreshToken(refreshToken);
        return result;
      }

      async forgotPassword(email: string) {
        const user = await UserModel.findOne({email: email}).lean();
        if (!user) throw ApiError.badRequest('Пользователь с таким email не найден');
        const link = v4();
        await linkService.createLink(link, user._id);
        await mailService.sendResetPassMail(email, `${process.env.CLIENT_URL}/resetPassword/${link}`);
      }

      async resetPassword(resetLink:string, newPassword: string) {
        const link = await LinkModel.findOne({value: resetLink});
        if (link) {
          const hashPassword = bcrypt.hashSync(newPassword, 7);
          const result = await UserModel.updateOne(
            {_id: link.userId},
            {password: hashPassword},
          );
          await link.delete();
          return result;
        }
        else {
          throw ApiError.badRequest('Неверная ссылка, или её срок жизни истёк');
        }
      }
}

export default new AuthService();