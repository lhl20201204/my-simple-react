import _, { first } from "lodash";
import { DELETE, deletions, EFFECTHOOK, fiberRoot, HOSTCOMPONENT, isInDebugger, NOEFFECT, NOLANE, PLACEMENT, REFEFFECT, rootFiber, setRootFiber, setWipRoot, UPDATE, wipRoot } from "./const";
import { IEffectHook, MyFiber, MyStateNode } from "./type";
import { isHostComponent, updateDom } from "./dom";
import { logEffectType, logFiberTree } from "./utils";
import { runInBatchUpdate } from "./ReactDom";

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
      // console.log(parentDom, '删除', childDom)
      if (parentDom.contains(childDom)) {
        parentDom.removeChild(childDom);
      }
    }
  //  fiber.return = null;
}

function findHostStateNode(fiber: MyFiber): MyFiber | null | undefined {
  return (!fiber || fiber.stateNode) ? fiber : findHostStateNode(fiber.child)
}

function findSiblingHostDom(fiber: MyFiber) {
  if (!fiber) {
    return null
  }
  const silibling = findHostStateNode(fiber);
  return silibling ? silibling.stateNode : findSiblingHostDom(fiber.sibling) ;
}

function commitPlacement(fiber: MyFiber) {
  if (!fiber) {
    throw new Error('运行时出错')
  }
  const parentDom: MyStateNode | null = getParentStateNode(fiber);
  if (parentDom) {
    // console.log(parentDom, 'appendChild', fiber.stateNode)
    // const index = fiber.index;
    const insertDom = findSiblingHostDom(fiber.sibling);
    const currentDom = findHostStateNode(fiber)?.stateNode;
    if (!currentDom) {
      throw new Error('运行时出错')
    }
    if (insertDom) {
      isInDebugger && console.log( fiber, parentDom, '将', currentDom, '插入到', insertDom , '前面')
      parentDom.insertBefore(currentDom, insertDom)
    } else {
      isInDebugger &&  console.log(fiber,parentDom, '添加', currentDom)
      parentDom.appendChild(currentDom)
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

function commitRef(fiber: MyFiber) {
   if (isHostComponent(fiber) &&
    fiber.ref) {
      // console.log('触发', fiber)
      if (_.has(fiber.ref, 'current')) {
        fiber.ref.current = fiber.stateNode;
      } else if (_.isFunction(fiber.ref)) {
        fiber.ref(fiber.stateNode)
      } else {
        throw '未处理'
      }
   } else {
    console.warn('未处理ForwardRef组件')
   }
}

function commitWork(fiber: MyFiber) {
  if (!fiber || fiber.flags === NOEFFECT) return;

  isInDebugger && console.log('commitWork', logEffectType(fiber),  _.cloneDeep(fiber));
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

  if (fiber.flags & REFEFFECT) {
    commitRef(fiber)
    fiber.flags &= ~REFEFFECT
  }
  // console.log('重置lanes')
  // fiber.lanes = NOLANE;
  // fiber.childLanes = NOLANE;
  // commitWork(fiber.child);
  // commitWork(fiber.sibling);
  if (fiber.flags !== NOEFFECT) {
    console.warn(fiber, 'fiberflags没清空');
  }
}

const messageChanel = new MessageChannel();
const port1 = messageChanel.port1;
const port2 = messageChanel.port2;

port2.onmessage = () => {
  handleEffect()
}

function handleEffect() {
  let firstEffect: IEffectHook = rootFiber.updateQueue.firstEffect;
  // console.log(_.cloneDeep({firstEffect}))
  const destroyList  = [];
  const createList: [IEffectHook, Function][] = [];
  while(firstEffect) {
    if (firstEffect.destroy) {
      destroyList.push(firstEffect.destroy)
    }
    createList.push([firstEffect, firstEffect.create]);
    const next = firstEffect.next;
    firstEffect.next = null;
    firstEffect = next
  }

  runInBatchUpdate(() => {
    while(destroyList.length) {
      destroyList.shift()()
    }
  
    while(createList.length) {
      const [effect, create] = createList.shift();
      effect.destroy =  create()
    }
  })
  rootFiber.updateQueue.firstEffect = null;
  rootFiber.updateQueue.lastEffect = null;
}

export function commitRoot() {
  let firstEffect = wipRoot.firstEffect;

  isInDebugger && console.warn('commitRoot', _.cloneDeep(wipRoot))
  const idList = []
  while(firstEffect) {
    idList.push(firstEffect.id)
    commitWork(firstEffect);
    firstEffect = firstEffect.nextEffect;
  }
  while(deletions.length) {
    commitWork(deletions.shift())
  }
  // 异步设计一个问题，如果在更新中，有effect
  port1.postMessage('')

  // handleEffect()


  // wipRoot.lanes = NOLANE;
  // wipRoot.childLanes = NOLANE;
  wipRoot.firstEffect = null;
  wipRoot.lastEffect = null;
  wipRoot.nextEffect = null;
  setRootFiber(wipRoot);
  logFiberTree(wipRoot) 
  setWipRoot(null);
}