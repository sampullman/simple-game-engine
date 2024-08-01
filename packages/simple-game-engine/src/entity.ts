import { IBounded } from './i-types'

export function entityCollision(e1: IBounded, e2: IBounded) {
  const r1 = e1.x + e1.width
  const b1 = e1.y + e1.height
  const r2 = e2.x + e2.width
  const b2 = e2.y + e2.height
  return r1 > e2.x && e1.x < r2 && e1.y < b2 && b1 > e2.y
}
