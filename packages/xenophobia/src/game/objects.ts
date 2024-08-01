import {
  keyhandler,
  clamp,
  ISound,
  entityCollision,
  IBounded,
  RenderContext,
  IHittable,
  ISprite,
  IHitCallback,
  textSize,
} from '@sampullman/simple-game-engine'
import { gameState, GameMode, shotW, shotH } from './state'
import { Point, PointPath } from './paths'
import {
  EnemyMode,
  IEnemy,
  ILaser,
  ILife,
  IPlayer,
  IPowerup,
  IPowerupInit,
  IPath,
  PlayerState,
  IShot,
  ShotMode,
  IExplosion,
  IMissile,
  IMine,
  IButton,
  IImageButton,
  ISliderChangeListener,
  ISlider,
} from './i-objects'

const { sprites, sounds } = gameState

let life

export function playSound(sound: ISound) {
  if (gameState.soundOn) {
    sound.stop()
    sound.play()
  }
}

export function Life(sprite: ISprite, x: number, y: number): ILife {
  const life: ILife = {
    sprite,
    x,
    y,
    path: null,
    update() {
      if (life.path) {
        const dir = life.path.next()
        life.x += dir.x
        life.y += dir.y
        if (life.path?.finished) {
          life.path = null
        }
      }
    },
    draw(c: RenderContext) {
      life.sprite.draw(c, life.x, life.y)
    },
  }
  return life
}

export function Laser(_owner: IEnemy, x: number, y: number, width?: number): ILaser {
  const timer = 15
  const height = gameState.c?.height - y
  const L: ILaser = {
    x,
    y,
    active: true,
    timer,
    width: width ?? 3,
    height,
    yDiff: height / timer,
    draw(c: RenderContext) {
      c.fillStyle = '#71CA35'
      c.fillRect(L.x, L.y, L.width, L.height)
    },
    hitEntity(entity: IHittable) {
      if (entityCollision(L, entity)) {
        entity.entityHit()
      }
    },
    update() {
      L.timer -= 1
      if (L.timer < 0) {
        L.active = false
      }
      L.y += L.yDiff
      L.height -= L.yDiff
      // L.x = L.owner.x + L.owner.width/2;
      // L.y = L.owner.y + L.owner.height;
    },
  }
  return L
}

interface IShotParams {
  sprites: ISprite[]
  x: number
  y: number
  speed: number
  width?: number
  height?: number
}

export function Shot(params: IShotParams): IShot {
  const mode = ShotMode.NORMAL
  const S: IShot = {
    x: params.x,
    y: params.y,
    speed: params.speed,
    width: params.width || shotW,
    height: params.height || shotH,
    active: true,
    mode,
    explosionTimer: 0,
    sprite: params.sprites[mode],
    inBounds: () =>
      S.x >= 0 && S.x <= gameState.c.width && S.y >= 0 && S.y <= gameState.c.height,
    draw: (c: RenderContext) => {
      S.sprite.draw(c, S.x, S.y)
    },
    hitEntity: (entity: IHittable) => {
      switch (S.mode) {
        case ShotMode.NORMAL:
          if (entityCollision(S, entity)) {
            entity.entityHit()
            S.mode = ShotMode.EXPLODING
            S.sprite = params.sprites[S.mode]
          }
          return false
        case ShotMode.EXPLODING:
          if (S.explosionTimer > 20) {
            S.active = false
            S.mode = ShotMode.GONE
          } else {
            S.explosionTimer += 1
          }
          return false
        default:
      }
      return false
    },
    update: () => {
      switch (S.mode) {
        case ShotMode.NORMAL:
          S.y += S.speed
          if (S.y < 0 || S.y > gameState.c.height) {
            S.active = false
          }
          break
        default:
      }
    },
  }
  return S
}

