import { clearEntities, Button, Slider } from './objects'
import {
  entityCollision,
  IBounded,
  keyhandler,
  RenderContext,
  textSize,
} from '@sampullman/simple-game-engine'
import { enemyObjList } from './enemies'
import { RandomVerticalInit } from './paths'
import { gameState, GameMode } from './state'
import { levels } from './levels'
import { EnemyMode, IButton, IEnemy, IEnemyInit, ISlider } from './i-objects'

type IUnitFn = () => void

let editorEnemies: IEnemy[] = []
let staticEnemies: IEnemy[] = []
let selectedEnemies: IEnemy[] = []
let sliders: ISlider[] = []
let editPlay = false
let showHelp = true
let showEnemyOptions = false
let dragging = false
let activating: IEnemy | undefined
let activeSlider: ISlider | undefined
let togglePlay: IButton
let mainButton: IButton
let showHelpButton: IButton
let healthSlider: ISlider
let shotFreqSlider: ISlider
let speedSlider: ISlider
const editorPlayerLives = 3
const editorPlayerMissiles = 2
let playerLivesSlider: ISlider
let playerMissilesSlider: ISlider
let attackFreqSlider: ISlider
let prevX = 0
let prevY = 0
let drawFn: IUnitFn
let startGame: IUnitFn
let FPS: number

const selRegion = {
  active: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  x1: 0,
  x2: 0,
  y1: 0,
  y2: 0,
}

function editorUpdate(c: RenderContext) {
  selectedEnemies = selectedEnemies.filter((e) => e.active)
  // updateEnemySliders();
  gameState.enemies = gameState.enemies.filter((e) => e.active)
  editorEnemies = editorEnemies.filter((e) => {
    if (e.x + e.width < 0) {
      e.x = 0
    } else if (e.x > c.width) {
      e.x = c.width - e.width
    }
    if (e.y < 0) {
      e.y = 0
    } else if (e.y > c.height) {
      e.y = c.height - e.height
    }
    return e.active
  })
}

function editorDraw(c: RenderContext) {
  drawFn()
  if (selRegion.active) {
    c.strokeStyle = '#DDD'
    c.strokeRect(selRegion.x, selRegion.y, selRegion.width, selRegion.height)
  } else if (activating) {
    c.strokeStyle = '#0F0'
    c.beginPath()
    c.moveTo(activating.x + activating.width / 2, activating.y + activating.height / 2)
    c.lineTo(prevX, prevY)
    c.closePath()
    c.stroke()
  }
  if (showHelp) {
    c.font = '14px Arial'
    c.fillText(
      '-Click and drag from a template below to create a new enemy.',
      10,
      c.boundary - 160,
    )
    c.fillText(
      '-Shift click or click and drag to select multiple enemies.',
      10,
      c.boundary - 140,
    )
    c.fillText(
      "-Type 'c' to copy an enemy or 'shift-c' to fill a row with copies.",
      10,
      c.boundary - 120,
    )
    c.fillText('-Hit the delete key to remove selected enemies.', 10, c.boundary - 100)
    c.fillText("-Type 'a' to set selected enemies as attackers.", 10, c.boundary - 80)
    c.fillText(
      '-Control click and drag from one enemy to another to make the',
      10,
      c.boundary - 60,
    )
    c.fillText('second enemy attack after the first is destroyed.', 30, c.boundary - 40)
    c.fillText(
      '-Use sliders to modify values. Values are copied along with enemies.',
      10,
      c.boundary - 20,
    )
  }
  sliders.forEach((slider) => {
    slider.draw(c)
  })
}

function stopCustom(c: RenderContext) {
  clearInterval(gameState.eventId)
  editPlay = false
  gameState.isOver = false
  clearEntities()
  gameState.player.lives = []
  gameState.explosions.length = 0
  gameState.buttons = [mainButton, togglePlay, showHelpButton]
  togglePlay.text = 'PLAY'
  togglePlay.setClickListener(() => {
    playCustom(c)
  })
  editorEnemies.forEach((e) => {
    e.x = e.editX ?? 0
    e.y = e.editY ?? 0
    e.health = e.editHealth ?? 0
    e.active = true
  })
  gameState.enemies = staticEnemies
    .slice(0, staticEnemies.length)
    .concat(editorEnemies.slice(0, editorEnemies.length))
  gameState.player.visible = false
  keyhandler.stop()
  editorDraw(c)
}

