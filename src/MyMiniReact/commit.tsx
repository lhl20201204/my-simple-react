import _ from "lodash";
import { CREATE_CONTEXT, DELETE, deletions, DESTROY_CONTEXT, EFFECT_DESTROY, EFFECT_HOOK_HAS_EFFECT, EFFECT_LAYOUT, EFFECT_PASSIVE, fiberRoot, FUNCTIONCOMPONENT, getIsFlushEffecting, HOSTCOMPONENT, INSERTBEFORE, isInDebugger, LAYOUT_EFFECT_HOOK, NO_CONTEXT, NOEFFECT, NOLANE, PLACEMENT, REFEFFECT, rootFiber, setCurrentContext, setIsFlushEffecting, setRootFiber, setWipRoot, UPDATE, wipRoot } from "./const";
import { IEffectHook, MyFiber, MyStateNode } from "./type";
import { isHostComponent, updateDom } from "./dom";
import { getCommitEffectListId, getEffectListId, logEffectType, logFiberTree } from "./utils";
import { reRender, runInBatchUpdate } from "./ReactDom";

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

  handleLayoutEffectDestroy(fiber);
  if (fiber.ref) {
    commitRef(fiber, true)
  }

  fiber.updateQueue.lastEffect = null;
  fiber.updateQueue.firstEffect = null

  // if (fiber.tag === FUNCTIONCOMPONENT) {
  //   if (fiber.updateQueue.lastEffect) {
  //     fiber.updateQueue.lastEffect = null;
  //   }
  //   const lastEffect = fiber.updateQueue.lastEffect
  //   // console.log('fff', _.cloneDeep(fiber.updateQueue))
  //   let f = fiber.updateQueue.firstEffect;
  //   while(f) {
  //     // if (f.tag & EFFECT_LAYOUT) {

  //     // }
  //     // console.log('处理f')
  //     f = f.next;
  //   }
  // }
  fiber.stateNode = null;

  fiber.return = null;
}

function findHostStateNode(fiber: MyFiber, parentDom: HTMLElement): MyFiber | null | undefined {
  return (!fiber || fiber.stateNode?.parentElement === parentDom) ? fiber : findHostStateNode(fiber.child, parentDom)
}

function findSiblingHostDom(fiber: MyFiber, parentDom: HTMLElement) {
  if (!fiber) {
    return null
  }
  const silibling = findHostStateNode(fiber, parentDom);
  return silibling ? silibling.stateNode : findSiblingHostDom(fiber.sibling, parentDom);
}

function commitPlacement(fiber: MyFiber) {
  if (!fiber) {
    throw new Error('运行时出错')
  }
  const parentDom: MyStateNode | null = getParentStateNode(fiber);
  if (parentDom) {
    // console.log(parentDom, 'appendChild', fiber.stateNode)
    // const index = fiber.index;
    const insertDom = findSiblingHostDom(fiber.sibling, parentDom as HTMLElement);
    const currentDom = getStateNode(fiber);
    if (!currentDom) {
      throw new Error('运行时出错')
    }
    if (insertDom) {
      isInDebugger && console.log(fiber, [parentDom], '将', [currentDom], '插入到', [insertDom], '前面')
      parentDom.insertBefore(currentDom, insertDom)
    } else {
      isInDebugger && console.log(fiber, [parentDom], '添加', [currentDom])
      parentDom.appendChild(currentDom)
    }
  }
}

