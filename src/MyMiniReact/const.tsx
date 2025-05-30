import _ from "lodash";
import { MyFiber, MyFiberRoot } from "./type";
import { getUUID } from "./utils";


export const MyReactFiberKey = getUUID('__MyReactFiber__');

export const isInDebugger = false;

export const PLACEMENT = 0b00000001;

export const UPDATE = 0b00000010;

export const DELETE = 0b00000100;

export const EFFECTHOOK = 0b00001000;

export const LAYOUT_EFFECT_HOOK = 0b00010000;

export const REFEFFECT = 0b00100000;

export const INSERTBEFORE = 0b01000000;

export const NOEFFECT = 0b00000;

export const EFFECT_PASSIVE = 0b000001;

export const EFFECT_LAYOUT = 0b000010;

export const EFFECT_HOOK_HAS_EFFECT = 0b000100;

export const EFFECT_DESTROY = 0b001000;

export const EffECTDicts = {
  [PLACEMENT]: 'placement',
  [DELETE]: 'delete',
  [UPDATE]: 'update',
  [NOEFFECT]: 'noEffect',
  [EFFECTHOOK]: 'effectHook',
  [REFEFFECT]: 'refEffect',
  [LAYOUT_EFFECT_HOOK]: 'layoutEffectHook',
  [INSERTBEFORE]: 'insertBefore'
};



// export const NOCONTEXT = 0b00000;

// export const EVENTCONTEXT = 0b00001;


export const NOLANE = 0b00000;

export const SYNCLANE = 0b00001;

export const CONTINUSE = 0b00010;

export const DEFAULTLANE = 0b00100;


export const ROOTCOMPONENT = 0b00000;

export const TEXTCOMPONENT = 0b000001;

export const HOSTCOMPONENT = 0b000010;

export const FUNCTIONCOMPONENT = 0b000100;

export const MEMOCOMPONENT = 0b001000;

export const FRAGMENTCOMPONENT = 0b010000;


// let globalContextFlags: number = NOCONTEXT;

// function addContextFlags(flag: number) {
//   globalContextFlags |= flag;
// }

let batchUpdating = false;

export function setBatchUpdating(bol: boolean) {
  // console.log('setBatchUpdating', bol)
  batchUpdating = bol;
}

export function getBatchUpdating() {
  return batchUpdating;
}

export const NO_CONTEXT = 0b0000000;
export const DESTROY_CONTEXT = 0b0000001;
export const CREATE_CONTEXT = 0b0000010;

let currentContext: number = NO_CONTEXT;

export function setCurrentContext(ctx: number) {
  currentContext = ctx;
}

export function getCurrentContext(): number {
  return currentContext
}

// export function getContextFlags() {
//   return globalContextFlags;
// }

// function removeContextFlags(flag: number) {
//   globalContextFlags &= ~flag;
// }

// export function runInContextFlags(cb: () => void, flag: number) {
//   const preContext = getContextFlags();
//   addContextFlags(flag);
//   cb()
//   removeContextFlags(preContext)
// }

export let workInProgress: MyFiber | null = null;

export const deletions: MyFiber[] = [];

export function setWorkInProgress(fiber: MyFiber) {
  workInProgress = fiber;
}

export let fiberRoot: MyFiberRoot | null = {
  tag: 0,
  current: null,
  stateNode: null,
  flag: 0
};;

export function setFiberRoot(f: Partial<MyFiberRoot>) {
  _.forEach(f, (v, k) => {
    fiberRoot[k] = v;
  })
}

export let rootFiber: MyFiber | null = null;

export let wipRoot: MyFiber | null = null;

export function setWipRoot(fiber: MyFiber | null) {
  wipRoot = fiber;
}

export function setRootFiber(fiber: MyFiber | null) {
  rootFiber = fiber;
}

let isRendering = false;

export function getIsRendering() {
  return isRendering;
}

export function setIsRendering(bol: boolean) {
  // console.log('setIsRendering', bol)
  isRendering = bol
}

let isFlushEffecting = false;

export function getIsFlushEffecting() {
  return isFlushEffecting
}

export function setIsFlushEffecting(bol: boolean) {
  isFlushEffecting = bol
}