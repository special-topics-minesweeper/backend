import {AuthService} from "../services/auth-service";
import {Unauthorized, BadRequest} from 'http-errors';
import unless from 'express-unless'
import {Container} from "inversify";

export function authMiddleware(container : Container) {
    const authMiddle = async (req, res, next) => {
        const authService : AuthService = container.get(AuthService);
        const token = req.headers.key;
        if(!token) {
            return res.status(400).send({
                message : "Key not provided"
            })
        }
        const userId = await authService.getUserIdFromToken(token);
        if(!userId) {
            return res.status(400).send({
                message : "Key provided is not authorized"
            })
        }
        req.headers.user_id = userId;
        return next();
    };
    authMiddle.unless = unless;
    return authMiddle;
}