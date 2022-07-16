import {Schema, model} from 'mongoose';
import { ILink } from 'src/types/types';

const LinkSchema = new Schema(
    {
        value: {type: String, required: true},
        userId: {type: String, required: true},
        created: { 
            type: Date, 
            default: Date.now,
            index: {
                expireAfterSeconds: 1800
            },
        },
        newPassword: {type: String},
    },
);

const LinkModel = model<ILink>('links', LinkSchema);
export default LinkModel;