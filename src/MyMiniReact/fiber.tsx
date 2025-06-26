import _ from "lodash";
import { commitRoot, disconnectElementAndFiber } from "./commit";
import { CONSUMNERCOMPONENT, FORWARDREFCOMPONENT, FRAGMENTCOMPONENT, FUNCTIONCOMPONENT, HOSTCOMPONENT, LAZYCOMPONENT, MEMOCOMPONENT, MyReactFiberKey, NOEFFECT, NOLANE, PLACEMENT, PORTAlCOMPONENT, PROVIDERCOMPONENT, REFEFFECT, ROOTCOMPONENT, rootFiber, setIsRendering, setWorkInProgress, SUSPENSECOMPONENT, TEXTCOMPONENT, UPDATE, wipRoot, workInProgress } from "./const";
import { MyFiber, MyPortalElement, MyReactElement, MySingleReactNode } from "./type";
import { beginWork } from "./beginWork";
import { getCommitEffectListId, getEffectListId, getPropsByElement, isStringOrNumber } from "./utils";
import { completeWork } from "./completeWork";
import { originConsoleLog, trackFiber, untrackFiber } from "./test";
import { isPortalComponent } from "./dom";


let id = 0;
export function createFiber(element: MySingleReactNode, index: number, alternateFiber: MyFiber | null,
  tag?: number) {
  // console.error(element);
  // if (tag === ROOTCOMPONENT) {
  //   console.error(_.cloneDeep(alternateFiber), alternateFiber && getEffectListId(alternateFiber));
  // }

  let fiberTag = tag;
  if (_.isNil(fiberTag)) {
    // console.log('fragment', element, window.reactFragmentType, element?.type === window.reactFragmentType)
    // console.warn('---->', element)
    if (isStringOrNumber(element)) {
      fiberTag = TEXTCOMPONENT;
    } else if (typeof element?.type === 'function') {
      fiberTag = FUNCTIONCOMPONENT;
    } else if (element?.type?.$$typeof === window.reactMemoType) {
      fiberTag = MEMOCOMPONENT;
    } else if (element?.type?.$$typeof === window.reactForwardRefType) {
      fiberTag = FORWARDREFCOMPONENT;
    } else if (element?.type === window.reactFragmentType) {
      fiberTag = FRAGMENTCOMPONENT;
    } else if (element?.type?.$$typeof === window.reactProviderType) {
      fiberTag = PROVIDERCOMPONENT;
    } else if (element?.type?.$$typeof === window.reactContextType) {
      fiberTag = CONSUMNERCOMPONENT;
    } else if (element?.type === window.reactSuspenseType) {
      fiberTag = SUSPENSECOMPONENT;
    } else if (element?.type?.$$typeof === window.reactLazyType) {
      fiberTag = LAZYCOMPONENT;
    } else if (element?.$$typeof === window.reactPortalType) {
      fiberTag = PORTAlCOMPONENT;
    } else {
      fiberTag = HOSTCOMPONENT;
    }
  }

  const needNewCreate = !alternateFiber?.alternate;

  const newFiber: MyFiber = alternateFiber?.alternate ?? {
    id: id++,
    key: (element as MyReactElement)?.key,
    pendingProps: getPropsByElement(element),
    type: (isStringOrNumber(element) ? 'text' : element?.type),
    flags: NOEFFECT,
    stateNode: null,
    tag: fiberTag,
    alternate: null,
    lanes: NOLANE,
    childLanes: NOLANE,
    child: null,
    dependencies: null,
    elementType: (element as MyReactElement)?.type,
    firstEffect: null,
    hook: [],
    commitCount: 0,
    updateQueue: {
      firstEffect: null,
      lastEffect: null,
    },
    element: element,
    index,
    lastEffect: null,
    memoizedProps: {},
    memoizedState: null,
    nextEffect: null,
    ref: (element as MyReactElement)?.ref,
    return: null,
    sibling: null,
  }
  if (needNewCreate) {
    trackFiber(newFiber);
  }
  newFiber.child = null;
  newFiber.sibling = null;
  newFiber.index = index;
  newFiber.element = element;

  if (alternateFiber) {
    newFiber.alternate = alternateFiber;
    newFiber.pendingProps = getPropsByElement(element),
    newFiber.memoizedProps = alternateFiber.memoizedProps;
    newFiber.ref = (element as MyReactElement)?.ref;
    newFiber.index = alternateFiber.index;
    newFiber.lanes = alternateFiber.lanes;
    newFiber.childLanes = alternateFiber.childLanes;
    newFiber.commitCount = alternateFiber.commitCount;

    // if (alternateFiber.updateQueue.lastEffect) {
    //   if(alternateFiber.updateQueue.lastEffect.next ) {
    //     console.log('fiber.next未断开', _.cloneDeep({updateQueue :alternateFiber.updateQueue, alternateFiber}))
    //   }
    // }
    // const endEffect = alternateFiber.updateQueue.lastEffect?.next ?? null;

    newFiber.updateQueue.firstEffect = alternateFiber.updateQueue.firstEffect;
    // let f = newFiber.updateQueue.firstEffect;
    newFiber.updateQueue.lastEffect = alternateFiber.updateQueue.lastEffect;
    newFiber.hook = alternateFiber.hook;
    newFiber.stateNode = alternateFiber.stateNode;
    newFiber.child = alternateFiber.child;
    newFiber.sibling = alternateFiber.sibling;
    newFiber.flags = alternateFiber.flags;
    newFiber.firstEffect = alternateFiber.firstEffect;
    newFiber.lastEffect = alternateFiber.lastEffect;

    newFiber.dependencies = alternateFiber.dependencies;

    // console.log(_.cloneDeep({ newFiber }))


    alternateFiber.dependencies = null;
    alternateFiber.updateQueue.firstEffect = null;
    alternateFiber.updateQueue.lastEffect = null;
    alternateFiber.firstEffect = null;
    alternateFiber.lastEffect = null;
    alternateFiber.nextEffect = null;

    alternateFiber.flags = NOEFFECT;
    alternateFiber.alternate = newFiber;
    alternateFiber.hook = [];
    alternateFiber.memoizedProps = alternateFiber.pendingProps;
    disconnectElementAndFiber(alternateFiber)
    // alternateFiber.pendingProps = {};
    alternateFiber.lanes = NOLANE;
    alternateFiber.childLanes = NOLANE;
  }
  if (_.has(element, '_owner')) {
    // originConsoleLog('添加_owner', element, newFiber)
    element._owner = newFiber;
  }
  // if (tag === ROOTCOMPONENT) {
  //   console.error(getCommitEffectListId(newFiber), _.cloneDeep(newFiber))
  // }
  // console.warn('createFiber', _.cloneDeep({ newFiber }))

  // if (fiberTag === PORTAlCOMPONENT) {
  //   console.log(newFiber);
  // }

  return newFiber;
}

