import _ from "lodash";
import { DEFAULTLANE, DELETE, deletions, FUNCTIONCOMPONENT, getBatchUpdating, isInDebugger, NOEFFECT, NOLANE, PLACEMENT, REFEFFECT, setBatchUpdating, UPDATE, workInProgress } from "./const";
import { createFiber } from "./fiber";
import { MyElement, MyElementType, MyElmemetKey, MyFiber } from "./type";
import { getPropsByElement, isPropsEqual, isStringOrNumber, logEffectType } from "./utils";
import { sumbitEffect } from "./completeWork";
import { ensureRootIsScheduled, runInBatchUpdate } from "./ReactDom";

export * from './hook'

export let currentlyFiber: MyFiber | null = null;
let hookIndex = 0;

export function addHookIndex() {
  return hookIndex++;
}

function getFlags(fiber: MyFiber) {
  let parent = fiber;
  while (parent && !(parent.flags & PLACEMENT)) {
    // console.log({ parent })
    parent = parent.return;
  }
  return (parent && (parent.flags & PLACEMENT)) ? NOEFFECT : PLACEMENT;
}

function canDiff(fiber: MyFiber, child?: MyElement) {
  return (fiber.key === child?.key && fiber.type === child?.type) || (fiber.type === 'text' && isStringOrNumber(child))
}

function findFiberByKeyAndType(list: MyFiber[], child?: MyElement) {
   const index = list.findIndex(c => canDiff(c, child));
   return index > -1 ? list.splice(index, 1)[0] : null;
}

function reconcileChildren(fiber: MyFiber, list: MyElement[]) {
  // console.log('reconcileChildren', _.cloneDeep({ fiber, list }))
  let children = _.flatten(list)
  let index = 0;
  let prevSibling: MyFiber | null = null;

  const totalFiberList = [];

  let f = fiber.lanes === NOLANE ? (fiber?.child ) :  (fiber.alternate?.child ?? null)
  while(f) {
    totalFiberList.push(f)
    f = f.sibling;
  }

  while (index < children.length || totalFiberList.length) {
    const child = children[index];
    let oldFiberSibling: MyFiber | null = index < children.length ?
     findFiberByKeyAndType(totalFiberList, child) : totalFiberList.shift()
    const isSameType = oldFiberSibling && canDiff(oldFiberSibling, child)
    let newFiber: MyFiber | null = null;

    // console.log(_.cloneDeep({
    //   child,
    //   oldFiberSibling,
    //   fiber,
    //   isSameType,
    //   bol: isSameType && isPropsEqual(getPropsByElement(child), oldFiberSibling.memoizedProps)
    // }))

    if (isSameType) {
      if (!isPropsEqual(getPropsByElement(child), oldFiberSibling.memoizedProps)) {
        newFiber = createFiber(child, index, oldFiberSibling);
        newFiber.return = fiber;
        let flags = UPDATE;
        if (newFiber.ref && newFiber.ref !== oldFiberSibling.ref) {
          flags |= REFEFFECT; 
        }
        // console.log(getPropsByElement(child), oldFiberSibling.memoizedProps, 'Update', _.cloneDeep(newFiber))
        // console.log('需要变更', _.cloneDeep(newFiber))
        setFiberWithFlags(newFiber, flags)
      } else {
        if (oldFiberSibling.lanes === NOLANE) {
          newFiber = oldFiberSibling
          newFiber.return = fiber;
        //  console.log('自己和儿子都没有更新', _.cloneDeep(oldFiberSibling), '重定向父亲', _.cloneDeep(fiber));
        } 
        else {
          newFiber = createFiber(child, index, oldFiberSibling);
          newFiber.return = fiber;
        //  console.warn('自己没更新，儿子需要更新', isPropsEqual(newFiber.pendingProps, oldFiberSibling.memoizedProps), logFiberIdPath(newFiber));
        }
        // newFiber = oldFiberSibling
      }
    } else if (!oldFiberSibling && index < children.length ) {
      let flags = getFlags(fiber);
      newFiber = createFiber(child, index, oldFiberSibling);
      newFiber.return = fiber;
      if (newFiber.ref) {
        flags |= REFEFFECT;
      }
      setFiberWithFlags(newFiber, flags)
      // console.log('新建', flags === PLACEMENT ? 'PLACEMENT' : 'NOEFFECT', newFiber)
    } else if (oldFiberSibling) {
      // oldFiberSibling.flags |= DELETE;
      // console.log('原来', oldFiberSibling, child)
      oldFiberSibling.return = fiber;
      dfsSumbitEffect(oldFiberSibling)
      // console.log('递归删除', _.cloneDeep(oldFiberSibling));
      if (index < children.length) {
        newFiber = createFiber(child, index, null);
        newFiber.return = fiber;
        setFiberWithFlags(newFiber, getFlags(fiber))
        // console.log('替换', _.cloneDeep(newFiber), logFiberIdPath(newFiber), logFiberIdPath(fiber));
      }
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      if (prevSibling) {
        prevSibling.sibling = newFiber;
      }
    }
    prevSibling = newFiber;
    oldFiberSibling = oldFiberSibling?.sibling ?? null;
    index++;
  }
  // console.log(_.cloneDeep(fiber))
  return fiber.child;
}

// let debugggerIndex  =0;
export function beginWork(fiber: MyFiber): MyFiber | null {
  // console.log('enter---->beginWork', fiber)
  // if (fiber.id === 5) {
  //   console.trace()
  // }
  if (!fiber) {
    return null;
  }

  if (
    fiber.lanes === NOLANE &&
    (!fiber.alternate || isPropsEqual(fiber.pendingProps, fiber.alternate.memoizedProps))
  ) {
    if (fiber.childLanes === NOLANE) {
      // console.log('所有子树跳过beginWork', _.cloneDeep(fiber))
      return null;
    } 
  }

  // console.warn('beginWork', _.cloneDeep(fiber))


  // if (fiber.alternate) {

  // }

  if (fiber.tag === FUNCTIONCOMPONENT) {
    // if (fiber.alternate && isPropsEqual(fiber.pendingProps, fiber.alternate.memoizedProps) && 
    // fiber.lanes === NOLANE && fiber.childLanes !== NOLANE) {
    //   console.log(fiber.id, '跳过函数重新渲染，直接进入儿子')
    //   return fiber.child;
    // }
    if (fiber.lanes === NOLANE) {
      // console.log(fiber.id, '本身不用更新', _.cloneDeep(fiber));
      return fiber.child;
    }

    hookIndex = 0;
    const preFiber = currentlyFiber;
    // 这里渲染过程中检测到有新的更新，该怎么做？


    currentlyFiber = fiber;

    const preBol = getBatchUpdating()
    setBatchUpdating(true)
    fiber.flags &= ~UPDATE;
    const  elements = (fiber.type as Function)(fiber.pendingProps);
    currentlyFiber = preFiber;
    const next = reconcileChildren(fiber, [elements]);
    setBatchUpdating(preBol)
    // 重新进来的时候，这里没有alternate。
    if (fiber.flags & UPDATE) {
      // console.log({
      //   workInProgress,
      //   fiber
      // })
      // console.log('组件渲染过程中有更新');
      ensureRootIsScheduled(false)
      return workInProgress;
    } 
    // console.log({ next, bol: workInProgress === fiber });
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


function dfsSumbitEffect(fiber: MyFiber) {
  if (!fiber) {
    return;
  }
  setFiberWithFlags(fiber, DELETE);
  deletions.push(fiber);
  sumbitEffect(fiber)
  
  let f = fiber.child;
  while(f) {
    dfsSumbitEffect(f);
    f = f.sibling;
  }
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