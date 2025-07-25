import _ from "lodash";
import { CLASSCOMPONENT, SNAPSHOT, CONSUMNERCOMPONENT, CONTEXTCHANGE, DEFAULTLANE, DELETE, deletions, FORCEUPDATE, FORWARDREFCOMPONENT, FUNCTIONCOMPONENT, getBatchUpdating, INSERTBEFORE, isInDebugger, LAZYCOMPONENT, MEMOCOMPONENT, NOEFFECT, NOLANE, PLACEMENT, PORTAlCOMPONENT, PROVIDERCOMPONENT, REFEFFECT, setBatchUpdating, SUSPENSECOMPONENT, UPDATE, workInProgress, UPDATEORMOUNT, ErrorBoundary, ErrorFiberList, NoHandleError, SUSPENSE_FLAGS, PLACEMENT_SKIP, SUSPENSE_REMOVE, RENDER_SUSPENSE, RETRY_ERROR_BOUNDARY, GetDeriveStateFromErrorFiberList } from "./const";
import { breakCurrentWork, clearFiber, createFiber, findCurrentFiberInCurrentRoot } from "./fiber";
import { MyContext, MyFiber, MyPortalElement, MyReactNode, MySingleReactNode } from "./type";
import { getPropsByElement, isPropsEqual, isStringOrNumber, getFiberTag, flagsContain, flagsAdd, flagsRemove, ensureFiberContainedByRootFiber } from "./utils";
import { sumbitEffect } from "./completeWork";
import { ensureRootIsScheduled } from "./ReactDom";
import { isClassComponent, isErrorBoundaryComponent, isHostComponent, isSuspenseComponent, isTextComponent } from "./dom";
import { addContextToFiber, readContext } from "./hook";

export * from './hook'

export let currentlyFiber: MyFiber | null = null;
let hookIndex = 0;

export function addHookIndex() {
  return hookIndex++;
}

export function getFlags(fiber: MyFiber) {
  let parent = fiber;
  while (parent && !flagsContain(parent.flags, PLACEMENT)) {
    // console.log({ parent })
    parent = parent.return;
  }
  return (parent && flagsContain(parent.flags, PLACEMENT)) ? PLACEMENT_SKIP : PLACEMENT;
}

