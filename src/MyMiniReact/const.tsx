import _ from "lodash";
import { MyFiber, MyFiberRoot } from "./type";
import { getUUID } from "./utils";


export const MyReactFiberKey = getUUID('__MyReactFiber__');

export const isInDebugger = false;

export const PLACEMENT = 0b00000001;

export const UPDATE = 0b00000010;

export const DELETE = 0b00000100;

export const PASSIVE_FLAGS = 0b00001000;

export const LAYOUT_FLAGS = 0b00010000;

export const REFEFFECT = 0b00100000;

export const INSERTBEFORE = 0b01000000;

export const CONTEXTCHANGE = 0b10000000;

export const FORCEUPDATE = 0b100000000;

export const SNAPSHOT = 0b1000000000;

export const UPDATEORMOUNT = 0b10000000000;

export const ErrorBoundary = 0b100000000000;

export const NoHandleError = 0b1000000000000;

export const SUSPENSE_FLAGS = 0b10000000000000;

export const PLACEMENT_SKIP = 0b100000000000000;

export const SUSPENSE_REMOVE = 0b1000000000000000;

export const SUSPENSE_RECOVERY = 0b10000000000000000;

export const RENDER_SUSPENSE = 0b100000000000000000;

export const RETRY_ERROR_BOUNDARY = 0b1000000000000000000;

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
  [PASSIVE_FLAGS]: 'PASSIVE_FLAGS',
  [REFEFFECT]: 'refEffect',
  [LAYOUT_FLAGS]: 'layoutEffectHook',
  [INSERTBEFORE]: 'insertBefore',
  [CONTEXTCHANGE]: 'contextChange',
  [FORCEUPDATE]: 'forceUpdate',
  [SNAPSHOT]: 'snapshot',
  [UPDATEORMOUNT]: 'updateOrMount',
  [ErrorBoundary]: 'ErrorBoundary',
  [NoHandleError]: 'NoHandleError',
  [SUSPENSE_FLAGS]: 'suspenseFlags',
  [PLACEMENT_SKIP]: 'placementSkip',
  [SUSPENSE_REMOVE]: 'suspenseRemove',
  [SUSPENSE_RECOVERY]: 'suspenseRecovery',
  [RENDER_SUSPENSE]: 'renderSuspense',
  [RETRY_ERROR_BOUNDARY]: 'retryErrorBoundary'
};



// export const NOCONTEXT = 0b00000;

// export const EVENTCONTEXT = 0b00001;


export const NOLANE = 0b00000;

export const SYNCLANE = 0b00001;

export const CONTINUSE = 0b00010;

export const DEFAULTLANE = 0b00100;


export const ROOTCOMPONENT = 0b0000000000000;

export const TEXTCOMPONENT = 0b0000000000001;

export const HOSTCOMPONENT = 0b0000000000010;

export const FUNCTIONCOMPONENT = 0b0000000000100;

export const MEMOCOMPONENT = 0b0000000001000;

export const FRAGMENTCOMPONENT = 0b0000000010000;

export const FORWARDREFCOMPONENT = 0b0000000100000;

export const PROVIDERCOMPONENT = 0b0000001000000;

export const CONSUMNERCOMPONENT = 0b0000010000000;

export const SUSPENSECOMPONENT = 0b0000100000000;

export const LAZYCOMPONENT = 0b0001000000000;

export const PORTAlCOMPONENT = 0b0010000000000;

export const CLASSCOMPONENT = 0b0100000000000;


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

export const ErrorFiberList: {
  fiber: MyFiber,
  error: Error
}[] = [];

export const GetDeriveStateFromErrorFiberList: {
  fiber: MyFiber,
  error: Error
}[] = [];

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

let pendingUpdateFiberList: [MyFiber, number][] = [];

export function addToPendingUpdateFiberList(start: number, end: number, fiber: MyFiber, flag: number) {
  pendingUpdateFiberList.splice(start, end, [fiber, flag])
}

export function getPendingUpdateFiberList() {
  return pendingUpdateFiberList
}
