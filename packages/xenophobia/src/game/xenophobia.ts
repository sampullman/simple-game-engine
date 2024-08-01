import { enemyObjList, xWanderMax } from './enemies'

import {
  setupEditor,
  editMouseMove,
  editMouseClick,
  editMouseUp,
  editMouseDown,
  stopCustom,
} from './editor'
import { playSound, Button, ImageButton, clearEntities } from './objects'

import { gameState, GameMode } from './state'
import { ILevel, levels, worlds } from './levels'
import {
  findPos,
  textSize,
  keyhandler,
  RenderContext,
} from '@sampullman/simple-game-engine'
// import { initHighScores } from './high_scores.js';
import { loadSprites } from './sprites'
import { IButton } from './i-objects'

const { sprites, sounds } = gameState

// let csrftoken;

const C_WIDTH = 480
const C_HEIGHT = 560

const BOUNDARY = C_HEIGHT - 200

const FPS = 30
let c: RenderContext
let saved = 1 | 0
let paused = false
let error = ''

let worldInd = 0
let levelInd = 0
let world: ILevel[] | undefined

let xWander = 0
const xWanderMin = -10
let xWanderSpeed = 0.2

/*
function highScorePosted(response) {
  // eslint-disable-line
  const rankText = `Rank: ${response.rank}`
  const s = textSize(rankText, c.font)
  c.fillText(rankText, C_WIDTH / 2 - s[0] / 2, C_HEIGHT / 2 + 160)
}

function setCookie(key, value, expire) {
  const exp = expire || new Date(2022, 1, 1);
}
*/

function getStoredNumber(key: string, defaultNum?: number): number {
  const def = defaultNum ?? 0
  const str = localStorage.getItem(key) ?? def.toString()
  const num = parseInt(str)
  return isNaN(num) ? def : num
}

function setStoredNumber(key: string, num: number) {
  localStorage.setItem(key, num.toString())
}

function save() {
  saved = 1
  setStoredNumber('saved', 1)
  setStoredNumber('world', worldInd)
  setStoredNumber('level', levelInd)
  setStoredNumber('score', gameState.score)
  setStoredNumber('lives', gameState.player.lives.length)
  // alert(worldInd+' '+levelInd+' '+score+' '+lives);
}

function load() {
  if (saved) {
    worldInd = getStoredNumber('world')
    levelInd = getStoredNumber('level')
    gameState.score = getStoredNumber('score')
    const lives = getStoredNumber('lives')
    gameState.player?.setupLives(c, lives)
  }
}

function setupGame() {
  world = worlds[worldInd]
  gameState.level = world[levelInd]
  gameState.attackTimer = gameState.level.attackFreq()
  gameState.level.load(c)
}

function drawButtons() {
  gameState.buttons.forEach((b) => {
    b.draw(c)
  })
}

function drawEnemyScores() {
  if (sprites.stars) {
    sprites.stars.draw(c)
  }
  let curY = C_HEIGHT / 2 + 60
  let curX = 50
  c.fillStyle = '#636171'
  c.fillRect(0, curY - 20, C_WIDTH, C_HEIGHT - (curY - 20))
  c.fillStyle = '#000'
  c.font = '22px Arial'
  for (let i = 0; i < enemyObjList.length; i += 1) {
    const e = enemyObjList[i]
    if (i === 4) {
      curX += C_WIDTH / 2 - 30
      curY = C_HEIGHT / 2 + 60
    }
    let h = 0
    if (e && e.sprite.loaded) {
      e.sprite.draw(c, curX, curY)
      h = e.sprite.height
      c.fillText(
        ` = ${enemyObjList[i].score}`,
        curX + e.sprite.width + 5,
        curY + (h + 20) / 2,
      )
    }
    curY += h + 20
  }
  drawButtons()
}

function display(id: string, value: string) {
  const node = document.getElementById(id)
  if (node !== null) {
    node.style.display = value
  }
}

