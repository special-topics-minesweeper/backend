import {inject, injectable } from "inversify";
import {GET, HeaderParam, Path, PathParam, POST} from "typescript-rest";
import {UserService} from "../services/user-service";
import {InputUser, User} from "../models/user";
import {BadRequest, NotFound} from "http-errors"
import {AuthService} from "../services/auth-service";
import {validate } from "email-validator"

@injectable()
export class UserCtrl {
    @inject(UserService)
    private userService : UserService;

    @inject(AuthService)
    private authService : AuthService

    @POST
    @Path("/users")
    public async addUser(userPayload : InputUser) {
        if(!userPayload.email || !userPayload.username || !userPayload.firstname
           || !userPayload.password || !userPayload.lastname) {
            throw new BadRequest("Missing/Incomplete fields in user payload");
        }
        if(!validate(userPayload.email)) {
            throw new BadRequest("Invalid email");
        }
        userPayload.username = userPayload.username.toLowerCase();
        if(!userPayload.username.match(/^[a-z0-9]+$/)) {
            throw new BadRequest('Invalid username');
        }

        const user = await this.userService.saveUser(userPayload);
        return {
            key : await this.authService.generateUserToken(user.id),
            user
        }
    }

    @POST
    @Path("/user/key")
    public async getUserToken(loginInfo : {login : string, password : string}) {
        if(!loginInfo.login || !loginInfo.password) {
            throw new BadRequest("Missing/Incomplete fields in login info");
        }
        let user;
        if(validate(loginInfo.login)) {
            user = await this.userService.verifyUserCredsByEmail(loginInfo.login, loginInfo.password);
        } else {
            user = await this.userService.verifyUserCredsByUsername(loginInfo.login, loginInfo.password);
        }
        if(!user) throw new NotFound("User with the following login and password not found");

        return {
            key : await this.authService.generateUserToken(user.id)
        }
    }

    @GET
    @Path('/user')
    public async getUser(@HeaderParam('user_id') userId : string) {
        return this.userService.findUser(userId);
    }

    @GET
    @Path('/:difficulty(easy|medium|hard)/users')
    public async getBestUsersOfDifficulty(@PathParam('difficulty') difficulty : 'easy' | 'medium' | 'hard') {
        return this.userService.findBestUsersByDifficulty(difficulty);
    }

}