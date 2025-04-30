import _ from "lodash";
import { DEFAULTLANE, DELETE, deletions, getBatchUpdating, NOEFFECT, NOLANE, PLACEMENT, rootFiber, UPDATE } from "./const";
import { createFiber } from "./fiber";
import { IDispatchValue, IStateHook, IStateParams, MyElement, MyFiber } from "./type";
import { createDom, isHostComponent } from "./dom";
import { ensureRootIsScheduled } from "./ReactDom";
import { getPropsByElement, isPropsEqual, isStringOrNumber } from "./utils";

let first = true;

export let currentlyFiber: MyFiber | null = null;
let hookIndex = 0;

export function getFlags(fiber: MyFiber) {
  let parent = fiber;
      while (parent && !(parent.flags & PLACEMENT)) {
        // console.log({ parent })
        parent = parent.return;
      }
  return parent && ( parent.flags & PLACEMENT) ? NOEFFECT : PLACEMENT ;
}

export function reconcileChildren(fiber: MyFiber, children: MyElement[]) {
  console.log('reconcileChildren', _.cloneDeep({ fiber, children }))
  let index = 0;
  let prevSibling: MyFiber | null = null;
  let oldFiberSibling: MyFiber | null = fiber.alternate?.child ?? null;

  while (index < children.length || oldFiberSibling) {
    const child =  children[index];
    const isSameType = oldFiberSibling && ((oldFiberSibling.type === child.type &&
      oldFiberSibling.key === child.key)
    || (oldFiberSibling.type === 'text' && isStringOrNumber(child)))
    let newFiber: MyFiber | null = null;

    console.log(_.cloneDeep({
      child,
      oldFiberSibling,
      fiber,
      isSameType
    }))

    if (isSameType) {
  
      newFiber = createFiber(child, index, oldFiberSibling, fiber);
      if (!isPropsEqual(getPropsByElement(child), oldFiberSibling.memoizedProps)) {
        // newFiber = createFiber(child, index, oldFiberSibling, fiber);
        setFiberWithFlags(newFiber, UPDATE)
      }  else {
        console.warn('复用整个newFiber', newFiber, newFiber.childLanes, newFiber.lanes)
        // if (newFiber.lanes === NOLANE && newFiber.childLanes === NOLANE) {
        //   newFiber = oldFiberSibling
        // }
        // newFiber = oldFiberSibling
      }
    } else if (!oldFiberSibling) {
      const flags = getFlags(fiber)
      newFiber = createFiber(child, index, oldFiberSibling, fiber);
      if (flags === PLACEMENT) {
        setFiberWithFlags(newFiber, flags)
      }
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
    fiber.alternate && 
    isPropsEqual(fiber.pendingProps, fiber.alternate.memoizedProps)
 ) {
    if (fiber.childLanes === NOLANE && fiber.lanes === NOLANE) {
      console.log('跳过beginWork', fiber)
      return null;
    }
 }

  console.warn('beginWork', _.cloneDeep(fiber))


  // if (fiber.alternate) {

  // }

  if (typeof fiber.type === 'function') {
    hookIndex = 0;
    const preFiber = currentlyFiber;
    currentlyFiber = fiber;
    const elements = (fiber.type as Function)(fiber.pendingProps);
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

export function completeWork(fiber: MyFiber) {
  fiber.memoizedProps = fiber.pendingProps;
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
  console.error('添加', fiber, {
    [PLACEMENT]: 'PLACEMENT',
    [DELETE]: 'DELETE',
    [UPDATE]: 'UPDATE'
  }[flags])
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