function handlers(canvas: HTMLElement) {
  const mouseDown = (e: MouseEvent) => {
    const canvasPos = findPos(canvas)
    if (canvasPos) {
      const x = e.pageX - canvasPos.x
      const y = e.pageY - canvasPos.y
      if (gameState.mode === GameMode.EDIT) {
        editMouseDown(c, x, y)
      }
    }
  }

  const mouseUp = (e: MouseEvent) => {
    const canvasPos = findPos(canvas)
    if (canvasPos) {
      const x = e.pageX - canvasPos.x
      const y = e.pageY - canvasPos.y
      if (gameState.mode === GameMode.EDIT) {
        editMouseUp(c, x, y)
      }
    }
  }

  const mouseMove = (e: MouseEvent) => {
    const canvasPos = findPos(canvas)
    if (canvasPos) {
      const x = e.pageX - canvasPos.x
      const y = e.pageY - canvasPos.y
      gameState.buttons = gameState.buttons.filter((b) => {
        if (!b.active) {
          return false
        }
        b.hover(x, y)
        b.draw(c)
        return true
      })
      if (gameState.mode === GameMode.EDIT) {
        editMouseMove(c, x, y)
      }
    }
  }

  const mouseClick = (e: MouseEvent) => {
    const canvasPos = findPos(canvas)
    if (canvasPos) {
      const x = e.pageX - canvasPos.x
      const y = e.pageY - canvasPos.y
      gameState.buttons.forEach((b) => {
        b.click(x, y)
      })
      gameState.buttons = gameState.buttons.filter((b) => b.active)
      if (gameState.mode === GameMode.EDIT) {
        editMouseClick(x, y)
      }
    }
  }

  return { mouseDown, mouseUp, mouseMove, mouseClick }
}

function debug(msg: string) {
  c.font = '16px Arial'
  c.fillText(msg, 0, C_HEIGHT / 1.5)
}

export function startGame() {
  // document.getElementById('canvas').focusout(pause);
  if (!paused) {
    if (gameState.eventId) {
      clearInterval(gameState.eventId)
    }
    gameState.eventId = setInterval(() => {
      update()
    }, 1000 / FPS)
  }
}

function restartGame() {
  gameState.isOver = false
  gameState.score = 0
  levelInd = 0
  worldInd = 0
  gameState.enemySpawnCount = 0
  gameState.player.numMissiles = 2
  gameState.player.setupLives(c, 3)
  startLevel()
}

function continueGame() {
  gameState.isOver = false
  load()
  startLevel()
}

function gameOver(won: boolean) {
  clearInterval(gameState.eventId)
  if (gameState.mode === GameMode.EDIT) {
    stopCustom(c)
    return
  }
  c.fillStyle = '#000'
  c.font = '30px Arial Black'
  let s1
  if (won) {
    s1 = textSize('You Win!', c.font)
    c.fillText('You Win!', C_WIDTH / 2 - s1[0] / 2, C_HEIGHT / 2 + 20)
  } else {
    s1 = textSize('Game Over!', c.font)
    c.fillText('Game Over!', C_WIDTH / 2 - s1[0] / 2, C_HEIGHT / 2 + 20)
  }
  c.font = '24px Arial'
  let s2 = textSize('Restart Game', c.font)
  const b1 = Button(
    'Restart Game',
    C_WIDTH / 2 - (s2[0] + 15),
    C_HEIGHT / 2 + 20 + s2[1],
    s2,
  )
  s2 = textSize('Restart Level', c.font)
  const b2 = Button('Replay Level', C_WIDTH / 2 + 15, C_HEIGHT / 2 + 20 + s2[1], s2)
  s1 = textSize('Submit High Score', c.font)
  c.fillText('Submit High Score', C_WIDTH / 2 - s1[0] / 2, C_HEIGHT / 2 + 125)
  b1.setClickListener(() => {
    display('#submit_highscore', 'none')
    b1.active = false
    b2.active = false
    restartGame()
  })
  b2.setClickListener(() => {
    display('#submit_highscore', 'none')
    b2.active = false
    b1.active = false
    continueGame()
  })
  gameState.buttons.push(b1)
  if (!won) gameState.buttons.push(b2)
  drawButtons()
  display('#submit_highscore', 'block')
}

function startLevel() {
  clearEntities()
  setupGame()
  startGame()
}

function levelWon() {
  if (!world) {
    return
  }
  clearInterval(gameState.eventId)
  if (gameState.mode === GameMode.EDIT) {
    stopCustom(c)
    return
  }
  levelInd += 1
  if (levelInd >= world.length) {
    worldInd += 1
    if (worldInd >= worlds.length) {
      gameOver(true)
      return
    }
    levelInd = 0
  }
  startLevel()
  save()
}

