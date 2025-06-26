import _ from "lodash";
import { CREATE_CONTEXT, DELETE, deletions, DESTROY_CONTEXT, EFFECT_DESTROY, EFFECT_HOOK_HAS_EFFECT, EFFECT_LAYOUT, EFFECT_PASSIVE, fiberRoot, FORWARDREFCOMPONENT, FUNCTIONCOMPONENT, getIsFlushEffecting, getPendingUpdateFiberList, HOSTCOMPONENT, INSERTBEFORE, isInDebugger, LAYOUT_FLAGS, MyReactFiberKey, NO_CONTEXT, NOEFFECT, NOLANE, PASSIVE_FLAGS, PLACEMENT, REFEFFECT, rootFiber, setCurrentContext, setIsFlushEffecting, setRootFiber, setWipRoot, UPDATE, wipRoot } from "./const";
import { IEffectHook, MyFiber, MyReactElement, MyStateNode } from "./type";
import { isHostComponent, updateDom } from "./dom";
import { logEffectType, logFiberTree } from "./utils";
import { reRender, runInBatchUpdate } from "./ReactDom";
import { originConsoleLog, untrackFiber } from "./test";
import { setFiberWithFlags } from "./beginWork";
import { sumbitEffect } from "./completeWork";
import { clearFiber } from "./fiber";

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

export function disconnectElementAndFiber(fiber: MyFiber) {
  if (fiber.element) {
    if ((fiber.element as MyReactElement)._owner) {
      (fiber.element as MyReactElement)._owner = null;
    }
  }
}

function commitDelete(fiber: MyFiber) {
  if (!fiber) return;
  // console.log('删除', _.cloneDeep(fiber))
  // let f = fiber.child;
  // while (f) {
  //   commitDelete(f);
  //   f = f.sibling;
  // }
  const parentDom: MyStateNode | null = getParentStateNode(fiber)
  const childDom: MyStateNode | null = getStateNode(fiber);
  if (parentDom && childDom) {
    isInDebugger && console.log(parentDom, '删除', childDom)
    if (parentDom.contains(childDom)) {
      parentDom.removeChild(childDom);
    }
  }
  if (fiber.flags & LAYOUT_FLAGS) {
    handleLayoutEffectDestroy(fiber);
  }
  if (fiber.ref && isHostComponent(fiber)) {
    commitRef(fiber, true)
  }

  clearFiber(fiber);
}

function findHostStateNode(fiber: MyFiber, parentDom: HTMLElement): MyFiber | null | undefined {
  if (!fiber) {
    return null;
  }

  if (fiber.stateNode && fiber.stateNode?.parentElement === parentDom) {
    return fiber;
  }

  return findHostStateNode(fiber.child, parentDom)
}

function findSiblingHostDom(fiber: MyFiber, parentDom: HTMLElement, index = -1) {
  if (!fiber) {
    return null;
  }

  let f = fiber;
  while (f) {
    const target = findHostStateNode(f, parentDom);
    if (target && !(f.flags & INSERTBEFORE) && f.index > index) {
      return target.stateNode;
    }
    f = f.sibling;
  }
  return null;

  // const silibling = findHostStateNode(fiber, parentDom);
  // return silibling && !(silibling.flags & INSERTBEFORE) ? silibling.stateNode : findSiblingHostDom(fiber.sibling, parentDom);
}

