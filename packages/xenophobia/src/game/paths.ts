import { gameState } from './state'
import {
  IAvoidPlayer,
  IComplexAttackPathInit,
  IEnemy,
  IFollowPlayer,
  IPoint,
  IPointPath,
  IRandomAttackPathInit,
  ISimpleAttackPathInit,
} from './i-objects'
import { IBounded, RenderContext } from '@sampullman/simple-game-engine'

export function Point(x: number, y: number): IPoint {
  return {
    x,
    y,
  }
}

export function PointPath(
  points: IPoint[],
  durations: number[],
  speed?: number,
  pathStartCallback?: () => void,
): IPointPath {
  const pathSpeed = speed || 1
  for (let i = 0; i < durations.length; i += 1) {
    durations[i] /= pathSpeed
  }
  const path: IPointPath = {
    pathStartCallback,
    finished: false,
    durations,
    durs: [],
    points,
    time: 0,
    index: 1,
    xStep: (points[1].x - points[0].x) / durations[0],
    yStep: (points[1].y - points[0].y) / durations[0],
    init() {
      path.pathStartCallback?.()
    },
    next() {
      path.time += 1
      if (path.time >= path.durations[path.index - 1]) {
        path.index += 1
        if (path.index >= path.points.length) {
          path.finished = true
        } else {
          path.time = 0
          path.xStep =
            (path.points[path.index].x - path.points[path.index - 1].x) /
            path.durations[path.index - 1]
          path.yStep =
            (path.points[path.index].y - path.points[path.index - 1].y) /
            path.durations[path.index - 1]
        }
      }
      return Point(path.xStep, path.yStep)
    },
    lastPoint() {
      return path.points[path.points.length - 1]
    },
  }
  return path
}

export function FollowPlayer(E: IBounded, duration: number): IFollowPlayer {
  const path: IFollowPlayer = {
    E,
    finished: false,
    duration,
    next() {
      path.duration -= 1
      if (E.y > gameState.c.height) {
        path.finished = true
        return Point(0, 0)
      }
      if (path.duration <= 0 || path.E.y > gameState.c.width - 1.5 * path.E.height) {
        return Point(0, 8)
      }
      const playerX = gameState.player.x
      const playerY = gameState.player.y
      const playerXVel = gameState.player.xVel
      const projX = playerX + 5 * playerXVel - path.E.x + (playerX - path.E.x) / 1.5
      const projY = playerY - path.E.y
      const dist = Math.sqrt(projX * projX + projY * projY)
      const xVel = 9 * (projX / dist)
      const yVel = 6 * (projY / dist)
      return Point(xVel, yVel)
    },
  }
  return path
}

export function AvoidPlayer(E: IBounded, duration: number): IAvoidPlayer {
  const path: IAvoidPlayer = {
    E,
    finished: false,
    done: false,
    duration,
    next() {
      if (path.E.y > gameState.c.height) {
        path.finished = true
        return Point(0, 0)
      }
      if (path.E.x < 0) {
        return Point(12, 0)
      }
      if (path.E.x > gameState.c.width) {
        return Point(-12, 0)
      }
      const player = gameState.player
      const projX = player.x + 10 * player.xVel - path.E.x + (player.x - path.E.x) / 1.5
      const projY = player.y + 3 * player.yVel - path.E.y
      const dist = Math.sqrt(projX * projX + projY * projY)
      let xVel = -10 * (projX / dist)
      if (
        (path.E.x < path.E.width && xVel < 0) ||
        (path.E.x > gameState.c.width - 2 * path.E.width && xVel > 0) ||
        Math.abs(projX) > gameState.c.width / 2
      ) {
        xVel = 0
      }
      return Point(xVel, 7)
    },
  }
  return path
}

export function clonePointPath(pathObj: IComplexAttackPathInit) {
  const xDiff = 0
  const yDiff = 0
  const newPoints: IPoint[] = []
  pathObj.points.forEach((point) => {
    newPoints.push(Point(point.x + xDiff, point.y + yDiff))
  })
  return PointPath(newPoints, pathObj.durs.slice(0, pathObj.durs.length), pathObj.E.speed)
}

