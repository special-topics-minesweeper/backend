import {inject, injectable} from "inversify";
import {Model, Schema, ObjectId} from "mongoose";
import {DBCollections} from "../constants";
import {Game} from "../models/game";
import {projectFields} from "../utils";
const gameFields : (keyof Omit<Game, 'bomb_positions'>)[] = ['id',  'status', 'map', 'user_id', 'difficulty'];


@injectable()
export class GameService {
    @inject(DBCollections.Games)
    private gamesModel : Model<Game>

    private static getPropertiesByDifficulty(difficulty : 'easy' | 'medium' | 'hard') : [[number, number], number] {
        switch (difficulty) {
            case "easy": return [[9, 9], 10]
            case "medium": return [[16, 16], 40]
            case "hard": return [[30, 16], 99]
        }
    }

    private static generateBombPositions(rowsCount : number, columnsCount : number, bombsCount : number) : [number, number][] {
        let bombPositionCandidates : [number, number][][]  = [];
        for(let i = 0; i < rowsCount; i++) {
            const candidatesRow : [number, number][] = [];
            for(let j = 0; j < rowsCount; j++) {
                candidatesRow.push([i, j]);
            }
            bombPositionCandidates.push(candidatesRow);
        }
        const bombCordinates : [number, number][] = [];
        console.log('hewr', rowsCount, columnsCount);
        for(let i = 0; i < bombsCount; i++) {
            const newBombX = this.getRandomInt(0, bombPositionCandidates.length - 1);
            const newBombY = this.getRandomInt(0, bombPositionCandidates[newBombX].length - 1);
            bombCordinates.push(bombPositionCandidates[newBombX][newBombY]);
            bombPositionCandidates[newBombX] = bombPositionCandidates[newBombX].filter(position => position !== bombPositionCandidates[newBombX][newBombY]);
            bombPositionCandidates = bombPositionCandidates.filter(candidatesRow => candidatesRow.length);
        }
        return bombCordinates;
    }

    private static getRandomInt(min : number, max : number) {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    public async saveGame(difficulty : 'easy' | 'medium' | 'hard', userId : string) : Promise<Omit<Game, 'bomb_positions'>> {
        const [dimensions, bombsCount] = GameService.getPropertiesByDifficulty(difficulty);
        console.log(dimensions[0], dimensions[1], bombsCount);
        const game = await this.gamesModel.create({
            status : 'pending',
            map : Array(dimensions[0]).fill(Array(dimensions[1]).fill({type : 'closed'})),
            bomb_positions : GameService.generateBombPositions(dimensions[0], dimensions[1], bombsCount),
            user_id : userId,
            difficulty
        });

        return projectFields(game, gameFields)
    }


}