function commitInsertBefore(fiber: MyFiber) {
  if (!fiber) {
    throw new Error('运行时出错')
  }
  const parentDom: MyStateNode | null = getParentStateNode(fiber);
  if (parentDom) {
    const targetIndex = fiber.newInsertIndex;
    if (_.isNil(targetIndex)) {
      throw new Error('运行时出错')
    }
    fiber.newInsertIndex = null;
    let f = fiber;
    while(f) {
      if (f.index === targetIndex) {
        break;
      }
      f = f.sibling;
    }
    if ((!f || f.index !== targetIndex) && targetIndex !== -1) {
      throw new Error('运行时出错')
    }

    const insertDom = f ? findSiblingHostDom(f, parentDom as HTMLElement) : null;
    const currentDom = getStateNode(fiber);
    if (!currentDom) {
      throw new Error('运行时出错')
    }
    // console.log({insertDom});
    if (insertDom) {
      isInDebugger && console.log(fiber, [parentDom], '将', [currentDom], '插入到', [insertDom], '前面')
      parentDom.insertBefore(currentDom, insertDom)
    } else {
      isInDebugger && console.log(fiber, [parentDom], '添加', [currentDom])
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
    console.warn('未处理ForwardRef组件', _.cloneDeep(fiber))
  }
}

function handleLayoutEffectDestroy(fiber: MyFiber) {
  if (fiber.flags & LAYOUT_EFFECT_HOOK) {
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
}

function commitLayoutEffectOrRef(fiber: MyFiber) {
  // console.log(_.cloneDeep({ fiber }))
  if (fiber.flags & REFEFFECT) {
    commitRef(fiber, false);
  }
  if (fiber.flags & LAYOUT_EFFECT_HOOK) {
    let firstEffect = fiber.updateQueue.firstEffect;
    const endEffect = fiber.updateQueue.lastEffect?.next ?? null;
    // console.log(_.cloneDeep({ firstEffect, endEffect}))
    while (firstEffect && firstEffect !== endEffect) {
      // console.log('create', fiber.id,  (EFFECT_HOOK_HAS_EFFECT | EFFECT_LAYOUT), firstEffect.tag)
      if ((firstEffect.tag & EFFECT_LAYOUT) && (firstEffect.tag & EFFECT_HOOK_HAS_EFFECT)) {
        firstEffect.tag &= ~EFFECT_HOOK_HAS_EFFECT;
        firstEffect.destroy = firstEffect.create()
      }
      firstEffect = firstEffect.next;
    }
  }
}

function commitWork(fiber: MyFiber) {
  if (!fiber || fiber.flags === NOEFFECT) return;

  console.error('commitWork', logEffectType(fiber), _.cloneDeep(fiber));

  // if (fiber.flags & DELETE) {
  //   commitDelete(fiber);
  //   fiber.flags &= ~DELETE
  // }

  if (fiber.flags & PLACEMENT) {
    commitPlacement(fiber);
    fiber.flags &= ~PLACEMENT
  }
  if (fiber.flags & UPDATE) {
    // console.log('commitUpdate', fiber)
    commitUpdate(fiber);
    fiber.flags &= ~UPDATE
  }

  if (fiber.flags & INSERTBEFORE) {
    commitInsertBefore(fiber);
    fiber.flags &= ~INSERTBEFORE
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
    setIsFlushEffecting(false);
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
    // console.log(_.cloneDeep({ firstEffect }))
    if (firstEffect.tag & tag) {
      // console.log('本次处理的', _.cloneDeep(firstEffect))
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
    const next = firstEffect.next;
    // if (tag === EFFECT_PASSIVE) {
    //   firstEffect.next = null;
    // }
    firstEffect = next
  }

  // console.log(tag, _.cloneDeep({ destroyList, createList}))

  runInBatchUpdate(() => {
    setCurrentContext(DESTROY_CONTEXT)
    // console.log('重置队伍', _.cloneDeep({ destroyList, createList, rootFiber }))
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
  }, jumpReRender)

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
        if (firstEffect.alternate) {
          commitRef(firstEffect, true)
        }
      }
      handleLayoutEffectDestroy(firstEffect);
      firstEffect = firstEffect.nextEffect;
    }
    firstEffect = wipRoot.firstEffect;
    while (firstEffect && firstEffect !== endEffect) {
      const fiber = firstEffect;
      if (fiber.flags & (REFEFFECT | LAYOUT_EFFECT_HOOK)) {
        commitLayoutEffectOrRef(fiber);
        fiber.flags &= ~REFEFFECT
        fiber.flags &= ~LAYOUT_EFFECT_HOOK
      }

      firstEffect = firstEffect.nextEffect;
    }
  })


  // console.log(_.cloneDeep({idList, firstEffect, lastEffect: wipRoot.lastEffect}))
  wipRoot.firstEffect = null;
  wipRoot.lastEffect = null;
  wipRoot.nextEffect = null; // TODO 处理每个fiber的nextEffect
  setRootFiber(wipRoot);

  // console.log('commitRoot---> start')

  // console.warn('useLayoutEffectBefore', getEffectListId(rootFiber));
  // handleEffect(EFFECT_LAYOUT, rootFiber.updateQueue.firstEffect, rootFiber.updateQueue.lastEffect?.next ?? null);
  // rootFiber.updateQueue.firstEffect = f;
  // rootFiber.updateQueue.lastEffect = l;
  // console.warn('useLayoutEffectAfter', _.cloneDeep({ rootFiber }), getEffectListId(rootFiber));
  // 异步设计一个问题，如果在更新中，有effect
  // console.log('同步时候的rootFiber', _.cloneDeep({ wipRoot }), [
  //   rootFiber ? getEffectListId(rootFiber) : '',
  //   wipRoot ? getEffectListId(wipRoot) : ''
  //  ])
  port1.postMessage('EFFECT_PASSIVE')

  // handleEffect()


  logFiberTree(wipRoot)
  setWipRoot(null);
}