function replaceActiveEnemy(E: IEnemy) {
  let ind = gameState.activeEnemies.indexOf(E)
  if (ind === -1) {
    return
  }
  while (ind !== -1) {
    gameState.activeEnemies.splice(ind, 1)
    ind = gameState.activeEnemies.indexOf(E)
  }
  const seen = []
  let enemy: IEnemy | undefined = E
  // eslint-disable-next-line
  while (true) {
    if (enemy) {
      if (seen.indexOf(enemy) !== -1) {
        return
      }
      if (!enemy.active || gameState.activeEnemies.indexOf(enemy) !== -1) {
        seen.push(enemy)
        enemy = enemy.parent
      } else {
        break
      }
    } else {
      return
    }
  }
  gameState.activeEnemies.push(enemy)
}

function Explosion(x: number, y: number, w: number, h: number): IExplosion {
  const exp: IExplosion = {
    x,
    y,
    width: w,
    height: h,
    time: 0,
    active: true,
    ind: 0,
    spriteTime: 2,
    draw(c: RenderContext) {
      if (w && h) {
        sprites.explosions[exp.ind].draw(c, exp.x, exp.y, w, h)
      } else {
        sprites.explosions[exp.ind].draw(c, exp.x, exp.y)
      }
    },
    update() {
      exp.time += 1
      if (exp.time > exp.spriteTime) {
        exp.time = 0
        exp.ind += 1
        if (exp.ind >= sprites.explosions.length) {
          exp.active = false
        }
      }
    },
  }
  return exp
}

function Missile(x: number, y: number, speed?: number, w?: number, h?: number): IMissile {
  const m: IMissile = {
    x,
    y,
    width: w || sprites.missile.width,
    height: h || sprites.missile.height,
    mode: ShotMode.NORMAL,
    sprite: sprites.missile,
    speed: speed || -7,
    active: true,
    explosionTimer: 0,
    inBounds() {
      return m.x >= 0 && m.x <= gameState.c.width && m.y >= 0 && m.y <= gameState.c.height
    },
    hitEntity(entity: IHittable) {
      if (entityCollision(m, entity)) {
        m.active = false
        const exp = Explosion(
          m.x - 2 * m.width,
          m.y - m.height,
          m.width * 5,
          m.height * 3,
        )
        gameState.explosions.push(exp)
        gameState.enemies.forEach((enemy) => {
          if (entityCollision(exp, enemy)) {
            enemy.entityHit(2)
          }
        })
      }
    },
    draw(c: RenderContext) {
      sprites.missile.draw(c, m.x, m.y)
    },
    update() {
      m.y += m.speed
      if (m.y < 0 || m.y > gameState.c.height) {
        m.active = false
      }
    },
  }
  return m
}

export function clearEntities() {
  gameState.mines = []
  gameState.enemies = []
  gameState.activeEnemies = []
  gameState.player.shots = []
  gameState.enemyShots = []
  gameState.enemyData.numAttacks = 0
  gameState.enemyData.initEnemyCount = 0
}

export function Mine(x: number, y: number): IMine {
  const mine: IMine = {
    x,
    y,
    width: sprites.mines[0].width,
    height: sprites.mines[0].height,
    active: true,
    blinkTimer: 15,
    blink: true,
    sprite: sprites.mines[0], // eslint-disable-line
    draw(c: RenderContext) {
      mine.sprite.draw(c, mine.x, mine.y)
    },
    hitEntity(entity: IHittable) {
      if (entityCollision(mine, entity)) {
        entity.entityHit(3)
        mine.active = false
      }
    },
    entityHit() {
      mine.active = false
      gameState.explosions.push(Explosion(mine.x, mine.y, mine.width, mine.height))
    },
    update() {
      mine.blinkTimer -= 1
      if (mine.blinkTimer <= 0) {
        mine.sprite = mine.blink ? sprites.mines[1] : sprites.mines[0]
        mine.blink = !mine.blink
        mine.blinkTimer = 15
      }
    },
  }
  return mine
}

interface IEnemyParams {
  sprite: ISprite
  x: number
  y: number
  type: number
  width: number
  height: number
  parent?: IEnemy
  score: number
  speed?: number
  health: number
  mode?: EnemyMode
  notifyEscorts?: () => void
}

