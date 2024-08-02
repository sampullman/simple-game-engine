/* Good day to you, sir. C stands for Canvas. */
import {
  clamp,
  IProxy,
  ISprite,
  keyhandler,
  LoadSprite,
  RenderContext,
} from '@sampullman/simple-game-engine'
import { player, Powerups, Ball, Block, SuperBlock } from './objects'
import { IBall, IBaseBlock } from './i-objects'

import androidLeg from '../assets/images/android-leg.png'
import androidLeg1 from '../assets/images/android-leg1.png'
import androidArm from '../assets/images/android-arm.png'
import androidArm1 from '../assets/images/android-arm1.png'
import androidHead from '../assets/images/android-head.png'
import androidHead1 from '../assets/images/android-head1.png'
import androidHead2 from '../assets/images/android-head2.png'
import androidBody from '../assets/images/android-body.png'
import androidBody1 from '../assets/images/android-body1.png'
import androidBody2 from '../assets/images/android-body2.png'
import androidBody3 from '../assets/images/android-body3.png'
import microsoft from '../assets/images/microsoft.png'
import python from '../assets/images/python.png'
import github from '../assets/images/github.png'
import apple from '../assets/images/apple.png'
import java from '../assets/images/java.png'
import unix from '../assets/images/unix.png'
import unix1 from '../assets/images/unix1.png'
import unix2 from '../assets/images/unix2.png'
import playerImg from '../assets/images/player.png'

const C_WIDTH = 400
const C_HEIGHT = 300
const bodySize = C_WIDTH / 5
const legWidth = 0.22 * bodySize
const legHeight = 0.35 * bodySize
const armWidth = 0.265 * bodySize
const armHeight = 0.85 * bodySize
const headWidth = bodySize
const headHeight = 0.485 * bodySize
const headLength = C_WIDTH / 2 - bodySize / 2
let blockWidth: number
let blockHeight: number
let legSprites: ISprite[]
let armSprites: ISprite[]
let headSprites: ISprite[]
let bodySprites: ISprite[]
let sprites: ISprite[]
let superSprites: ISprite[]

const FPS = 30
let domCanvas: HTMLCanvasElement
let c: RenderContext
let gameEventId: ReturnType<typeof setInterval>
let drawEnabled = true

/* eslint-disable no-unused-vars */
let error = ''

let frameCount = 0

let balls: IBall[] = []
let blocks: IBaseBlock[] = []

const GameMode = {
  INIT: 0,
  ON: 1,
  PAUSED: 2,
  BOSS: 3,
  WIN: 4,
  LOSE: 5,
}

let mode = GameMode.INIT

export function countFrames() {
  error = frameCount.toString()
  frameCount = 0
}

function initBlocks() {
  let x = 0
  let y = 0
  for (let i = 0; i < sprites.length; i += 1) {
    for (let j = 0; j < 12; j += 1) {
      if (i % 2 === 1 && (j === 1 || j === 5 || j === 9)) {
        blocks.push(
          SuperBlock({
            x,
            y,
            powerup: Powerups.EXTRA_BALL,
            width: 2 * blockWidth,
            height: blockHeight,
            sprites: superSprites,
          }),
        )
        x += 2 * blockWidth
        j += 1
      } else {
        blocks.push(
          Block({
            x,
            y,
            powerup: Powerups.BALL_SIZE,
            width: blockWidth,
            height: blockHeight,
            sprite: sprites[i],
          }),
        )
        x += blockWidth
      }
    }
    x = 0
    y += blockHeight
  }
}

function setupBoss() {
  mode = GameMode.BOSS
  blocks.push(
    SuperBlock({
      x: headLength,
      y: headHeight,
      width: bodySize,
      height: bodySize,
      sprites: bodySprites,
    }),
  )
  blocks.push(
    SuperBlock({
      x: headLength,
      y: 0,
      width: headWidth,
      height: headHeight,
      sprites: headSprites,
    }),
  )
  blocks.push(
    SuperBlock({
      x: headLength - armWidth,
      y: headHeight - armHeight / 12,
      width: armWidth,
      height: armHeight,
      sprites: armSprites,
    }),
  )
  blocks.push(
    SuperBlock({
      x: headLength + bodySize,
      y: headHeight - armHeight / 12,
      width: armWidth,
      height: armHeight,
      sprites: armSprites,
    }),
  )
  blocks.push(
    SuperBlock({
      x: C_WIDTH / 2 - bodySize / 3,
      y: headHeight + bodySize,
      width: legWidth,
      height: legHeight,
      sprites: legSprites,
    }),
  )
  blocks.push(
    SuperBlock({
      x: C_WIDTH / 2 + bodySize / 9,
      y: headHeight + bodySize,
      width: legWidth,
      height: legHeight,
      sprites: legSprites,
    }),
  )
}

function draw() {
  if (drawEnabled) {
    c.fillStyle = '#636171'
    c.fillRect(0, 0, C_WIDTH, C_HEIGHT)
    player.draw(c)
    balls.forEach((ball) => {
      ball.draw(c)
    })
    blocks.forEach((block) => {
      block.draw(c)
    })
  }
  frameCount += 1
  if (error) {
    debug(error)
  }
}

function setupGame() {
  balls.push(
    Ball({
      speed: -6,
      x: player.x + player.width / 2,
      y: player.y - 54,
    }),
  )
  initBlocks()
}

