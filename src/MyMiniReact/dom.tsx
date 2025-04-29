import _ from "lodash";
import { MyFiber } from "./type";
import { getUUID } from "./utils";
import { getBatchUpdating, HOSTCOMPONENT, setBatchUpdating } from "./const";
import { ensureRootIsScheduled } from "./ReactDom";

export function isHostComponent(fiber: MyFiber) {
  return fiber.tag === HOSTCOMPONENT
}

export  const findChildStateNode = (fiber: MyFiber | null) => {
  if (!fiber) {
    return null;
  }
  if (isHostComponent(fiber) && fiber.stateNode) {
    return fiber.stateNode;
  }
  return findChildStateNode(fiber.child)
}

const map = new Map()
export function getKeys(key:string) {
  if (!map.has(key)) {
    map.set(key, getUUID(key))
  }
  return map.get(key)
}

export function updateDom(fiber: MyFiber) {
  if (!fiber) return;
  if (isHostComponent(fiber)) {
    const newProps = fiber.pendingProps;
    const dom = fiber.stateNode;

    // fiber.memoizedProps = fiber.pendingProps;

    if (dom) {
      if (fiber.type === 'text') {
        dom.textContent =`${newProps}`;
        return;
      }

      const oldProps = fiber.alternate?.memoizedProps || {};
      Object.keys(oldProps).forEach(key => {
        if (key !== 'children' && newProps[key] === undefined) {
          dom[key] = undefined;
        }
      });
      Object.keys(newProps).forEach(key => {
        if (key !== 'children') {
          if (_.startsWith(key, 'on')) {
            const fnKey = getKeys(key)
            if (_.get(dom, fnKey)) {
              dom.removeEventListener(key.slice(2).toLowerCase(), _.get(dom, fnKey));
            }
             _.set(dom, fnKey ,(e) => {
              const preBol = getBatchUpdating()
              setBatchUpdating(true)
              newProps[key](e)
              setBatchUpdating(preBol)
              if (!preBol) {
                 ensureRootIsScheduled()
              }
           });
            dom.addEventListener(key.slice(2).toLowerCase(), _.get(dom, fnKey));
          } else {
            dom[key] = newProps[key];
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
    fiber.stateNode = document.createTextNode(`${fiber.pendingProps}` as string);
    return fiber.stateNode;
  }
  if (isHostComponent(fiber)) {
    const dom = document.createElement(fiber.type as keyof HTMLElementTagNameMap);
    fiber.stateNode = dom;
    updateDom(fiber);
    let f = fiber.child;
    while(f) {
      const childDom = findChildStateNode(f);
      if (childDom) {
        dom.appendChild(childDom)
      }
      f = f.sibling;
    }
    return dom;
  }
  return null;
}