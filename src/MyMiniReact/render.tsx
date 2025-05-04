import _ from "lodash";
import { DEFAULTLANE, DELETE, deletions, EFFECTHOOK, FUNCTIONCOMPONENT, getBatchUpdating, isInDebugger, NOEFFECT, NOLANE, PLACEMENT, REFEFFECT, ROOTCOMPONENT, UPDATE } from "./const";
import { createFiber } from "./fiber";
import { IDispatchValue, IEffectHook, IHook, IRefHook, IStateHook, IStateParams, MyElement, MyFiber } from "./type";
import { createDom, isHostComponent } from "./dom";
import { ensureRootIsScheduled } from "./ReactDom";
import { getPropsByElement, isDepEqual, isPropsEqual, isStringOrNumber, logEffectType } from "./utils";

let first = true;

export let currentlyFiber: MyFiber | null = null;
let hookIndex = 0;

export function getFlags(fiber: MyFiber) {
  let parent = fiber;
      while (parent && !(parent.flags & PLACEMENT)) {
        // console.log({ parent })
        parent = parent.return;
      }
  return (parent && ( parent.flags & PLACEMENT)) ? NOEFFECT : PLACEMENT ;
}

export function reconcileChildren(fiber: MyFiber, children: MyElement[]) {
  isInDebugger &&  console.log('reconcileChildren', _.cloneDeep({ fiber, children }))
  let index = 0;
  let prevSibling: MyFiber | null = null;
  let oldFiberSibling: MyFiber | null = fiber.alternate?.child ?? null;

  while (index < children.length || oldFiberSibling) {
    const child =  children[index];
    const isSameType = oldFiberSibling && ((oldFiberSibling.type === child.type &&
      oldFiberSibling.key === child.key)
    || (oldFiberSibling.type === 'text' && isStringOrNumber(child)))
    let newFiber: MyFiber | null = null;

    // console.log(_.cloneDeep({
    //   child,
    //   oldFiberSibling,
    //   fiber,
    //   isSameType
    // }))

    if (isSameType) {
      if (!isPropsEqual(getPropsByElement(child), oldFiberSibling.memoizedProps)) {
        newFiber = createFiber(child, index, oldFiberSibling, fiber);
        // console.log(getPropsByElement(child), oldFiberSibling.memoizedProps, 'Update', _.cloneDeep(newFiber))
        setFiberWithFlags(newFiber, UPDATE)
      }  else {
        if (oldFiberSibling.lanes === NOLANE && oldFiberSibling.childLanes === NOLANE) {
          newFiber = oldFiberSibling
          newFiber.return = fiber;
          // console.log('自己和儿子都没有更新', _.cloneDeep(oldFiberSibling), '重定向父亲', _.cloneDeep(fiber));
        } else {
          newFiber = createFiber(child, index, oldFiberSibling, fiber);
          newFiber.return = fiber;
          // console.warn('自己没更新，儿子需要更新', newFiber);
        }
        // newFiber = oldFiberSibling
      }
    } else if (!oldFiberSibling) {
      const flags = getFlags(fiber)
      newFiber = createFiber(child, index, oldFiberSibling, fiber);
      setFiberWithFlags(newFiber, flags)
      // console.log('新建', flags === PLACEMENT ? 'PLACEMENT' : 'NOEFFECT', newFiber)
    } else if (oldFiberSibling) {
      // oldFiberSibling.flags |= DELETE;
      setFiberWithFlags(oldFiberSibling, DELETE)
      deletions.push(oldFiberSibling);
      if (!_.isNil(child)) {
        newFiber = createFiber(child, index, null, fiber);
        setFiberWithFlags(newFiber, getFlags(fiber))
      }
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    oldFiberSibling = oldFiberSibling?.sibling ?? null;
    index++;
  }
  // console.log(_.cloneDeep(fiber))
  return fiber.child;
}

export function beginWork(fiber: MyFiber): MyFiber | null {
  if (!fiber) {
    return null;
  }

  if (
    fiber.lanes === NOLANE && 
    fiber.childLanes === NOLANE &&
    (!fiber.alternate || isPropsEqual(fiber.pendingProps, fiber.alternate.memoizedProps))
 ) {
    if (fiber.childLanes === NOLANE && fiber.lanes === NOLANE) {
      isInDebugger && console.log('跳过beginWork', fiber)
      return null;
    }
 }

 isInDebugger && console.warn('beginWork', _.cloneDeep(fiber))


  // if (fiber.alternate) {

  // }

  if (typeof fiber.type === 'function') {
    hookIndex = 0;
    const preFiber = currentlyFiber;
    currentlyFiber = fiber;
    const elements = (fiber.type as Function)(fiber.pendingProps);
    // console.log({ elements })
    const next = reconcileChildren(fiber, [elements]);
    currentlyFiber = preFiber;
    return next;
  }

  if (!fiber.pendingProps.children) {
    return null;
  }

  const next = reconcileChildren(fiber,
    _.isArray(fiber.pendingProps.children) ?
      fiber.pendingProps.children :
      [fiber.pendingProps.children]
  );

  return next;
}

export function getRootFiber(fiber: MyFiber): MyFiber {
  return fiber.return ? getRootFiber(fiber.return) : fiber
}

export function sumbitEffect(fiber: MyFiber) {
  if ((fiber.flags & EFFECTHOOK) && (fiber.tag !== ROOTCOMPONENT) ) {
      const parentFiber = getRootFiber(fiber);
      // 递归上传effect
      if (fiber.updateQueue.lastEffect) {
         if (!parentFiber.updateQueue.lastEffect) {
            parentFiber.updateQueue.firstEffect = fiber.updateQueue.firstEffect
         } else {
          parentFiber.updateQueue.lastEffect.next = fiber.updateQueue.firstEffect
         }
         parentFiber.updateQueue.lastEffect = fiber.updateQueue.lastEffect;
         fiber.updateQueue.lastEffect = null;
         fiber.updateQueue.firstEffect = null;
         fiber.flags &= ~EFFECTHOOK
     }

  }
}

export function completeWork(fiber: MyFiber) {
  fiber.memoizedProps = fiber.pendingProps;
  if (fiber && isHostComponent(fiber) && !fiber.stateNode) {
    createDom(fiber);
  }
 
  if (fiber.ref && (!fiber.alternate || fiber.ref !== fiber.alternate.ref)) {
    // console.log('ref变更', fiber);
    setFiberWithFlags(fiber, REFEFFECT)
  }

  const parentFiber = fiber.return;
  if (fiber.lastEffect && parentFiber) {
    if (parentFiber.lastEffect) {
      parentFiber.lastEffect.nextEffect = fiber.firstEffect;
    } else {
      parentFiber.firstEffect = fiber.firstEffect;
    }
    parentFiber.lastEffect = fiber.lastEffect;
    fiber.firstEffect = null;
    fiber.lastEffect = null;
    fiber.nextEffect = null;
  }


  if (fiber.lanes > NOLANE && fiber.tag !== ROOTCOMPONENT) {
    const parentFiber = fiber.return;
    if (parentFiber.lastEffect) {
      parentFiber.lastEffect.nextEffect = fiber;
    } else {
      parentFiber.firstEffect = fiber;
    }
    parentFiber.lastEffect = fiber;
  }

  sumbitEffect(fiber);
  isInDebugger && console.error('completeWork', _.cloneDeep(fiber));
  fiber.lanes = NOLANE;
  fiber.childLanes = NOLANE;

}

export function setFiberWithFlags(fiber: MyFiber, flags: number) {
  isInDebugger &&  console.error('添加', fiber, logEffectType(fiber))
  fiber.flags |= flags;
  fiber.lanes |= DEFAULTLANE;
  let currentFiber = fiber.return;

  while (currentFiber) {
    // console.log(currentFiber);
    currentFiber.childLanes |= fiber.lanes;
    currentFiber = currentFiber.return;
  }
  // rootFiber.lanes = lanes;
  // if (!rootFiber.firstEffect) {
  //   rootFiber.firstEffect = fiber;
  // }
  // if (flags === DELETE) {
  //   fiber.return = null;
  // }
}

export const globalUpdateList: IDispatchValue<unknown>[] = []

export function useState<T>(x: IStateParams<T>) : [T, (x: IStateParams<T>) => void] {
   const fiber = currentlyFiber;
   
   if (fiber.alternate) {
    const hook = fiber.hook[hookIndex++] as IStateHook<T>;
    while(hook.updateList.length) {
      const h = hook.updateList.shift();
      hook.memoizeState = _.isFunction(h) ? h(hook.memoizeState) : h;
    }
    hook.fiber = fiber;
    return [hook.memoizeState, hook.dispatchAction] as [T, (x: IStateParams<T>) => void];
   }

   let v: T = _.isFunction(x) ? x() : x;

   const updateList: IDispatchValue<T>[] = []
   const newHook: IStateHook<T> = {
    memoizeState: v,
    updateList,
    fiber,
    dispatchAction: (x: IDispatchValue<T>) => {
      updateList.push(x);
      // console.error('setState', newHook.fiber)
      setFiberWithFlags(newHook.fiber, UPDATE)
      if (!getBatchUpdating()) {
        ensureRootIsScheduled()
      }
    }
   }
   hookIndex++
   fiber.hook.push(newHook)
   return  [newHook.memoizeState, newHook.dispatchAction] as [T, (x: IStateParams<T>) => void];
}

export function pushEffect(fiber: MyFiber, newHook: IEffectHook) {
 if (!fiber.updateQueue.lastEffect) {
  fiber.updateQueue.firstEffect = newHook;
} else {
  fiber.updateQueue.lastEffect.next = newHook;
}
fiber.updateQueue.lastEffect = newHook;
setFiberWithFlags(fiber, EFFECTHOOK);
// console.log('打上EffectFiber', fiber)
}

let effectId = 0;
export function useEffect(create: () => (() => void) | void, deps: unknown[]) {
  const fiber: MyFiber = currentlyFiber;
  if (fiber.alternate) {
    const hook = fiber.hook[hookIndex++] as IEffectHook;
    if (!isDepEqual(hook.deps, deps)) {
      hook.create = create;
      hook.deps = deps;
      pushEffect(fiber, hook);

      // 需要更新。 需要更新的effect。应该放在updateQueue。
    }
    return;
  }
  // 执行时机不对。应该是先存起来。
  // // create执行时机应该是在commit之后。
  // const destroy = create()
  const newHook: IEffectHook = {
    id: effectId ++,
    tag: 1, // TODO,
    create,
    destroy: null,
    deps,
    next: null
  }
   // 首次进来必定需要更新。
  pushEffect(fiber, newHook)
  fiber.hook.push(newHook)
}


export function useRef<T>(x: T): Readonly<{ current: T}> {
  const fiber: MyFiber = currentlyFiber;
  if (fiber.alternate) {
    const hook = fiber.hook[hookIndex++] as IRefHook;
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