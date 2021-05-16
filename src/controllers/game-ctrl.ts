import {inject, injectable} from "inversify";
import {GameService} from "../services/game-service";
import {HeaderParam, Path, PathParam, POST, PUT, QueryParam} from "typescript-rest";
import {BadRequest, NotFound} from "http-errors"
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
        return this.gameService.createAndSaveGame(difficulty, userId);
    }

    @Path('/:gameId')
    @PUT
    public async openCellOnGame(
        @HeaderParam('user_id') userId: string,
        @PathParam('gameId') gameId : string,
        @QueryParam('x') x : string,
        @QueryParam('y') y : string
    ) {
        if(!x || !y || !userId || !gameId) {
            throw new BadRequest("Missing/Invalid arguments");
        }
        const game = await this.gameService.updateGameByOpeningACell(gameId, +x, +y, userId);
        if(!game) {
            throw new NotFound("Game not found");
        }
        return game;
    }

}