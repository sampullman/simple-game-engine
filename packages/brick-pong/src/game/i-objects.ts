import { IBounded, ICircle, ISprite, RenderContext } from '@sampullman/simple-game-engine'

export interface IBall extends ICircle {
  active: boolean
  xVel: number
  yVel: number
  color: string
  debug: string | null
  inBounds(c: RenderContext): boolean
  draw(c: RenderContext): void
  randomSize(): void
  hitPlayer(): boolean
  hitBlock(block: IBounded): boolean
  update(c: RenderContext): void
}

export interface IBaseBlock extends IBounded {
  active: boolean
  powerup: number
  draw(c: RenderContext): void
  handleHit(_balls: IBall[], other: IBall): void
}

export interface IBlock extends IBaseBlock {
  sprite: ISprite
}

export interface ISuperBlock extends IBaseBlock {
  sprites: ISprite[]
  state: number
  numStates: number
}
