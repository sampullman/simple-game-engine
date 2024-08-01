import {
  FollowPlayerPath,
  AvoidPlayerPath,
  StandardAttackPath,
  SweepAttackPath,
} from './paths'
import { Enemy, playSound, Laser, Mine, Shot } from './objects'
import { gameState } from './state'
import { arrayRand, ISprite } from '@sampullman/simple-game-engine'
import { EnemyMode, IEnemy, IEnemyInit, IInitPathFn, IShootFnInit } from './i-objects'

const { sprites, sounds } = gameState

export const xWanderMax = 10

function initEnemy(
  sprite: ISprite,
  x: number,
  y: number,
  w: number,
  h: number,
  score: number,
  health: number,
  type: number,
  InitPathFn: IInitPathFn | null,
  AttackPath: IInitPathFn | undefined,
  shootFn: IShootFnInit,
  shotFreq: number,
  speed: number | undefined,
  parent: IEnemy | undefined,
) {
  const enemy = Enemy({
    type,
    sprite,
    x,
    y,
    width: w,
    height: h,
    parent,
    score,
    speed,
    health,
  })
  enemy.AttackPath = AttackPath?.(gameState.c, enemy)
  enemy.shoot = shootFn(enemy, shotFreq)
  if (InitPathFn) {
    enemy.initPath = InitPathFn(gameState.c, enemy).instantiate()
  }
  return enemy
}

export const Enemy1Obj: IEnemyInit = {
  sprite: {} as ISprite,
  type: 1,
  score: 10,
  health: 1,
  shootFn() {
    return () => {}
  },
  instantiate(x, y, w, h, shotFreq, InitPathFn, speed, parent) {
    return initEnemy(
      Enemy1Obj.sprite,
      x,
      y,
      w,
      h,
      Enemy1Obj.score,
      Enemy1Obj.health,
      Enemy1Obj.type,
      InitPathFn,
      Enemy1Obj.AttackPath,
      Enemy1Obj.shootFn,
      shotFreq,
      speed,
      parent,
    )
  },
  AttackPath: StandardAttackPath,
}

export const Enemy2Obj: IEnemyInit = {
  sprite: {} as ISprite,
  type: 2,
  score: 20,
  health: 1,
  shootFn(E: IEnemy, freq: number) {
    let shotTimer = Math.random() * freq
    return () => {
      shotTimer -= 1
      if (shotTimer <= 0) {
        gameState.enemyShots.push(
          Shot({
            sprites: sprites.enemyShot,
            x: E.x + E.width / 2,
            y: E.y + E.height,
            speed: 10,
          }),
        )
        shotTimer = freq / 2 + Math.random() * (freq / 2)
        playSound(sounds.enemyShot)
      }
    }
  },
  instantiate(x, y, w, h, shotFreq, InitPathFn, speed, parent) {
    return initEnemy(
      Enemy2Obj.sprite,
      x,
      y,
      w,
      h,
      Enemy2Obj.score,
      Enemy2Obj.health,
      Enemy2Obj.type,
      InitPathFn,
      Enemy2Obj.AttackPath,
      Enemy2Obj.shootFn,
      shotFreq,
      speed,
      parent,
    )
  },
  AttackPath: StandardAttackPath,
}

export const Enemy3Obj: IEnemyInit = {
  sprite: {} as ISprite,
  type: 3,
  score: 50,
  health: 1,
  shootFn(E: IEnemy, freq: number) {
    let shotTimer = freq
    let left = true
    return () => {
      shotTimer -= 1
      if (shotTimer <= 0) {
        gameState.enemyShots.push(
          Shot({
            sprites: sprites.enemyShot,
            x: E.x + E.width / (left ? 4 : 1.75),
            y: E.y + E.height,
            speed: 10,
          }),
        )
        left = !left
        shotTimer = freq / 2 + Math.random() * (freq / 2)
        playSound(sounds.enemyShot)
      }
    }
  },
  instantiate(x, y, w, h, shotFreq, InitPathFn, speed, parent) {
    return initEnemy(
      Enemy3Obj.sprite,
      x,
      y,
      w,
      h,
      Enemy3Obj.score,
      Enemy3Obj.health,
      Enemy3Obj.type,
      InitPathFn,
      Enemy3Obj.AttackPath,
      Enemy3Obj.shootFn,
      shotFreq,
      speed,
      parent,
    )
  },
  AttackPath: StandardAttackPath,
}