const playCustom = (c: RenderContext) => {
  editPlay = true
  gameState.level = levels.custom
  gameState.level.attackFreq = () => FPS * attackFreqSlider.val
  gameState.attackTimer = gameState.level.attackFreq()
  gameState.player.setupLives(c, playerLivesSlider.val)
  gameState.enemySpawnCount = 0
  gameState.player.numMissiles = Math.round(playerMissilesSlider.val)
  gameState.buttons = [togglePlay]
  togglePlay.text = 'STOP'
  togglePlay.setClickListener(() => {
    stopCustom(c)
  })
  gameState.enemies = editorEnemies.slice(0, editorEnemies.length)
  gameState.enemies.forEach((e) => {
    e.editX = e.x
    e.editY = e.y
    e.editHealth = e.health
    e.initPath = e.initPathFn?.(c, e).instantiate()
    e.initPath?.init?.()
    e.mode = EnemyMode.INIT
  })
  gameState.level.load(c)
  gameState.player.visible = true
  startGame()
}

function teardownEditor() {
  gameState.buttons = []
  gameState.enemies.length = 0
  keyhandler.fns.Delete = undefined
  keyhandler.fns.KeyC = undefined
  keyhandler.fns.KeyA = undefined
  gameState.mode = GameMode.MENU
}

function staticEnemyClick(enemyObj: IEnemyInit, enemy: IEnemy) {
  return () => {
    const e = enemyObj.instantiate(
      enemy.x,
      enemy.y,
      enemyObj.sprite.width,
      enemyObj.sprite.height,
      30,
      null,
    )
    e.initPathFn = RandomVerticalInit
    e.shootFn = enemyObj.shootFn
    e.hoverActionFn = enemyObj.hoverActionFn
    e.AttackPathFn = enemyObj.AttackPath
    e.wanderFn = enemyObj.wanderFn
    e.shotFreq = 30
    e.type = enemyObj.type
    return e
  }
}
function deleteSelected(c: RenderContext) {
  selectedEnemies.forEach((e) => {
    e.active = false
  })
  editorUpdate(c)
  editorDraw(c)
}

function updateEnemySliders(c: RenderContext) {
  let show = true
  if (selectedEnemies.length > 0) {
    const id = selectedEnemies[0].type
    selectedEnemies.forEach((e) => {
      show = show && id === e.type
    })
  }
  if (selectedEnemies.length === 0 || !show) {
    sliders = sliders.slice(0, 3)
    showEnemyOptions = false
    return
  }
  if (!showEnemyOptions) {
    showEnemyOptions = true
    sliders.push(healthSlider)
    sliders.push(shotFreqSlider)
    sliders.push(speedSlider)
  }
  const e = selectedEnemies[0]
  const sliderWidth = 75
  const xPos = e.x + (e.x < c.width - 120 ? e.width + 10 : -1 * sliderWidth - 5)
  const yPos = e.y + e.height
  healthSlider.setToVal(e.health)
  healthSlider.setPos(xPos, yPos)
  shotFreqSlider.setToVal(e.shotFreq / FPS)
  shotFreqSlider.setPos(xPos, yPos + 40)
  speedSlider.setToVal(e.speed)
  speedSlider.setPos(xPos, yPos + 80)
}

function clickHit(x: number, y: number, E: IBounded) {
  return x > E.x && x < E.x + E.width && y > E.y && y < E.y + E.height
}

function clearSelectedEnemies() {
  selectedEnemies.forEach((e) => {
    e.squared = false
  })
  selectedEnemies = []
}

function pushNewSelectedEnemy(newE: IEnemy) {
  editorEnemies.push(newE)
  gameState.enemies.push(newE)
  selectedEnemies.push(newE)
  newE.squared = true
}

function activateEnemies(c: RenderContext) {
  let allActive = true
  selectedEnemies.forEach((e) => {
    allActive = allActive && !!e.editorActive
  })
  selectedEnemies.forEach((e) => {
    if (allActive) {
      e.editorActive = false
    } else if (gameState.editorActiveEnemies.indexOf(e) === -1) {
      gameState.editorActiveEnemies.push(e)
      e.editorActive = true
    }
  })
  gameState.editorActiveEnemies = gameState.editorActiveEnemies.filter(
    (e) => e.editorActive,
  )
  editorDraw(c)
}