export function Enemy(params: IEnemyParams): IEnemy {
  gameState.enemySpawnCount += 1
  const enemy: IEnemy = {
    id: gameState.enemySpawnCount,
    type: params.type,
    x: params.x,
    y: params.y,
    width: params.width,
    height: params.height,
    startX: 0,
    startY: 0,
    shotFreq: 0,
    initPathFn: undefined,
    AttackPathFn: undefined,
    AttackPath: undefined,
    shootFn: undefined,
    shoot: undefined,
    score: params.score,
    health: params.health,
    sprite: params.sprite,
    active: true,
    alwaysAttack: false,
    mode: params.mode || EnemyMode.INIT,
    speed: params.speed || 1,
    notifyEscorts: params.notifyEscorts || (() => {}),
    returnPath() {
      enemy.y = 0
      return PointPath(
        [Point(enemy.x, enemy.y), Point(enemy.startX, enemy.startY)],
        [30],
        1,
      )
    },
    clone(x: number, y: number): IEnemy {
      const e = Enemy({
        type: enemy.type,
        sprite: enemy.sprite,
        x: x ?? enemy.x,
        y: y ?? enemy.y,
        width: enemy.width,
        height: enemy.height,
        score: enemy.score,
        health: enemy.health,
      })
      e.speed = enemy.speed
      e.shotFreq = enemy.shotFreq
      e.initPathFn = enemy.initPathFn
      e.AttackPathFn = enemy.AttackPathFn
      e.shootFn = enemy.shootFn
      e.wanderFn = enemy.wanderFn
      e.hoverActionFn = enemy.hoverActionFn
      if (enemy.initPathFn) {
        e.initPath = enemy.initPathFn(gameState.c, e).instantiate()
      }
      if (enemy.AttackPathFn) {
        e.AttackPath = enemy.AttackPathFn(gameState.c, e)
      }
      e.shoot = enemy.shootFn?.(e, enemy.shotFreq)
      e.hoverAction = enemy.hoverActionFn?.(e, e.shotFreq)
      if (e.wanderFn) {
        e.wander = e.wanderFn(e)
      }
      return e
    },
    wander(xWander: number) {
      if (enemy.mode === EnemyMode.ATTACK) {
        enemy.startX += xWander
      } else {
        enemy.x += xWander
      }
    },
    attack(path: IPath | undefined) {
      if (
        enemy.mode === EnemyMode.ATTACK ||
        enemy.mode === EnemyMode.INIT ||
        enemy.x < 0 ||
        enemy.x > gameState.c.width ||
        enemy.AttackPath === null
      ) {
        return
      }
      if (enemy.mode === EnemyMode.HOVER) {
        enemy.startX = enemy.x
        enemy.startY = enemy.y
      }
      enemy.mode = EnemyMode.ATTACK
      enemy.path = path ?? enemy.AttackPath?.instantiate()
      enemy.notifyEscorts?.()
    },
    update() {
      switch (enemy.mode) {
        case EnemyMode.INIT: {
          const dir = enemy.initPath?.next()
          if (dir) {
            enemy.x += dir.x
            enemy.y += dir.y
          }
          if (enemy.initPath?.finished) {
            enemy.mode = EnemyMode.HOVER
            const last = enemy.initPath?.lastPoint?.()
            if (last) {
              enemy.x = last.x
              enemy.y = last.y
            }
            gameState.enemyData.initEnemyCount += 1
          }
          break
        }
        case EnemyMode.HOVER:
          if (enemy.hoverAction) {
            enemy.hoverAction()
          }
          break
        case EnemyMode.ATTACK: {
          const dir = enemy.path?.next()
          if (dir) {
            enemy.x += dir.x
            enemy.y += dir.y
          }
          if (entityCollision(enemy, gameState.player)) {
            gameState.player.entityHit()
            enemy.entityHit()
          }
          if (enemy.path?.finished) {
            enemy.mode = EnemyMode.RETURN
            enemy.path = enemy.returnPath()
          }
          enemy.shoot?.()
          break
        }
        case EnemyMode.RETURN: {
          const dir = enemy.path?.next()
          if (dir) {
            enemy.x += dir.x
            enemy.y += dir.y
          }
          if (enemy.path?.finished) {
            enemy.mode = EnemyMode.HOVER
            if (enemy.alwaysAttack) {
              enemy.attack()
            }
          }
          break
        }
        default:
      }
    },
    // TODO -- move this functionality to editor
    draw(c: RenderContext) {
      enemy.sprite.draw(c, enemy.x, enemy.y, enemy.width, enemy.height)
      if (gameState.mode === GameMode.EDIT) {
        if (enemy.squared) {
          c.strokeStyle = '#DDD'
          c.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height)
        }
        c.strokeStyle = '#0F0'
        if (enemy.editorActive || gameState.activeEnemies.indexOf(enemy) !== -1) {
          c.beginPath()
          c.arc(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            1.2 * (enemy.width / 2),
            0,
            2 * Math.PI,
          )
          c.stroke()
          c.closePath()
        }
        let next = enemy.parent
        while (next) {
          if (next.active) {
            c.beginPath()
            c.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2)
            c.lineTo(next.x + next.width / 2, next.y + next.height / 2)
            c.closePath()
            c.stroke()
            break
          } else {
            next = next.parent
          }
        }
      }
    },
    entityHit(dmg?: number) {
      enemy.health -= dmg || 1
      if (enemy.health <= 0) {
        playSound(sounds.enemyExp)
        const rand = Math.random()
        if (rand < 0.02) {
          gameState.powerups.push(powerupObjs[0].instantiate(enemy.x, enemy.y))
        } else if (rand < 0.05) {
          gameState.powerups.push(powerupObjs[1].instantiate(enemy.x, enemy.y))
        } else if (rand < 0.06) {
          gameState.powerups.push(powerupObjs[2].instantiate(enemy.x, enemy.y))
        }
        gameState.score += enemy.score
        enemy.active = false
        gameState.explosions.push(Explosion(enemy.x, enemy.y, enemy.width, enemy.height))
        replaceActiveEnemy(enemy)
      }
    },
  }
  return enemy
}