export function syncWorkLoop() {
  while (workInProgress) {
    performUnitOfWork();
  }
  if (!workInProgress && wipRoot) {
    setIsRendering(false);
    commitRoot();
  }
}

export function workLoop(deadline: IdleDeadline) {
  // console.log('workloop-----》')
  while (workInProgress && deadline.timeRemaining() > 1) {
    performUnitOfWork();
  }
  if (!workInProgress && wipRoot) {
    setIsRendering(false);
    commitRoot();
  }
  if (workInProgress) {
    requestIdleCallback(workLoop);
  }
}

export function performUnitOfWork(): MyFiber | null {
  // 构建一课完整的fiber
  let current = workInProgress;
  let nextFiber = beginWork(current);
  if (nextFiber) {
    setWorkInProgress(nextFiber);
    return nextFiber;
  }
  // console.log('不能继续向下了')
  completeWork(current);
  if (current.sibling) {
    setWorkInProgress(current.sibling)
    return current.sibling;
  }

  let temp = current.return;
  // 开始competeWork
  while (temp && !temp.sibling) {
    // console.log('向上')
    completeWork(temp)
    temp = temp.return;
  }
  if (temp) {
    // console.log('往兄弟走')
    completeWork(temp)
  }
  nextFiber = temp?.sibling;
  setWorkInProgress(nextFiber);
  return nextFiber;
}

export function clearFiber(fiber: MyFiber) {
  untrackFiber(fiber)
  fiber.childLanes = null;
  fiber.flags = null;
  fiber.hook = null;
  fiber.index = null;
  fiber.key = null;
  fiber.lanes = null;
  fiber.lastEffect = null;
  disconnectElementAndFiber(fiber)
  fiber.dependencies = null;
  fiber.element = null;
  fiber.memoizedProps = null;
  fiber.memoizedState = null;
  fiber.pendingProps = null;
  fiber.nextEffect = null;
  fiber.elementType = null;
  fiber.commitCount = null;
  fiber.id = null;
  fiber.ref = null;
  fiber.type = null;
  fiber.tag = null;
  let f = fiber.updateQueue?.firstEffect;
  while (f) {
    f.fiber = null;
    f = f.next;
  }
  if (fiber.updateQueue) {
    fiber.updateQueue.lastEffect = null;
    fiber.updateQueue.firstEffect = null;
  }
  fiber.updateQueue = null;
  if (fiber.stateNode) {
    fiber.stateNode[MyReactFiberKey] = null;
  }
  fiber.stateNode = null;
  fiber.return = null;
  fiber.sibling = null;
  fiber.child = null;
  if (fiber.alternate) {
    fiber.alternate.alternate = null;
    clearFiber(fiber.alternate);
  }
  fiber.alternate = null;
}

export function getAllChildrenFiber(fiber: MyFiber, count = 0): MyFiber[]  {
  const ret: MyFiber[] = [];
  if (count > 0) {
     ret.push(fiber)
  }
  let f = fiber.child;
  while (f) {
    ret.push(...getAllChildrenFiber(f, count + 1))
    f = f.sibling;
  }
  return ret;
}

export function dfsClearFiber(fiber: MyFiber) {
  const list = getAllChildrenFiber(fiber);
  const list2 = fiber.alternate ? getAllChildrenFiber(fiber.alternate) : [];
  // console.log(_.cloneDeep([...list, ...list2]))
  for(const f of list) {
    clearFiber(f)
  }
  for(const f of list2) {
    clearFiber(f)
  }
}




