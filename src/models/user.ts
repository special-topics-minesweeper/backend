import {ObjectId, Schema} from "mongoose";
import mongoose from "mongoose";


export interface User {
    id : string
    username : string
    firstname : string
    lastname : string
    email : string
    password : string
    games_count : number
    wins_count : number
    best_results : {
        easy : number,
        medium : number,
        hard : number
    }
}

export type OutputUser = Omit<User, 'password'>;
export type InputUser = Omit<User, 'id' | 'games_count' | 'wins_count' | 'best_results' >;


const User: Schema = new Schema({
    username : { type : String, required: true, unique : true },
    firstname : { type: String, required: true  },
    lastname : { type: String, required: true  },
    email : { type: String, required: true, unique : true  },
    password : { type: String, required: true  },
    games_count : { type: Number, default : 0 },
    wins_count : { type: Number, default : 0 },
    best_results : {
        easy : { type : Number, default : -1, index : true },
        medium : { type: Number, default: -1, index : true },
        hard : { type : Number , default : -1, index : true }
    }
}, {
    timestamps : {
        createdAt : 'create_date',
        updatedAt : 'last_update_date'
    }
});

User.virtual('id').get(function(){
    return this._id.toHexString();
});

mongoose.model<User>('users', User);