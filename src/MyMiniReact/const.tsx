import _ from "lodash";
import { MyFiber, MyFiberRoot } from "./type";

export const PLACEMENT = 0b00001;

export const UPDATE = 0b00010;

export const DELETE = 0b00100;

export const NOEFFECT = 0b00000;

export const NOCONTEXT = 0b00000;

export const EVENTCONTEXT = 0b00001;


export const NOLANE = 0b00000;

export const SYNCLANE = 0b00001;

export const CONTINUSE = 0b00010;

export const DEFAULTLANE = 0b00100;


export const ROOTCOMPONENT = 0b00000;

export const HOSTCOMPONENT = 0b00001;

export const FUNCTIONCOMPONENT = 0b00010;

let globalContextFlags: number = NOCONTEXT;

function addContextFlags(flag: number) {
  globalContextFlags |= flag;
}

let batchUpdating = false;

export function setBatchUpdating(bol: boolean) {
  batchUpdating = bol;
}

export function getBatchUpdating() {
  return batchUpdating;
}

export function getContextFlags() {
  return globalContextFlags;
}

function removeContextFlags(flag: number) {
  globalContextFlags &= ~flag;
}

export function runInContextFlags(cb: () => void, flag: number) {
  const preContext = getContextFlags();
  addContextFlags(flag);
  cb()
  removeContextFlags(preContext)
}

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