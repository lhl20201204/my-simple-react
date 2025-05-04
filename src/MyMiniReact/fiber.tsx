import _ from "lodash";
import { commitRoot } from "./commit";
import { FUNCTIONCOMPONENT, HOSTCOMPONENT, NOEFFECT, NOLANE, setWorkInProgress, wipRoot, workInProgress } from "./const";
import { MyElement, MyFiber } from "./type";
import { beginWork, completeWork } from "./render";
import { getPropsByElement, isStringOrNumber } from "./utils";


let id = 0;
export function createFiber(element: MyElement | null, index: number, alternateFiber: MyFiber | null, parentFiber: MyFiber | null, tag?: number) {
  // console.error(element);
  const newFiber: MyFiber = alternateFiber?.alternate ?? {
    id: id ++,
    pendingProps: getPropsByElement(element),
    type: isStringOrNumber(element) ? 'text' : element?.type,
    flags: NOEFFECT,
    stateNode: null,
    tag: tag ?? (typeof element?.type === 'function' ? FUNCTIONCOMPONENT : HOSTCOMPONENT),
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
    index,
    key: element?.key,
    lastEffect: null,
    memoizedProps: {},
    memoizedState: null,
    nextEffect: null,
    ref: element?.ref,
    return: parentFiber,
    sibling: null,
  }
  newFiber.child = null;
  newFiber.sibling = null;

  if (alternateFiber) {
    newFiber.alternate = alternateFiber;
    newFiber.pendingProps = getPropsByElement(element),
    newFiber.ref = element?.ref;
    newFiber.index = alternateFiber.index;
    newFiber.lanes = alternateFiber.lanes;
    newFiber.childLanes = alternateFiber.childLanes;
    newFiber.updateQueue.firstEffect = null;
    newFiber.updateQueue.lastEffect = null;
    newFiber.hook = alternateFiber.hook;
    newFiber.stateNode = alternateFiber.stateNode;
    newFiber.child = alternateFiber.child;
    newFiber.sibling = alternateFiber.sibling;


    alternateFiber.updateQueue.firstEffect = null;
    alternateFiber.updateQueue.lastEffect = null;
    alternateFiber.hook  = [];
    alternateFiber.memoizedProps = alternateFiber.pendingProps;
    alternateFiber.pendingProps = {};
    alternateFiber.lanes = NOLANE;
    alternateFiber.childLanes = NOLANE;
  }

  return newFiber;
}

export function workLoop(deadline: IdleDeadline) {
  while (workInProgress && deadline.timeRemaining() > 1) {
    performUnitOfWork();
  }
  if (!workInProgress && wipRoot) {
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
  completeWork(current);
  if (current.sibling) {
    setWorkInProgress(current.sibling)
    return current.sibling;
  }

  let temp = current.return;
  // 开始competeWork
  while (temp && !temp.sibling) {
    completeWork(temp)
    temp = temp.return;
  }
  if (temp) {
    completeWork(temp)
  }
  nextFiber = temp?.sibling;
  setWorkInProgress(nextFiber);
  return nextFiber;
}




