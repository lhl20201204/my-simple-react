import _ from "lodash";
import { DELETE, deletions, fiberRoot, HOSTCOMPONENT, NOLANE, PLACEMENT, setRootFiber, setWipRoot, UPDATE, wipRoot } from "./const";
import { MyFiber, MyStateNode } from "./type";
import { isHostComponent, updateDom } from "./dom";
import { logFiberTree } from "./utils";

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
  let childFiber = fiber;
  while (childFiber && !childFiber.stateNode) {
    childFiber = childFiber.child;
  }
  return childFiber?.stateNode || null;
}

function commitDelete(fiber: MyFiber) {
  if (!fiber) return;
  let f = fiber.child;
  while(f) {
    commitDelete(f);
    f = f.sibling;
  }
  const parentDom: MyStateNode | null = getParentStateNode(fiber)
  const childDom: MyStateNode | null = getStateNode(fiber);
    if (parentDom && childDom) {
      console.log('删除', childDom)
      parentDom.removeChild(childDom);
    }
}

function commitPlacement(fiber: MyFiber) {
  if (!fiber) return;
  const parentDom: MyStateNode | null = getParentStateNode(fiber);
  if (fiber.stateNode && parentDom) {
    // console.log(parentDom, 'appendChild', fiber.stateNode)
    const index = fiber.index;
    const insertDom = parentDom.childNodes[index + 1];
    if (insertDom) {
      console.log( fiber, parentDom, '将', fiber.stateNode, '插入到', insertDom , '前面')
      parentDom.insertBefore(fiber.stateNode, insertDom)
    } else {
      console.log(fiber,parentDom, '添加', fiber.stateNode)
      parentDom.appendChild(fiber.stateNode)
    }
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
  } 
  
  if (fiber.flags & PLACEMENT) {
    commitPlacement(fiber);
    fiber.flags &= ~PLACEMENT
  } 
 if (fiber.flags & UPDATE) {
    commitUpdate(fiber);
    fiber.flags &= ~UPDATE
  } 
  console.log('重置lanes')
  fiber.lanes = NOLANE;
  fiber.childLanes = NOLANE;
  // commitWork(fiber.child);
  // commitWork(fiber.sibling);
}

export function commitRoot() {
  let firstEffect = wipRoot.firstEffect;
  while(firstEffect) {
    commitWork(firstEffect);
    firstEffect = firstEffect.nextEffect;
  }
  while(deletions.length) {
    commitWork(deletions.shift())
  }
  wipRoot.lanes = NOLANE;
  wipRoot.childLanes = NOLANE;
  wipRoot.firstEffect = null;
  wipRoot.lastEffect = null;
  wipRoot.nextEffect = null;
  setRootFiber(wipRoot);
  logFiberTree(wipRoot) 
  setWipRoot(null);
}