function drawStart(sprite: IProxy | null) {
  if (!sprite) {
    console.log('Sprite load fail')
  } else {
    setupGame()
    domCanvas.onclick = startGame
    draw()
    c.fillStyle = '#000'
    c.font = '30px RobotoBlack'
    c.fillText('Click To Start!', C_WIDTH / 4, C_HEIGHT / 1.5)
  }
}

function restartGame() {
  balls = []
  blocks = []
  setupGame()
  startGame()
}

function gameWon() {
  mode = GameMode.WIN
  clearInterval(gameEventId)
  c.fillStyle = '#000'
  c.font = '30px RobotoBlack'
  c.fillText('You Win!', C_WIDTH / 3, C_HEIGHT / 2)
  c.font = '24px RobotoBlack'
  c.fillText('Click to replay', C_WIDTH / 3.2, C_HEIGHT / 2 + 40)
  domCanvas.onclick = restartGame
}

function gameOver() {
  clearInterval(gameEventId)
  domCanvas.onclick = restartGame
  mode = GameMode.LOSE
  c.fillStyle = '#000'
  c.font = '30px RobotoBlack'
  c.fillText('Game Over!', C_WIDTH / 3, C_HEIGHT / 1.5)
  c.font = '24px RobotoBlack'
  c.fillText('Click to replay', C_WIDTH / 3, C_HEIGHT / 1.5 + 40)
}

/* eslint-disable no-unused-vars */
function debug(msg: string) {
  c.font = '16px RobotoBlack'
  c.fillText(msg, 0, C_HEIGHT / 1.5)
}

export function pause() {
  if (mode === GameMode.ON || mode === GameMode.BOSS) {
    drawEnabled = false
    mode = GameMode.PAUSED
    clearInterval(gameEventId)
    domCanvas.onfocusout = null
    domCanvas.onclick = startGame
    keyhandler.stop()
    c.fillStyle = '#000'
    c.font = '28px RobotoBlack'
    c.fillText('Paused: Click to Resume', C_WIDTH / 7, C_HEIGHT / 2 - 20)
  }
}

function loadSprites() {
  LoadSprite.imageRoot = ''
  legSprites = [
    LoadSprite(androidLeg, legWidth, legHeight),
    LoadSprite(androidLeg1, legWidth, legHeight),
  ]
  armSprites = [
    LoadSprite(androidArm, armWidth, armHeight),
    LoadSprite(androidArm1, armWidth, armHeight),
  ]
  headSprites = [
    LoadSprite(androidHead, headWidth, headHeight),
    LoadSprite(androidHead1, headWidth, headHeight),
    LoadSprite(androidHead2, headWidth, headHeight),
  ]
  bodySprites = [
    LoadSprite(androidBody, bodySize, bodySize),
    LoadSprite(androidBody1, bodySize, bodySize),
    LoadSprite(androidBody2, bodySize, bodySize),
    LoadSprite(androidBody3, bodySize, bodySize),
  ]
  blockWidth = C_WIDTH / 12
  blockHeight = C_HEIGHT / 10
  sprites = [
    LoadSprite(microsoft, blockWidth, blockHeight),
    LoadSprite(python, blockWidth, blockHeight),
    LoadSprite(github, blockWidth, blockHeight),
    LoadSprite(apple, blockWidth, blockHeight),
    LoadSprite(java, blockWidth, blockHeight),
  ]
  superSprites = [
    LoadSprite(unix, 2 * blockWidth, blockHeight),
    LoadSprite(unix1, 2 * blockWidth, blockHeight),
    LoadSprite(unix2, 2 * blockWidth, blockHeight),
  ]
  player.sprite = LoadSprite(playerImg, 72, 12, drawStart)
}

export function loadGame(canvasId?: string) {
  domCanvas = document.getElementById(canvasId ?? 'canvas') as HTMLCanvasElement
  const ctx = domCanvas?.getContext('2d', { alpha: false })
  if (!domCanvas || !ctx) {
    throw new Error('Failed to create rendering context')
  }
  c = ctx as RenderContext
  c.width = C_WIDTH
  c.height = C_HEIGHT
  player.init(C_WIDTH / 2 - 36, C_HEIGHT - 16)
  console.log('INIT', C_WIDTH, C_HEIGHT)

  if (mode === GameMode.INIT) {
    loadSprites()
  } else if (mode === GameMode.PAUSED) {
    mode = GameMode.ON
    pause()
  } else if (mode === GameMode.WIN) {
    gameWon()
  } else if (mode === GameMode.LOSE) {
    gameOver()
  }
}

function update() {
  if (keyhandler.keys.ArrowLeft) {
    player.x -= 8
  } else if (keyhandler.keys.ArrowRight) {
    player.x += 8
  }
  player.x = clamp(player.x, 0, C_WIDTH - player.width)
  balls.forEach((ball) => {
    ball.update(c)
  })
  balls.forEach((ball) => {
    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i]
      if (ball.hitBlock(block)) {
        block.handleHit(balls, ball)
        break
      }
    }
  })
  blocks = blocks.filter((block) => block.active)
  balls = balls.filter((ball) => ball.active)
  if (blocks.length === 0) {
    if (mode === GameMode.ON) {
      setupBoss()
    } else {
      drawEnabled = false
      gameWon()
    }
  }
  if (balls.length === 0) {
    drawEnabled = false
    gameOver()
  }
}

const startGame = () => {
  keyhandler.start()
  domCanvas.onclick = null
  domCanvas.onfocusout = pause
  mode = GameMode.ON
  drawEnabled = true
  gameEventId = setInterval(() => {
    update()
    draw()
  }, 1000 / FPS)
}