export function pause() {
  keyhandler.stop()
  clearInterval(gameState.eventId)
  paused = true
}

export function resume() {
  keyhandler.start()
  paused = false
  startGame()
}

function showStart() {
  keyhandler.start()
  c.fillStyle = '#636171'
  c.fillRect(0, 0, C_WIDTH, C_HEIGHT)
  c.fillStyle = '#000'
  c.font = '56px Verdana'
  const s = textSize('Xenophobia', c.font)
  c.fillText('Xenophobia', C_WIDTH / 2 - s[0] / 2, C_HEIGHT / 6)
  c.font = '24px Arial'
  let s1 = textSize('Destroy the aliens, because', c.font)
  c.fillText('Destroy the aliens, because', C_WIDTH / 2 - s1[0] / 2, C_HEIGHT / 4)
  let s2 = textSize('they are different from you.', c.font)
  c.fillText(
    'they are different from you.',
    C_WIDTH / 2 - s2[0] / 2,
    C_HEIGHT / 4 + s1[1],
  )
  c.font = '18px Arial Black'
  s1 = textSize('NEW GAME', c.font)
  let b1: IButton
  let b2: IButton
  const b3 = Button(
    'LEVEL EDITOR',
    C_WIDTH / 2 - s2[0] / 2,
    C_HEIGHT / 3 + s1[1] + 45,
    s2,
    c.font,
  )
  if (saved) {
    b1 = Button('NEW GAME', C_WIDTH / 2 - (s1[0] + 15), C_HEIGHT / 3 + 15, s1, c.font)
    s2 = textSize('CONTINUE', c.font)
    b2 = Button('CONTINUE', C_WIDTH / 2 + 15, C_HEIGHT / 3 + 15, s2, c.font)
    b2.setClickListener(() => {
      playSound(sounds.ambient)
      gameState.mode = GameMode.SINGLE
      continueGame()
      b2.active = false
      b1.active = false
      b3.active = false
    })
    gameState.buttons.push(b2)
  } else {
    b1 = Button('NEW GAME', C_WIDTH / 2 - s1[0] / 2, C_HEIGHT / 3, s1, c.font)
  }
  gameState.buttons.push(b1)
  b1.setClickListener(() => {
    playSound(sounds.ambient)
    if (b2) {
      b2.active = false
    }
    b3.active = false
    b1.active = false
    gameState.mode = GameMode.SINGLE
    restartGame()
  })
  s2 = textSize('LEVEL EDITOR', c.font)
  gameState.buttons.push(b3)
  b3.setClickListener(() => {
    playSound(sounds.ambient)
    b1.active = false
    if (b2) {
      b2.active = false
    }
    b3.active = false
    gameState.mode = GameMode.EDIT
    levelEditor()
  })
}

function draw() {
  c.fillStyle = '#636171'
  c.fillRect(0, 0, C_WIDTH, C_HEIGHT)
  sprites.stars.draw(c)
  drawButtons()
  gameState.player?.draw(c)
  c.beginPath()
  c.moveTo(0, BOUNDARY)
  c.lineTo(C_WIDTH, BOUNDARY)
  c.lineWidth = 1
  c.strokeStyle = '#999'
  c.stroke()
  gameState.player.shots.forEach((shot) => {
    shot.draw(c)
  })
  gameState.powerups.forEach((p) => {
    p.draw(c)
  })
  gameState.enemyShots.forEach((shot) => {
    shot.draw(c)
  })
  gameState.enemies.forEach((enemy) => {
    enemy.draw(c)
  })
  gameState.player.lives.forEach((life) => {
    life.draw(c)
  })
  gameState.explosions.forEach((exp) => {
    exp.draw(c)
  })
  gameState.mines.forEach((mine) => {
    mine.draw(c)
  })
  c.font = '18px Arial'
  c.fillStyle = '#000'
  c.fillText(`Level ${worldInd + 1}-${levelInd + 1}`, 10, 18)
  c.fillText(`Missiles: ${gameState.player.numMissiles}`, C_WIDTH / 3, 18)
  c.fillText(`Score: ${gameState.score}`, C_WIDTH / 1.7, 18)
  debug(error)
  if (gameState.isOver) {
    gameState.gameOverTimer -= 1
    if (gameState.gameOverTimer <= 0) {
      gameOver(false)
    }
  }
}

