import _ from "lodash";
import { MyFiber } from "./type";
import { HOSTCOMPONENT, isInDebugger, MyReactFiberKey } from "./const";
import { runInBatchUpdate } from "./ReactDom";

export function isHostComponent(fiber: MyFiber) {
  return fiber.tag === HOSTCOMPONENT
}

export const findChildStateNode = (fiber: MyFiber | null) => {
  if (!fiber) {
    return null;
  }
  if (isHostComponent(fiber) && fiber.stateNode) {
    return fiber.stateNode;
  }
  return findChildStateNode(fiber.child)
}

const map = new Map<string, Function>()
// export function getKeys(key: string) {
//   if (!map.has(key)) {
//     map.set(key, getUUID(key))
//   }
//   return map.get(key)
// }


export function addEventListener(key: string, fiber: MyFiber) {
  // const rootFiber = getRootFiber(fiber);
  const topDom: HTMLElement = document.body;
  if (!topDom) {
    throw new Error('')
  }
  const uniqId = key;
  // console.log('enter', map, key);
  if (!map.has(uniqId)) {
    const fn = (e: Event) => {
      const originstopPropagation = e.stopPropagation
      runInBatchUpdate(() => {
        let dom = e.target as HTMLElement;
        let jump = false;
        while (dom) {
          const targetFiber: MyFiber = dom[MyReactFiberKey];
          if (targetFiber && isHostComponent(targetFiber) && targetFiber.memoizedProps[key]) {
            e.stopPropagation = (...args: []) => {
              jump = true;
              originstopPropagation.call(e, ...args)
            }
            // console.log('触发回调时候的fiber', targetFiber, [targetFiber.memoizedProps[key]])
            if (!_.isFunction(targetFiber.memoizedProps[key])) {
              console.warn(e, '不是函数')
            } else {
              targetFiber.memoizedProps[key](e)
            }
          }
          if (jump) {
            break;
          }
          dom = dom.parentElement
        }
      })
    }
    topDom.addEventListener(key.slice(2).toLowerCase(), fn)
    map.set(uniqId, fn);
  }

}

export function updateDom(fiber: MyFiber) {
  if (!fiber) return;
  if (isHostComponent(fiber)) {
    const newProps = fiber.pendingProps;
    const dom = fiber.stateNode;
    dom[MyReactFiberKey] = fiber;

    // fiber.memoizedProps = fiber.pendingProps;

    if (dom) {
      if (fiber.type === 'text') {
        if (!(_.isNil(newProps) || _.isBoolean(newProps))) {
          dom.textContent = `${newProps}`;
        } else {
          dom.textContent = ``;
        }
        return;
      }

      const oldProps = fiber.alternate?.memoizedProps || {};
      Object.keys(oldProps).forEach(key => {
        if (key === 'style') {
          _.forEach(oldProps[key], (v, k) => {
            if (_.isNil(newProps[key]?.[k])) {
              (dom as HTMLElement).style[k] = undefined;
            }
          })
        } else if (key !== 'children' && newProps[key] === undefined) {
          dom[key] = undefined;
        }
      });
      Object.keys(newProps || {}).forEach(key => {
        if (key !== 'children' && newProps[key] !== oldProps[key]) {
          if (_.startsWith(key, 'on')) {
            // const fnKey = getKeys(key)
            // if (_.get(dom, fnKey)) {
            //   dom.removeEventListener(key.slice(2).toLowerCase(), _.get(dom, fnKey));
            // }

            // _.set(dom, fnKey, (e) => {
            //   runInBatchUpdate(() => {
            //     newProps[key](e)
            //   })
            // });
            // dom.addEventListener(key.slice(2).toLowerCase(), _.get(dom, fnKey));
            addEventListener(key, fiber)
          } else {
            if (key === 'style') {
              _.forEach(newProps[key], (v, k) => {
                (dom as HTMLElement).style[k] = v;
              })
            } else {
              dom[key] = newProps[key];
            }
          }
        }
      });
    }

  }
}

export function createDom(fiber: MyFiber) {
  if (fiber.type === 'root') {
    // return fiberRoot.stateNode;
    return null;
  }
  if (fiber.type === 'text') {
    fiber.stateNode = document.createTextNode(_.isNil(fiber.pendingProps) || _.isBoolean(fiber.pendingProps) ? '' : `${fiber.pendingProps}` as string);
    fiber.stateNode[MyReactFiberKey] = fiber;
    return fiber.stateNode;
  }
  if (isHostComponent(fiber)) {
    const dom = document.createElement(fiber.type as keyof HTMLElementTagNameMap);
    fiber.stateNode = dom;
    updateDom(fiber);
    let f = fiber.child;
    const ret = []
    while (f) {
      const childDom = findChildStateNode(f);
      if (childDom) {
        dom.appendChild(childDom)
        ret.push(childDom)
      }
      f = f.sibling;
    }
    // console.log(dom, '添加', ret)
    return dom;
  }
  return null;
}