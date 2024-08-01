import { ISound, ISprite, RenderContext } from '@sampullman/simple-game-engine'
import {
  IAbstractShot,
  IEnemy,
  IExplosion,
  IMine,
  IPlayer,
  IPowerup,
  IStars,
  IUiElement,
} from './i-objects'
import { ILevel } from './levels'

export const shotW = 5
export const shotH = 15

export enum GameMode {
  MENU = 0,
  SINGLE = 1,
  MULTI = 2,
  EDIT = 3,
}

export interface IGameState {
  mode: GameMode
  c: RenderContext
  score: number
  buttons: IUiElement[]
  soundOn: boolean
  isOver: boolean
  eventId: number
  shotTimer: number
  gameOverTimer: number
  attackTimer: number
  level: ILevel | null
  activeEnemies: IEnemy[]
  editorActiveEnemies: IEnemy[]
  player: IPlayer
  explosions: IExplosion[]
  powerups: IPowerup[]
  enemies: IEnemy[]
  enemySpawnCount: number
  enemyData: {
    width: number
    height: number
    numAttacks: number
    initEnemyCount: number
  }
  mines: IMine[]
  enemyShots: IAbstractShot[]
  sprites: {
    mines: ISprite[]
    explosions: ISprite[]
    stars: IStars
    enemyShot: ISprite[]
    pause: ISprite
    play: ISprite
    soundOff: ISprite
    soundOn: ISprite
    playerShot: ISprite[]
    playerLife: ISprite
    shield: ISprite
    shieldPowerup: ISprite
    missile: ISprite
    star: ISprite
  }
  sounds: Record<string, ISound>
}

export const gameState: IGameState = {
  mode: GameMode.SINGLE,
  c: {} as RenderContext,
  score: 0,
  buttons: [],
  soundOn: false,
  isOver: false,
  eventId: 0,
  shotTimer: 0,
  gameOverTimer: 0,
  attackTimer: 0,
  level: null,
  activeEnemies: [],
  editorActiveEnemies: [],
  player: {} as IPlayer,
  explosions: [],
  powerups: [],
  enemies: [],
  enemySpawnCount: 0,
  enemyData: {
    width: 36,
    height: 24,
    numAttacks: 0,
    initEnemyCount: 0,
  },
  mines: [],
  enemyShots: [],
  sprites: {
    mines: [],
    explosions: [],
    enemyShot: [],
    stars: {} as IStars,
    pause: {} as ISprite,
    play: {} as ISprite,
    soundOff: {} as ISprite,
    soundOn: {} as ISprite,
    playerShot: [],
    playerLife: {} as ISprite,
    shield: {} as ISprite,
    shieldPowerup: {} as ISprite,
    missile: {} as ISprite,
    star: {} as ISprite,
  },
  sounds: {},
}
