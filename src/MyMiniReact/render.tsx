import _ from "lodash";
import { DEFAULTLANE, DELETE, deletions, EFFECT_DESTROY, EFFECT_HOOK_HAS_EFFECT, EFFECTHOOK, isInDebugger, NOEFFECT, NOLANE, PLACEMENT, REFEFFECT, ROOTCOMPONENT, UPDATE } from "./const";
import { createFiber } from "./fiber";
import { MyElement, MyFiber } from "./type";
import { createDom, isHostComponent } from "./dom";
import { getPropsByElement, isPropsEqual, isStringOrNumber, logEffectType } from "./utils";

export * from './hook'

export let currentlyFiber: MyFiber | null = null;
export let hookIndex = 0;

export function addHookIndex() {
  return hookIndex++;
}

export function getFlags(fiber: MyFiber) {
  let parent = fiber;
  while (parent && !(parent.flags & PLACEMENT)) {
    // console.log({ parent })
    parent = parent.return;
  }
  return (parent && (parent.flags & PLACEMENT)) ? NOEFFECT : PLACEMENT;
}

export function reconcileChildren(fiber: MyFiber, list: MyElement[]) {
  isInDebugger && console.log('reconcileChildren', _.cloneDeep({ fiber, list }))
  let children = _.flatten(list)
  let index = 0;
  let prevSibling: MyFiber | null = null;
  let oldFiberSibling: MyFiber | null = fiber.alternate?.child ?? null;

  while (index < children.length || oldFiberSibling) {
    const child = children[index];
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
      } else {
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
    let elements = (fiber.type as Function)(fiber.pendingProps);
    // console.log({ elements })
    // if (_.isArray(elements.props.children)) {
    //   elements = {..._.flatten(elements)}
    // }
    const next = reconcileChildren(fiber, [elements]);
    currentlyFiber = preFiber;
    return next;
  }

  if (!fiber.pendingProps?.children) {
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
  const bol = (fiber.flags & EFFECTHOOK);
  const destroyBol = (fiber.flags & DELETE);
  if ((bol || destroyBol) && (fiber.tag !== ROOTCOMPONENT)) {
    const parentFiber = getRootFiber(fiber);
    // 递归上传effect
    let f = fiber.updateQueue.firstEffect;
    
    while (f) {

      if ((f.tag & EFFECT_HOOK_HAS_EFFECT) || destroyBol) {
        if (destroyBol) { 
          f.tag |= EFFECT_DESTROY
        };
        if (!parentFiber.updateQueue.lastEffect) {
          parentFiber.updateQueue.firstEffect = f
        } else {
          parentFiber.updateQueue.lastEffect.next = f
        }
        parentFiber.updateQueue.lastEffect = f;
        f.tag &= ~EFFECT_HOOK_HAS_EFFECT
        //  fiber.updateQueue.lastEffect = null;
        //  fiber.updateQueue.firstEffect = null
      }
      f = f.next
    }

    if (destroyBol && (fiber.ref)) {
      fiber.flags |= REFEFFECT;
    }
    
    // console.log(_.cloneDeep({ fiber }))

    fiber.flags &= ~EFFECTHOOK
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
  isInDebugger && console.error('添加', fiber, logEffectType(fiber))
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