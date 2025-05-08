import _ from "lodash";
import { commitRoot } from "./commit";
import { FUNCTIONCOMPONENT, HOSTCOMPONENT, NOEFFECT, NOLANE, setWorkInProgress, wipRoot, workInProgress } from "./const";
import { MyElement, MyFiber } from "./type";
import { beginWork } from "./beginWork";
import { getPropsByElement, isStringOrNumber } from "./utils";
import { completeWork } from "./completeWork";


let id = 0;
export function createFiber(element: MyElement | null, index: number, alternateFiber: MyFiber | null, 
  tag?: number, isClone?: boolean) {
  // console.error(element);
  const newFiber: MyFiber = alternateFiber?.alternate ?? {
    id: id ++,
    key: isClone ? alternateFiber.key : element?.key,
    pendingProps: isClone ? alternateFiber.pendingProps : getPropsByElement(element),
    type: isClone ? alternateFiber.type : (isStringOrNumber(element) ? 'text' : element?.type),
    flags: NOEFFECT,
    stateNode: null,
    tag: isClone ? alternateFiber.tag : (tag ?? (typeof element?.type === 'function' ? FUNCTIONCOMPONENT : HOSTCOMPONENT)),
    alternate: null,
    lanes: NOLANE,
    childLanes: NOLANE,
    child: null,
    dependencies: null,
    elementType: isClone ? alternateFiber.elementType : element?.type,
    firstEffect: null,
    hook: [],
    updateQueue: {
      firstEffect: null,
      lastEffect: null,
    },
    index,
    lastEffect: null,
    memoizedProps: {},
    memoizedState: null,
    nextEffect: null,
    ref: isClone ? alternateFiber.ref : element?.ref,
    return: null,
    sibling: null,
  }
  newFiber.child = null;
  newFiber.sibling = null;
  newFiber.index = index;

  if (alternateFiber) {
    newFiber.alternate = alternateFiber;
    newFiber.pendingProps = isClone ? alternateFiber.pendingProps  : getPropsByElement(element),
    newFiber.ref = isClone ? alternateFiber.ref : element?.ref;
    newFiber.index = alternateFiber.index;
    newFiber.lanes = alternateFiber.lanes;
    newFiber.childLanes = alternateFiber.childLanes;

    // if (alternateFiber.updateQueue.lastEffect) {
    //   if(alternateFiber.updateQueue.lastEffect.next ) {
    //     console.log('fiber.next未断开', _.cloneDeep({updateQueue :alternateFiber.updateQueue, alternateFiber}))
    //   }
    // }
    const endEffect = alternateFiber.updateQueue.lastEffect?.next ?? null;

    newFiber.updateQueue.firstEffect = alternateFiber.updateQueue.firstEffect;
    let f = newFiber.updateQueue.firstEffect;
    while(f && f!== endEffect) {
      newFiber.updateQueue.lastEffect = f;
      f = f.next;
    }
    newFiber.hook = alternateFiber.hook;
    newFiber.stateNode = alternateFiber.stateNode;
    newFiber.child = alternateFiber.child;
    newFiber.sibling = alternateFiber.sibling;

    // console.log(_.cloneDeep({ newFiber }))


    // alternateFiber.updateQueue.firstEffect = null;
    // alternateFiber.updateQueue.lastEffect = null;
    alternateFiber.hook  = [];
    alternateFiber.memoizedProps = alternateFiber.pendingProps;
    alternateFiber.pendingProps = {};
    alternateFiber.lanes = NOLANE;
    alternateFiber.childLanes = NOLANE;;
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




