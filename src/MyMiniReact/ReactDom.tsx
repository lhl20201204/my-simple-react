import _ from "lodash";
import { DEFAULTLANE, getBatchUpdating, NOLANE, ROOTCOMPONENT, rootFiber, setBatchUpdating, setFiberRoot, setWipRoot, setWorkInProgress, wipRoot } from "./const";
import { createFiber, workLoop } from "./fiber";
import { MyElement, MyFiber, MyStateNode, MyTask } from "./type";
import { isPropsEqual } from "./utils";


export const taskQueue: MyTask[] = [];

export function ensureRootIsScheduled() {
  // console.log(_.cloneDeep({
  //   rootFiber
  // }))
  if (!rootFiber || ( rootFiber.lanes === NOLANE && rootFiber.childLanes === NOLANE)) {
    return;
  }
  // rootFiber.updateQueue.firstEffect = null;
  // rootFiber.updateQueue.lastEffect = null;
  // console.log('重新置为空');
  
   const newWipRoot = createFiber({
    $$typeof: window.reactType,
    type: 'root',
    props: rootFiber.pendingProps,
    key: null,
    ref: null,
    _owner: null,
    _store: {
      validated: false
    }
  }, 0, rootFiber, ROOTCOMPONENT);
   console.error( _.cloneDeep({
    wipRoot,
    newWipRoot,
    rootFiber,
    propsIsEqual: isPropsEqual(newWipRoot.pendingProps, rootFiber.memoizedProps)
   }))
   scheduleRootFiber(newWipRoot)
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
      }, 0, null, ROOTCOMPONENT);
      rootFiber2.lanes = DEFAULTLANE;
      setFiberRoot({
        stateNode: rootNode,
        current: rootFiber2
      });
      scheduleRootFiber(rootFiber2)
    },
  };
}