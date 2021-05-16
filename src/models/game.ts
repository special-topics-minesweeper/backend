import {ObjectId, Schema} from "mongoose";
import mongoose from "mongoose";

export type OpenCell = {
    type : 'open'
    bomb_neighbors_count : number
}

export type ClosedCell = {
    type : 'closed'
}

export type BombCell = {
    type : 'bomb',
}

export type GameDifficulty = 'easy' | 'medium' | 'hard';

export interface Game {
    id : string
    status : 'win' | 'lose' | 'pending'
    map : (OpenCell | ClosedCell | BombCell)[][],
    bomb_positions : [number, number][],
    user_id : string
    difficulty : GameDifficulty,
    create_date : Date
}
const MapCell : Schema = new Schema({
    type : {
        type : String, enum : [ 'open', 'closed', 'bomb' ]
    },
    bomb_neighbors_count : {
        type : Number
    }
}, { _id : false});

const Game: Schema = new Schema({
    status : { type : String, default : 'pending' },
    difficulty : { type: String, enum : ['easy', 'medium', 'hard'] },
    map : [
        [
            MapCell
        ]
    ],
    bomb_positions : [ [ {type : Number}, {type : Number} ] ],
    user_id : { type : Schema.Types.ObjectId, required : true }
},{
    timestamps : {
        createdAt : 'create_date',
        updatedAt : 'last_update_date'
    },
    minimize : true
});

Game.virtual('id').get(function(){
    return this._id.toHexString();
});

mongoose.model<Game>('games', Game);