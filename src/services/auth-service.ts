import {inject, injectable} from "inversify";
import {sign, verify} from "jsonwebtoken"
import {JWT_SECRET} from "../constants";

@injectable()
export class AuthService {
    private static TOKEN_LIFETIME = 7 * 24 * 60 * 60;

    @inject(JWT_SECRET)
    private jwtSecret : string;

    public async generateUserToken(userId : string) {
        return sign({
            user_id : userId
        }, this.jwtSecret, { expiresIn : AuthService.TOKEN_LIFETIME })
    }

    public async getUserIdFromToken(token : string) : Promise<string | null> {
        try {
            const decodedToken = await verify(token, this.jwtSecret);
            return decodedToken.user_id;
        } catch(ex) {
            return null;
        }
    }
}