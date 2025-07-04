import _ from "lodash";
import { addHookIndex, currentlyFiber, handleFunctionComponent, setFiberWithFlags } from "./beginWork";
import { IDispatchValue, IEffectHook, IMemoOrCallbackHook, IRefHook, IStateHook, IStateParams, MyContext, MyDependenciesContext, MyFiber, MyRef } from "./type";
import { DESTROY_CONTEXT, EFFECT_HOOK_HAS_EFFECT, EFFECT_LAYOUT, EFFECT_PASSIVE, PASSIVE_FLAGS, getBatchUpdating, getCurrentContext, LAYOUT_FLAGS, ROOTCOMPONENT, rootFiber, UPDATE, wipRoot, PROVIDERCOMPONENT } from "./const";
import { ensureRootIsScheduled, runInBatchUpdate } from "./ReactDom";
import { isDepEqual, logFiberIdPath } from "./utils";

export function findFiberPath(fiber: MyFiber) {
  const ret = [];
  while (fiber) {
    ret.push(fiber);
    fiber = fiber.return;
  }
  return ret;
}

export function mayBeTargetFiber(f: MyFiber, s: MyFiber) {
  return f === s || f?.alternate === s;
}


export function findTagFiber(targetFiber: MyFiber, path: MyFiber[], rootFiber: MyFiber): MyFiber | null {
  if (mayBeTargetFiber(targetFiber, rootFiber)) {
    return rootFiber;
  }
  path.pop();
  const top = path[path.length - 1];
  let f = rootFiber.child;
  while (f) {
    const ret = mayBeTargetFiber(top, f) ?  findTagFiber(targetFiber, path, f) : null
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
    // console.error('useState', _.cloneDeep(hook))
    while (hook.updateList.length) {
      const h = hook.updateList.shift();
      // console.error('useState-shift', _.cloneDeep(h))
      hook.memoizeState = _.isFunction(h) ? h(hook.memoizeState) : h;
    }
    //  console.log('拿到的', hook.memoizeState, _.cloneDeep(hook))
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
      const currentFiber = wipRoot ? findTagFiber(fiber, path, wipRoot) : rootFiber ? findTagFiber(fiber, path, rootFiber) : fiber;

      const oldValue = newHook.memoizeState;

      // console.error('setState', _.cloneDeep({ currentFiber }), logFiberIdPath(currentFiber))
      if (!(currentFiber.flags & UPDATE) && !currentlyFiber && getCurrentContext() !== DESTROY_CONTEXT) {
        // console.error('直接执行setState', x, _.cloneDeep(updateList))
        newHook.memoizeState = _.isFunction(x) ? x(newHook.memoizeState) : x;
      } else {
        // console.error('push到updateList', x, _.cloneDeep(updateList))
        // console.log('push到updateList', x, oldValue, _.cloneDeep(updateList))
        if (x !== oldValue) {
          updateList.push(x);
        } else if (currentlyFiber && (
          ![fiber, fiber?.alternate].includes(currentlyFiber)
        )) {
          // const path = findFiberPath(currentlyFiber)
          // const targetFiber = findTagFiber(currentlyFiber, path, wipRoot);
          // handleFunctionComponent(targetFiber, !! targetFiber.ref);
          // currentlyFiber.type(currentlyFiber.pendingProps, currentlyFiber.ref);
        }
      }

      if ((_.isFunction(x) || x !== oldValue) && !(currentFiber.flags & UPDATE)) {
        setFiberWithFlags(currentFiber, UPDATE)
        // console.warn('setFiberWithFlags',wipRoot, rootFiber, findFiberPath(fiber), _.cloneDeep(currentFiber), logFiberIdPath(currentFiber))
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
        if (!(fiber.flags & flags)) {
          setFiberWithFlags(fiber, flags);
        }
      }

      hook.create = create;
      hook.pendingDeps = deps;
      return;
    }
    // 执行时机不对。应该是先存起来。
    // // create执行时机应该是在commit之后。
    // const destroy = create();

    const newHook: IEffectHook = {
      id: effectId++,
      tag: tag | EFFECT_HOOK_HAS_EFFECT, // TODO,
      create,
      destroy: null,
      fiber,
      deps,
      pendingDeps: deps,
      next: null
    }
    // console.warn('初始化', _.cloneDeep(newHook))
    // 首次进来必定需要更新。
    pushEffect(fiber, newHook);
    if (!(fiber.flags & flags)) {
      setFiberWithFlags(fiber, flags);
    }
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

export function MyUseImperativeHandle<T>(ref: MyRef<T>, handle: () => T, deps?: any[]) {
  return MyUseLayoutEffect(() => {
    const instance = handle();
    if (_.isFunction(ref)) {
      ref(instance)
      return () => {
        ref(null)
      }
    } else {
      ref.current = instance;
      return () => {
        ref.current = null;
      }
    }
  }, deps)
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

export function MyUseContext<T>(context: MyContext<T>): T {
  const fiber: MyFiber = currentlyFiber;
  if (fiber.alternate) {
    fiber.hook[addHookIndex()] as IMemoOrCallbackHook;
    let f = fiber.dependencies?.firstContext;
    while (f && f.context !== context) {
      f = f.next;
    }

    if (!f || f.context !== context) {
      return context._currentValue;
    }
    return f.memoizedValue as T;
  }

  let memoizedValue = undefined;
  let f = fiber;
  while (f) {
    if (f.tag === PROVIDERCOMPONENT && f.elementType._context === context) {
      memoizedValue = f.memoizedProps.value;
      break;
    }
    f = f.return;
  }

  const newContext: MyDependenciesContext<T> = {
    context,
    memoizedValue,
    next: null
  };

  if (!fiber.dependencies) {
    fiber.dependencies = {
      firstContext: newContext
    }
  } else {
    let f = fiber.dependencies.firstContext;
    while (f) {

      if (!f.next) {
        break;
      }
      f = f.next;
    }
    f.next = newContext
  }
  // 创建一个空的context；
  const newHook = {
  }
  fiber.hook.push(newHook)
  return newContext.memoizedValue;
}