function commitPlacement(fiber: MyFiber) {
  if (!fiber) {
    throw new Error('运行时出错')
  }
  const parentDom: MyStateNode | null = getParentStateNode(fiber);
  if (parentDom) {
    // console.log(parentDom, 'appendChild', fiber.stateNode)
    // const index = fiber.index;
    const insertDom = findSiblingHostDom(fiber.sibling, parentDom as HTMLElement,
      fiber.index
    );
    const currentDom = getStateNode(fiber);
    if (!currentDom) {
      throw new Error('运行时出错')
    }
    if (insertDom) {
      // console.log(fiber, [parentDom], '将', [currentDom], '插入到', [insertDom], '前面')
      parentDom.insertBefore(currentDom, insertDom)
    } else {
      // console.log(fiber, [parentDom], '添加', [currentDom])
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

function commitRef(fiber: MyFiber, isDestroy: boolean) {
  if (isHostComponent(fiber) &&
    fiber.ref) {
    // console.log('触发', fiber)
    const instance = isDestroy ? null : fiber.stateNode;
    if (_.has(fiber.ref, 'current')) {
      fiber.ref.current = instance;
    } else if (_.isFunction(fiber.ref)) {
      fiber.ref(instance)
    } else {
      throw '未处理'
    }
  } else {
    console.warn('未处理的情况', _.cloneDeep(fiber))
  }
}

function handleLayoutEffectDestroy(fiber: MyFiber) {

  let firstEffect = fiber.updateQueue.firstEffect;
  const endEffect = fiber.updateQueue.lastEffect?.next ?? null;
  while (firstEffect && firstEffect !== endEffect) {
    // console.log('destroy', )
    if ((firstEffect.tag & EFFECT_LAYOUT) && (firstEffect.tag & EFFECT_HOOK_HAS_EFFECT)) {
      // firstEffect.tag &= ~EFFECT_HOOK_HAS_EFFECT;
      //  console.log('删除')
      if (_.isFunction(firstEffect.destroy)) {
        firstEffect.destroy()
      }
    }
    firstEffect = firstEffect.next;
  }
}

function commitLayoutEffectOrRef(fiber: MyFiber) {
  // console.log(_.cloneDeep({ fiber }))
  if (fiber.flags & REFEFFECT) {
    commitRef(fiber, false);
  }
  if (fiber.flags & LAYOUT_FLAGS) {
    let firstEffect = fiber.updateQueue.firstEffect;
    const endEffect = fiber.updateQueue.lastEffect?.next ?? null;
    // console.log(_.cloneDeep({ firstEffect, endEffect}))
    while (firstEffect && firstEffect !== endEffect) {
      if ((firstEffect.tag & EFFECT_LAYOUT) && (firstEffect.tag & EFFECT_HOOK_HAS_EFFECT)) {
        firstEffect.tag &= ~EFFECT_HOOK_HAS_EFFECT;
        firstEffect.destroy = firstEffect.create()
      }
      firstEffect = firstEffect.next;
    }
  }
}

function commitEffect(fiber: MyFiber) {
  sumbitEffect(fiber);
}

function commitWork(fiber: MyFiber) {
  if (!fiber || fiber.flags === NOEFFECT) return;

  // console.error('commitWork', logEffectType(fiber), _.cloneDeep(fiber));

  // if (fiber.flags & DELETE) {
  //   commitDelete(fiber);
  //   fiber.flags &= ~DELETE
  // }

  if ((fiber.flags & PLACEMENT) || (fiber.flags & INSERTBEFORE)) {
    commitPlacement(fiber);
    fiber.flags &= ~PLACEMENT
    fiber.flags &= ~INSERTBEFORE
  }

  if ((fiber.flags & PASSIVE_FLAGS) ||
    (fiber.flags & LAYOUT_FLAGS)
  ) {
    commitEffect(fiber)
    fiber.flags &= ~PASSIVE_FLAGS
  }

  if (fiber.flags & UPDATE) {
    // console.log('commitUpdate', fiber)
    commitUpdate(fiber);
    fiber.flags &= ~UPDATE
  }

  // if (fiber.flags !== NOEFFECT) {
  //   console.warn(fiber, 'fiberflags没清空');
  // }
}

const messageChanel = new MessageChannel();
const port1 = messageChanel.port1;
const port2 = messageChanel.port2;

port2.onmessage = (e) => {
  // e.data()
  if (e.data === 'EFFECT_PASSIVE') {
    //  console.warn('useEffect统一调度', _.cloneDeep({
    //   rootFiber
    //  }), [getEffectListId(rootFiber),
    //   wipRoot ? getEffectListId(wipRoot) : ''
    //  ])
    if (!getIsFlushEffecting()) {
      return;
    }

    handleEffect(EFFECT_PASSIVE, rootFiber);
    //  console.error('commit-after', _.cloneDeep({ rootFiber }))
    //  console.log('after-render', _.cloneDeep({ rootFiber}))
  }
}

export function handleEffect(tag: number, rootFiber: MyFiber, jumpReRender = false) {
  let firstEffect: IEffectHook = rootFiber.updateQueue.firstEffect;
  const endEffect: IEffectHook = rootFiber.updateQueue.lastEffect?.next;

  // console.log(_.cloneDeep({firstEffect}))
  const destroyList = [];
  const createList: [IEffectHook, Function][] = [];
  while (firstEffect && firstEffect !== endEffect) {
    // console.log(_.cloneDeep({ id: firstEffect.id, firstEffect, bol: !!(firstEffect.tag & tag) }))
    if (firstEffect.tag & tag) {
      // console.log('本次处理的', firstEffect.tag & EFFECT_PASSIVE, _.cloneDeep(firstEffect))
      firstEffect.tag &= ~EFFECT_HOOK_HAS_EFFECT;
      if (firstEffect.destroy) {
        destroyList.push(firstEffect.destroy)
      }
      if (!(firstEffect.tag & EFFECT_DESTROY)) {
        createList.push([firstEffect, firstEffect.create]);
      } else {
        // console.log('跳过create的Effect')
      }
    };
    // if (tag === EFFECT_PASSIVE) {
    //   firstEffect.next = null;
    // }
    firstEffect = firstEffect.next;
  }

  // console.log(tag, _.cloneDeep({ destroyList, createList}))
  const flush = () => {

    setCurrentContext(DESTROY_CONTEXT)
    // console.warn('重置队伍', _.cloneDeep({ destroyList, createList: [...createList], rootFiber }))
    while (destroyList.length) {
      destroyList.shift()()
    }
    setCurrentContext(NO_CONTEXT)
    setCurrentContext(CREATE_CONTEXT)
    while (createList.length) {
      const [effect, create] = createList.shift();
      effect.destroy = create()
    }
    setCurrentContext(NO_CONTEXT)
    rootFiber.updateQueue.firstEffect = null;
    rootFiber.updateQueue.lastEffect = null;
    setIsFlushEffecting(false);
  };
  runInBatchUpdate(flush, jumpReRender)

  // if (newCurrentEffect) {
  //   newCurrentEffect.next = null;
  // }
  // if (tag === EFFECT_PASSIVE) {
  //   console.log('清空所有updateQueue')
  //   rootFiber.updateQueue.firstEffect = null;
  //   rootFiber.updateQueue.lastEffect = null;
  // }
}

export function commitRoot() {
  let firstEffect = wipRoot.firstEffect;

  // console.error('commitRoot', _.cloneDeep({wipRoot, firstEffect, lastEffect: wipRoot.lastEffect}))
  // const idList = []
  const endEffect = wipRoot.lastEffect?.nextEffect ?? null

  // console.error(getCommitEffectListId(wipRoot), _.cloneDeep(wipRoot))

  // for (const x of deletions) {
  //   commitDelete(x)
  // }
  while (firstEffect && firstEffect !== endEffect) {
    // idList.push([firstEffect.id ,_.cloneDeep(firstEffect)])
    commitWork(firstEffect);

    firstEffect = firstEffect.nextEffect;
  }

  setIsFlushEffecting(true)
  runInBatchUpdate(() => {
    let firstEffect = wipRoot.firstEffect;
    const endEffect = wipRoot.lastEffect?.nextEffect ?? null;

    while (deletions.length) {
      commitDelete(deletions.shift())
    }

    while (firstEffect && firstEffect !== endEffect) {
      if (firstEffect.flags & REFEFFECT) {
        // console.log(_.cloneDeep({ firstEffect }))
        if (firstEffect.alternate && firstEffect.alternate.commitCount > 0) {
          commitRef(firstEffect.alternate, true)
        }
      }
      if (firstEffect.flags & LAYOUT_FLAGS) {
        handleLayoutEffectDestroy(firstEffect);
      }
      firstEffect = firstEffect.nextEffect;
    }

    firstEffect = wipRoot.firstEffect;
    while (firstEffect && firstEffect !== endEffect) {
      const fiber = firstEffect;
      if (!!(fiber.flags & REFEFFECT) || !!(fiber.flags & LAYOUT_FLAGS)) {
        commitLayoutEffectOrRef(fiber);
        fiber.flags &= ~REFEFFECT
        fiber.flags &= ~LAYOUT_FLAGS
      }
      const origin = firstEffect;
      firstEffect = firstEffect.nextEffect;
      origin.nextEffect = null;
    }

    const list = getPendingUpdateFiberList();
    while (list.length) {
      setFiberWithFlags(list.pop(), UPDATE)
    }

    wipRoot.firstEffect = null;
    wipRoot.lastEffect = null;
    wipRoot.nextEffect = null; // TODO 处理每个fiber的nextEffect
    setRootFiber(wipRoot);

    port1.postMessage('EFFECT_PASSIVE')

    logFiberTree(wipRoot)
    setWipRoot(null);
  })
  // console.log(_.cloneDeep({idList, firstEffect, lastEffect: wipRoot.lastEffect}))

}