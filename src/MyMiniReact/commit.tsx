import _ from "lodash";
import { SNAPSHOT, CREATE_CONTEXT, deletions, DESTROY_CONTEXT, EFFECT_DESTROY, EFFECT_HOOK_HAS_EFFECT, EFFECT_LAYOUT, EFFECT_PASSIVE, fiberRoot, getIsFlushEffecting, getPendingUpdateFiberList, INSERTBEFORE, LAYOUT_FLAGS, NO_CONTEXT, NOEFFECT, PASSIVE_FLAGS, PLACEMENT, PORTAlCOMPONENT, REFEFFECT, rootFiber, setCurrentContext, setIsFlushEffecting, setRootFiber, setWipRoot, UPDATE, wipRoot, UPDATEORMOUNT, ErrorBoundary, ErrorFiberList, NoHandleError, PLACEMENT_SKIP, SUSPENSE_REMOVE, SUSPENSE_RECOVERY, RENDER_SUSPENSE, GetDeriveStateFromErrorFiberList } from "./const";
import { IEffectHook, MyFiber, MyReactElement, MyStateNode } from "./type";
import { isClassComponent, isHostComponent, isPortalComponent, updateDom } from "./dom";
import { fiberHadAlternate, flagsContain, flagsRemove, getFiberTag, logFiberTree } from "./utils";
import { runInBatchUpdate } from "./ReactDom";
import { handlePromiseError, setFiberWithFlags } from "./beginWork";
import { sumbitEffect } from "./completeWork";
import { clearFiber } from "./fiber";

function getParentStateNode(fiber: MyFiber) {
  if (!fiber) return null;
  let parentFiber = fiber.return;
  while (parentFiber && !isHostComponent(parentFiber)) {
    parentFiber = parentFiber.return;
  }
  return parentFiber?.stateNode || fiberRoot.stateNode;
}

function getStateNode(fiber: MyFiber) {
  if (!fiber) return null;
  let childFiber = fiber;
  while (childFiber && !isHostComponent(childFiber)) {
    childFiber = childFiber.child;
  }
  return childFiber?.stateNode || null;
}

