import _ from "lodash";
import { DELETE, EFFECT_DESTROY, EFFECT_HOOK_HAS_EFFECT, EFFECT_LAYOUT, PASSIVE_FLAGS, LAYOUT_FLAGS, NOEFFECT, NOLANE, REFEFFECT, ROOTCOMPONENT, UPDATE, addToPendingUpdateFiberList, SUSPENSE_FLAGS, SUSPENSE_REMOVE, SUSPENSE_RECOVERY, RETRY_ERROR_BOUNDARY, setWorkInProgress, GetDeriveStateFromErrorFiberList } from "./const";
import { createDom, isClassComponent, isHostComponent, isSuspenseComponent } from "./dom";
import { dfsSumbitEffect, getRootFiber, handlePromiseError, setFiberWithFlags } from "./beginWork";
import { MyFiber } from "./type";
import { flagsAdd, flagsContain, flagsRemove, getFiberTag, isDepEqual, saveCurrentCanvasTree } from "./utils";
import { ensureRootIsScheduled } from "./ReactDom";

// function resetEffectQueue(fiber: MyFiber) {
//   const hookList = fiber.hook;
//   fiber.updateQueue.firstEffect = null;
//   fiber.updateQueue.lastEffect = null;
//   for(const hook of  hookList) {
//     if (((hook as IEffectHook).tag & EFFECT_LAYOUT)
//      || ((hook as IEffectHook).tag & EFFECT_PASSIVE)) {
//     pushEffect(fiber, hook as IEffectHook)
//     }
//   }
// }

export function sumbitEffect(fiber: MyFiber) {
  const hasEffectBol = flagsContain(fiber.flags, PASSIVE_FLAGS);
  const hadLayoutEffectBol = flagsContain(fiber.flags, LAYOUT_FLAGS);
  const deleteBol = flagsContain(fiber.flags, DELETE);


  // if (deleteBol) {
  //   fiber.flags |=  LAYOUT_FLAGS
  // }

  if ((hasEffectBol || hadLayoutEffectBol || deleteBol) && (fiber.tag !== ROOTCOMPONENT)) {
    const parentFiber = getRootFiber(fiber);

    // if (!fiber.updateQueue) {
    //   console.log(_.cloneDeep({ fiber, hasEffectBol, hadLayoutEffectBol, deleteBol }))
    //   console.trace();
    // }
    // 递归上传effect
    let f = fiber.updateQueue.firstEffect;
    if (fiber.updateQueue.lastEffect) {
      fiber.updateQueue.lastEffect.next = null;
    }
    // const endEffect = fiber.updateQueue.lastEffect?.next ?? null;
    // if (fiber.updateQueue.lastEffect) {
    //   fiber.updateQueue.lastEffect.next = null;
    // }
    // let c = 0;
    while (f) {
      // if (c ++ > 100) {
      //   throw new Error('jjjj')
      // }
      const isSame = isDepEqual(f.deps, f.pendingDeps);
      // if (f.id === 9) {
      //   console.warn(_.cloneDeep({ f, deps: [[...f.deps], [...f.pendingDeps ?? []]], isSame }))
      // }

      if (!isSame) {
        f.tag |= EFFECT_HOOK_HAS_EFFECT;
        f.deps = f.pendingDeps;
        // console.log(fiber, '有变更', _.cloneDeep({ f, fiber}))
        // if (!deleteBol) {

        // }        
      }

      //  if (f.id === 9) {
      //     console.log('enter', f.tag,  (EFFECT_HOOK_HAS_EFFECT | EFFECT_PASSIVE), (f.tag & (EFFECT_HOOK_HAS_EFFECT | EFFECT_PASSIVE)) || deleteBol)
      //  }

      if (deleteBol) {
        f.tag = flagsAdd(f.tag, EFFECT_DESTROY | EFFECT_HOOK_HAS_EFFECT);
        if (flagsContain(f.tag, EFFECT_LAYOUT)) {
          fiber.flags = flagsAdd(fiber.flags, LAYOUT_FLAGS);
        }
      };

      if (!!(f.tag & EFFECT_HOOK_HAS_EFFECT)) {
        if (!parentFiber.updateQueue.lastEffect) {
          parentFiber.updateQueue.firstEffect = f
        } else {
          parentFiber.updateQueue.lastEffect.next = f
        }
        parentFiber.updateQueue.lastEffect = f;
        // console.log('插入', f.id, _.cloneDeep(f), deleteBol,
        //   _.cloneDeep({updateQueue: parentFiber.updateQueue}),
        //    [getEffectListId(parentFiber, true)]);
        // console.error('sumbitEffect', getFiberIdPathArrow(fiber), f.id, _.cloneDeep({ f }),
        // [getEffectListId(parentFiber)])
        // f.tag &= ~EFFECT_HOOK_HAS_EFFECT
        // if (deleteBol) {
        //   // console.log('删除充值')
        //  fiber.updateQueue.lastEffect = null;
        //  fiber.updateQueue.firstEffect = null
        // }
        if (parentFiber.tag === ROOTCOMPONENT) {
          // console.log('上传', fiber, _.cloneDeep(parentFiber.updateQueue), getEffectListId(parentFiber))
        }
      }
      f = f.next
    }
    // if (parentFiber.updateQueue.lastEffect) {
    //   parentFiber.updateQueue.lastEffect.next = null;
    // }
    // if (!deleteBol) {
    //  resetEffectQueue(fiber)
    // }

    if (deleteBol && (fiber.ref) && (isHostComponent(fiber) || isClassComponent(fiber))) {
      // console.log('卸载ref', _.cloneDeep(fiber))
      fiber.flags = flagsAdd(fiber.flags, REFEFFECT);
    }

    // console.log(_.cloneDeep({ fiber }))

    if (hasEffectBol) {
      fiber.flags = flagsRemove(fiber.flags, PASSIVE_FLAGS)
    }
  }
}