gameState.player = {
  color: '#00A',
  width: 36,
  height: 36,
  x: 0,
  y: 0,
  sprites: [],
  xVel: 0,
  yVel: 0,
  visible: true,
  blinks: 0,
  blinkNum: 0,
  blinkDur: 10,
  immobile: 0,
  lives: [],
  shots: [],
  numMissiles: 2,
  state: PlayerState.NORMAL,
  shielded: false,
  init(this: IPlayer, c: RenderContext) {
    this.x = c.width / 2
    this.y = c.height - 36
  },
  switchState(this: IPlayer, state: PlayerState) {
    if (this.state !== PlayerState.DAMAGED) {
      this.state = state
    }
  },
  entityHit(this: IPlayer, dmg: number) {
    const damage = dmg || 1
    if (this.blinks > 0) {
      return
    }
    if (damage > 1) this.shielded = false
    if (this.shielded) {
      this.shielded = false
      return
    }
    playSound(sounds.enemyExp)
    gameState.explosions.push(Explosion(this.x, this.y, this.width, this.height))
    this.lives.pop()
    if (this.lives.length === 0) {
      this.state = PlayerState.DESTROYED
      gameState.isOver = true
      gameState.gameOverTimer = 15
    } else {
      this.x = gameState.c.width / 2
      this.y = gameState.c.height - 36
      this.blink(3)
    }
  },
  shield(this: IPlayer) {
    if (this.shielded) {
      gameState.score += 500
    }
    this.shielded = true
  },
  blink(this: IPlayer, blinks: number) {
    this.blinks = blinks
    this.immobile = 30
  },
  update(this: IPlayer) {
    if (this.immobile > 0) {
      this.immobile -= 1
    } else {
      if (keyhandler.keys.ArrowLeft || keyhandler.keys.KeyA) {
        this.xVel = -8
        this.x -= 8
        this.switchState(PlayerState.LEFT)
      } else if (keyhandler.keys.ArrowRight || keyhandler.keys.KeyD) {
        this.xVel = 8
        this.x += 8
        this.switchState(PlayerState.RIGHT)
      } else {
        this.xVel = 0
        this.switchState(PlayerState.NORMAL)
      }
      if (keyhandler.keys.ArrowUp || keyhandler.keys.KeyW) {
        this.yVel = -8
        this.y -= 8
      } else if (keyhandler.keys.ArrowDown || keyhandler.keys.KeyS) {
        this.yVel = 8
        this.y += 8
      } else {
        this.yVel = 0
      }
      if (gameState.shotTimer > 10) {
        if (keyhandler.keys.Space) {
          playSound(sounds.shot)
          gameState.shotTimer = 0
          this.shots.push(
            Shot({
              speed: -10,
              x: this.x + this.width / 2,
              y: this.y,
              sprites: sprites.playerShot,
            }),
          )
        }
        if (keyhandler.Shift() && this.numMissiles > 0) {
          gameState.shotTimer = 0
          this.shots.push(Missile(this.x, this.y))
          this.numMissiles -= 1
        }
      }
    }
    this.x = clamp(this.x, 0, gameState.c.width - this.width)
    this.y = clamp(this.y, gameState.c.boundary, gameState.c.height - this.height)
    if (this.blinks > 0) {
      this.blinkNum += 1
      if (this.blinkNum >= this.blinkDur) {
        this.visible = !this.visible
        if (this.visible) {
          this.blinks -= 1
        }
        this.blinkNum = 0
      }
    }
  },
  draw(this: IPlayer, c: RenderContext) {
    if (this.state !== PlayerState.DESTROYED && this.visible && !gameState.isOver) {
      this.sprites[this.state].draw(c, this.x, this.y)
      if (this.shielded) {
        sprites.shield.draw(c, this.x - 6, this.y - 8)
      }
    }
  },
  setupLives(this: IPlayer, c: RenderContext, lives: number) {
    this.blink(3)
    for (let i = 0; i < lives; i += 1) {
      this.lives.push(
        Life(
          sprites.playerLife,
          i * (this.width / 2) + (i + 1) * 10,
          c.height - (this.height / 2 + 5),
        ),
      )
    }
  },
}

