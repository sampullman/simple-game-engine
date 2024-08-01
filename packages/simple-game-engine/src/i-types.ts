export interface RenderContext extends CanvasRenderingContext2D {
  width: number
  height: number
  boundary: number
}

export interface IPosition {
  x: number
  y: number
}

export interface ISized {
  width: number
  height: number
}

export interface IBounded extends IPosition, ISized {}

export interface IHittable extends IBounded {
  entityHit: (damage?: number) => void
}

export interface IGameObject {
  draw: (c: RenderContext) => void
  update: () => void
}

export interface IMovable {
  xVel: number
  yVel: number
}

export interface ISound {
  sound: HTMLAudioElement
  play: () => void
  stop: () => void
}

export type IHitCallback = (self: IBounded) => void

export interface ISprite extends ISized {
  width: number
  height: number
  loaded: boolean
  draw: (
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w?: number,
    h?: number,
  ) => void
  fill: (
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    repeat?: string,
  ) => void
}
