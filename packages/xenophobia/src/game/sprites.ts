import {
  Enemy1Obj,
  Enemy2Obj,
  Enemy3Obj,
  Enemy4Obj,
  Enemy5Obj,
  Enemy6Obj,
  Enemy7Obj,
  Enemy8Obj,
  Enemy9Obj,
  enemyObjList,
} from './enemies'
import { ISprite, LoadSprite, RenderContext, Sound } from '@sampullman/simple-game-engine'
import { shotW, shotH, gameState } from './state'
import { IPlayer, IStar, IStars } from './i-objects'
import playerUrl from '../assets/images/player.png'
import playerLefUrl from '../assets/images/playerLeft.png'
import playerRightUrl from '../assets/images/playerRight.png'
import enemy1Url from '../assets/images/enemy1.png'
import enemy2Url from '../assets/images/enemy2.png'
import enemy3Url from '../assets/images/enemy3.png'
import enemy4Url from '../assets/images/enemy4.png'
import enemy5Url from '../assets/images/enemy5.png'
import enemy6Url from '../assets/images/enemy6.png'
import enemy7Url from '../assets/images/enemy7.png'
import enemy8Url from '../assets/images/enemy8.png'
import enemy9Url from '../assets/images/enemy9.png'
import explosion1Url from '../assets/images/explosion1.png'
import explosion2Url from '../assets/images/explosion2.png'
import explosion3Url from '../assets/images/explosion3.png'
import explosion4Url from '../assets/images/explosion4.png'
import laserRedUrl from '../assets/images/laserRed.png'
import laserRedShotUrl from '../assets/images/laserRedShot.png'
import laserGreenUrl from '../assets/images/laserGreen.png'
import laserGreenShotUrl from '../assets/images/laserGreenShot.png'
import lifeUrl from '../assets/images/life.png'
import pauseUrl from '../assets/images/pause.png'
import playUrl from '../assets/images/play.png'
import soundOnUrl from '../assets/images/sound_on.png'
import soundOffUrl from '../assets/images/sound_off.png'
import shieldUrl from '../assets/images/shield.png'
import shieldPowerupUrl from '../assets/images/shieldPowerup.png'
import missileUrl from '../assets/images/missile.png'
import mine1Url from '../assets/images/mine1.png'
import mine2Url from '../assets/images/mine2.png'
import starUrl from '../assets/images/star.png'

import shotMp3 from '../assets/sounds/shot.mp3'
import shotOgg from '../assets/sounds/shot.ogg'
import enemyShotMp3 from '../assets/sounds/enemy_shot.mp3'
import enemyShotOgg from '../assets/sounds/enemy_shot.ogg'
import enemyExpMp3 from '../assets/sounds/enemy_exp.mp3'
import enemyExpOgg from '../assets/sounds/enemy_exp.ogg'
import ambienceMp3 from '../assets/sounds/ambience.mp3'
import laserMp3 from '../assets/sounds/laser.mp3'
import laserOgg from '../assets/sounds/laser.ogg'

const { sprites, sounds } = gameState

function Stars(
  c: RenderContext,
  sprite: ISprite,
  minSize: number,
  maxSize: number,
  minSpeed: number,
  maxSpeed: number,
  freq: number,
): IStars {
  const obj: IStars = {
    sprite,
    stars: [],
    timer: 0,
    minSize,
    maxWidth: maxSize - minSize,
    minSpeed,
    maxSpeedWidth: maxSpeed - minSpeed,
    freq,
    add(x, y) {
      const star: IStar = [
        x || Math.random() * c.width,
        y || 0,
        Math.random() * obj.maxWidth + obj.minSize,
        Math.random() * obj.maxSpeedWidth + obj.minSpeed,
      ]
      obj.stars.push(star)
    },
    update(ctx) {
      obj.timer -= 1
      if (obj.timer <= 0) {
        obj.add()
        obj.timer = Math.random() * freq + freq / 2
      }
      obj.stars = obj.stars.filter((star) => {
        star[1] += star[3]
        return star[1] < ctx.height
      })
    },
    draw(ctx) {
      const drawSprite = obj.sprite
      obj.stars.forEach((star) => {
        drawSprite.draw(ctx, star[0], star[1], star[2], star[2])
      })
    },
  }
  return obj
}