function copyEnemy(c: RenderContext) {
  if (selectedEnemies.length === 0) {
    return
  }
  const e = selectedEnemies[selectedEnemies.length - 1]
  const xDiff = e.width + 15
  let xPos = e.x - xDiff
  let newE
  if (keyhandler.Shift()) {
    selectedEnemies = [e]
    while (xPos > 0) {
      newE = e.clone(xPos, e.y)
      pushNewSelectedEnemy(newE)
      xPos -= xDiff
    }
    xPos = e.x + xDiff
    while (xPos < c.width - e.width) {
      newE = e.clone(xPos, e.y)
      pushNewSelectedEnemy(newE)
      xPos += xDiff
    }
  } else {
    const newX = e.x > c.width ? e.x - e.width / 2 : e.x + e.width / 2
    newE = e.clone(newX, e.y + e.width / 2)
    pushNewSelectedEnemy(newE)
  }
  editorDraw(c)
}

function editMouseDown(c: RenderContext, x: number, y: number) {
  if (editPlay) {
    return
  }
  prevX = x
  prevY = y
  let i
  let e
  for (i = 0; i < sliders.length; i += 1) {
    if (sliders[i].hit(x, y)) {
      activeSlider = sliders[i]
      dragging = true
      editorDraw(c)
      return
    }
  }
  for (i = editorEnemies.length - 1; i >= 0; i -= 1) {
    e = editorEnemies[i]
    if (clickHit(x, y, e)) {
      if (keyhandler.Control()) {
        activating = e
      } else if (!e.squared) {
        e.squared = true
        if (keyhandler.Shift()) {
          selectedEnemies.push(e)
        } else {
          clearSelectedEnemies()
          selectedEnemies = [e]
        }
      } else if (keyhandler.Shift()) {
        selectedEnemies.splice(selectedEnemies.indexOf(e), 1)
        e.squared = false
      }
      dragging = true
      updateEnemySliders(c)
      editorDraw(c)
      return
    }
  }
  for (i = 0; i < staticEnemies.length; i += 1) {
    e = staticEnemies[i]
    if (clickHit(x, y, e)) {
      clearSelectedEnemies()
      const clickedEnemy = e.click?.()
      if (clickedEnemy) {
        clickedEnemy.x = x
        clickedEnemy.y = y
        dragging = true
        pushNewSelectedEnemy(clickedEnemy)
      }
      updateEnemySliders(c)
      editorDraw(c)
      return
    }
  }
  if (!keyhandler.Shift()) clearSelectedEnemies()
  selRegion.active = true
  selRegion.x1 = x
  selRegion.y1 = y
  selRegion.width = 0
  selRegion.height = 0
  updateEnemySliders(c)
  editorUpdate(c)
  editorDraw(c)
}

function editMouseUp(c: RenderContext, x: number, y: number) {
  if (editPlay) {
    return
  }
  if (activeSlider) {
    activeSlider.clicked = false
  }
  activeSlider = undefined
  if (activating) {
    let parentChosen = false
    editorEnemies.forEach((e) => {
      if (clickHit(x, y, e) && e !== activating) {
        let cycle = false
        let { parent } = e
        parentChosen = true
        while (parent) {
          if (parent === activating) {
            cycle = true
            break
          }
          parent = parent.parent
        }
        if (!cycle && activating) {
          activating.parent = e
        }
      }
    })
    if (!parentChosen) activating.parent = undefined
    activating = undefined
  }
  editorUpdate(c)
  selRegion.active = false
  dragging = false
  editorDraw(c)
}

function editMouseMove(c: RenderContext, x: number, y: number) {
  if (editPlay) return
  if (dragging && !activating) {
    if (activeSlider) {
      activeSlider.slide(x - prevX, y - prevY)
    } else {
      selectedEnemies.forEach((e) => {
        const xDiff = x - prevX
        const yDiff = y - prevY
        if (showEnemyOptions) {
          healthSlider.move(xDiff, yDiff)
          shotFreqSlider.move(xDiff, yDiff)
          speedSlider.move(xDiff, yDiff)
          updateEnemySliders(c)
        }
        e.x += xDiff
        e.y += yDiff
      })
    }
  } else if (selRegion.active) {
    selRegion.x2 = x
    selRegion.y2 = y
    selRegion.x = Math.min(selRegion.x1, selRegion.x2)
    selRegion.y = Math.min(selRegion.y1, selRegion.y2)
    selRegion.width = Math.abs(selRegion.x1 - selRegion.x2)
    selRegion.height = Math.abs(selRegion.y1 - selRegion.y2)
    selectedEnemies = []
    editorEnemies.forEach((e) => {
      if (entityCollision(selRegion, e)) {
        selectedEnemies.push(e)
        e.squared = true
      } else {
        e.squared = false
      }
    })
  }
  prevX = x
  prevY = y
  editorUpdate(c)
  editorDraw(c)
}

function editMouseClick(_x: number, _y: number) {}

