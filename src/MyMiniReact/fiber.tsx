import _ from "lodash";
import { commitRoot, disconnectElementAndFiber } from "./commit";
import { FRAGMENTCOMPONENT, FUNCTIONCOMPONENT, HOSTCOMPONENT, MEMOCOMPONENT, NOEFFECT, NOLANE, ROOTCOMPONENT, rootFiber, setIsRendering, setWorkInProgress, TEXTCOMPONENT, wipRoot, workInProgress } from "./const";
import { MyElement, MyFiber } from "./type";
import { beginWork } from "./beginWork";
import { getCommitEffectListId, getEffectListId, getPropsByElement, isStringOrNumber } from "./utils";
import { completeWork } from "./completeWork";
import { originConsoleLog, trackFiber } from "./test";


let id = 0;
export function createFiber(element: MyElement | null, index: number, alternateFiber: MyFiber | null,
  tag?: number) {
  // console.error(element);
  // if (tag === ROOTCOMPONENT) {
  //   console.error(_.cloneDeep(alternateFiber), alternateFiber && getEffectListId(alternateFiber));
  // }

  let fiberTag = tag;
  if (_.isNil(fiberTag)) {
    // console.log('fragment', element, window.reactFragmentType, element?.type === window.reactFragmentType)
    if (isStringOrNumber(element)) {
      fiberTag = TEXTCOMPONENT;
    } else if (typeof element?.type === 'function') {
      fiberTag = FUNCTIONCOMPONENT;
     } else if (element?.type?.$$typeof === window.reactMemoType) {
      fiberTag = MEMOCOMPONENT;
     } else if (element?.type === window.reactFragmentType) {
      fiberTag = FRAGMENTCOMPONENT;
     } else {
      fiberTag = HOSTCOMPONENT;
     }
  }

  const needNewCreate = !alternateFiber?.alternate;

  const newFiber: MyFiber = alternateFiber?.alternate ?? {
    id: id++,
    key: element?.key,
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
    elementType: element?.type,
    firstEffect: null,
    hook: [],
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
    ref: element?.ref,
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
    newFiber.ref = element?.ref;
    newFiber.index = alternateFiber.index;
    newFiber.lanes = alternateFiber.lanes;
    newFiber.childLanes = alternateFiber.childLanes;

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

    // console.log(_.cloneDeep({ newFiber }))


    alternateFiber.updateQueue.firstEffect = null;
    alternateFiber.updateQueue.lastEffect = null;
    alternateFiber.firstEffect = null;
    alternateFiber.lastEffect = null;

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
    // element._owner = newFiber;
  }
  // if (tag === ROOTCOMPONENT) {
  //   console.error(getCommitEffectListId(newFiber), _.cloneDeep(newFiber))
  // }
  // console.warn('createFiber', _.cloneDeep({ newFiber }))
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




