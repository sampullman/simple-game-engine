/*
var formats = [ "wav", "mp3" ];
var bubble = new buzz.sound( "/static/sounds/bubble", {
    formats: formats });
var crack = new buzz.sound( "/static/sounds/crack", {
    formats: formats });
var bounce = new buzz.sound( "/static/sounds/bounce", {
    formats: formats });
*/

import { IBounded, ISprite, RenderContext } from '@sampullman/simple-game-engine'
import { IBall, IBlock, ISuperBlock } from './i-objects'

export const Powerups = {
  NONE: 0,
  EXTRA_BALL: 1,
  BALL_SIZE: 2,
}

interface IPlayer extends IBounded {
  color: string
  sprite: ISprite | undefined
  init(x: number, y: number): void
  draw(c: RenderContext): void
}

export const player: IPlayer = {
  color: '#00A',
  width: 72,
  height: 12,
  x: 0,
  y: 0,
  sprite: undefined,
  init(x: number, y: number) {
    this.x = x
    this.y = y
  },
  draw(c: RenderContext) {
    this.sprite?.draw(c, this.x, this.y)
  },
}

interface IBallParams {
  speed: number
  x: number
  y: number
}

export function Ball(B: IBallParams): IBall {
  const radius = 8
  const ball: IBall = {
    active: true,
    xVel: 0,
    yVel: -B.speed,
    radius,
    color: '#000',
    debug: null,
    x: B.x,
    y: (B.y -= radius),
    inBounds(c: RenderContext) {
      return ball.x >= 0 && ball.x <= c.width && ball.y >= 0 && ball.y <= c.height
    },
    draw(c: RenderContext) {
      c.beginPath()
      c.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI)
      c.fillStyle = ball.color
      c.fill()
      c.closePath()
    },
    randomSize() {
      const size = Math.floor(Math.random() * 3)
      if (size === 2) {
        ball.radius = 4
      } else if (size === 1) {
        ball.radius = 15
      } else {
        ball.radius = 8
      }
    },
    hitPlayer() {
      return (
        ball.x + ball.radius > player.x &&
        ball.x - ball.radius < player.x + player.width &&
        ball.y + ball.radius > player.y
      )
    },
    hitBlock(block: IBounded) {
      if (
        ball.x + ball.radius > block.x &&
        ball.x - ball.radius < block.x + block.width &&
        ball.y + ball.radius > block.y &&
        ball.y - ball.radius < block.y + block.height
      ) {
        const velY = Math.abs(ball.yVel)
        if (
          ball.y - ball.radius + velY >= block.y + block.height ||
          ball.y + ball.radius - velY <= block.y
        ) {
          ball.yVel *= -1
        } else {
          ball.xVel *= -1
        }
        return true
      }
      return false
    },
    update(c: RenderContext) {
      ball.x += ball.xVel
      ball.y += ball.yVel

      if (ball.x - ball.radius < 0) {
        // bounce.play();
        ball.x = ball.radius
        ball.xVel *= -1
      } else if (ball.x + ball.radius > c.width) {
        // bounce.play();
        ball.x = c.width - ball.radius - 1
        ball.xVel *= -1
      } else if (ball.y - ball.radius < 0) {
        // bounce.play();
        ball.y = ball.radius
        ball.yVel *= -1
      } else if (ball.hitPlayer()) {
        // bounce.play();
        ball.yVel *= -1
        const t = (ball.x - player.x) / player.width
        ball.xVel = 8 * (t - 0.5)
        ball.y = player.y - ball.radius
      } else if (ball.y + ball.radius > c.height) {
        ball.active = false
      }
    },
  }
  return ball
}

interface IBlockParams {
  x: number
  y: number
  powerup?: number
  width: number
  height: number
  sprite: ISprite
}

export function Block(B: IBlockParams): IBlock {
  const block: IBlock = {
    x: B.x,
    y: B.y,
    width: B.width,
    height: B.height,
    sprite: B.sprite,
    active: true,
    powerup: B.powerup ?? Powerups.NONE,
    draw(c: RenderContext) {
      block.sprite.draw(c, block.x, block.y)
    },
    handleHit(_balls: IBall[], other: IBall) {
      // bubble.play();
      if (block.powerup === Powerups.BALL_SIZE) {
        if (Math.random() < 0.2) {
          other.randomSize()
        }
      }
      block.active = false
    },
  }
  return block
}

interface ISuperBlockParams extends Omit<IBlockParams, 'sprite'> {
  sprites: ISprite[]
}

export function SuperBlock(B: ISuperBlockParams): ISuperBlock {
  const block: ISuperBlock = {
    x: B.x,
    y: B.y,
    width: B.width,
    height: B.height,
    sprites: B.sprites,
    powerup: B.powerup ?? Powerups.NONE,
    active: true,
    state: 0,
    numStates: B.sprites.length,
    draw(c: RenderContext) {
      block.sprites[block.state].draw(c, block.x, block.y)
    },
    handleHit(balls: IBall[], _other: IBall) {
      // crack.play();
      block.state += 1
      if (block.state >= block.numStates) {
        block.active = false
        switch (block.powerup) {
          case Powerups.EXTRA_BALL:
            balls.push(
              Ball({
                speed: 6,
                x: block.x,
                y: block.y,
              }),
            )
            break
          default:
            break
        }
        balls.forEach((ball) => {
          // TODO -- calculate new velocity vector & convert back to x/y vel.
          ball.xVel *= 1.1
          ball.yVel *= 1.1
        })
      }
    },
  }
  return block
}
