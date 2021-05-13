import {inject, injectable} from "inversify";
import {GameService} from "../services/game-service";
import {HeaderParam, Path, POST, QueryParam} from "typescript-rest";
import {BadRequest} from "http-errors"
@injectable()
@Path('/games')
export class GameCtrl {
    @inject(GameService)
    private gameService : GameService

    @Path('/')
    @POST
    public async createGame(
        @HeaderParam('user_id') userId : string,
        @QueryParam('difficulty') difficulty : 'easy' | 'medium' | 'hard'
    )  {
        if(!['easy', 'medium', 'hard'].includes(difficulty)) {
            throw new BadRequest('difficulty provided is invalid')
        }
        return this.gameService.saveGame(difficulty, userId);
    }
}