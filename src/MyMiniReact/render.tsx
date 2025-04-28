import _ from "lodash";
import { DEFAULTLANE, DELETE, deletions, getBatchUpdating, NOEFFECT, NOLANE, PLACEMENT, rootFiber, UPDATE } from "./const";
import { createFiber } from "./fiber";
import { IDispatchValue, IStateHook, IStateParams, MyElement, MyFiber } from "./type";
import { createDom, isHostComponent } from "./dom";
import { ensureRootIsScheduled } from "./ReactDom";
import { isPropsEqual, isStringOrNumber } from "./utils";

let first = true;

export let currentlyFiber: MyFiber | null = null;
let hookIndex = 0;

export function reconcileChildren(fiber: MyFiber, children: MyElement[]) {
  // console.log('reconcileChildren', _.cloneDeep({ fiber, children }))
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
      newFiber = createFiber(child, index, oldFiberSibling, fiber);
      if (!isPropsEqual(newFiber.pendingProps, oldFiberSibling.memoizedProps)) {
        setFiberWithFlags(newFiber, UPDATE)
      }
    } else if (!oldFiberSibling) {
      let flags = PLACEMENT;
      if (!rootFiber) {
        if (!first) {
          flags = NOEFFECT;
        }
        first = false;
      }

      newFiber = createFiber(child, index, oldFiberSibling, fiber);
      if (flags === PLACEMENT) {
        setFiberWithFlags(newFiber, flags)
      }
      // console.log('新建', child, newFiber)
    } else if (oldFiberSibling && !child) {
      // oldFiberSibling.flags |= DELETE;
      setFiberWithFlags(oldFiberSibling, DELETE)
      deletions.push(oldFiberSibling);
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
}

export function beginWork(fiber: MyFiber): MyFiber | null {
  if (!fiber) {
    return null;
  }
  console.warn('beginWork', _.cloneDeep(fiber))


  // if (fiber.alternate) {

  // }

  if (typeof fiber.type === 'function') {
    hookIndex = 0;
    currentlyFiber = fiber;
    const elements = (fiber.type as Function)(fiber.pendingProps);
    reconcileChildren(fiber, [elements]);
    currentlyFiber = null;
    return fiber.child;
  }

  if (!fiber.pendingProps.children) {
    return null;
  }

  reconcileChildren(fiber,
    _.isArray(fiber.pendingProps.children) ?
      fiber.pendingProps.children :
      [fiber.pendingProps.children]
  );

  return fiber.child;
}

export function completeWork(fiber: MyFiber) {
  if (fiber && isHostComponent(fiber) && !fiber.stateNode) {
    createDom(fiber);
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
  }


  if (fiber.lanes > NOLANE) {
    const parentFiber = fiber.return;
    if (parentFiber.lastEffect) {
      parentFiber.lastEffect.nextEffect = fiber;
    } else {
      parentFiber.firstEffect = fiber;
    }
    parentFiber.lastEffect = fiber;
  }
  console.error('completeWork', _.cloneDeep(fiber));
}

export function setFiberWithFlags(fiber: MyFiber, flags: number) {
  fiber.flags |= flags;
  const lanes = DEFAULTLANE;
  fiber.lanes = lanes;
  let currentFiber = fiber.return;

  while (currentFiber) {
    currentFiber.childLanes |= lanes;
    currentFiber = currentFiber.return;
  }
  // rootFiber.lanes = lanes;
  // if (!rootFiber.firstEffect) {
  //   rootFiber.firstEffect = fiber;
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