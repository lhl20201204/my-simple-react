import _ from "lodash";
import { addHookIndex, currentlyFiber, setFiberWithFlags } from "./beginWork";
import { IDispatchValue, IEffectHook, IMemoOrCallbackHook, IRefHook, IStateHook, IStateParams, MyFiber } from "./type";
import { DESTROY_CONTEXT, EFFECT_HOOK_HAS_EFFECT, EFFECT_LAYOUT, EFFECT_PASSIVE, PASSIVE_FLAGS, getBatchUpdating, getCurrentContext, LAYOUT_FLAGS, ROOTCOMPONENT, rootFiber, UPDATE, wipRoot } from "./const";
import { ensureRootIsScheduled, runInBatchUpdate } from "./ReactDom";
import { isDepEqual, logFiberIdPath } from "./utils";

function findFiberPath(fiber: MyFiber) {
  const ret = [];
  while(fiber) {
    ret.push(fiber);
    fiber = fiber.return;
  }
  return ret;
}

function findTagFiber(fiber: MyFiber, path: MyFiber[], rootFiber: MyFiber) {
  // originConsoleLog([...path])
  let p = rootFiber;
  while(path.length && p === path[path.length - 1]) {
    // p = p.child;
    let c = p.child;
    let f = p;
    path.pop();
    while (c) {
      if (c === path[path.length - 1]) {
        p = c;
      }
      c = c.sibling;
    }
    if (p === f) {
      break;
    }
  }
  // originConsoleLog(path.length, fiber.alternate, fiber, rootFiber);
  return path.length ? fiber.alternate : fiber;
}

export function MyUseState<T>(x: IStateParams<T>): [T, (x: IDispatchValue<T>) => void] {
  const fiber = currentlyFiber;

  if (fiber.alternate) {
    // console.log(_.cloneDeep({ fiber }))
    const hook = fiber.hook[addHookIndex()] as IStateHook<T>;
    while (hook.updateList.length) {
      const h = hook.updateList.shift();
      hook.memoizeState = _.isFunction(h) ? h(hook.memoizeState) : h;
    }
    //  console.log('拿到的', hook.memoizeState)
    //  hook.fiber = fiber;
    return [hook.memoizeState, hook.dispatchAction] as [T, (x: IStateParams<T>) => void];
  }

  // const originRootFiber = wipRoot;
  let v: T = _.isFunction(x) ? x() : x;
  const updateList: IDispatchValue<T>[] = []
  const newHook: IStateHook<T> = {
    memoizeState: v,
    updateList,
    dispatchAction: (x: IDispatchValue<T>) => {
      const path = findFiberPath(fiber);
      const currentRootFiber = path[path.length - 1];
      if (currentRootFiber.tag !== ROOTCOMPONENT) {
        // console.warn('组件已经卸载')
        return;
      }
      const currentFiber = rootFiber ? findTagFiber(fiber, path, rootFiber) :
        wipRoot ? findTagFiber(fiber, path, wipRoot) : fiber;

      const oldValue = newHook.memoizeState;
      
      // console.error('setState', _.cloneDeep({ currentFiber }), logFiberIdPath(currentFiber))
      if (!(currentFiber.flags & UPDATE) && !currentlyFiber && getCurrentContext() !== DESTROY_CONTEXT) {
        newHook.memoizeState = _.isFunction(x) ? x(newHook.memoizeState) : x;
      } else {
        updateList.push(x);
      }

      if ((_.isFunction(x) || x !== oldValue) && !(currentFiber.flags & UPDATE)) {
        setFiberWithFlags(currentFiber, UPDATE)
      }

      if (!getBatchUpdating() && !!(currentFiber.flags & UPDATE)) {
        ensureRootIsScheduled(true)
      }
    }
  }
  addHookIndex()
  fiber.hook.push(newHook)
  return [newHook.memoizeState, newHook.dispatchAction] as [T, (x: IStateParams<T>) => void];
}

export function pushEffect(fiber: MyFiber, newHook: IEffectHook) {
  if (!fiber.updateQueue.lastEffect) {
    fiber.updateQueue.firstEffect = newHook;
  } else {
    fiber.updateQueue.lastEffect.next = newHook;
  }
  fiber.updateQueue.lastEffect = newHook;
  // console.log('打上EffectFiber', fiber)
}

