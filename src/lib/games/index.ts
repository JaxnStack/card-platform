/**
 * Engine loader
 */

import { kataEngine } from "./kata"
import { ak47Engine } from "./ak47"

export function getEngine(type: "kata" | "ak47") {
  return type === "kata" ? kataEngine : ak47Engine
}