function addLife(x: number, y: number) {
  life = Life(sprites.playerLife, x, y)
  gameState.player.lives.push(life)
  const xMul = gameState.player.lives.length - 1
  const lifeX = xMul * (gameState.player.width / 2) + (xMul + 1) * 10
  const endP = Point(lifeX, gameState.c.height - (gameState.player.height / 2 + 5))
  life.path = PointPath([Point(x, y), endP], [15])
}

function Powerup(
  sprite: ISprite,
  x: number,
  y: number,
  w: number,
  h: number,
  hitCallback: IHitCallback,
): IPowerup {
  const p: IPowerup = {
    sprite,
    x,
    y,
    width: w,
    height: h,
    radius: Math.sqrt(2) * (w / 2),
    hitCallback,
    active: true,
    update: () => {
      p.y += 4
      if (p.y > gameState.c.height) {
        p.active = false
      } else if (entityCollision(p, gameState.player)) {
        p.hitCallback(p)
        p.active = false
      }
    },
    draw: (c: RenderContext) => {
      p.sprite.draw(c, p.x, p.y, p.width, p.height)
      c.beginPath()
      c.arc(p.x + p.radius / 1.5, p.y + p.radius / 1.5, p.radius, 0, 2 * Math.PI)
      c.strokeStyle = '#DDD'
      c.stroke()
      c.closePath()
    },
  }
  return p
}

function MissilePowerup(): IPowerupInit {
  const missile = {
    width: 20,
    height: 20,
    hitCallback: (_: IBounded) => {
      if (gameState.player) {
        gameState.player.numMissiles += 1
      }
    },
    instantiate: (x: number, y: number) =>
      Powerup(sprites.missile, x, y, missile.width, missile.height, missile.hitCallback),
  }
  return missile
}

function LifePowerup(): IPowerupInit {
  const life = {
    width: 20,
    height: 20,
    hitCallback: (self: IBounded) => {
      addLife(self.x, self.y)
    },
    instantiate: (x: number, y: number) => {
      return Powerup(sprites.playerLife, x, y, life.width, life.height, life.hitCallback)
    },
  }
  return life
}