const update = () => {
  gameState.player.update()
  // TODO -- combine shot iterations
  gameState.player.shots.forEach((shot) => {
    shot.update()
    for (let i = 0; i < gameState.enemies.length; i += 1) {
      shot.hitEntity(gameState.enemies[i])
    }
    gameState.mines.forEach((mine) => {
      shot.hitEntity(mine)
    })
  })
  gameState.player.lives.forEach((life) => {
    life.update()
  })
  gameState.player.shots = gameState.player.shots.filter((shot) => shot.active)
  gameState.powerups = gameState.powerups.filter((p) => {
    p.update()
    return p.active
  })
  gameState.enemyShots = gameState.enemyShots.filter((shot) => {
    shot.update()
    shot.hitEntity(gameState.player)
    return shot.active
  })
  gameState.enemies.forEach((enemy) => {
    enemy.update()
    if (gameState.enemyData.initEnemyCount >= gameState.enemies.length) {
      enemy.wander?.(xWanderSpeed)
    }
  })
  gameState.enemies = gameState.enemies.filter((enemy) => enemy.active)
  gameState.mines = gameState.mines.filter((mine) => {
    mine.update()
    mine.hitEntity(gameState.player)
    return mine.active
  })
  xWander += xWanderSpeed
  if (xWander > xWanderMax || xWander < xWanderMin) {
    xWanderSpeed *= -1
  }
  gameState.explosions = gameState.explosions.filter((exp) => {
    exp.update()
    return exp.active
  })
  sprites.stars.update(c)
  if (gameState.attackTimer <= 0 && gameState.activeEnemies.length > 0) {
    const e =
      gameState.activeEnemies[Math.floor(Math.random() * gameState.activeEnemies.length)]
    e.attack()
    gameState.enemyData.numAttacks += 1
    const freq = gameState.level?.attackFreq()
    if (freq !== undefined) {
      gameState.attackTimer = Math.random() * freq + freq / 8
    }
  }
  if (gameState.enemies.length === 0) {
    levelWon()
    return
  }
  error = gameState.activeEnemies.length.toString()
  gameState.shotTimer += 1
  gameState.attackTimer -= 1
  draw()
}

export function loadGame(canvasId?: string) {
  const canvas = document.getElementById(canvasId ?? 'canvas') as HTMLCanvasElement
  const ctx = canvas?.getContext('2d', { alpha: false })
  if (!ctx) {
    throw new Error('Failed to create rendering context')
  }
  c = ctx as RenderContext
  c.width = C_WIDTH
  c.height = C_HEIGHT
  gameState.c = c
  c.boundary = BOUNDARY
  levels.init(c)
  gameState.player.init(c)
  const { mouseDown, mouseUp, mouseMove, mouseClick } = handlers(canvas)
  canvas.onmousemove = mouseMove
  canvas.onmousedown = mouseDown
  canvas.onmouseup = mouseUp
  canvas.onclick = mouseClick
  // csrftoken = getCookie('csrftoken');
  // setupAjax();
  // initHighScores(highScorePosted);
  saved = getStoredNumber('saved')
  loadSprites(c, gameState.player, drawEnemyScores, drawButtons)
  canvas.focus()
  showStart()
  const userPause = ImageButton(c, sprites.pause, sprites.play, C_WIDTH - 28, 4, 24, 24)
  userPause.setClickListener(() => (paused ? resume() : pause()))
  gameState.buttons.push(userPause)
  const toggleSound = ImageButton(
    c,
    sprites.soundOff,
    sprites.soundOn,
    C_WIDTH - 52,
    6,
    20,
    20,
  )
  toggleSound.setClickListener(() => {
    gameState.soundOn = !gameState.soundOn
    if (!gameState.soundOn) {
      sounds.ambient.stop()
    } else {
      sounds.ambient.play()
    }
  })
  gameState.buttons.push(toggleSound)
}

const levelEditor = () => {
  gameState.isOver = false
  clearEntities()
  gameState.player.visible = false
  gameState.buttons = gameState.buttons.filter((b) => b.active)
  setupEditor(c, draw, FPS, startGame, showStart)
}