let effectId = 0;

export const getEffectFn = (tag: typeof EFFECT_LAYOUT | typeof EFFECT_PASSIVE,
  flags: typeof PASSIVE_FLAGS | typeof LAYOUT_FLAGS
) => {
  return function useEffect(create: () => (() => void) | void, deps: unknown[]) {
    const fiber: MyFiber = currentlyFiber;
    if (fiber.alternate) {
      const hook = fiber.hook[addHookIndex()] as IEffectHook;
      //  if (!isDepEqual(hook.deps, deps)) {
      //   //  console.log('处罚effect', _.cloneDeep([...hook.deps]), _.cloneDeep([...deps]))
      //    hook.create = create;
      //    hook.pendingDeps = deps;
      //   //  hook.deps = deps;
      //   //  hook.tag |= EFFECT_HOOK_HAS_EFFECT;
      //   //  setFiberWithFlags(fiber, flags);
      //   //  console.log(_.cloneDeep({ fiber}))
      //    // pushEffect(fiber, hook);

      //    // 需要更新。 需要更新的effect。应该放在updateQueue。
      //  } else {
      //   //  console.log('依赖相等', _.cloneDeep([...hook.deps]), _.cloneDeep([...deps]))
      //   //  hook.tag &= ~EFFECT_HOOK_HAS_EFFECT;
      //  }
      if (!isDepEqual(hook.deps, deps)) {
        setFiberWithFlags(fiber, flags);
        // if (rootFiber) {
        //   hook.tag |= EFFECT_HOOK_HAS_EFFECT;
        //   hook.deps = deps;
        // }
      }

      hook.create = create;
      hook.pendingDeps = deps;
      return;
    }
    // 执行时机不对。应该是先存起来。
    // // create执行时机应该是在commit之后。
    // const destroy = create()
    const newHook: IEffectHook = {
      id: effectId++,
      tag: tag | EFFECT_HOOK_HAS_EFFECT, // TODO,
      create,
      destroy: null,
      fiber,
      deps,
      next: null
    }
    // 首次进来必定需要更新。
    pushEffect(fiber, newHook)
    setFiberWithFlags(fiber, flags);
    //  console.log(fiber, '打上fiber', flags, newHook.tag);
    fiber.hook.push(newHook)
  }
}

export const MyUseEffect = getEffectFn(EFFECT_PASSIVE, PASSIVE_FLAGS);

export const MyUseLayoutEffect = getEffectFn(EFFECT_LAYOUT, LAYOUT_FLAGS);


export function MyUseRef<T>(x: T): { current: T } {
  const fiber: MyFiber = currentlyFiber;
  if (fiber.alternate) {
    const hook = fiber.hook[addHookIndex()] as IRefHook;
    return hook.memoizeState
  }
  const newHook: IRefHook = {
    memoizeState: {
      current: x
    }
  }
  fiber.hook.push(newHook)
  return newHook.memoizeState
}

export function MyUseMemo<T>(cb: () => T, deps: any[]): T {
  const fiber: MyFiber = currentlyFiber;
  if (fiber.alternate) {
    const hook = fiber.hook[addHookIndex()] as IMemoOrCallbackHook;
    if (!isDepEqual(hook.deps, deps)) {
      hook.deps = deps;
      hook.memoizeState = runInBatchUpdate(() => cb());
    }
    return hook.memoizeState
  }
  const newHook: IMemoOrCallbackHook = {
    memoizeState: runInBatchUpdate(() => cb()),
    deps
  }
  fiber.hook.push(newHook)
  return newHook.memoizeState
}

export function MyUseCallback<T extends Function>(cb: T, deps: any[]): T {
  const fiber: MyFiber = currentlyFiber;
  if (fiber.alternate) {
    const hook = fiber.hook[addHookIndex()] as IMemoOrCallbackHook;
    if (!isDepEqual(hook.deps, deps)) {
      hook.deps = deps;
      hook.memoizeState = cb;
    }
    return hook.memoizeState
  }
  const newHook: IMemoOrCallbackHook = {
    memoizeState: cb,
    deps
  }
  fiber.hook.push(newHook)
  return newHook.memoizeState
}