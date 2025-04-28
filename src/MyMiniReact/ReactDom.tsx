import _ from "lodash";
import { NOEFFECT, ROOTCOMPONENT, rootFiber, setFiberRoot, setWipRoot, setWorkInProgress } from "./const";
import { createFiber, workLoop } from "./fiber";
import { MyElement, MyFiber, MyStateNode, MyTask } from "./type";


export const taskQueue: MyTask[] = [];

export function ensureRootIsScheduled() {
   const wipRoot = createFiber({
    type: 'root',
    props: {
      children: rootFiber.pendingProps.children
    },
    key: null,
    ref: null
  }, 0, rootFiber, null, ROOTCOMPONENT)
  console.log( _.cloneDeep({
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


export function createRoot(rootNode: MyStateNode) {
  return {
    render: (element: MyElement) => {
      const rootFiber2 = createFiber({
        type: 'root',
        props: {
          children: element
        },
        key: null,
        ref: null
      }, NOEFFECT, null, null, ROOTCOMPONENT);

      setFiberRoot({
        stateNode: rootNode,
        current: rootFiber2
      });
      scheduleRootFiber(rootFiber2)
    },
  };
}