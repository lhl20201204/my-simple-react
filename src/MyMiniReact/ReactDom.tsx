import _ from "lodash";
import { DEFAULTLANE, getBatchUpdating, isInDebugger, NOEFFECT, NOLANE, ROOTCOMPONENT, rootFiber, setBatchUpdating, setFiberRoot, setWipRoot, setWorkInProgress } from "./const";
import { createFiber, workLoop } from "./fiber";
import { MyElement, MyFiber, MyStateNode, MyTask } from "./type";


export const taskQueue: MyTask[] = [];

export function ensureRootIsScheduled() {
  if (rootFiber && rootFiber.lanes === NOLANE && rootFiber.childLanes === NOLANE) {
    return;
  }
  rootFiber.updateQueue.firstEffect = null;
  rootFiber.updateQueue.lastEffect = null;
  
   const wipRoot = createFiber({
    $$typeof: window.reactType,
    type: 'root',
    props: {
      children: rootFiber.pendingProps.children
    },
    key: null,
    ref: null,
    _owner: null,
    _store: {
      validated: false
    }
  }, 0, rootFiber, null, ROOTCOMPONENT)
  isInDebugger && console.log( _.cloneDeep({
    wipRoot,
    rootFiber
   }))
   scheduleRootFiber(wipRoot)
}

export function scheduleRootFiber(rootFiber3: MyFiber) {
  setWipRoot(rootFiber3);
  setWorkInProgress(rootFiber3);
  requestIdleCallback(workLoop);
}


export function runInBatchUpdate(cb: () => void) {
  const preBol = getBatchUpdating()
   setBatchUpdating(true)
  const ret =  cb()
  setBatchUpdating(preBol)
 if (!preBol) {
   ensureRootIsScheduled()
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
      }, 0, null, null, ROOTCOMPONENT);
      rootFiber2.lanes = DEFAULTLANE;
      setFiberRoot({
        stateNode: rootNode,
        current: rootFiber2
      });
      scheduleRootFiber(rootFiber2)
    },
  };
}