export function StandardAttackPath(c: RenderContext, E: IEnemy): IComplexAttackPathInit {
  const init: IComplexAttackPathInit = {
    E,
    points: [],
    durs: [],
    instantiate() {
      const dir = Math.random() < 0.5 ? -1 : 1
      init.points = [
        Point(E.x, E.y),
        Point(E.x + dir * (c.width / 4), E.y + c.height / 6),
        Point(E.x - dir * (c.width / 3), c.height),
      ]
      init.durs = [30, 80]
      return PointPath(init.points, init.durs, E.speed)
    },
    clone(_: IEnemy) {
      return clonePointPath(init)
    },
  }
  return init
}

export function SweepAttackPath(c: RenderContext, E: IEnemy): IComplexAttackPathInit {
  const init: IComplexAttackPathInit = {
    E,
    points: [],
    durs: [],
    instantiate() {
      let x1
      let x2
      if (E.x < c.width / 2) {
        x1 = 0
        x2 = c.width
      } else {
        x1 = c.width
        x2 = 0
      }
      init.durs = [40, 150]
      init.points = [
        Point(E.x, E.y),
        Point(x1, E.y + c.height / 8),
        Point(x2, c.height - E.y),
      ]
      return PointPath(init.points, init.durs, 1)
    },
    clone(_: IEnemy) {
      return clonePointPath(init)
    },
  }
  return init
}

export function FollowPlayerPath(
  _: RenderContext,
  E: IEnemy,
  duration?: number,
): ISimpleAttackPathInit {
  const init: ISimpleAttackPathInit = {
    E,
    duration: duration ?? 90,
    instantiate: () => FollowPlayer(E, init.duration),
    clone: (entity: IEnemy) => FollowPlayer(entity, init.duration),
  }
  return init
}

export function AvoidPlayerPath(
  _: RenderContext,
  E: IEnemy,
  duration?: number,
): ISimpleAttackPathInit {
  const init: ISimpleAttackPathInit = {
    E,
    duration: duration ?? 100,
    instantiate: () => AvoidPlayer(E, init.duration),
    clone: (entity: IEnemy) => AvoidPlayer(entity, init.duration),
  }
  return init
}

export function RandomVerticalInit(
  c: RenderContext,
  E: IEnemy,
  minDur?: number,
): IRandomAttackPathInit {
  const init: IRandomAttackPathInit = {
    E,
    minDur: minDur ?? 0,
    points: [],
    durs: [],
    instantiate: () => {
      init.points = [Point(E.x, E.y - c.height), Point(E.x, E.y)]
      init.durs = [init.minDur + 20 + Math.random() * 40]
      const pathStartCallback = () => {
        E.y -= c.height
      }
      return PointPath(init.points, init.durs, 1, pathStartCallback)
    },
    clone: (_: IEnemy) => clonePointPath(init),
  }
  return init
}

export function RandomHorizontalInit(
  c: RenderContext,
  E: IEnemy,
  minDur?: number,
): IRandomAttackPathInit {
  const init: IRandomAttackPathInit = {
    E,
    minDur: minDur ?? 0,
    points: [],
    durs: [],
    instantiate: () => {
      const dir = E.x < c.width / 2 ? -1 * c.width : c.width
      init.points = [Point(E.x + dir, E.y), Point(E.x, E.y)]
      init.durs = [init.minDur + 20 + Math.random() * 40]
      const pathStartCallback = () => {
        E.x += dir
      }
      return PointPath(init.points, init.durs, 1, pathStartCallback)
    },
    clone: (_: IEnemy) => clonePointPath(init),
  }
  return init
}

export function RandomInit(
  c: RenderContext,
  E: IEnemy,
  minDur?: number,
): IRandomAttackPathInit {
  const init: IRandomAttackPathInit = {
    E,
    minDur: minDur ?? 0,
    points: [],
    durs: [],
    instantiate: () => {
      const newX = Math.random() * c.width
      init.points = [Point(newX, E.y - c.height), Point(E.x, E.y)]
      init.durs = [init.minDur + 20 + Math.random() * 40]
      const pathStartCallback = () => {
        E.x = newX
        E.y -= c.height
      }
      return PointPath(init.points, init.durs, 1, pathStartCallback)
    },
    clone: (_: IEnemy) => clonePointPath(init),
  }
  return init
}
