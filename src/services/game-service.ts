import { inject, injectable } from 'inversify';
import { Model, Schema, ObjectId } from 'mongoose';
import { DBCollections } from '../constants';
import { BombCell, ClosedCell, Game } from '../models/game';
import { projectFields } from '../utils';
import { OpenCell } from '../models/game';
const gameFields: (keyof Omit<Game, 'bomb_positions'>)[] = [
  'id',
  'status',
  'map',
  'user_id',
  'difficulty',
];
​
@injectable()
export class GameService {
  @inject(DBCollections.Games)
  private gamesModel: Model<Game>;
​
  private static getPropertiesByDifficulty(
    difficulty: 'easy' | 'medium' | 'hard'
  ): [[number, number], number] {
    switch (difficulty) {
      case 'easy':
        return [[9, 9], 10];
      case 'medium':
        return [[16, 16], 40];
      case 'hard':
        return [[30, 16], 99];
    }
  }
​
  private static generateBombPositions(
    rowsCount: number,
    columnsCount: number,
    bombsCount: number
  ): [number, number][] {
    let bombPositionCandidates: [number, number][][] = [];
    for (let i = 0; i < rowsCount; i++) {
      const candidatesRow: [number, number][] = [];
      for (let j = 0; j < rowsCount; j++) {
        candidatesRow.push([i, j]);
      }
      bombPositionCandidates.push(candidatesRow);
    }
    const bombCoordinates: [number, number][] = [];
    console.log('hewr', rowsCount, columnsCount);
    for (let i = 0; i < bombsCount; i++) {
      const newBombX = this.getRandomInt(0, bombPositionCandidates.length - 1);
      const newBombY = this.getRandomInt(
        0,
        bombPositionCandidates[newBombX].length - 1
      );
      bombCoordinates.push(bombPositionCandidates[newBombX][newBombY]);
      bombPositionCandidates[newBombX] = bombPositionCandidates[
        newBombX
      ].filter(
        (position) => position !== bombPositionCandidates[newBombX][newBombY]
      );
      bombPositionCandidates = bombPositionCandidates.filter(
        (candidatesRow) => candidatesRow.length
      );
    }
    return bombCoordinates;
  }
​
  private static getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
​
  private static arrayIncludes = (arr, value) =>
    arr.filter((item) => item[0] === value[0] && item[1] === value[1])
      .length !== 0;
​
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
    return v.filter(
      ([h, j]) =>
        h + x >= 0 && h + x < map.length && j + y >= 0 && j + y < map[0].length
    );
  };
​
  private static getNeighborBombs = (game, [x, y]: number[]) =>
    GameService.getNeighbors(game.map, [x, y]).reduce(
      (acc, position) =>
        acc +
        Number(
          GameService.arrayIncludes(game.bomb_positions, [
            position[0],
            position[1],
          ])
        ),
      0
    );
  private static x(
    game: Pick<Game, 'map' | 'bomb_positions'>,
    x: number,
    y: number
  ): Pick<Game, 'map' | 'bomb_positions'> {
    // change includes logics
    const isBomb = GameService.arrayIncludes(game.bomb_positions, [x, y]);
​
    if (isBomb) {
      game.bomb_positions.forEach((index) => {
        game.map[index[0]][index[1]].type = 'bomb';
      });
      return game;
    }
​
    const queue: number[][] = [[x, y]];
    while (queue.length) {
      const [x1, y1] = queue[0];
      queue.shift();
​
      if (game.map[x1][y1].type === 'open') continue;
​
      const bomb_neighbors_count = GameService.getNeighborBombs(game.map, [
        x1,
        y1,
      ]);
​
      game.map[x1][y1] = { type: 'open', bomb_neighbors_count };
      if (!bomb_neighbors_count) {
        queue.push(...GameService.getNeighbors(game.map, [x1, y1]));
      }
    }
    // Return the game
    return game;
  }
​
  public async saveGame(
    difficulty: 'easy' | 'medium' | 'hard',
    userId: string
  ): Promise<Omit<Game, 'bomb_positions'>> {
    const [dimensions, bombsCount] =
      GameService.getPropertiesByDifficulty(difficulty);
    console.log(dimensions[0], dimensions[1], bombsCount);
    const game = await this.gamesModel.create({
      status: 'pending',
      map: Array(dimensions[0]).fill(
        Array(dimensions[1]).fill({ type: 'closed' })
      ),
      bomb_positions: GameService.generateBombPositions(
        dimensions[0],
        dimensions[1],
        bombsCount
      ),
      user_id: userId,
      difficulty,
    });
​
    return projectFields(game, gameFields);
  }
}