export function loadSprites(
  c: RenderContext,
  player: IPlayer,
  spriteLoadFn: () => void,
  buttonLoadFn: () => void,
) {
  const enemyLoadFn = () => {
    if (sprites.star.loaded && enemyObjList.every((E) => E.sprite.loaded)) {
      spriteLoadFn()
    }
  }
  function initStars() {
    sprites.stars = Stars(c, sprites.star, 5, 18, 0.2, 0.7, 50)
    for (let i = 0; i < 30; i += 1) {
      sprites.stars.add(Math.random() * c.width, Math.random() * c.height)
    }
    enemyLoadFn()
  }
  const w = player.width
  const h = player.height
  LoadSprite.imageRoot = ''
  player.sprites = [
    LoadSprite(playerUrl, w, h),
    LoadSprite(playerLefUrl, w, h),
    LoadSprite(playerRightUrl, w, h),
  ]
  Enemy1Obj.sprite = LoadSprite(
    enemy1Url,
    gameState.enemyData.width,
    gameState.enemyData.height,
    enemyLoadFn,
  )
  Enemy2Obj.sprite = LoadSprite(
    enemy2Url,
    gameState.enemyData.width,
    gameState.enemyData.height,
    enemyLoadFn,
  )
  Enemy3Obj.sprite = LoadSprite(
    enemy3Url,
    gameState.enemyData.width,
    gameState.enemyData.height,
    enemyLoadFn,
  )
  Enemy4Obj.sprite = LoadSprite(
    enemy4Url,
    gameState.enemyData.width,
    gameState.enemyData.height,
    enemyLoadFn,
  )
  Enemy5Obj.sprite = LoadSprite(
    enemy5Url,
    gameState.enemyData.width * 2,
    gameState.enemyData.height * 2,
    enemyLoadFn,
  )
  Enemy6Obj.sprite = LoadSprite(
    enemy6Url,
    gameState.enemyData.width,
    gameState.enemyData.height,
    enemyLoadFn,
  )
  Enemy7Obj.sprite = LoadSprite(
    enemy7Url,
    gameState.enemyData.width,
    gameState.enemyData.height,
    enemyLoadFn,
  )
  Enemy8Obj.sprite = LoadSprite(
    enemy8Url,
    gameState.enemyData.width * 3,
    gameState.enemyData.height,
    enemyLoadFn,
  )
  sprites.playerShot = [
    LoadSprite(laserRedUrl, shotW, shotH),
    LoadSprite(laserRedShotUrl, 28, 28),
  ]
  sprites.enemyShot = [
    LoadSprite(laserGreenUrl, shotW, shotH),
    LoadSprite(laserGreenShotUrl, 28, 28),
  ]
  sprites.playerLife = LoadSprite(lifeUrl, w / 2, h / 2)
  sprites.explosions.push(
    LoadSprite(explosion1Url, gameState.enemyData.width, gameState.enemyData.height),
  )
  sprites.explosions.push(
    LoadSprite(explosion2Url, gameState.enemyData.width, gameState.enemyData.height),
  )
  sprites.explosions.push(
    LoadSprite(explosion3Url, gameState.enemyData.width, gameState.enemyData.height),
  )
  sprites.explosions.push(
    LoadSprite(explosion4Url, gameState.enemyData.width, gameState.enemyData.height),
  )
  sprites.pause = LoadSprite(pauseUrl, 32, 32, buttonLoadFn)
  sprites.play = LoadSprite(playUrl, 32, 32, buttonLoadFn)
  sprites.soundOn = LoadSprite(soundOnUrl, 32, 32, buttonLoadFn)
  sprites.soundOff = LoadSprite(soundOffUrl, 32, 32, buttonLoadFn)
  sprites.shield = LoadSprite(shieldUrl, w + 12, h + 5)
  sprites.shieldPowerup = LoadSprite(shieldPowerupUrl, 16, 16)
  sprites.missile = LoadSprite(missileUrl, w / 1.25, h)
  sprites.mines.push(LoadSprite(mine1Url, 28, 28))
  sprites.mines.push(LoadSprite(mine2Url, 28, 28))
  Enemy9Obj.sprite = LoadSprite(
    enemy9Url,
    gameState.enemyData.width * 3,
    gameState.enemyData.height * 3,
  )
  sprites.star = LoadSprite(starUrl, 16, 16, initStars)
  sounds.shot = Sound({ mp3: shotMp3, ogg: shotOgg })
  sounds.enemyShot = Sound({ mp3: enemyShotMp3, ogg: enemyShotOgg })
  sounds.enemyExp = Sound({ mp3: enemyExpMp3, ogg: enemyExpOgg })
  sounds.ambient = Sound({ mp3: ambienceMp3, loop: true })
  sounds.laser = Sound({ mp3: laserMp3, ogg: laserOgg })
}
