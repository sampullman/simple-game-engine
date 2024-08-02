import { ISound, ISprite } from './i-types'

export function Sprite(
  image: HTMLCanvasElement | HTMLImageElement,
  width: number,
  height: number,
  sourceX?: number,
  sourceY?: number,
): ISprite {
  const backupWidth = width || image.width
  const backupHeight = height || image.height
  return {
    width,
    height,
    loaded: true,
    draw(
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number | undefined,
      h: number | undefined,
    ) {
      c.drawImage(
        image,
        sourceX || 0,
        sourceY || 0,
        image.width,
        image.height,
        x,
        y,
        w || backupWidth,
        h || backupHeight,
      )
    },
    fill(
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      repeat: string | undefined,
    ) {
      const pattern = c.createPattern(image, repeat || 'repeat')
      if (pattern) {
        c.fillStyle = pattern
      }
      c.fillRect(x, y, w, h)
    },
  }
}

export interface IProxy {
  loaded: boolean
}

export function LoadSprite(
  name: string,
  w: number,
  h: number,
  callback?: (proxy: IProxy | null) => void,
): ISprite {
  const img = new Image()
  const proxy: IProxy = { loaded: false }

  img.onload = () => {
    const tile = Sprite(img, w, h)

    Object.assign(proxy, tile)
    proxy.loaded = true
    callback?.(proxy)
  }
  img.onerror = () => {
    console.log(`Load fail: ${LoadSprite.imageRoot}${name}`)
    callback?.(null)
  }
  img.src = `${LoadSprite.imageRoot}${name}`
  return proxy as ISprite
}
LoadSprite.imageRoot = ''

export interface ISoundParams {
  mp3?: string
  ogg?: string
  loop?: boolean
}

export function Sound(params: ISoundParams): ISound {
  const { mp3, ogg, loop } = params
  const wrap = {
    sound: document.createElement('audio'),
    play() {
      wrap.sound.play()
    },
    stop() {
      wrap.sound.pause()
    },
  }
  if (ogg && wrap.sound.canPlayType('audio/ogg')) {
    wrap.sound.src = ogg
  } else if (mp3) {
    wrap.sound.src = mp3
  }
  wrap.sound.setAttribute('preload', 'auto')
  wrap.sound.setAttribute('controls', 'none')
  if (loop) {
    wrap.sound.setAttribute('loop', '')
  }
  wrap.sound.style.display = 'none'
  document.body.appendChild(wrap.sound)
  return wrap
}
