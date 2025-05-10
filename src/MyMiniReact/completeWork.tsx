import _ from "lodash";
import { DELETE, EFFECT_DESTROY, EFFECT_HOOK_HAS_EFFECT, EFFECT_PASSIVE, EFFECTHOOK, isInDebugger, LAYOUT_EFFECT_HOOK, NOLANE, REFEFFECT, ROOTCOMPONENT } from "./const";
import { createDom, isHostComponent } from "./dom";
import { getRootFiber } from "./beginWork";
import { MyFiber } from "./type";

export function sumbitEffect(fiber: MyFiber) {
  const hasEffectBol = (fiber.flags & EFFECTHOOK);
  const deleteBol = (fiber.flags & DELETE);

  if (deleteBol) {
    fiber.flags |= LAYOUT_EFFECT_HOOK
  }

  if ((hasEffectBol || deleteBol) && (fiber.tag !== ROOTCOMPONENT)) {
    const parentFiber = getRootFiber(fiber);
    // 递归上传effect
    let f = fiber.updateQueue.firstEffect;
    const endEffect = fiber.updateQueue.lastEffect?.next ?? null;
    // if (fiber.updateQueue.lastEffect) {
    //   fiber.updateQueue.lastEffect.next = null;
    // }
    while (f && f!== endEffect) {

      if ((f.tag & (EFFECT_HOOK_HAS_EFFECT | EFFECT_PASSIVE)) || deleteBol) {
        if (deleteBol) { 
          // console.log('删除进来')
          f.tag |= EFFECT_DESTROY | EFFECT_HOOK_HAS_EFFECT
        };
        if (!parentFiber.updateQueue.lastEffect) {
          parentFiber.updateQueue.firstEffect = f
        } else {
          parentFiber.updateQueue.lastEffect.next = f
        }
        parentFiber.updateQueue.lastEffect = f;
        // f.tag &= ~EFFECT_HOOK_HAS_EFFECT
        // if (deleteBol) {
        //   // console.log('删除充值')
        //  fiber.updateQueue.lastEffect = null;
        //  fiber.updateQueue.firstEffect = null
        // }
      }
      f = f.next
    }

    if (deleteBol && (fiber.ref)) {
      fiber.flags |= REFEFFECT;
    }
    
    // console.log(_.cloneDeep({ fiber }))

    fiber.flags &= ~EFFECTHOOK
  }
}

export function completeWork(fiber: MyFiber) {
  fiber.memoizedProps = fiber.pendingProps;
  if (fiber && isHostComponent(fiber) && !fiber.stateNode) {
    createDom(fiber);
  }

  // if (fiber.ref  && ((!fiber.alternate || fiber.lanes > NOLANE) || fiber.ref !== fiber.alternate.ref)) {
  //   // console.log('ref变更', fiber);
  //   setFiberWithFlags(fiber, REFEFFECT)
  // }

  // console.warn('completeWork', _.cloneDeep({ fiber }))

  const parentFiber = fiber.return;
  if (fiber.lastEffect && parentFiber) {
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


  if (fiber.lanes > NOLANE && fiber.tag !== ROOTCOMPONENT) {
    const parentFiber = fiber.return;
    if (parentFiber.lastEffect) {
      parentFiber.lastEffect.nextEffect = fiber;
    } else {
      parentFiber.firstEffect = fiber;
    }
    parentFiber.lastEffect = fiber;
    // console.log(fiber.id, '上传自身', parentFiber.id);
    fiber.firstEffect = null;
    fiber.lastEffect = null;
    fiber.nextEffect = null;
  }


  sumbitEffect(fiber);
  isInDebugger && console.error('completeWork', _.cloneDeep(fiber));
  fiber.lanes = NOLANE;
  fiber.childLanes = NOLANE;

}