export const Enemy4Obj: IEnemyInit = {
  sprite: {} as ISprite,
  type: 4,
  score: 100,
  health: 1,
  shootFn(E: IEnemy, freq: number) {
    let shotTimer = Math.random() * freq
    return () => {
      shotTimer -= 1
      if (shotTimer <= 0) {
        gameState.enemyShots.push(
          Shot({
            sprites: sprites.enemyShot,
            x: E.x + E.width / 4,
            y: E.y + E.height,
            speed: 10,
          }),
        )
        gameState.enemyShots.push(
          Shot({
            sprites: sprites.enemyShot,
            x: E.x + E.width / 1.75,
            y: E.y + E.height,
            speed: 10,
          }),
        )
        shotTimer = Math.random() * freq
        playSound(sounds.enemyShot)
      }
    }
  },
  instantiate(x, y, w, h, shotFreq, InitPathFn, _speed, parent, child) {
    const enemy = initEnemy(
      Enemy4Obj.sprite,
      x,
      y,
      w,
      h,
      Enemy4Obj.score,
      Enemy4Obj.health,
      Enemy4Obj.type,
      InitPathFn,
      Enemy4Obj.AttackPath,
      Enemy4Obj.shootFn,
      shotFreq,
      1,
      parent,
    )

    if (child) {
      child.parent = enemy
    }
    return enemy
  },
  AttackPath: FollowPlayerPath,
}

export const Enemy5Obj: IEnemyInit = {
  sprite: {} as ISprite,
  type: 5,
  score: 250,
  health: 3,
  shootFn(E: IEnemy, freq: number) {
    const cannonFn = Enemy3Obj.shootFn(E, freq)
    let laserTimer = freq
    return () => {
      cannonFn()
      laserTimer -= 1
      if (laserTimer < 0) {
        gameState.enemyShots.push(Laser(E, E.x + E.width / 2, E.y + E.height - 5))
        laserTimer = Math.random() * freq * 3 + freq
        playSound(sounds.laser)
      }
    }
  },
  notifyEscortsFn(E: IEnemy, escorts: IEnemy[]) {
    escorts.forEach((escort) => {
      escort.relativeEscortX = escort.x - E.x
      escort.relativeEscortY = escort.y - E.y
    })
    return () => {
      escorts.filter((escort) => {
        if (escort.active) {
          escort.attack(E.AttackPath?.clone(escort))
          escort.x = E.x + (escort.relativeEscortX ?? 0)
          escort.y = E.y + (escort.relativeEscortY ?? 0)
          return true
        }
        return false
      })
    }
  },
  instantiate(x, y, w, h, shotFreq, InitPathFn, _speed, _parent, _child, escorts) {
    const enemy = Enemy({
      sprite: Enemy5Obj.sprite,
      x,
      y,
      width: w,
      height: h,
      score: Enemy5Obj.score,
      health: Enemy5Obj.health,
      type: Enemy5Obj.type,
    })
    enemy.AttackPath = Enemy5Obj.AttackPath?.(gameState.c, enemy)
    enemy.shoot = this.shootFn(enemy, shotFreq)
    if (InitPathFn) {
      enemy.initPath = InitPathFn(gameState.c, enemy).instantiate(true)
    }
    if (escorts) {
      enemy.notifyEscorts = Enemy5Obj.notifyEscortsFn?.(enemy, escorts)
    }
    return enemy
  },
  AttackPath: SweepAttackPath,
}

export const Enemy6Obj: IEnemyInit = {
  sprite: {} as ISprite,
  type: 6,
  score: 300,
  health: 2,
  shootFn(E: IEnemy, freq: number) {
    let laserTimer = freq
    return () => {
      laserTimer -= 1
      if (laserTimer < 0) {
        gameState.enemyShots.push(Laser(E, E.x + E.width / 2, E.y + E.height - 5))
        laserTimer = Math.random() * freq + freq
        playSound(sounds.laser)
      }
    }
  },
  hoverActionFn(E, freq) {
    return this.shootFn(E, freq)
  },
  wanderFn(E: IEnemy) {
    return (xWanderSpeed) => {
      let newXWanderSpeed =
        0.5 * xWanderSpeed * ((gameState.c.width / 2 - 20) / xWanderMax)
      if (E.x > gameState.c.width - E.width || E.x < 0) {
        newXWanderSpeed *= -1
      }
      E.x += newXWanderSpeed
    }
  },
  instantiate(x, y, w, h, shotFreq, InitPathFn) {
    const enemy = Enemy({
      sprite: Enemy6Obj.sprite,
      x,
      y,
      width: w,
      height: h,
      score: Enemy6Obj.score,
      health: Enemy6Obj.health,
      type: Enemy6Obj.type,
    })
    enemy.shoot = this.shootFn(enemy, shotFreq)
    if (InitPathFn) {
      enemy.initPath = InitPathFn(gameState.c, enemy).instantiate()
    }
    enemy.wander = Enemy6Obj.wanderFn?.(enemy)
    enemy.hoverAction = Enemy6Obj.hoverActionFn?.(enemy, shotFreq)
    return enemy
  },
}

export const Enemy7Obj: IEnemyInit = {
  sprite: {} as ISprite,
  type: 7,
  score: 200,
  health: 2,
  shootFn(E: IEnemy, freq: number) {
    let timer = Math.random() * freq
    return () => {
      if (
        E.y > gameState.c.boundary &&
        E.x > 0 &&
        E.x < gameState.c.width &&
        !E.path?.done
      ) {
        timer -= 1
        if (timer <= 0) {
          gameState.mines.push(Mine(E.x, E.y))
          if (E.path) {
            E.path.done = true
          }
          timer = Math.random() * freq
        }
      }
    }
  },
  instantiate(x, y, w, h, shotFreq, InitPathFn, speed, parent) {
    return initEnemy(
      Enemy7Obj.sprite,
      x,
      y,
      w,
      h,
      Enemy7Obj.score,
      Enemy7Obj.health,
      Enemy7Obj.type,
      InitPathFn,
      Enemy7Obj.AttackPath,
      Enemy7Obj.shootFn,
      shotFreq,
      speed,
      parent,
    )
  },
  AttackPath: AvoidPlayerPath,
}