function canDiff(fiber: MyFiber, child?: MySingleReactNode) {
  return (
    (child as MyPortalElement)?.$$typeof === window.reactPortalType
    && (child as MyPortalElement)?.key === fiber.key
  ) ||
    (_.isObject(child) && fiber.key === child?.key && fiber.type === child?.type) || (isTextComponent(fiber) && isStringOrNumber(child))
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

  let f = fiber.lanes === NOLANE || !fiber.commitCount ? (fiber?.child) : (fiber.alternate?.child ?? null)
  while (f) {
    totalFiberList.push(f)
    f = f.sibling;
  }

  // console.log('old', _.cloneDeep(fiber), _.map(totalFiberList, 'id'), _.cloneDeep([...totalFiberList]));
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

    // console.log('reconcileChildren', _.cloneDeep({
    //   index,
    //   child,
    //   oldFiberSibling,
    //   fiber,
    //   isSameType,
    //   len: children.length,
    //   bol: isSameType && isPropsEqual(getPropsByElement(child), oldFiberSibling.pendingProps, oldFiberSibling),
    //   tag: oldFiberSibling ? getFiberTag(oldFiberSibling) : null
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
        if ((isHostComponent(newFiber)
          || isClassComponent(newFiber)) && newFiber.ref && newFiber.ref !== oldFiberSibling.ref) {
          flags = flagsAdd(flags, REFEFFECT);
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
          //  console.warn('自己有更新', _.cloneDeep({oldFiberSibling}), isPropsEqual(newFiber.pendingProps, oldFiberSibling.memoizedProps), getFiberIdPathArrow(newFiber));
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
      if ((isHostComponent(newFiber) ||
        isClassComponent(newFiber)) && newFiber.ref) {
        flags = flagsAdd(flags, REFEFFECT);
      }
      setFiberWithFlags(newFiber, flags)
      // console.log('新建', flags === PLACEMENT ? 'PLACEMENT' : 'NOEFFECT', newFiber)
    } else if (oldFiberSibling) {
      // oldFiberSibling.flags |= DELETE;
      // console.log('原来', oldFiberSibling, child)
      oldFiberSibling.return = fiber;
      if (flagsContain(oldFiberSibling.flags, SUSPENSE_REMOVE)) {
        // console.error('suspense-remove', _.cloneDeep(oldFiberSibling))
        deletions.push(oldFiberSibling);
      } else {
        console.error('beginWork过程中删除', _.cloneDeep(oldFiberSibling))
        dfsSumbitEffect(oldFiberSibling)
      }
      // console.log('递归删除', _.cloneDeep({oldFiberSibling, index, len: children.length}));
      if (index < children.length) {
        newFiber = createFiber(child, index, null);
        if (!retFiber) {
          retFiber = newFiber;
        }
        newFiber.return = fiber;
        setFiberWithFlags(newFiber, getFlags(fiber));
        // console.log('替换', _.cloneDeep(newFiber), getFiberIdPathArrow(newFiber), getFiberIdPathArrow(fiber));
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
        adjustFiberList[i][1].flags = flagsAdd(adjustFiberList[i][1].flags, INSERTBEFORE);
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

  let ttt = fiber.child;
  const newFiberChildList = []
  while (ttt) {
    newFiberChildList.push(ttt)
    ttt = ttt.sibling;
  }
  // console.log('currentFiber', _.cloneDeep(fiber), 'newChildren', _.map(newFiberChildList, 'id'), _.cloneDeep([...newFiberChildList]));
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
      // console.warn('完全复用', _.cloneDeep(newFiber))
      if (oldFiberSibling.childLanes !== NOLANE && !retFiber) {
        retFiber = newFiber;
      }
      newFiber.return = parentFiber;
      // console.log('自己没有更新', _.cloneDeep(oldFiberSibling), '重定向父亲', _.cloneDeep(fiber));
    }
    else {
      newFiber = createFiber(oldFiberSibling.element, oldFiberSibling.index, oldFiberSibling);
      // console.error('cloneChildFiber', _.cloneDeep(newFiber))
      if (!retFiber) {
        retFiber = newFiber;
      }
      newFiber.return = parentFiber;
      //  console.warn('自己有更新', _.cloneDeep({oldFiberSibling}), isPropsEqual(newFiber.pendingProps, oldFiberSibling.memoizedProps), getFiberIdPathArrow(newFiber));
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

export function handleClassComponent(fiber: MyFiber) {
  if (fiber.lanes === NOLANE) {
    // console.log(fiber.id, '本身不用更新', _.cloneDeep(fiber));
    if (fiber.childLanes !== NOLANE) {
      return cloneChildFiber(fiber)
    }
    return fiber.child;
  }

  // console.error('handleClassComponent', _.cloneDeep(fiber), getFiberTag(fiber))

  const CLASSFN = fiber.type;

  const isFirst = !fiber.stateNode
  if (isFirst) {
    let contextInstance = {};
    if (CLASSFN.contextType) {
      contextInstance = addContextToFiber(CLASSFN.contextType, fiber).memoizedValue;
    }
    fiber.stateNode = new CLASSFN(fiber.pendingProps);
    fiber.stateNode.context = contextInstance;
    fiber.stateNode._reactInternals = fiber;
  }

  if (flagsContain(fiber.flags, NoHandleError)) {
    fiber.flags = flagsRemove(fiber.flags, NoHandleError)
    resetLaneProps(fiber);
    return reconcileChildren(fiber, []);
  }

  const instace = fiber.stateNode;

  if (flagsContain(fiber.flags, CONTEXTCHANGE)) {
    instace.context = readContext(CLASSFN.contextType, fiber);
    fiber.flags = flagsRemove(fiber.flags, CONTEXTCHANGE);
  }
  // 魔改存在这里
  let nextState = { ...instace.state };
  let updateStateBol = false;
  if (flagsContain(fiber.flags, UPDATE)) {
    instace.props = fiber.pendingProps;
    while (instace.updateList.length) {
      const h = instace.updateList.shift();
      // console.error('useState-shift', _.cloneDeep(h))
      updateStateBol = true;
      nextState = _.isFunction(h) ? {
        ...nextState,
        ...h(nextState)
      } : {
        ...nextState,
        ...h
      };
    }
    fiber.flags = flagsRemove(fiber.flags, UPDATE)
  }

  if (CLASSFN.getDerivedStateFromProps) {
    const newState2 = CLASSFN.getDerivedStateFromProps(fiber.pendingProps, instace.state)
    if (newState2) {
      updateStateBol = true;
      nextState = {
        ...nextState,
        ...newState2
      };
    }
  }


  if (!isFirst) {
    if (!flagsContain(fiber.flags, FORCEUPDATE) &&
      (
        _.isFunction(instace.shouldComponentUpdate) &&
        !instace.shouldComponentUpdate(
          fiber.pendingProps,
          nextState
        ))) {
      fiber.memoizedState = {
        ...fiber.memoizedState,
        prevState: instace.state
      }
      instace.state = nextState;
      resetLaneProps(fiber);
      return null
    }
  }
  if (updateStateBol) {
    fiber.memoizedState = {
      ...fiber.memoizedState,
      prevState: instace.state
    }
    instace.state = nextState;
  }

  let preBol = getBatchUpdating()
  let next: MyFiber | null = null;
  try {
    setBatchUpdating(true)

    const elements = instace.render();

    if (flagsContain(fiber.flags, FORCEUPDATE)) {
      while (instace.forceUpdateList.length) {
        instace.forceUpdateList.shift()
      }
      fiber.flags = flagsRemove(fiber.flags, FORCEUPDATE)
    }

    if (_.isFunction(instace.getSnapshotBeforeUpdate)
    ) {
      setFiberWithFlags(fiber, SNAPSHOT)
    }
    if (_.isFunction(instace.componentDidMount)
      || _.isFunction(instace.componentDidUpdate)) {
      setFiberWithFlags(fiber, UPDATEORMOUNT)
    }

    next = reconcileChildren(fiber, [elements]);
  } finally {
    setBatchUpdating(preBol)
  }
  // 重新进来的时候，这里没有alternate。
  if (flagsContain(fiber.flags, UPDATE)) {
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
  const preBol = getBatchUpdating()
  let next: MyFiber | null = null;
  try {

    // console.log(_.cloneDeep({ fiber, path: getEffectListId(fiber) }))
    setBatchUpdating(true)
    fiber.flags = flagsRemove(fiber.flags, UPDATE);
    const elements = (isRef ? fiber.type.render : fiber.type as Function)(fiber.pendingProps, isRef ? fiber.ref : undefined);
    next = reconcileChildren(fiber, [elements]);
  } finally {
    setBatchUpdating(preBol)
    currentlyFiber = preFiber;
  }
  // 重新进来的时候，这里没有alternate。
  if (flagsContain(fiber.flags, UPDATE)) {
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
          setFiberWithFlags(f, isClassComponent(f) ? CONTEXTCHANGE : UPDATE)
          // console.log('notifyChildFiber', f, newValue)
          break;
        }
        c = c.next;
      }
    }
    notifyChildFiber(f, context, newValue);
    f = f.sibling;
  }
}
let id = 0;
export function handleErrorBoundary(fiber: MyFiber, e: Error): MyFiber {
  // console.error('handleErrorBoundary', fiber, e);
  resetLaneProps(fiber)
  let targetFiber = fiber.return;
  while (targetFiber && !isErrorBoundaryComponent(targetFiber)) {
    // console.log('loop', targetFiber)
    targetFiber = targetFiber.return;
  }
  if (!targetFiber || !isErrorBoundaryComponent(targetFiber)) {
    throw e;
  }

  console.log('找到Errorboundary', targetFiber)

  if (id++ > 10) {
    throw new Error('xxxx')
  }

  const isGetDerivedStateFromError = _.isFunction(targetFiber.type.getDerivedStateFromError);

  const newDeletion = [];
  for(const x of deletions) {
    if (!(ensureFiberContainedByRootFiber(x, targetFiber)
       || ensureFiberContainedByRootFiber(x, targetFiber.alternate))) {
      newDeletion.push(x)
    } else {
      // console.error('过滤掉', _.cloneDeep(x))
      // TODO 这里要不要处理
      // clearFiber(x);
    }
  }
  deletions.splice(0, deletions.length, ...newDeletion)

  if (_.isFunction(targetFiber.stateNode?.componentDidCatch)) {
    setFiberWithFlags(targetFiber, ErrorBoundary);
    ErrorFiberList.push({
      fiber: targetFiber,
      error: e
    })
    if (!isGetDerivedStateFromError) {
      return breakCurrentWork(fiber)
    }
  }

  if (isGetDerivedStateFromError) {
    try {
      // const newstate = targetFiber.type.getDerivedStateFromError(e);
      // if (newstate) {
      //   targetFiber.stateNode.state = {
      //     ...targetFiber.stateNode.state,
      //     ...newstate
      //   }
      //   setFiberWithFlags(targetFiber, UPDATE)
      // }
      setFiberWithFlags(targetFiber, RETRY_ERROR_BOUNDARY)
      GetDeriveStateFromErrorFiberList.push({
        fiber: targetFiber,
        error: e,
      })
      return breakCurrentWork(fiber)
      // console.log('newState',  targetFiber.stateNode.state)
    } catch (newE) {
      return handleErrorBoundary(targetFiber, newE)
    }
  }

  console.warn('未处理的情况')

  return null;
}


export function handlePromiseError(fiber: MyFiber, e: Error, isNotSuspense: boolean) {
  // console.log(fiber, e, isNotSuspense)
  resetLaneProps(fiber);
  if (!(e instanceof Promise) || isNotSuspense) {
    return handleErrorBoundary(fiber, e);
  }
  let suspenseFiber = fiber.return;
  while (suspenseFiber && (
    !isSuspenseComponent(suspenseFiber)
    // || isErrorClassComponent(suspenseFiber)
  )) {
    suspenseFiber = suspenseFiber.return;
  }
  // TODO ErrorBoundary
  if (!suspenseFiber || !(isSuspenseComponent(suspenseFiber)
    // || isErrorClassComponent(suspenseFiber)
  )) {
    return handleErrorBoundary(fiber, e);
  }
  //  console.warn('找到suspenseFiber', suspenseFiber)
  e.then(() => {
    const targetFiber = findCurrentFiberInCurrentRoot(suspenseFiber);
    if (!targetFiber) {
      return;
    }
    // logFiberTree(rootFiber);
    // console.log(ensureFiberContainedByRootFiber(suspenseFiber, rootFiber), ensureFiberContainedByRootFiber(suspenseFiber, wipRoot))
    // alert('promise-resolve')
    // console.warn('\n\n\n\npromise-resolve\n\n\n\n');
    // console.log('promise-resolve', e, _.cloneDeep({targetFiber, suspenseFiber, path: findFiberPath(suspenseFiber), wipRoot, rootFiber}));
    targetFiber.flags = flagsRemove(targetFiber.flags, SUSPENSE_FLAGS);
    setFiberWithFlags(targetFiber, UPDATE);
    ensureRootIsScheduled(true);
  })



  // suspenseFiber.firstEffect = null;
  // suspenseFiber.lastEffect = null;
  // // let hookList = suspenseFiber.hook;
  // suspenseFiber.updateQueue.firstEffect = null;
  // suspenseFiber.updateQueue.lastEffect = null;
  // dfsClearFiber(suspenseFiber);
  // if (suspenseFiber.alternate) {
  //   dfsClearFiber(suspenseFiber.alternate);
  // }
  // suspenseFiber.child = null;



  // for(const hook of  hookList) {
  //   if (((hook as IEffectHook).tag & EFFECT_LAYOUT)
  //    || ((hook as IEffectHook).tag & EFFECT_PASSIVE)) {
  //   pushEffect(suspenseFiber, hook as IEffectHook)
  //   }
  // }
  // 这里一定没有effect 。
  // console.warn('重新enter', _.cloneDeep(suspenseFiber))
  setFiberWithFlags(suspenseFiber, SUSPENSE_FLAGS)
  suspenseFiber.memoizedState = {
    ...suspenseFiber.memoizedState,
    errorFiber: fiber
  }
  setFiberWithFlags(fiber, RENDER_SUSPENSE)
  // ensureRootIsScheduled(true)
  // resetLaneProps(fiber)
  resetLaneProps(fiber)
  return null;
  // return reconcileChildren(suspenseFiber, [
  //   suspenseFiber.pendingProps.fallback
  // ])
}

function handleSuspense(fiber: MyFiber) {
  if (fiber.lanes === NOLANE) {
    // console.log(fiber.id, '本身不用更新', _.cloneDeep(fiber));
    if (fiber.childLanes !== NOLANE) {
      return cloneChildFiber(fiber)
    }
    return fiber.child;
  }
  if (flagsContain(fiber.flags, SUSPENSE_FLAGS)) {
    // const tempFiber = fiber.child;
    // fiber.child = null;
    // const newFiber = createFiber(fiber.element, fiber.index, fiber);
    // newFiber.return = fiber.return;
    // fiber.memoizedState = fiber.child;
    if (!fiber.alternate) {
      fiber.alternate = createFiber(fiber.element, fiber.index, fiber);
      // console.error('createFiber', _.cloneDeep(fiber), _.cloneDeep(fiber.alternate))
      fiber.alternate.return = fiber.return;
      fiber.return.child = fiber.alternate;
    }

    const tempFiber = fiber.alternate.child;
    const tempFiber2 = fiber.memoizedState?.children?.return;
    let f: MyFiber | null = fiber.memoizedState.children;
    while (f) {
      // setFiberWithFlags(f, SUSPENSE_REMOVE);

      // console.warn(f.flags, f.flags & SUSPENSE_REMOVE);
      f.flags = flagsAdd(f.flags, SUSPENSE_REMOVE);
      deletions.push(f);
      // console.warn(f.id, f.flags, 'beginWork-suspense-remove', _.cloneDeep(f), getFiberTag(f))
      // console.error('suspense-remove', _.cloneDeep(f))
      f = f.sibling;
    }
    const needTempModifyAlternateChild = fiber.memoizedState?.type === 'children';
    if (needTempModifyAlternateChild) {
      fiber.alternate.child = fiber.memoizedState?.fallback;
      if (fiber.alternate.child) {
        fiber.alternate.child.return = fiber.alternate;
      }
    }
    // console.warn('拦截fallback', _.cloneDeep([fiber, fiber.alternate, 
    // fiber.alternate.child,
    // fiber.memoizedState,
    // fiber.memoizedState?.fallback, fiber.pendingProps.fallback]))

    const next = reconcileChildren(fiber, [fiber.pendingProps.fallback]);

    if (needTempModifyAlternateChild) {
      fiber.alternate.child = tempFiber;
      fiber.alternate.child.return = tempFiber2;
    }
    // fiber.child = tempFiber
    fiber.memoizedState = {
      ...fiber.memoizedState,
      fallback: fiber.child,
      type: 'fallback'
    }
    resetLaneProps(fiber)
    return next;
  } else {
    const tempFiber = fiber.alternate?.child;
    const tempFiber2 = fiber.memoizedState?.children?.return;
    const needTempModifyAlternateChild = fiber.memoizedState?.type === 'fallback';
    if (needTempModifyAlternateChild) {
      fiber.alternate.child = fiber.memoizedState.children;
      fiber.alternate.child.return = fiber.alternate;
    }
    // console.warn('\n\n\n\n\n', _.cloneDeep({ child: fiber.memoizedState?.children,
    //   fiber, tag:
    //   fiber.memoizedState?.children ? getFiberTag(fiber.memoizedState?.children) : null}),
    // '\n\n\n\n\n')
    const next = reconcileChildren(fiber, [fiber.pendingProps.children]);
    if (flagsContain(fiber.flags, UPDATE)) {
      // let f = fiber.child;
      // while(f) {
      //   f.flags &= ~SUSPENSE_REMOVE;
      //   setFiberWithFlags(f, getFlags(f));
      //   console.error('suspense-update', _.cloneDeep(f), getFiberTag(f))
      //   f = f.sibling;
      // }
      const targetFiber = fiber.memoizedState?.errorFiber;
      if (targetFiber) {
        if (targetFiber !== findCurrentFiberInCurrentRoot(targetFiber)) {
          console.error('未处理的情况')
        }
        setFiberWithFlags(targetFiber, UPDATE);
        fiber.memoizedState.errorFiber = null;
      } else {
        console.error('未处理的情况')
      }
      fiber.flags = flagsRemove(fiber.flags, UPDATE);
    }

    fiber.memoizedState = {
      ...fiber.memoizedState,
      children: fiber.child,
      type: 'children'
    }
    if (needTempModifyAlternateChild) {
      fiber.alternate.child = tempFiber;
      fiber.alternate.child.return = tempFiber2;
    }
    resetLaneProps(fiber);
    return next;
  }
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
  //   type: getFiberTag(fiber),
  //   id: fiber.id,
  //   fiber
  // }))


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
    // console.log('provider-value-change--->', _.cloneDeep(fiber))
    if (fiber.alternate && fiber.pendingProps.value !== fiber.memoizedProps.value) {
      // console.warn(_.cloneDeep({ fiber}))
      //   console.error('provider-value-change', _.cloneDeep(fiber),
      //  _.cloneDeep(fiber.pendingProps.value),
      //  _.cloneDeep(fiber.memoizedProps.value))
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
    // resetLaneProps(fiber);
    return handleSuspense(fiber);
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
      return handlePromiseError(fiber, e, false);
    }
  }

  if (fiber.tag === FUNCTIONCOMPONENT || fiber.tag === FORWARDREFCOMPONENT) {
    try {
      return handleFunctionComponent(fiber, fiber.tag === FORWARDREFCOMPONENT);
    } catch (e) {
      return handlePromiseError(fiber, e, false);
    }
  }

  if (fiber.tag === CLASSCOMPONENT) {
    try {
      return handleClassComponent(fiber);
    } catch (e) {
      return handlePromiseError(fiber, e, false);
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


export function dfsSumbitEffect(fiber: MyFiber) {
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
  isInDebugger && console.error('添加', fiber, getFiberTag(fiber))
  fiber.flags = flagsAdd(fiber.flags, flags);
  fiber.lanes = flagsAdd(fiber.lanes, DEFAULTLANE);
  let currentFiber = fiber.return;

  // if (fiber.id === 29 || fiber.id === 9) {
  //   console.trace()
  // }

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