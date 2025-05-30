import _ from "lodash";
import { addHookIndex, currentlyFiber, getRootFiber, setFiberWithFlags } from "./beginWork";
import { IDispatchValue, IEffectHook, IMemoOrCallbackHook, IRefHook, IStateHook, IStateParams, MyFiber } from "./type";
import { DESTROY_CONTEXT, EFFECT_HOOK_HAS_EFFECT, EFFECT_LAYOUT, EFFECT_PASSIVE, EFFECTHOOK, getBatchUpdating, getCurrentContext, LAYOUT_EFFECT_HOOK, ROOTCOMPONENT, rootFiber, UPDATE, wipRoot } from "./const";
import { ensureRootIsScheduled, runInBatchUpdate } from "./ReactDom";
import { isDepEqual, logFiberIdPath } from "./utils";

function findTagFiber(fiber: MyFiber, parentFiber: MyFiber) {
  let f = parentFiber.child;
  while (f) {
    if (fiber === f || (fiber.alternate && fiber.alternate === f)) {
      return f
    }
    const ret = findTagFiber(fiber, f);
    if (ret) {
      return ret;
    }
    f = f.sibling;
  }
  return null;
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
      
      const currentRootFiber = getRootFiber(fiber);
      if (currentRootFiber.tag !== ROOTCOMPONENT) {
        // console.warn('组件已经卸载')
        return;
      }
      const currentFiber = rootFiber ? findTagFiber(fiber, rootFiber) :
        wipRoot ? findTagFiber(fiber, wipRoot) : fiber;
      
      if ((_.isFunction(x) || x !== newHook.memoizeState) && !(currentFiber.flags & UPDATE)) {
          setFiberWithFlags(currentFiber, UPDATE)
      }
      // console.log('setState', { currentFiber }, logFiberIdPath(currentFiber))
      if (!(currentFiber.flags & UPDATE) && !currentlyFiber && getCurrentContext() !== DESTROY_CONTEXT) {
        newHook.memoizeState = _.isFunction(x) ? x(newHook.memoizeState) : x;
      } else {
        updateList.push(x);
      }
      if (!getBatchUpdating()) {
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
  flags: typeof EFFECTHOOK | typeof LAYOUT_EFFECT_HOOK
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

export const MyUseEffect = getEffectFn(EFFECT_PASSIVE, EFFECTHOOK);

export const MyUseLayoutEffect = getEffectFn(EFFECT_LAYOUT, LAYOUT_EFFECT_HOOK);


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