export const Enemy8Obj: IEnemyInit = {
  sprite: {} as ISprite,
  type: 8,
  score: 400,
  health: 5,
  shootFn(E: IEnemy, freq: number) {
    let timer = freq / 5
    return () => {
      timer -= 1
      if (timer <= 0) {
        const rand = Math.random()
        const gun = Math.floor(rand * 6)
        if (rand < 0.2) {
          for (let i = 1; i < 6; i += 1) {
            gameState.enemyShots.push(
              Shot({
                sprites: sprites.enemyShot,
                x: E.x + (i * E.width) / 6,
                y: E.y + E.height - 5,
                speed: 10,
              }),
            )
          }
        } else {
          gameState.enemyShots.push(
            Shot({
              sprites: sprites.enemyShot,
              x: E.x + (gun * E.width) / 6,
              y: E.y + E.height - 5,
              speed: 10,
            }),
          )
        }
        playSound(sounds.enemyShot)
        timer = freq / 5 + rand
      }
    }
  },
  instantiate(x, y, w, h, shotFreq, InitPathFn) {
    const enemy = Enemy({
      sprite: Enemy8Obj.sprite,
      x,
      y,
      width: w,
      height: h,
      score: Enemy8Obj.score,
      health: Enemy8Obj.health,
      type: Enemy8Obj.type,
    })
    enemy.AttackPath = Enemy8Obj.AttackPath?.(gameState.c, enemy)
    enemy.shoot = this.shootFn(enemy, shotFreq)
    if (InitPathFn) {
      enemy.initPath = InitPathFn(gameState.c, enemy).instantiate()
    }
    return enemy
  },
  AttackPath: StandardAttackPath,
}

export const Enemy9Obj: IEnemyInit = {
  sprite: {} as ISprite,
  type: 9,
  score: 2000,
  health: 20,
  shootFn(E: IEnemy, freq: number) {
    const bottomEnemies = [Enemy1Obj, Enemy2Obj, Enemy3Obj]
    let timer = freq
    return () => {
      timer -= 1
      if (timer <= 0) {
        timer = freq / 2 + Math.random() * (freq / 2)
        let e1: IEnemy
        let e2: IEnemy
        const rand = Math.random()
        if (rand < 0.3) {
          e1 = Enemy4Obj.instantiate(
            E.x - gameState.enemyData.width,
            E.y + 10,
            gameState.enemyData.width,
            gameState.enemyData.height,
            50,
            null,
            1,
          )
          e2 = Enemy4Obj.instantiate(
            E.x + E.width,
            E.y + 10,
            gameState.enemyData.width,
            gameState.enemyData.height,
            50,
            null,
            1,
          )
        } else if (rand < 0.8) {
          e1 = arrayRand(bottomEnemies).instantiate(
            E.x + 10,
            E.y + E.height,
            gameState.enemyData.width,
            gameState.enemyData.height,
            30,
            null,
            1,
          )
          e2 = arrayRand(bottomEnemies).instantiate(
            E.x + E.width - (10 + gameState.enemyData.width),
            E.y + E.height,
            gameState.enemyData.width,
            gameState.enemyData.height,
            30,
            null,
            1,
          )
        } else {
          gameState.enemyShots.push(
            Laser(E, E.x + E.width / 2 - 3, E.y + E.height - 40, 5),
          )
          playSound(sounds.laser)
          return
        }
        e1.mode = EnemyMode.HOVER
        e2.mode = EnemyMode.HOVER
        gameState.enemyData.initEnemyCount += 2
        e1.alwaysAttack = true
        e2.alwaysAttack = true
        e1.attack()
        e2.attack()
        gameState.enemies.push(e1)
        gameState.enemies.push(e2)
      }
    }
  },
  instantiate(x, y, w, h, shotFreq, InitPathFn) {
    const enemy = Enemy({
      sprite: Enemy9Obj.sprite,
      x,
      y,
      width: w,
      height: h,
      score: Enemy9Obj.score,
      health: Enemy9Obj.health,
      type: Enemy9Obj.type,
    })
    enemy.shoot = this.shootFn(enemy, shotFreq)
    if (InitPathFn) enemy.initPath = InitPathFn(gameState.c, enemy, 30).instantiate()
    enemy.hoverAction = this.shootFn(enemy, shotFreq)
    return enemy
  },
}

export const enemyObjList = [
  Enemy1Obj,
  Enemy2Obj,
  Enemy3Obj,
  Enemy4Obj,
  Enemy5Obj,
  Enemy6Obj,
  Enemy7Obj,
  Enemy8Obj,
]