function getDeleteStateNode(fiber: MyFiber) {
  if (!fiber) return null;
  let childFiber = fiber;
  while (childFiber && childFiber.tag !== PORTAlCOMPONENT && !isHostComponent(childFiber)) {
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
  // let f = fiber.child;
  // while (f) {
  //   commitDelete(f);
  //   f = f.sibling;
  // }
  if (isPortalComponent(fiber)) {
    return;
  }

  const onlyHandleDom = flagsContain(fiber.flags, SUSPENSE_REMOVE)


  const parentDom: MyStateNode | null = getParentStateNode(fiber)
  const childDom: MyStateNode | null = getDeleteStateNode(fiber);
  if (parentDom && childDom) {
    // console.log(parentDom, _.cloneDeep(fiber), '删除', childDom, parentDom.contains(childDom))
    if (parentDom.contains(childDom)) {
      parentDom.removeChild(childDom);
    }
  }

  if (!onlyHandleDom && flagsContain(fiber.flags, LAYOUT_FLAGS)) {
    handleLayoutEffectDestroy(fiber);
  }
  if (!onlyHandleDom && fiber.ref && (isHostComponent(fiber) || isClassComponent(fiber))) {
    commitRef(fiber, true)
  }

  if (!onlyHandleDom && isClassComponent(fiber)) {
    // console.warn(_.cloneDeep(fiber))
    if (_.isFunction(fiber.stateNode?.componentWillUnmount)) {
      fiber.stateNode.componentWillUnmount()
    }
  }

}

function findHostStateNode(fiber: MyFiber, parentDom: HTMLElement): MyFiber | null | undefined {
  if (!fiber) {
    return null;
  }

  if (isHostComponent(fiber) && fiber.stateNode?.parentElement === parentDom) {
    return fiber;
  }

  return findHostStateNode(fiber.child, parentDom)
}

function findSiblingHostDom(fiber: MyFiber, parentDom: HTMLElement, index = -1) {
  // if (!fiber) {
  //   return null;
  // }

  let parentFiber: MyFiber | null = fiber?.return ?? null;
  while (parentFiber && !isHostComponent(parentFiber)) {
    parentFiber = parentFiber.return;
  }
  if (!parentFiber || !parentFiber.stateNode) {
    return null;
  }

  let f = fiber;
  let targetIndex = index;
  while (f) {
    const target = findHostStateNode(f, parentDom);
    if (target && !flagsContain(f.flags, INSERTBEFORE) && f.index > targetIndex) {
      return target.stateNode;
    }
    if (f.sibling) {
      f = f.sibling;
    } else {
      while (f !== parentFiber && !f.sibling) {
        f = f.return;
      }
      if (f === parentFiber) {
        return null;
      }
      targetIndex = f.index
      // console.log('targetIndex', targetIndex)
      f = f.sibling;
    }
  }
  return null;

  // const silibling = findHostStateNode(fiber, parentDom);
  // return silibling && !(silibling.flags & INSERTBEFORE) ? silibling.stateNode : findSiblingHostDom(fiber.sibling, parentDom);
}

function commitPlacement(fiber: MyFiber) {
  if (!fiber) {
    throw new Error('运行时出错')
  }

  if (isPortalComponent(fiber)) {
    return;
  }

  const parentDom: MyStateNode | null = getParentStateNode(fiber);
  if (parentDom) {
    // console.log(parentDom, 'appendChild', fiber.stateNode)
    // const index = fiber.index;
    const insertDom = findSiblingHostDom(fiber, parentDom as HTMLElement,
      fiber.index
    );
    const currentDom = getStateNode(fiber);
    // console.log('dom', _.cloneDeep({ fiber, parentDom, currentDom, insertDom }))
    if (!currentDom) {
      // return;
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
  if ((isHostComponent(fiber) ||
    isClassComponent(fiber)
  ) &&
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
  if (flagsContain(fiber.flags, REFEFFECT)) {
    commitRef(fiber, false);
  }
  if (flagsContain(fiber.flags, LAYOUT_FLAGS)) {
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

function commitSnapShot(fiber: MyFiber) {
  if (fiberHadAlternate(fiber)) {
    const instance = fiber.stateNode;
    if (instance.getSnapshotBeforeUpdate) {
      fiber.memoizedState = {
        ...fiber.memoizedState,
        snapShot: instance.getSnapshotBeforeUpdate(
          fiber.alternate.pendingProps,
          fiber.alternate.memoizedState?.prevState ?? {}
        )
      }
    }
  }
}

function commitClassComponent(fiber: MyFiber) {
  if (fiberHadAlternate(fiber)) {
    const instance = fiber.stateNode;
    if (instance.componentDidUpdate) {
      try {
        instance.componentDidUpdate(
          fiber.alternate.pendingProps,
          fiber.alternate.memoizedState?.prevState ?? {},
          fiber.alternate.memoizedState?.snapShot ?? null
        )
      } catch (e) {
        handlePromiseError(fiber, e, true)
      }
    }
  } else {
    const instance = fiber.stateNode;
    if (instance.componentDidMount) {
      try {
        instance.componentDidMount()
      } catch (e) {
        handlePromiseError(fiber, e, true)
      }
    }
  }
}

function commitErrorBoundary(fiber: MyFiber) {
  if (_.isFunction(fiber.stateNode?.componentDidCatch)) {
    const targetIndex = ErrorFiberList.findIndex(c => c.fiber === fiber
      || c.fiber === fiber.alternate
    );
    if (targetIndex > -1) {
      try {
        fiber.stateNode.componentDidCatch(
          ErrorFiberList[targetIndex].error
        )
        if (!flagsContain(fiber.flags, UPDATE)
        && !_.isFunction(fiber.type.getDerivedStateFromError)) {
          setFiberWithFlags(fiber, NoHandleError)
        }
        ErrorFiberList.splice(targetIndex, 1);
      } catch (e) {
        handlePromiseError(fiber, e, true)
      }
    } else {
      console.warn('未处理的情况', ErrorFiberList)
    }
  }
}

function commitWork(fiber: MyFiber) {
  if (fiber.flags === PLACEMENT_SKIP) {
    fiber.flags = flagsRemove(fiber.flags, PLACEMENT_SKIP)
  }
  if (!fiber || fiber.flags === NOEFFECT) return;


  // console.error('commitWork', getFiberTag(fiber), _.cloneDeep(fiber));

  // if (fiber.flags & DELETE) {
  //   commitDelete(fiber);
  //   fiber.flags &= ~DELETE
  // }

  if (flagsContain(fiber.flags, PLACEMENT_SKIP)) {
    fiber.flags = flagsRemove(fiber.flags, PLACEMENT_SKIP)
  }

  if (flagsContain(fiber.flags, PLACEMENT) || flagsContain(fiber.flags, INSERTBEFORE)
    || flagsContain(fiber.flags, SUSPENSE_RECOVERY)) {
    commitPlacement(fiber);
    fiber.flags = flagsRemove(fiber.flags, PLACEMENT)
    fiber.flags = flagsRemove(fiber.flags, INSERTBEFORE)
    fiber.flags = flagsRemove(fiber.flags, SUSPENSE_RECOVERY)
  }

  if (flagsContain(fiber.flags, ErrorBoundary)) {
    commitErrorBoundary(fiber)
    fiber.flags = flagsRemove(fiber.flags, ErrorBoundary)
  }

  if (flagsContain(fiber.flags, PASSIVE_FLAGS) ||
    flagsContain(fiber.flags, LAYOUT_FLAGS)
  ) {
    commitEffect(fiber)
    fiber.flags = flagsRemove(fiber.flags, PASSIVE_FLAGS)
  }

  if (flagsContain(fiber.flags, UPDATE)) {
    // console.log('commitUpdate', fiber)
    commitUpdate(fiber);
    fiber.flags = flagsRemove(fiber.flags, UPDATE)
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
    // console.log('effect执行------->')
    while (createList.length) {
      const [effect, create] = createList.shift();
      effect.destroy = create()
    }
    // console.log('effect结束<-------')
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

  setIsFlushEffecting(true)
  runInBatchUpdate(() => {
    let firstEffect = wipRoot.firstEffect;
    wipRoot.commitCount++;

    // console.error('commitRoot', _.cloneDeep({wipRoot, firstEffect, lastEffect: wipRoot.lastEffect}))
    // const idList = []
    let endEffect = wipRoot.lastEffect?.nextEffect ?? null

    // console.error(getCommitEffectListId(wipRoot), _.cloneDeep(wipRoot))

    // for (const x of deletions) {
    //   commitDelete(x)
    // }
    const fiberList = []
    while (firstEffect && firstEffect !== endEffect) {
      if (flagsContain(firstEffect.flags, RENDER_SUSPENSE)) {
        firstEffect.flags = flagsRemove(firstEffect.flags, RENDER_SUSPENSE)
      } else {
        firstEffect.commitCount++;
      }
      fiberList.push(firstEffect);
      if (flagsContain(firstEffect.flags, SNAPSHOT)) {
        commitSnapShot(firstEffect)
        firstEffect.flags = flagsRemove(firstEffect.flags, SNAPSHOT)
      }
      firstEffect = firstEffect.nextEffect;
    }
    console.log(_.cloneDeep(deletions))
    for (const f of deletions) {
      commitDelete(f);
    }
    while (deletions.length) {
      const f = deletions.shift();
      // console.error('被删除的fiber', _.cloneDeep(f))
      if (flagsContain(f.flags, SUSPENSE_REMOVE)) {
        // console.error('suspense-remove', _.cloneDeep(f))
      } else {
        clearFiber(f)
      }
    }


    fiberList.forEach(firstEffect => {
      commitWork(firstEffect);
    })

    firstEffect = wipRoot.firstEffect;
    endEffect = wipRoot.lastEffect?.nextEffect ?? null;



    while (firstEffect && firstEffect !== endEffect) {
      if (flagsContain(firstEffect.flags, REFEFFECT)) {
        if (fiberHadAlternate(firstEffect)) {
          commitRef(firstEffect.alternate, true)
        }
      }

      if (flagsContain(firstEffect.flags, LAYOUT_FLAGS)) {
        handleLayoutEffectDestroy(firstEffect);
      }
      firstEffect = firstEffect.nextEffect;
    }

    firstEffect = wipRoot.firstEffect;
    while (firstEffect && firstEffect !== endEffect) {
      const fiber = firstEffect;

      if (flagsContain(firstEffect.flags, UPDATEORMOUNT)) {
        commitClassComponent(firstEffect)
        firstEffect.flags = flagsRemove(firstEffect.flags, UPDATEORMOUNT)
      }
      
      if (flagsContain(fiber.flags, REFEFFECT) || flagsContain(fiber.flags, LAYOUT_FLAGS)) {
        commitLayoutEffectOrRef(fiber);
        fiber.flags = flagsRemove(fiber.flags, REFEFFECT)
        fiber.flags = flagsRemove(fiber.flags, LAYOUT_FLAGS)
      }
      const origin = firstEffect;
      firstEffect = firstEffect.nextEffect;
      origin.nextEffect = null;
    }

    const list = getPendingUpdateFiberList();
    while (list.length) {
      const [fiber, flag] = list.pop()
      // console.error('commitRoot-pendingUpdateFiberList', _.cloneDeep(fiber))
      setFiberWithFlags(fiber, flag)
    }

    wipRoot.firstEffect = null;
    wipRoot.lastEffect = null;
    wipRoot.nextEffect = null; // TODO 处理每个fiber的nextEffect
    setRootFiber(wipRoot);

    port1.postMessage('EFFECT_PASSIVE')
    if (ErrorFiberList.length || GetDeriveStateFromErrorFiberList.length) {
      console.error('error冒泡没有处理');
    }
    logFiberTree(wipRoot)
    setWipRoot(null);
  })
  // console.log(_.cloneDeep({idList, firstEffect, lastEffect: wipRoot.lastEffect}))

}