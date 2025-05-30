import _ from "lodash";
import { DELETE, EFFECT_DESTROY, EFFECT_HOOK_HAS_EFFECT, EFFECT_LAYOUT, EFFECT_PASSIVE, EFFECTHOOK, isInDebugger, LAYOUT_EFFECT_HOOK, NOEFFECT, NOLANE, REFEFFECT, ROOTCOMPONENT } from "./const";
import { createDom, isHostComponent } from "./dom";
import { getRootFiber, setFiberWithFlags } from "./beginWork";
import { MyFiber } from "./type";
import { getEffectListId, isDepEqual, logEffectType, logFiberIdPath } from "./utils";

export function sumbitEffect(fiber: MyFiber) {
  const hasEffectBol = (fiber.flags & EFFECTHOOK);
  const hadLayoutEffectBol = (fiber.flags & LAYOUT_EFFECT_HOOK);
  const deleteBol = (fiber.flags & DELETE);

  if (deleteBol) {
    fiber.flags |= LAYOUT_EFFECT_HOOK
  }

  if ((hasEffectBol || hadLayoutEffectBol || deleteBol) && (fiber.tag !== ROOTCOMPONENT)) {
    const parentFiber = getRootFiber(fiber);
    // 递归上传effect
    let f = fiber.updateQueue.firstEffect;
    const endEffect = fiber.updateQueue.lastEffect?.next ?? null;
    // if (fiber.updateQueue.lastEffect) {
    //   fiber.updateQueue.lastEffect.next = null;
    // }
    while (f && f !== endEffect) {
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

      if (!!(f.tag & EFFECT_HOOK_HAS_EFFECT) || deleteBol) {
        if (deleteBol) {
          // console.log('删除进来')
          f.tag |= EFFECT_DESTROY | EFFECT_HOOK_HAS_EFFECT
        };
        if (!parentFiber.updateQueue.lastEffect) {
          parentFiber.updateQueue.firstEffect = f
        } else {
          parentFiber.updateQueue.lastEffect.next = f
        }
        // console.log('插入', f);
        parentFiber.updateQueue.lastEffect = f;
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

    if (deleteBol && (fiber.ref)) {
      fiber.flags |= REFEFFECT;
    }

    // console.log(_.cloneDeep({ fiber }))

    if (hasEffectBol) {
      fiber.flags &= ~EFFECTHOOK
    }
  }
}

export function completeWork(fiber: MyFiber) {
  if (fiber.memoizedProps !== fiber.pendingProps) {
    console.error('-------->', _.cloneDeep({ fiber }))
  }
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

  const parentFiber = getRootFiber(fiber);
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
    const parentFiber = getRootFiber(fiber)
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


  sumbitEffect(fiber);
  // console.error('completeWork', _.cloneDeep(fiber));
  fiber.childLanes = NOLANE;
  if (fiber.lanes !== NOLANE) {
    console.error('------>', fiber.id, _.cloneDeep(fiber))
  }
}