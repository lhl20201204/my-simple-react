import _, { first, update } from "lodash";
import { DELETE, EFFECT_DESTROY, EFFECT_HOOK_HAS_EFFECT, EFFECT_LAYOUT, EFFECT_PASSIVE, PASSIVE_FLAGS, isInDebugger, LAYOUT_FLAGS, NOEFFECT, NOLANE, REFEFFECT, ROOTCOMPONENT, UPDATE, addToPendingUpdateFiberList } from "./const";
import { createDom, isHostComponent } from "./dom";
import { getRootFiber, pushEffect, setFiberWithFlags } from "./beginWork";
import { IEffectHook, MyFiber } from "./type";
import { getEffectListId, isDepEqual, logEffectType, logFiberIdPath } from "./utils";

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
  const hasEffectBol = (fiber.flags & PASSIVE_FLAGS);
  const hadLayoutEffectBol = (fiber.flags & LAYOUT_FLAGS);
  const deleteBol = (fiber.flags & DELETE);

 
  // if (deleteBol) {
  //   fiber.flags |=  LAYOUT_FLAGS
  // }

  if ((hasEffectBol || hadLayoutEffectBol || deleteBol) && (fiber.tag !== ROOTCOMPONENT)) {
    const parentFiber =  getRootFiber(fiber);
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
        f.tag |= EFFECT_DESTROY | EFFECT_HOOK_HAS_EFFECT;
        if (f.tag & EFFECT_LAYOUT) {
          fiber.flags |=  LAYOUT_FLAGS;
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
        // console.error('sumbitEffect', logFiberIdPath(fiber), f.id, _.cloneDeep({ f }),
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
  
    if (deleteBol && (fiber.ref) && isHostComponent(fiber)) {
      fiber.flags |= REFEFFECT;
    }

    // console.log(_.cloneDeep({ fiber }))

    if (hasEffectBol) {
      fiber.flags &= ~PASSIVE_FLAGS
    }
  } 
}

export function completeWork(fiber: MyFiber) {
  if (fiber.memoizedProps !== fiber.pendingProps) {
    console.error('-------->', _.cloneDeep({ fiber }))
  }
  fiber.commitCount ++;
  if (fiber && isHostComponent(fiber) && !fiber.stateNode) {
    createDom(fiber);
  }

  // if (fiber.ref  && ((!fiber.alternate || fiber.lanes > NOLANE) || fiber.ref !== fiber.alternate.ref)) {
  //   // console.log('ref变更', fiber);
  //   setFiberWithFlags(fiber, REFEFFECT)
  // }

  // console.warn('completeWork', _.cloneDeep({ type: logEffectType(fiber),
  //     id: fiber.id,
  //     fiber }))

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
    // console.log('推入fiber', fiber, logEffectType(fiber));
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
    if (fiber.flags & UPDATE) {
      // console.log('enter');
      addToPendingUpdateFiberList(0, 0, fiber);
    } else {
      console.error('------>', fiber.id, _.cloneDeep(fiber))
    }
  }
}