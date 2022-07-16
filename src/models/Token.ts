import {Schema, model} from 'mongoose';
import {IToken} from '../types/types';

const RefreshTokenSchema = new Schema(
  {
    userId: {type: Schema.Types.ObjectId, ref: 'User'},
    refreshToken: {type: String, required: true},
    // Здесь можно хранить фингер-принт браузера и ip
  },
  {
    // options
  }
);

const TokenModel = model<IToken>('tokens', RefreshTokenSchema);
export default TokenModel;