function ShieldPowerup(): IPowerupInit {
  const shield = {
    width: 20,
    height: 20,
    hitCallback: (_: IBounded) => {
      gameState.player?.shield()
    },
    instantiate: (x: number, y: number) =>
      Powerup(
        sprites.shieldPowerup,
        x,
        y,
        shield.width,
        shield.height,
        shield.hitCallback,
      ),
  }
  return shield
}

function pointInRect(px: number, py: number, x: number, y: number, w: number, h: number) {
  return px > x && px < x + w && py > y && py < y + h
}

export function Button(
  text: string,
  x: number,
  y: number,
  size: number[],
  fontOpt?: string,
  fontColor?: string,
  _color?: string,
  _hoverColor?: string,
): IButton {
  const font = fontOpt ?? '18px Arial Black'
  const fs = textSize(text, font)
  const btn: IButton = {
    font,
    size: size ?? textSize(text, font),
    text,
    x,
    y,
    width: size[0] + 25,
    height: size[1] + 18,
    left: x - 10,
    top: y,
    fontColor: fontColor || '#000',
    // color: color ?? '6e898a',
    // hoverColor: hoverColor ?? '88babb',
    color: 'rgb(110,137,138)',
    hoverColor: 'rgb(136,186,187)',
    mouseOver: false,
    active: true,
    draw(c: RenderContext) {
      if (btn.mouseOver) {
        c.fillStyle = btn.hoverColor
      } else {
        c.fillStyle = btn.color
      }
      c.lineWidth = 1
      c.fillRect(btn.left, btn.top, btn.width, btn.height)
      c.strokeStyle = '#000'
      c.strokeRect(btn.left, btn.top, btn.width, btn.height)
      c.font = btn.font
      c.fillStyle = btn.fontColor
      c.fillText(
        btn.text,
        btn.left + btn.width / 2 - fs[0] / 2,
        btn.y + btn.height / 1.45,
      )
    },
    hover(px: number, py: number) {
      btn.mouseOver = pointInRect(px, py, btn.left, btn.top, btn.width, btn.height)
    },
    click(px: number, py: number) {
      if (pointInRect(px, py, btn.left, btn.top, btn.width, btn.height)) {
        btn.clickListener?.()
      }
    },
    setClickListener(listener: () => void) {
      btn.clickListener = listener
    },
  }
  return btn
}

export function ImageButton(
  c: RenderContext,
  image: ISprite,
  clickImage: ISprite,
  x: number,
  y: number,
  w: number,
  h: number,
): IImageButton {
  const btn: IImageButton = {
    image,
    clickImage,
    x,
    y,
    width: w,
    height: h,
    off: true,
    active: true,
    mouseOver: false,
    draw(ctx: RenderContext) {
      if (btn.off) {
        if (btn.image.loaded) {
          btn.image.draw(ctx, btn.x, btn.y, btn.width, btn.height)
        }
      } else if (btn.clickImage.loaded) {
        btn.clickImage.draw(ctx, btn.x, btn.y, btn.width, btn.height)
      }
    },
    hover(px: number, py: number) {
      btn.mouseOver = pointInRect(px, py, btn.x, btn.y, btn.width, btn.height)
    },
    click(px: number, py: number) {
      if (pointInRect(px, py, btn.x, btn.y, btn.width, btn.height)) {
        btn.off = !btn.off
        btn.clickListener?.()
        c.clearRect(btn.x, btn.y, btn.width, btn.height)
        btn.draw(c)
      }
    },
    setClickListener(listener: () => void) {
      btn.clickListener = listener
    },
  }
  return btn
}

/* A vertical or horizontal slider with a label and optional callback for when the value changes
   by step. A step of 0 means the slider is continuous */
