import _ from "lodash";
import { CONSUMNERCOMPONENT, DEFAULTLANE, DELETE, deletions, EFFECT_LAYOUT, EFFECT_PASSIVE, FORWARDREFCOMPONENT, FUNCTIONCOMPONENT, getBatchUpdating, INSERTBEFORE, isInDebugger, LAZYCOMPONENT, MEMOCOMPONENT, NOEFFECT, NOLANE, PLACEMENT, PORTAlCOMPONENT, PROVIDERCOMPONENT, REFEFFECT, ROOTCOMPONENT, rootFiber, setBatchUpdating, SUSPENSECOMPONENT, TEXTCOMPONENT, UPDATE, wipRoot, workInProgress } from "./const";
import { createFiber, dfsClearFiber } from "./fiber";
import { IEffectHook, MyContext, MyFiber, MyPortalElement, MyReactNode, MySingleReactNode } from "./type";
import { getEffectListId, getPropsByElement, isPropsEqual, isStringOrNumber, logEffectType, logFiberIdPath } from "./utils";
import { sumbitEffect } from "./completeWork";
import { ensureRootIsScheduled, runInBatchUpdate } from "./ReactDom";
import { isHostComponent, isTextComponent } from "./dom";
import { getElementId } from "./jsx-dev-runtime";
import { findFiberPath, findTagFiber, pushEffect } from "./hook";

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

function canDiff(fiber: MyFiber, child?: MySingleReactNode) {
  return (_.isObject(child) && fiber.key === child?.key && fiber.type === child?.type) || (isTextComponent(fiber) && isStringOrNumber(child))
}

function findFiberByKeyAndType(list: MyFiber[], child?: MySingleReactNode) {
  // console.log('findFiberByKeyAndType',_.cloneDeep({ list, child}))
  const index = list.findIndex(c => canDiff(c, child));
  return index > -1 ? list.splice(index, 1)[0] : null;
}

