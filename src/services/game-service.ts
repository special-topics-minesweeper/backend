import {inject, injectable} from 'inversify';
import {Model, Schema, ObjectId, Types} from 'mongoose';
import {DBCollections} from '../constants';
import {BombCell, ClosedCell, Game, GameDifficulty} from '../models/game';
import {projectFields, isTupleInArray, getRandomInt} from '../utils';
import {OpenCell} from '../models/game';
import {UserService} from "./user-service";
import {BadRequest} from "http-errors"

const gameFields: (keyof Omit<Game, 'bomb_positions'>)[] = [
    'id',
    'status',
    'map',
    'user_id',
    'difficulty',
];

@injectable()
export class GameService {
    @inject(DBCollections.Games)
    private gamesModel: Model<Game>;

    @inject(UserService)
    private userService : UserService;

    public async createAndSaveGame(difficulty: GameDifficulty, userId: string): Promise<Omit<Game, 'bomb_positions'>> {
        const [dimensions, bombsCount] = GameService.getPropertiesByDifficulty(difficulty);
        const game = await this.gamesModel.create({
            status: 'pending',
            map: Array(dimensions[0]).fill(Array(dimensions[1]).fill({type: 'closed'})),
            bomb_positions: GameService.generateBombPositions(
                dimensions[0],
                dimensions[1],
                bombsCount
            ),
            user_id: userId,
            difficulty,
        });

        return projectFields(game, gameFields);
    }


    private static getPropertiesByDifficulty(difficulty: GameDifficulty): [[number, number], number] {
        switch (difficulty) {
            case 'easy':
                return [[9, 9], 10];
            case 'medium':
                return [[16, 16], 40];
            case 'hard':
                return [[16, 30], 99];
        }
    }

    private static generateBombPositions(rowsCount: number, columnsCount: number, bombsCount: number): [number, number][] {
        let bombPositionCandidates: [number, number][][] = [];
        for (let i = 0; i < rowsCount; i++) {
            const candidatesRow: [number, number][] = [];
            for (let j = 0; j < columnsCount; j++) {
                candidatesRow.push([i, j]);
            }
            bombPositionCandidates.push(candidatesRow);
        }
        const bombCoordinates: [number, number][] = [];
        for (let i = 0; i < bombsCount; i++) {
            const newBombX = getRandomInt(0, bombPositionCandidates.length - 1);
            const newBombY = getRandomInt(0, bombPositionCandidates[newBombX].length - 1);
            bombCoordinates.push(bombPositionCandidates[newBombX][newBombY]);
            bombPositionCandidates[newBombX] = bombPositionCandidates[newBombX].filter(
                (position) => position !== bombPositionCandidates[newBombX][newBombY]
            );
            bombPositionCandidates = bombPositionCandidates.filter((candidatesRow) => candidatesRow.length);
        }
        return bombCoordinates;
    }


    public async updateGameByOpeningACell(gameId : string, x : number, y : number, userId : string) : Promise<Omit<Game, 'bomb_positions'> | null> {
        if(!Types.ObjectId.isValid(gameId)) return null;
        const game = await this.gamesModel.findOne({ _id : gameId, user_id : userId, status : 'pending' });
        if(!game) {
            return null;
        }
        const [[rowCount, columnCount]] =  GameService.getPropertiesByDifficulty(game.difficulty);
        if(x < 0 || x >= rowCount) {
            throw new BadRequest("x in invalid!");
        }
        if(y < 0 || y >= columnCount) {
            throw new BadRequest("y is invalid");
        }
        if(game.map[x][y].type === "open") {
            throw new BadRequest("The cell is already open");
        }
        game.map = GameService.openCellOnAGame(projectFields(game, ['map', 'bomb_positions']), x, y).map;
        game.status = GameService.getGameStatus(game.map, game.bomb_positions, x, y);
        await this.gamesModel.update({ _id : gameId, user_id : userId }, { $set : { map : game.map, status : game.status } });

        const gameCompletionTime = Math.floor((new Date().getTime() - game.create_date.getTime()) / 1000);
        await this.userService.addToGameHistory(userId, game.status === 'win', game.difficulty, gameCompletionTime);

        return projectFields(game, gameFields);
    }

    private static getGameStatus(map : (OpenCell | ClosedCell | BombCell)[][], bombPositions : [number, number][], openedCellX : number, openedCellY) {
        if(map[openedCellX][openedCellY].type === 'bomb')
            return 'lose';
        return GameService.closedCellsCount(map) === bombPositions.length ? 'win' : 'pending';
    }

    private static closedCellsCount(map : (OpenCell | ClosedCell | BombCell)[][]) {
        let closedCount = 0;
        for(const cellRow of map) {
            for(const cell of cellRow) {
                closedCount += cell.type === 'closed' ? 1 : 0;
            }
        }
        return closedCount;
    }


    private static openCellOnAGame(
        game: Pick<Game, 'map' | 'bomb_positions'>,
        x: number,
        y: number
    ): Pick<Game, 'map' | 'bomb_positions'> {

        // change includes logics
        const isBomb = isTupleInArray(game.bomb_positions, [x, y]);

        if (isBomb) {
            game.bomb_positions.forEach((index) => {
                game.map[index[0]][index[1]].type = 'bomb';
            });
            return game;
        }

        const queue: number[][] = [[x, y]];
        while (queue.length) {
            const [x1, y1] = queue[0];
            queue.shift();

            if (game.map[x1][y1].type === 'open' || isTupleInArray(game.bomb_positions, [x1, y1])) continue;

            const bomb_neighbors_count = GameService.getNeighborBombs(game, [
                x1,
                y1,
            ]);

            game.map[x1][y1] = {type: 'open', bomb_neighbors_count};
            if (!bomb_neighbors_count) {
                queue.push(...GameService.getNeighbors(game.map, [x1, y1]));
            }
        }
        // Return the game
        return game;
    }

    private static getNeighbors = (map, [x, y]: number[]) => {
        let v = [
            [0, 1],
            [1, 0],
            [0, -1],
            [-1, 0],
            [1, 1],
            [-1, -1],
            [1, -1],
            [-1, 1],
        ];
        return v.filter(([h, j]) => h + x >= 0 && h + x < map.length && j + y >= 0 && j + y < map[0].length)
            .map(([i, j]) => [x + i, y + j]);
    };

    private static getNeighborBombs(game, [x, y]: number[]) {
        return GameService.getNeighbors(game.map, [x, y]).reduce(
            (acc, position) =>
                acc +
                Number(
                    isTupleInArray(game.bomb_positions, [
                        position[0],
                        position[1],
                    ])
                ),
            0
        );
    }
}