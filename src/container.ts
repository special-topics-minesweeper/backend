import mongoose, {Model} from 'mongoose';
import {Container} from "inversify";
import {UserCtrl} from "./controllers/user-ctrl";
import {UserService} from "./services/user-service";
import {DBCollections, JWT_SECRET} from "./constants";
import './models/user'
import './models/game'
import {AuthService} from "./services/auth-service";
import {GameService} from "./services/game-service";
import {GameCtrl} from "./controllers/game-ctrl";
export async function initContainer() {
    const container = new Container();
    container.bind(UserCtrl).toSelf();
    container.bind(UserService).toSelf();
    container.bind(AuthService).toSelf();
    container.bind(GameService).toSelf();
    container.bind(GameCtrl).toSelf();


    const db = mongoose.createConnection(process.env.MONGO_URI || 'mongodb://mongo:27017/MINE');
    await db.model('users').ensureIndexes();
    container.bind(DBCollections.Users).toConstantValue(db.model('users'))
    container.bind(DBCollections.Games).toConstantValue(db.model('games'));
    container.bind(JWT_SECRET).toConstantValue(process.env.JWT_SECRET || 'secret');


    return container;
};