function reconcileChildren(fiber: MyFiber, list: MyReactNode[]) {
  // console.log('reconcileChildren', _.cloneDeep({ fiber, list }))
  let children = _.flatten(list)
  let index = 0;
  let prevSibling: MyFiber | null = null;

  const totalFiberList = [];

  let f = fiber.lanes === NOLANE ? (fiber?.child) : (fiber.alternate?.child ?? null)
  while (f) {
    totalFiberList.push(f)
    f = f.sibling;
  }

  // console.log('old', [...totalFiberList]);
  // console.log('------', _.cloneDeep({fiber, totalFiberList}))

  const adjustFiberList = [];

  let retFiber: MyFiber | null = null;

  let lastFiber: MyFiber | null = null;

  while (index < children.length || totalFiberList.length) {
    const child = children[index];
    let oldFiberSibling: MyFiber | null = index < children.length ?
      findFiberByKeyAndType(totalFiberList, child) : totalFiberList.shift()
    const isSameType = oldFiberSibling && canDiff(oldFiberSibling, child)
    let newFiber: MyFiber | null = null;

    // console.log(_.cloneDeep({
    //   index,
    //   child,
    //   oldFiberSibling,
    //   fiber,
    //   isSameType,
    //   len: children.length,
    //   bol: isSameType && isPropsEqual(getPropsByElement(child), oldFiberSibling.pendingProps, oldFiberSibling)
    // }))

    if (isSameType) {
      if (!isPropsEqual(getPropsByElement(child), oldFiberSibling.pendingProps, oldFiberSibling)) {
        // console.log('props变更', _.cloneDeep({
        //   newFiber,
        //   childElement: getPropsByElement(child),
        //   oldElement: oldFiberSibling.memoizedProps
        // }))
        newFiber = createFiber(child, index, oldFiberSibling);
        if (!retFiber) {
          retFiber = newFiber;
        }
        newFiber.return = fiber;
        let flags = UPDATE;
        if (isHostComponent(newFiber) && newFiber.ref && newFiber.ref !== oldFiberSibling.ref) {
          flags |= REFEFFECT;
        }
        // console.log(getPropsByElement(child), oldFiberSibling.memoizedProps, 'Update', _.cloneDeep(newFiber))
        // console.log('需要变更', _.cloneDeep(newFiber))
        setFiberWithFlags(newFiber, flags)
      } else {
        // console.log('props相等，类型相同', _.cloneDeep({ oldFiberSibling }))
        if (oldFiberSibling.lanes === NOLANE ||
          oldFiberSibling.flags === NOEFFECT
        ) {
          newFiber = oldFiberSibling
          if (oldFiberSibling.childLanes !== NOLANE && !retFiber) {
            retFiber = newFiber;
          }
          newFiber.return = fiber;
          // console.log('自己没有更新', _.cloneDeep(oldFiberSibling), '重定向父亲', _.cloneDeep(fiber));
        }
        else {
          newFiber = createFiber(child, index, oldFiberSibling);
          if (!retFiber) {
            retFiber = newFiber;
          }
          newFiber.return = fiber;
          //  console.warn('自己有更新', _.cloneDeep({oldFiberSibling}), isPropsEqual(newFiber.pendingProps, oldFiberSibling.memoizedProps), logFiberIdPath(newFiber));
        }
        // newFiber = oldFiberSibling
      }
    } else if (!oldFiberSibling && index < children.length) {
      let flags = getFlags(fiber);
      newFiber = createFiber(child, index, oldFiberSibling);
      if (!retFiber) {
        retFiber = newFiber;
      }
      newFiber.return = fiber;
      if (isHostComponent(newFiber) && newFiber.ref) {
        flags |= REFEFFECT;
      }
      setFiberWithFlags(newFiber, flags)
      // console.log('新建', flags === PLACEMENT ? 'PLACEMENT' : 'NOEFFECT', newFiber)
    } else if (oldFiberSibling) {
      // oldFiberSibling.flags |= DELETE;
      // console.log('原来', oldFiberSibling, child)
      oldFiberSibling.return = fiber;
      dfsSumbitEffect(oldFiberSibling)
      // console.log('递归删除', _.cloneDeep({oldFiberSibling, index, len: children.length}));
      if (index < children.length) {
        newFiber = createFiber(child, index, null);
        if (!retFiber) {
          retFiber = newFiber;
        }
        newFiber.return = fiber;
        setFiberWithFlags(newFiber, getFlags(fiber));
        // console.log('替换', _.cloneDeep(newFiber), logFiberIdPath(newFiber), logFiberIdPath(fiber));
      }
    } else {
      console.error('未处理的情况----》')
      throw new Error('未处理的情况----》')
    }

    if (!newFiber && index < children.length) {
      console.error('newFiber为空', _.cloneDeep({ fiber, index }))
      throw new Error('newFiber为空')
    }

    // console.log('---------\n', index, newFiber)

    if (newFiber) {
      adjustFiberList.push([newFiber.index, newFiber, index])
      newFiber.index = index;
      lastFiber = newFiber;
    }

    if (index === 0) {
      fiber.child = newFiber;
      // if (fiber.alternate) {
      //   fiber.alternate.child = null;
      // }
    } else {
      if (prevSibling) {
        prevSibling.sibling = newFiber;
      }
    }
    prevSibling = newFiber;
    oldFiberSibling = oldFiberSibling?.sibling ?? null;
    index++;
  }
  if (lastFiber) {
    lastFiber.sibling = null;
  }
  // console.log(_.cloneDeep(fiber))
  // console.log('retFiber', retFiber)
  // if (!retFiber) {
  //   console.error('retFiber为空', _.cloneDeep(fiber))
  // }
  // const newRetList = [];
  // let f2 = fiber.child;
  // while (f2) {
  //   newRetList.push(f2);
  //   f2 = f2.sibling;
  // }

  const dp: [number, number[]][] = new Array(adjustFiberList.length).fill(0).map((c, i) => [1, [i]]);
  const arr = _.map(adjustFiberList, '0');
  let ret = [0];
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < i; j++) {
      if (arr[i] > arr[j]) {
        if (dp[j][0] + 1 >= dp[i][0]) {
          const newRet = [...dp[j][1], i];
          dp[i] = [dp[j][0] + 1, newRet];
          if (_.size(newRet) >= _.size(ret)) {
            ret = newRet;
          }
        }
      }
    }
  }
  // console.log(arr, ret);
  if (_.size(ret) !== adjustFiberList.length) {
    // const finnalAdjustFiberList = [];
    for (let i = 0; i < adjustFiberList.length; i++) {
      if (!_.includes(ret, i)) {
        // const fistBigIndex = _.find(ret, (c) => c > i);

        // const newInsertIndex = fistBigIndex > -1 ? adjustFiberList[fistBigIndex][1].index : -1;
        // adjustFiberList[i][1].newInsertIndex = newInsertIndex;
        // finnalAdjustFiberList.push(adjustFiberList[i][1]);
        // console.warn(ret,adjustFiberList[i][1], newInsertIndex);
        adjustFiberList[i][1].flags |= INSERTBEFORE;
        if (!retFiber || adjustFiberList[i][1].index < retFiber.index) {
          retFiber = adjustFiberList[i][1];
        }
        // setFiberWithFlags(adjustFiberList[i][1], INSERTBEFORE);
      }
    }
    // console.log('new', _.cloneDeep({ newRetList, adjustFiberList, ret, finnalAdjustFiberList } ))
  }

  if (fiber.alternate) {
    fiber.alternate.child = null;
    fiber.alternate.sibling = null;
  }

  return retFiber ?? fiber.child;
}