export function Slider(
  c: RenderContext,
  label: string,
  units: string,
  x: number,
  y: number,
  width: number,
  height: number,
  min: number,
  max: number,
  step: number,
  horizontal: boolean,
  changeListener?: ISliderChangeListener,
): ISlider {
  const font = '14px Arial'
  c.font = font
  const slider: ISlider = {
    label,
    units,
    x,
    y,
    width,
    height,
    xKnob: x,
    yKnob: horizontal ? y + 20 : y,
    step,
    min,
    max,
    val: min,
    displayVal: min,
    horizontal,
    radius: (horizontal ? height : width) / 2,
    changeListener,
    clicked: false,
    font,
    color: '',
    labelSize: c.measureText(label),
    unitsSize: c.measureText(`00.000 ${units}`),
    getVal: (pos: number, minVal: number, length: number) =>
      (slider.max - slider.min) * ((pos - minVal) / length) + slider.min,
    move(xDiff: number, yDiff: number) {
      slider.setPos(slider.x + xDiff, slider.y + yDiff)
    },
    setPos(xPos: number, yPos: number) {
      slider.x = xPos
      slider.y = yPos
      if (slider.horizontal) {
        slider.yKnob = yPos + 20
      } else {
        slider.xKnob = xPos
      }
      slider.setToVal(slider.val)
    },
    valueFn() {
      const value = slider.val
      return () => value
    },
    updateDisplayVal() {
      if (slider.step === 0) {
        slider.displayVal = slider.val
      } else {
        const floor = slider.step * Math.floor((slider.val - slider.min) / slider.step)
        slider.displayVal =
          slider.val - floor > slider.step / 2 ? floor + slider.step : floor
      }
    },
    setToVal(val: number) {
      if (val >= slider.min && val <= slider.max) {
        if (slider.horizontal) {
          slider.xKnob =
            slider.width * ((val - slider.min) / (slider.max - slider.min)) + slider.x
        } else {
          slider.yKnob =
            slider.height * ((val - slider.min) / (slider.max - slider.min)) +
            slider.height
        }
        slider.val = val
        if (slider.changeListener) {
          slider.changeListener(val)
        }
        slider.updateDisplayVal()
      }
    },
    slide(xDiff: number, yDiff: number) {
      if (horizontal) {
        slider.xKnob += xDiff
        slider.xKnob = clamp(slider.xKnob, slider.x, slider.x + slider.width)
        slider.val = slider.getVal(slider.xKnob, slider.x, slider.width)
      } else {
        slider.yKnob += yDiff
        slider.yKnob = clamp(slider.yKnob, slider.y, slider.y + slider.height)
        slider.val = slider.getVal(slider.yKnob, slider.y, slider.height)
      }
      slider.updateDisplayVal()
      if (slider.changeListener) {
        slider.changeListener(slider.displayVal)
      }
    },
    hit(xPos: number, yPos: number) {
      slider.clicked =
        x > slider.xKnob - slider.radius &&
        xPos < slider.xKnob + slider.radius &&
        yPos > slider.yKnob - slider.radius &&
        yPos < slider.yKnob + slider.radius
      return slider.clicked
    },
    draw(ctx: RenderContext) {
      ctx.beginPath()
      ctx.lineWidth = slider.height / 4
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#05F'
      ctx.moveTo(slider.x, slider.y + 20)
      if (slider.horizontal) {
        ctx.lineTo(slider.x + slider.width, slider.y + 20)
      } else {
        ctx.lineTo(slider.x, slider.y + slider.height)
      }
      ctx.closePath()
      ctx.stroke()
      ctx.beginPath()
      ctx.fillStyle = '#000'
      ctx.arc(
        slider.xKnob,
        slider.yKnob,
        slider.radius + (slider.clicked ? 1.5 : 0),
        0,
        2 * Math.PI,
      )
      ctx.fillStyle = slider.color
      ctx.fill()
      ctx.closePath()
      ctx.font = slider.font
      const valStr = `${slider.displayVal.toFixed(3)} ${slider.units}`
      if (slider.horizontal) {
        const xMid = slider.x + slider.width / 2
        ctx.fillText(slider.label, xMid - slider.labelSize.width / 2, slider.y)
        ctx.fillText(valStr, xMid - slider.unitsSize.width / 2, slider.y + 13)
      } else {
        ctx.fillText(slider.label, slider.x + 10, slider.y + 10)
        ctx.fillText(valStr, slider.x + 10, slider.y + 25)
      }
    },
  }
  return slider
}

export const powerupObjs = [MissilePowerup(), ShieldPowerup(), LifePowerup()]
