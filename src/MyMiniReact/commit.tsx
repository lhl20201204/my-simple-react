import _ from "lodash";
import { DELETE, fiberRoot, HOSTCOMPONENT, PLACEMENT, setRootFiber, setWipRoot, UPDATE, wipRoot } from "./const";
import { MyFiber, MyStateNode } from "./type";
import { isHostComponent, updateDom } from "./dom";

function getParentStateNode(fiber: MyFiber) {
  if (!fiber) return null;
  let parentFiber = fiber.return;
  while (parentFiber && !parentFiber.stateNode) {
    parentFiber = parentFiber.return;
  }
  return parentFiber?.stateNode || fiberRoot.stateNode;
}

function getStateNode(fiber: MyFiber) {
  if (!fiber) return null;
  let parentDom: MyStateNode | null = null;
  let childFiber = fiber.child;
  while (!parentDom) {
    parentDom = childFiber.stateNode;
    childFiber = childFiber.child;
  }
  return parentDom;
}

function commitDelete(fiber: MyFiber) {
  if (!fiber) return;
  const parentDom: MyStateNode | null = getParentStateNode(fiber)
  commitDelete(fiber.child);
  commitDelete(fiber.sibling);
  const childDom: MyStateNode | null = getStateNode(fiber);
  if (parentDom && childDom) {
    parentDom.removeChild(childDom);
  }
}

function commitPlacement(fiber: MyFiber) {
  if (!fiber) return;
  const parentDom: MyStateNode | null = getParentStateNode(fiber);
  if (fiber.stateNode && parentDom) {
    // console.log(parentDom, 'appendChild', fiber.stateNode)
    parentDom.appendChild(fiber.stateNode)
  }
}

function commitUpdate(fiber: MyFiber) {
  if (!fiber) return;
  if (isHostComponent(fiber)) {
    updateDom(fiber)
  }
  // if (_.isFunction(fiber.type)) {
  //   setWorkInProgress(fiber);
  //   requestIdleCallback(workLoop);
  // }
}

function commitWork(fiber: MyFiber) {
  if (!fiber) return;
  console.log('commit', fiber);
  if (fiber.flags & DELETE) {
    commitDelete(fiber);
    fiber.flags &= ~DELETE
  } else if (fiber.flags & PLACEMENT) {
    commitPlacement(fiber);
    fiber.flags &= ~PLACEMENT
  } else if (fiber.flags & UPDATE) {
    commitUpdate(fiber);
    fiber.flags &= ~UPDATE
  }  
  // commitWork(fiber.child);
  // commitWork(fiber.sibling);
}

export function commitRoot() {
  let firstEffect = wipRoot.firstEffect;
  while(firstEffect) {
    commitWork(firstEffect);
    firstEffect = firstEffect.nextEffect;
  }
  wipRoot.firstEffect = null;
  wipRoot.lastEffect = null;
  wipRoot.nextEffect = null;
  setRootFiber(wipRoot);
  setWipRoot(null);
}