export function removeEffect(fiber: MyFiber) {
  let t = fiber.firstEffect;
  let e = fiber.lastEffect?.nextEffect ?? null;
  while (t && t !== e) {
    const next = t.nextEffect;
    // console.error(t, getFiberTag(t), '被抛弃')
    t.nextEffect = null;
    t = next;
  }
  fiber.firstEffect = null;
  fiber.lastEffect = null;
}

export function completeWork(fiber: MyFiber) {
  if (fiber.memoizedProps !== fiber.pendingProps) {
    console.error('-------->', _.cloneDeep({ fiber }))
  }

  if (flagsContain(fiber.flags, RETRY_ERROR_BOUNDARY)) {
    saveCurrentCanvasTree();
    fiber.flags = flagsRemove(fiber.flags, RETRY_ERROR_BOUNDARY);
    let targetIndex = GetDeriveStateFromErrorFiberList.findIndex(c => c.fiber === fiber);
    if (targetIndex > -1) {
      while (targetIndex > -1) {
        const error = GetDeriveStateFromErrorFiberList[targetIndex].error
        GetDeriveStateFromErrorFiberList.splice(targetIndex, 1);
        removeEffect(fiber);
        try {
          const newstate = fiber.type.getDerivedStateFromError(
            error
          )
          // console.log('进入try', fiber, newstate)
          if (newstate) {
            fiber.stateNode.state = {
              ...fiber.stateNode.state,
              ...newstate
            }
            setFiberWithFlags(fiber, UPDATE)
          }
        } catch (e) {
          // TODO error处理
          (handlePromiseError(fiber, e, true))
          return
        }
        targetIndex = GetDeriveStateFromErrorFiberList.findIndex(c => c.fiber === fiber)
      }
    } else {
      console.warn('未处理的情况')
    }

    // setWorkInProgress(fiber)
    ensureRootIsScheduled(true)
    return
  }

  if (fiber && isHostComponent(fiber) && !fiber.stateNode) {
    createDom(fiber);
  }

  // if (fiber.ref  && ((!fiber.alternate || fiber.lanes > NOLANE) || fiber.ref !== fiber.alternate.ref)) {
  //   // console.log('ref变更', fiber);
  //   setFiberWithFlags(fiber, REFEFFECT)
  // }

  // console.warn('completeWork', _.cloneDeep({ type: getFiberTag(fiber),
  //     id: fiber.id,
  //     fiber }))

  if (isSuspenseComponent(fiber)) {
    // console.error('completeWork-suspense', _.cloneDeep(fiber))
    const insertMap = new Set();
    let f = fiber.firstEffect;
    const end = fiber.lastEffect?.nextEffect ?? null;
    while (f && f !== end) {
      insertMap.add(f)
      f = f.nextEffect;
    }
    if (flagsContain(fiber.flags, SUSPENSE_FLAGS)) {

      f = fiber.memoizedState.children;
      while (f) {
        // console.warn('将suspense的dom临时卸载', _.cloneDeep(f))
        f.flags = flagsAdd(f.flags, SUSPENSE_REMOVE);
        if (!insertMap.has(f)) {
          if (fiber.lastEffect) {
            fiber.lastEffect.nextEffect = f;
          } else {
            fiber.firstEffect = f;
          }
          insertMap.add(f);
          fiber.lastEffect = f;
        }
        // setFiberWithFlags(f, SUSPENSE_REMOVE);
        // f.flags |= SUSPENSE_REMOVE;
        // console.error('suspense-remove', _.cloneDeep(f))
        f = f.sibling;
      }
    } else {
      f = fiber.memoizedState?.fallback;
      while (f) {
        f.return = fiber;
        dfsSumbitEffect(f);
        f = f.sibling;
      }
      if (fiber.memoizedState) {
        fiber.memoizedState.fallback = null;
      }
      f = fiber.memoizedState?.children;
      while (f) {
        if (flagsContain(f.flags, SUSPENSE_REMOVE)) {
          // console.warn('将隐藏的dom重新显示', _.cloneDeep(f))
          f.flags = flagsRemove(f.flags, SUSPENSE_REMOVE);
          f.flags = flagsAdd(f.flags, SUSPENSE_RECOVERY);
          if (!insertMap.has(f)) {
            if (fiber.lastEffect) {
              fiber.lastEffect.nextEffect = f;
            } else {
              fiber.firstEffect = f;
            }
            insertMap.add(f);
            fiber.lastEffect = f;
          }
        }
        // console.error('suspense-remove', _.cloneDeep(f))
        f = f.sibling;
      }
    }
  }

  const parentFiber = fiber.return; // getRootFiber(fiber);
  if (fiber.lastEffect && parentFiber && fiber.tag !== ROOTCOMPONENT) {
    if (parentFiber.lastEffect) {
      parentFiber.lastEffect.nextEffect = fiber.firstEffect;
    } else {
      parentFiber.firstEffect = fiber.firstEffect;
    }
    parentFiber.lastEffect = fiber.lastEffect;
    // console.log(fiber.id, '将后代们上传给父亲', parentFiber.id);
    fiber.firstEffect = null;
    fiber.lastEffect = null;
    fiber.nextEffect = null;
  }


  if (fiber.flags > NOEFFECT && fiber.tag !== ROOTCOMPONENT) {
    const parentFiber = fiber.return; // getRootFiber(fiber)
    if (parentFiber.lastEffect) {
      parentFiber.lastEffect.nextEffect = fiber;
    } else {
      parentFiber.firstEffect = fiber;
    }
    // console.log('推入fiber', fiber, getFiberTag(fiber));
    parentFiber.lastEffect = fiber;
    // console.log(fiber.id, '上传自身', parentFiber.id);
    fiber.firstEffect = null;
    fiber.lastEffect = null;
    fiber.nextEffect = null;
  }


  // sumbitEffect(fiber);
  // console.error('completeWork', _.cloneDeep(fiber));
  fiber.childLanes = NOLANE;
  if (fiber.lanes !== NOLANE) {
    // console.error('------>', fiber.id, _.cloneDeep(fiber))
    if (flagsContain(fiber.flags, UPDATE) || flagsContain(fiber.flags, SUSPENSE_FLAGS)) {
      // console.log('enter');
      addToPendingUpdateFiberList(0, 0, fiber, fiber.flags);
    } else {
      console.error('------>', fiber.id, _.cloneDeep(fiber))
    }
  }

  // if (fiber && fiber.return && isSuspenseComponent(fiber.return)) {
  //   console.warn('completeWork-suspense-child', _.cloneDeep(fiber), fiber.lanes)
  // }
}