interface IKeyHandler {
  fns: Record<string, (() => void) | undefined>

  Control: () => boolean
  Shift: () => boolean
  keydownHandler: (event: KeyboardEvent) => boolean
  keyupHandler: (event: KeyboardEvent) => void
  start: () => void
  stop: () => void
  keys: Record<string, boolean>
}

export const keyhandler: IKeyHandler = {
  fns: {},
  keys: {},

  Control() {
    return keyhandler.keys.ShiftLeft || keyhandler.keys.ShiftRight
  },

  Shift() {
    return keyhandler.keys.ControlLeft || keyhandler.keys.ControlRight
  },

  keydownHandler(event: KeyboardEvent) {
    const key = event.code
    keyhandler.keys[key] = true

    if (keyhandler.fns[key]) {
      keyhandler.fns[key]()
    }
    if (
      keyhandler.keys.ArrowLeft ||
      keyhandler.keys.ArrowRight ||
      keyhandler.keys.ArrowUp ||
      keyhandler.keys.ArrowDown ||
      keyhandler.keys.Space
    ) {
      event.preventDefault()
      return false
    }
    return true
  },

  keyupHandler(event: KeyboardEvent) {
    keyhandler.keys[event.code] = false
  },

  start() {
    keyhandler.stop()
    document.addEventListener('keydown', this.keydownHandler, true)
    document.addEventListener('keyup', this.keyupHandler, true)
  },
  stop() {
    document.removeEventListener('keydown', this.keydownHandler, true)
    document.removeEventListener('keyup', this.keyupHandler, true)
  },
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}

export function escapeHtml(str: string) {
  const div = document.createElement('div')
  div.appendChild(document.createTextNode(str))
  return div.innerHTML
}

export function textSize(str: string, font?: string): number[] {
  const f = font || '12px arial'
  const div = document.createElement('div')
  div.appendChild(document.createTextNode(str))
  div.style.position = 'absolute'
  div.style.float = 'left'
  div.style.whiteSpace = 'nowrap'
  div.style.visibility = 'hidden'
  div.style.font = f
  document.body.appendChild(div)
  const w = div.offsetWidth
  const h = div.offsetHeight
  document.body.removeChild(div)

  return [w, h]
}

/*
function csrfSafeMethod(method) {
  // these HTTP methods do not require CSRF protection
  return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

function setupAjax() {
    $.ajaxSetup({
        crossDomain: false, // obviates need for sameOrigin test
        beforeSend: function (xhr, settings) {
            if(!csrfSafeMethod(settings.type)) {
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
            }
        }
    });
}
*/

export interface IPostRequest extends XMLHttpRequest {
  refresh?: string
}

export type IPostCallback = (http: IPostRequest) => void

export function post(
  url: string,
  data: Record<string, unknown>,
  callback: IPostCallback,
) {
  const http = new XMLHttpRequest()
  http.open('POST', url, true)
  http.setRequestHeader('Content-Type', 'application/json; charset=UTF-8')
  http.onreadystatechange = () => {
    if (http.readyState === 4 && callback !== null) {
      callback(http)
    }
  }
  http.send(JSON.stringify(data))
}

interface IActiveArr {
  active: boolean
}

export function removeSquare(
  arr: IActiveArr[],
  stride: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  for (let i = y; i < y + h; i += 1) {
    for (let j = x; j < x + w; j += 1) {
      if (i * stride + j < arr.length) {
        arr[i * stride + j].active = false
      }
    }
  }
}

export function arrayRand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function findPos(obj: HTMLElement) {
  let curleft = 0
  let curtop = 0
  let curObj: HTMLElement | undefined = obj
  if (curObj.offsetParent) {
    do {
      curleft += curObj.offsetLeft
      curtop += curObj.offsetTop
      curObj = curObj.offsetParent as HTMLElement | undefined
    } while (curObj)
    return { x: curleft, y: curtop }
  }
  return undefined
}

export function withId(id: string) {
  return document.getElementById(id)
}