function resetLaneProps(fiber: MyFiber) {
  fiber.memoizedProps = fiber.pendingProps;
  fiber.lanes = NOLANE;
}

function cloneChildFiber(parentFiber: MyFiber) {
  let oldFiberSibling = parentFiber.child;
  let newFiber: MyFiber | null = null;
  let retFiber: MyFiber | null = null;
  let prevSibling: MyFiber | null = null;
  while (oldFiberSibling) {
    if (oldFiberSibling.lanes === NOLANE ||
      oldFiberSibling.flags === NOEFFECT
    ) {
      newFiber = oldFiberSibling
      if (oldFiberSibling.childLanes !== NOLANE && !retFiber) {
        retFiber = newFiber;
      }
      newFiber.return = parentFiber;
      // console.log('自己没有更新', _.cloneDeep(oldFiberSibling), '重定向父亲', _.cloneDeep(fiber));
    }
    else {
      newFiber = createFiber(oldFiberSibling.element, oldFiberSibling.index, oldFiberSibling);
      if (!retFiber) {
        retFiber = newFiber;
      }
      newFiber.return = parentFiber;
      //  console.warn('自己有更新', _.cloneDeep({oldFiberSibling}), isPropsEqual(newFiber.pendingProps, oldFiberSibling.memoizedProps), logFiberIdPath(newFiber));
    }
    if (newFiber.index === 0) {
      parentFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    oldFiberSibling = oldFiberSibling.sibling;
  }
  return retFiber ?? parentFiber.child;
}

export function handleFunctionComponent(fiber: MyFiber, isRef: boolean) {

  // if (fiber.alternate && isPropsEqual(fiber.pendingProps, fiber.alternate.memoizedProps) && 
  // fiber.lanes === NOLANE && fiber.childLanes !== NOLANE) {
  //   console.log(fiber.id, '跳过函数重新渲染，直接进入儿子')
  //   return fiber.child;
  // }
  // console.error('fiber', fiber.id, fiber.lanes, _.cloneDeep(fiber))
  if (fiber.lanes === NOLANE) {
    // console.log(fiber.id, '本身不用更新', _.cloneDeep(fiber));
    if (fiber.childLanes !== NOLANE) {
      return cloneChildFiber(fiber)
    }
    return fiber.child;
  }

  hookIndex = 0;
  const preFiber = currentlyFiber;
  // 这里渲染过程中检测到有新的更新，该怎么做？


  currentlyFiber = fiber;

  // console.log(_.cloneDeep({ fiber, path: getEffectListId(fiber) }))

  const preBol = getBatchUpdating()
  setBatchUpdating(true)
  fiber.flags &= ~UPDATE;
  const elements = (isRef ? fiber.type.render : fiber.type as Function)(fiber.pendingProps, isRef ? fiber.ref : undefined);
  currentlyFiber = preFiber;
  const next = reconcileChildren(fiber, [elements]);
  setBatchUpdating(preBol)
  // 重新进来的时候，这里没有alternate。
  if (fiber.flags & UPDATE) {
    // console.log({
    //   workInProgress,
    //   fiber
    // })
    // console.log('组件渲染过程中有更新', getEffectListId(wipRoot), _.cloneDeep(
    //   {wipRoot}
    // ));
    ensureRootIsScheduled(false)
    // resetLaneProps(fiber)
    return workInProgress;
  }
  resetLaneProps(fiber)
  // console.log({ next, bol: workInProgress === fiber });
  return next;

}

export function notifyChildFiber<T>(fiber: MyFiber, context: MyContext<T>,
  newValue: T
) {
  let f = fiber.child;
  while (f) {
    if (f.tag === CONSUMNERCOMPONENT) {
      setFiberWithFlags(f, UPDATE)
    } else {
      let c = f.dependencies?.firstContext
      // console.log({ c })
      while (c) {
        if (c.context === context) {
          c.memoizedValue = newValue;
          setFiberWithFlags(f, UPDATE)
          break;
        }
        c = c.next;
      }
    }
    notifyChildFiber(f, context, newValue);
    f = f.sibling;
  }
}

export function handlePromiseError(fiber: MyFiber, e: Error) {
  if (!(e instanceof Promise)) {
    throw e;
  }
  let suspenseFiber = fiber;
  while (suspenseFiber && suspenseFiber.tag !== SUSPENSECOMPONENT) {
    suspenseFiber = suspenseFiber.return;
  }
  // TODO ErrorBoundary
  if (!suspenseFiber || suspenseFiber.tag !== SUSPENSECOMPONENT) {
    throw e;
  }
  //  console.warn('找到suspenseFiber', suspenseFiber)
  e.then(() => {
    const path = findFiberPath(suspenseFiber);
    const currentRootFiber = path[path.length - 1];
    if (currentRootFiber.tag !== ROOTCOMPONENT) {
      return;
    }
    const targetFiber = wipRoot ? findTagFiber(suspenseFiber, path, wipRoot) : rootFiber ? findTagFiber(suspenseFiber, path, rootFiber) : suspenseFiber;
    setFiberWithFlags(targetFiber, UPDATE);
    ensureRootIsScheduled(true);
  })



  suspenseFiber.firstEffect = null;
  suspenseFiber.lastEffect = null;
  // let hookList = suspenseFiber.hook;
  suspenseFiber.updateQueue.firstEffect = null;
  suspenseFiber.updateQueue.lastEffect = null;
  dfsClearFiber(suspenseFiber);
  if (suspenseFiber.alternate) {
    dfsClearFiber(suspenseFiber.alternate);
  }
  suspenseFiber.child = null;
  // for(const hook of  hookList) {
  //   if (((hook as IEffectHook).tag & EFFECT_LAYOUT)
  //    || ((hook as IEffectHook).tag & EFFECT_PASSIVE)) {
  //   pushEffect(suspenseFiber, hook as IEffectHook)
  //   }
  // }
  // 这里一定没有effect 。
  // console.warn('重新enter', _.cloneDeep(suspenseFiber))
  return reconcileChildren(suspenseFiber, [
    suspenseFiber.pendingProps.fallback
  ])
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
    (!fiber.alternate || isPropsEqual(fiber.pendingProps, fiber.memoizedProps, fiber))
  ) {
    if (fiber.childLanes === NOLANE) {
      // console.log('所有子树跳过beginWork', _.cloneDeep(fiber))
      return null;
    }
  }

  // console.error('beginWork', _.cloneDeep({
  //   type: logEffectType(fiber),
  //   id: fiber.id,
  //   fiber}))


  // if (fiber.alternate) {

  // }

  if (fiber.tag === MEMOCOMPONENT) {
    // console.warn('memo', fiber.id, fiber.pendingProps)
    const next = reconcileChildren(fiber,
      [
        {
          elementId: -3,
          $$typeof: window.reactType,
          type: fiber.type.type,
          props: fiber.pendingProps,
          ref: fiber.ref,
          _owner: null,
          _store: null,
          key: fiber.key
        }
      ]
    );
    resetLaneProps(fiber)
    return next;
  }

  if (fiber.tag === PROVIDERCOMPONENT) {
    if (fiber.alternate && fiber.pendingProps.value !== fiber.memoizedProps.value) {
      // console.warn(_.cloneDeep({ fiber}))
      notifyChildFiber(fiber, fiber.elementType._context, fiber.pendingProps.value);
    }
    // resetLaneProps(fiber)
  }

  if (fiber.tag === CONSUMNERCOMPONENT) {
    // console.log(fiber, fiber.lanes, fiber.childLanes)
    if (fiber.lanes === NOLANE) {
      // console.log(fiber.id, '本身不用更新', _.cloneDeep(fiber));
      if (fiber.childLanes !== NOLANE) {
        return cloneChildFiber(fiber)
      }
      // console.log('enter')
      return fiber.child;
    }

    let memoizedValue = undefined;
    let f = fiber;
    while (f) {
      if (f.tag === PROVIDERCOMPONENT && f.elementType._context ===
        fiber.elementType._context
      ) {
        memoizedValue = f.memoizedProps.value;
        break;
      }
      f = f.return;
    }
    const next = reconcileChildren(fiber,
      [
        (fiber.pendingProps.children as Function)(
          memoizedValue
        )
      ]
    )
    resetLaneProps(fiber)
    // console.log(fiber.lanes)
    return next;
  }

  if (fiber.tag === PORTAlCOMPONENT) {
    resetLaneProps(fiber);
    return reconcileChildren(fiber, [
      (fiber.element as MyPortalElement)?.children
    ])
  }

  if (fiber.tag === SUSPENSECOMPONENT) {
    fiber.flags &= ~UPDATE;
  }

  if (fiber.tag === LAZYCOMPONENT) {
    try {
      const type = fiber.type;
      const Comp = type._init(type._payload);
      resetLaneProps(fiber)
      return reconcileChildren(fiber, [
        {
          elementId: -4,
          $$typeof: window.reactType,
          type: Comp,
          props: fiber.pendingProps,
          ref: fiber.ref,
          _owner: null,
          _store: null,
          key: fiber.key
        }
      ])
    } catch (e) {
      return handlePromiseError(fiber, e);
    }
  }

  if (fiber.tag === FUNCTIONCOMPONENT || fiber.tag === FORWARDREFCOMPONENT) {
    try {
      return handleFunctionComponent(fiber, fiber.tag === FORWARDREFCOMPONENT);
    } catch (e) {
      return handlePromiseError(fiber, e);
    }
  }

  if (_.isNil(fiber.pendingProps?.children)) {
    resetLaneProps(fiber)
    return null;
  }

  const next = reconcileChildren(fiber,
    _.isArray(fiber.pendingProps.children) ?
      fiber.pendingProps.children :
      [fiber.pendingProps.children]
  );

  // if (fiber.tag === PROVIDERCOMPONENT) {
  //   console.warn(_.cloneDeep(fiber));
  // }

  resetLaneProps(fiber)
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
  while (f) {
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