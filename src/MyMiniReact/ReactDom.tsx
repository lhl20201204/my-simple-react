import _ from "lodash";
import { DEFAULTLANE, EFFECT_PASSIVE, getBatchUpdating, getIsFlushEffecting, getIsRendering, NOLANE, ROOTCOMPONENT, rootFiber, setBatchUpdating, setFiberRoot, setIsFlushEffecting, setIsRendering, setWipRoot, setWorkInProgress, wipRoot } from "./const";
import { createFiber, syncWorkLoop, workLoop } from "./fiber";
import { MyElement, MyFiber, MyStateNode, MyTask } from "./type";
import { handleEffect } from "./commit";
import { getEffectListId } from "./utils";


export const taskQueue: MyTask[] = [];

export function ensureRootIsScheduled(isSync: boolean) {

  const originRootFiber = !rootFiber || wipRoot ? wipRoot : rootFiber;

  // console.log(_.cloneDeep({
  //   originRootFiber,
  //   wipRoot,
  //   rootFiber
  // }))

  if ((originRootFiber.lanes === NOLANE && originRootFiber.childLanes === NOLANE)) {
    return;
  }
  // rootFiber.updateQueue.firstEffect = null;
  // rootFiber.updateQueue.lastEffect = null;
  // console.log('重新置为空');

  //  console.log('重新从root开始渲染');

  const newWipRoot = createFiber({
    $$typeof: window.reactType,
    type: 'root',
    props: originRootFiber.pendingProps,
    key: null,
    ref: null,
    _owner: null,
    _store: {
      validated: false
    }
  }, 0, originRootFiber, ROOTCOMPONENT);
  //  console.error( _.cloneDeep({
  //   wipRoot,
  //   newWipRoot,
  //   rootFiber,
  //   path: [
  //     wipRoot ? getEffectListId(wipRoot) : '',
  //     newWipRoot ? getEffectListId(newWipRoot) : '',
  //     rootFiber ? getEffectListId(rootFiber) : ''
  //   ]
  //  }))
  scheduleRootFiber(newWipRoot, isSync)
}

export function reRender(isSync: boolean) {
  if (!getIsRendering()) {
    if (getIsFlushEffecting()) {
      // console.error('提前执行useEffect')
      handleEffect(EFFECT_PASSIVE, rootFiber, true)
      wipRoot.updateQueue.lastEffect = null;
      wipRoot.updateQueue.firstEffect = null;
      setIsFlushEffecting(false)
    }
    setIsRendering(true);
    // 立即执
    if (isSync) {
      // console.log('开始渲染')
      syncWorkLoop()
    } else {
      requestIdleCallback(workLoop);
    }
  }
}

export function scheduleRootFiber(rootFiber3: MyFiber, isSync: boolean) {
  setWipRoot(rootFiber3);
  setWorkInProgress(rootFiber3);
  // console.log('scheduleRootFiber', { rootFiber3 }, isSync, getIsRendering());
  reRender(isSync)
}


export function runInBatchUpdate<T>(cb: () => T, jumpReRender = false): T {
  const preBol = getBatchUpdating()
  setBatchUpdating(true)
  const ret = cb()
  setBatchUpdating(preBol)
  if (!preBol && !jumpReRender) {
    ensureRootIsScheduled(true)
  }
  return ret;
}


export function createRoot(rootNode: MyStateNode) {
  return {
    render: (element: MyElement) => {
      // console.log('element', { element})
      const rootFiber2 = createFiber({
        $$typeof: window.reactType,
        type: 'root',
        props: {
          children: element
        },
        key: null,
        ref: null,
        _owner: null,
        _store: {
          validated: false
        }
      }, 0, null, ROOTCOMPONENT);
      rootFiber2.lanes = DEFAULTLANE;
      setFiberRoot({
        stateNode: rootNode,
        current: rootFiber2
      });
      scheduleRootFiber(rootFiber2, false)
    },
  };
}