// TODO -- Separate into one time setup and return setup
function setupEditor(
  c: RenderContext,
  draw: IUnitFn,
  framesPerSecond: number,
  startFn: IUnitFn,
  showStart: IUnitFn,
) {
  startGame = startFn
  FPS = framesPerSecond
  drawFn = draw
  keyhandler.fns.del = () => {
    deleteSelected(c)
  }
  keyhandler.fns.c = () => {
    copyEnemy(c)
  }
  keyhandler.fns.a = () => {
    activateEnemies(c)
  }
  staticEnemies = []
  let x = 0
  const y = c.boundary + 10
  for (let i = 0; i < enemyObjList.length; i += 1) {
    const obj = enemyObjList[i]
    const e = obj.instantiate(
      x,
      y,
      obj.sprite.width,
      obj.sprite.height,
      0,
      RandomVerticalInit,
    )
    e.click = staticEnemyClick(obj, e)
    staticEnemies.push(e)
    x += e.sprite.width + 10
  }
  gameState.enemies = staticEnemies
    .slice(0, staticEnemies.length)
    .concat(editorEnemies.slice(0, editorEnemies.length))
  c.font = '16px Arial Black'
  const s1 = textSize('MAIN', c.font)
  mainButton = Button('MAIN', c.width - (s1[0] + 10), c.height - (s1[1] + 15), s1, c.font)
  mainButton.setClickListener(() => {
    teardownEditor()
    showStart()
  })
  const s2 = textSize('PLAY', c.font)
  togglePlay = Button(
    'PLAY',
    c.width - (s2[0] + 10),
    c.height - (s1[1] + s2[1] + 30),
    s2,
    c.font,
  )
  togglePlay.setClickListener(() => {
    playCustom(c)
  })
  c.font = '14px Arial Black'
  const s3 = textSize('HIDE', c.font)
  showHelpButton = Button(
    'HIDE',
    c.width - (s3[0] + 10),
    c.boundary - (s3[1] + 50),
    s3,
    c.font,
  )
  showHelpButton.setClickListener(() => {
    showHelpButton.text = showHelpButton.text === 'HIDE' ? 'HELP' : 'HIDE'
    showHelp = !showHelp
    editorDraw(c)
  })
  gameState.buttons = [mainButton, togglePlay, showHelpButton]
  attackFreqSlider = Slider(
    c,
    'Time between Attacks',
    'sec.',
    20,
    c.height - 35,
    110,
    14,
    0,
    3,
    0,
    true,
    undefined,
  )
  attackFreqSlider.setToVal(1.5)
  playerLivesSlider = Slider(
    c,
    'Player Health',
    '',
    160,
    c.height - 35,
    80,
    14,
    1,
    10,
    1,
    true,
    undefined,
  )
  playerLivesSlider.setToVal(editorPlayerLives)
  playerMissilesSlider = Slider(
    c,
    'Player Missiles',
    '',
    260,
    c.height - 35,
    90,
    14,
    0,
    20,
    1,
    true,
    undefined,
  )
  playerMissilesSlider.setToVal(editorPlayerMissiles)
  sliders = [attackFreqSlider, playerLivesSlider, playerMissilesSlider]
  const healthUpdate = (val: number) => {
    selectedEnemies.forEach((enemy) => {
      enemy.health = Math.round(val)
    })
  }
  const shotFreqUpdate = (val: number) => {
    selectedEnemies.forEach((enemy) => {
      enemy.shotFreq = val * FPS
      if (enemy.hoverActionFn) {
        enemy.hoverAction = enemy.hoverActionFn(enemy, enemy.shotFreq)
      }
      enemy.shoot = enemy.shootFn?.(enemy, enemy.shotFreq)
    })
  }
  const speedUpdate = (val: number) => {
    selectedEnemies.forEach((enemy) => {
      enemy.speed = val
    })
  }
  const sliderWidth = 75
  healthSlider = Slider(
    c,
    'Health',
    '',
    0,
    0,
    sliderWidth,
    12,
    1,
    10,
    1,
    true,
    healthUpdate,
  )
  shotFreqSlider = Slider(
    c,
    'Shot Freq.',
    'sec.',
    0,
    0,
    sliderWidth,
    12,
    0,
    3,
    0,
    true,
    shotFreqUpdate,
  )
  speedSlider = Slider(
    c,
    'Speed',
    '',
    0,
    0,
    sliderWidth,
    12,
    0.1,
    3,
    0.1,
    true,
    speedUpdate,
  )
  editorDraw(c)
}

export {
  setupEditor,
  editMouseMove,
  editMouseClick,
  editMouseUp,
  editMouseDown,
  stopCustom,
}
