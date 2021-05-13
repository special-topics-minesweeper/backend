import {inject, injectable} from "inversify";
import { Model } from "mongoose";
import {DBCollections} from "../constants";
import {InputUser, OutputUser, User} from "../models/user";
import bcrypt from "bcrypt"
import {nanoid} from "nanoid"
import {projectFields} from "../utils";
import {Conflict} from "http-errors"
const userFields : (keyof OutputUser)[] = ['id', 'username', 'firstname', 'lastname', 'email', 'games_count', 'wins_count', 'best_results'];
@injectable()
export class UserService {
    @inject(DBCollections.Users)
    private userModel : Model<User>

    public async saveUser(userPayload : InputUser) : Promise<OutputUser> {
        const salt = await bcrypt.genSalt();
        try {
            const user = await this.userModel.create({
                username: userPayload.username,
                firstname: userPayload.firstname,
                lastname: userPayload.lastname,
                email: userPayload.email,
                password: await bcrypt.hash(userPayload.password, salt),
            });
            return projectFields(user, userFields)
        } catch(err) {
            if(err.name === 'MongoError' && err.code === 11000) {
                throw new Conflict(`User with the following ${Object.keys(err.keyPattern)[0]} already exists`);
            }
            throw err;
        }
    }

    public async findUser(userId) : Promise<OutputUser> {
        return projectFields(
            await this.userModel.findOne({_id : userId}).lean(),
            userFields
        )
    }

    public async findBestUsersByDifficulty(difficulty : 'easy' | 'medium' | 'hard') : Promise<OutputUser[]> {
        const users = await this.userModel.find({
            [`best_results.${difficulty}`]: {
                '$gt' : 0
            }
        }).sort({
            [`best_results.${difficulty}`] : 1
        }).limit(10).lean();
        return users.map(user => projectFields(user, userFields))
    }

    public async verifyUserCredsByUsername(username : string, password : string) : Promise<OutputUser | null> {
        const user = await this.userModel.findOne({username});
        if(!user) return null;
        return this.verifyPassword(password, user.password) ? user : null;
    }

    public async verifyUserCredsByEmail(email : string, password : string) : Promise<OutputUser | null> {
        const user = await this.userModel.findOne({email});
        if(!user) return null;
        return this.verifyPassword(password, user.password) ? user : null;
    }

    private verifyPassword(givenPassword, passwordHash) {
        return bcrypt.compare(givenPassword, passwordHash);
    }

}