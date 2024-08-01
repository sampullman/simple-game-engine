import {
  IBounded,
  IGameObject,
  IHitCallback,
  IHittable,
  IMovable,
  IPosition,
  ISprite,
  RenderContext,
} from '@sampullman/simple-game-engine'

export enum PlayerState {
  NORMAL = 0,
  LEFT = 1,
  RIGHT = 2,
  DAMAGED = 3,
  DESTROYED = 4,
}

export interface IPlayer extends IBounded, IMovable {
  color: string
  sprites: ISprite[]
  visible: boolean
  blinks: number
  blinkNum: number
  blinkDur: number
  immobile: number
  lives: ILife[]
  shots: IShot[]
  numMissiles: number
  state: PlayerState
  shielded: boolean
  init(this: IPlayer, c: RenderContext): void
  switchState(this: IPlayer, state: PlayerState): void
  entityHit(this: IPlayer, dmg?: number | undefined): void
  shield(this: IPlayer): void
  blink(this: IPlayer, blinks: number): void
  update(this: IPlayer): void
  draw(this: IPlayer, c: RenderContext): void
  setupLives(this: IPlayer, c: RenderContext, lives: number): void
}

export interface IPowerupInit {
  width: number
  height: number
  hitCallback: IHitCallback
  instantiate: (x: number, y: number) => IPowerup
}

export interface IPowerup extends IBounded, IGameObject {
  sprite: ISprite
  radius: number
  hitCallback: IHitCallback
  active: boolean
}

export type IStar = [number, number, number, number]

export interface IStars {
  sprite: ISprite
  stars: IStar[]
  timer: number
  minSize: number
  maxWidth: number
  minSpeed: number
  maxSpeedWidth: number
  freq: number
  add: (x?: number, y?: number) => void
  update: (ctx: RenderContext) => void
  draw: (ctx: RenderContext) => void
}

export type IPoint = IPosition

export interface IAttackPathInit {
  E: IEnemy
  instantiate: () => IPath
  clone(e: IEnemy): IPath
}

export interface IComplexAttackPathInit extends IAttackPathInit {
  points: IPoint[]
  durs: number[]
}

export interface ISimpleAttackPathInit extends IAttackPathInit {
  duration: number
}

export interface IRandomAttackPathInit extends IComplexAttackPathInit {
  minDur: number
}

export interface IPath {
  finished: boolean
  done?: boolean
  init?: () => void
  next: () => IPosition
  lastPoint?: () => IPoint
}

export interface IPointPath extends IPath {
  pathStartCallback?: () => void
  durations: number[]
  durs: number[]
  points: IPoint[]
  time: number
  index: number
  xStep: number
  yStep: number
}

export interface IFollowPlayer extends IPath {
  E: IBounded
  duration: number
}

export interface IAvoidPlayer extends IPath {
  E: IBounded
  duration: number
}

export interface ILife extends IPosition, IGameObject {
  sprite: ISprite
  path: IPath | null
}

export type IShootFnInit = (e: IEnemy, freq: number) => () => void
export type IWanderFn = (xWanderSpeed: number) => void
export type IWanderFnInit = (E: IEnemy) => IWanderFn

export type IInitPathFn = (
  c: RenderContext,
  enemy: IEnemy,
  duration?: number,
) => IInitPath

export interface IInitPath {
  instantiate: (b?: boolean) => IPath
  clone: (e: IEnemy) => IPath
}

export interface IEnemyInit {
  sprite: ISprite
  type: number
  score: number
  health: number
  shootFn: IShootFnInit
  hoverActionFn?: IShootFnInit
  wanderFn?: IWanderFnInit
  instantiate: (
    x: number,
    y: number,
    w: number,
    h: number,
    shotFreq: number,
    InitPathFn: IInitPathFn | null,
    speed?: number,
    parent?: IEnemy,
    child?: IEnemy,
    escorts?: IEnemy[],
  ) => IEnemy
  AttackPath?: IInitPathFn
  notifyEscortsFn?: (E: IEnemy, escorts: IEnemy[]) => () => void
}

export enum EnemyMode {
  INIT = 0,
  HOVER = 1,
  ATTACK = 2,
  RETURN = 3,
}

export interface IEnemy extends IBounded, IGameObject {
  id: number
  type: number
  sprite: ISprite
  startX: number
  startY: number
  relativeEscortX?: number
  relativeEscortY?: number
  active: boolean
  alwaysAttack: boolean
  mode: EnemyMode
  speed: number
  score: number
  health: number
  parent?: IEnemy
  shotFreq: number
  squared?: boolean
  editorActive?: boolean
  initPathFn?: IInitPathFn
  initPath?: IPath
  AttackPathFn: IInitPathFn | undefined
  AttackPath: IInitPath | undefined
  path?: IPath
  shootFn: IShootFnInit | undefined
  shoot?: () => void
  wanderFn?: IWanderFnInit
  hoverActionFn?: IShootFnInit
  notifyEscorts?: () => void
  returnPath: () => IPath
  clone: (x: number, y: number) => IEnemy
  wander?: (xWander: number) => void
  hoverAction?: () => void
  attack: (path?: IPath) => void
  entityHit: (dmg?: number) => void

  // Editor only
  editX?: number
  editY?: number
  editHealth?: number
  click?: () => IEnemy
}

export enum ShotMode {
  NORMAL = 0,
  EXPLODING = 1,
  GONE = 2,
}

export interface IAbstractShot extends IBounded, IGameObject {
  active: boolean
  hitEntity: (entity: IHittable) => void
}

export interface IShot extends IAbstractShot {
  speed: number
  mode: ShotMode
  explosionTimer: number
  sprite: ISprite
  inBounds: () => boolean
}

export interface ILaser extends IAbstractShot {
  timer: number
  width: number
  height: number
  yDiff: number
}

export interface IExplosion extends IBounded, IGameObject {
  time: number
  active: boolean
  ind: number
  spriteTime: number
}

export type IMissile = IShot

export interface IMine extends IHittable, IGameObject {
  active: boolean
  blinkTimer: number
  blink: boolean
  sprite: ISprite
  hitEntity: (entity: IHittable) => void
}

export interface IUiElement extends IBounded {
  active: boolean
  mouseOver: boolean
  clickListener?: () => void
  setClickListener(listener: () => void): void
  draw(c: RenderContext): void
  hover(px: number, py: number): void
  click(px: number, py: number): void
}

export interface IButton extends IUiElement {
  font: string
  size: number[]
  text: string
  left: number
  top: number
  fontColor: string
  color: string
  hoverColor: string
}

export interface IImageButton extends IUiElement {
  image: ISprite
  clickImage: ISprite
  off: boolean
}

export type ISliderChangeListener = (val: number) => void

export interface ISlider extends IBounded {
  label: string
  units: string
  xKnob: number
  yKnob: number
  step: number
  min: number
  max: number
  val: number
  displayVal: number
  horizontal: boolean
  radius: number
  color: string
  changeListener?: ISliderChangeListener
  clicked: boolean
  font: string
  labelSize: TextMetrics
  unitsSize: TextMetrics
  getVal(pos: number, minVal: number, length: number): number
  move(xDiff: number, yDiff: number): void
  setPos(xPos: number, yPos: number): void
  valueFn(): () => number
  updateDisplayVal(): void
  setToVal(val: number): void
  slide(xDiff: number, yDiff: number): void
  hit(xPos: number, yPos: number): boolean
  draw(ctx: RenderContext): void
}
