import _ from "lodash";
import { MyFiber, MyPortalElement, MyStateNode } from "./type";
import { fiberRoot, FRAGMENTCOMPONENT, HOSTCOMPONENT, isInDebugger, MyReactFiberKey, PORTAlCOMPONENT, PROVIDERCOMPONENT, ROOTCOMPONENT, SUSPENSECOMPONENT, TEXTCOMPONENT } from "./const";
import { runInBatchUpdate } from "./ReactDom";
import { getUUID } from "./utils";

export function isTextComponent(fiber: MyFiber) {
  return fiber.tag === TEXTCOMPONENT;
}

export function isPortalComponent(fiber: MyFiber) {
  return fiber.tag === PORTAlCOMPONENT;
}

export function isHostComponent(fiber: MyFiber) {
  return fiber.tag === HOSTCOMPONENT || isTextComponent(fiber)
    || fiber.tag === FRAGMENTCOMPONENT
    || fiber.tag === PROVIDERCOMPONENT
    || fiber.tag === SUSPENSECOMPONENT
    || isPortalComponent(fiber);
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

const bodyMap = new Map<string, Function>()
// export function getKeys(key: string) {
//   if (!map.has(key)) {
//     map.set(key, getUUID(key))
//   }
//   return map.get(key)
// }

const weakMap = new WeakMap<MyStateNode, Map<string, Function>>();


export function getTopFiber(fiber: MyFiber): HTMLElement | Text {
  let f = fiber;
  while (f && f.tag !== PORTAlCOMPONENT) {
    f = f.return;
  }
  return f ? (f.element as MyPortalElement).containerInfo : fiberRoot.stateNode;
}

const topDomIdMap = new WeakMap();

export function getUniqId(dom: any, key: string) {
  if (!topDomIdMap.has(dom)) {
    topDomIdMap.set(dom, getUUID(key))
  }
  return topDomIdMap.get(dom)
}

export function addEventListener(key: string, fiber: MyFiber) {
  // const rootFiber = getRootFiber(fiber);
  const topDom = getTopFiber(fiber);
  if (!topDom) {
    throw new Error('')
  }
  const isUseInDom = ['onMouseEnter', 'onMouseLeave'].includes(key)

  const uniqId: any = getUniqId(topDom, key);
  if (!weakMap.has(fiber.stateNode)) {
    weakMap.set(fiber.stateNode, new Map())
  }
  const map = isUseInDom ? weakMap.get(fiber.stateNode) : bodyMap;
  const eventDom = isUseInDom ? fiber.stateNode : topDom;
  if (!map.has(uniqId)) {
    const fn = (e: Event) => {
      // console.log(key.slice(2).toLowerCase(), e);
      const originstopPropagation = e.stopPropagation
      runInBatchUpdate(() => {
        let dom = e.target as HTMLElement;
        let jump = false;
        while (dom && dom !== topDom) {
          // console.log(dom)
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
    eventDom.addEventListener(key.slice(2).toLowerCase(), fn)
    // console.log('eventDom', eventDom, key)
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
      if (isTextComponent(fiber)) {
        if (!(_.isNil(newProps) || _.isBoolean(newProps))) {
          dom.textContent = `${newProps}`;
        } else {
          dom.textContent = ``;
        }
        return;
      }
      const oldProps = fiber.alternate?.commitCount > 0 ?
        fiber.alternate?.memoizedProps || {} : {};
      // console.log({newProps, oldProps})
      Object.keys(oldProps).forEach(key => {
        if (key === 'style') {
          const styles = (dom as HTMLElement).style || {};

          _.forEach(styles, (v, k) => {
            //  console.log(v, k, newProps[key]?.[k]);

            if (_.isNil(newProps[key]?.[k])) {
              // console.log(dom, '移除掉', k);
              Reflect.deleteProperty(styles, k);
            }
          });
          // (dom as HTMLElement).style = styles;
          Reflect.set(dom, 'style', styles);
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
                // console.log('添加', dom, k, v);
                (dom as HTMLElement).style[k] =
                  ['padding', 'margin', 'width', 'height'].includes(k) && _.isNumber(v)
                    ? `${v}px`
                    : v;
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
  if (fiber.tag === ROOTCOMPONENT) {
    // return fiberRoot.stateNode;
    return null;
  }
  if (isTextComponent(fiber)) {
    fiber.stateNode = document.createTextNode(_.isNil(fiber.pendingProps) || _.isBoolean(fiber.pendingProps) ? '' : `${fiber.pendingProps}` as string);
    fiber.stateNode[MyReactFiberKey] = fiber;
    // console.log('创建dom', fiber.stateNode)
    return fiber.stateNode;
  }
  if (isHostComponent(fiber)) {
    const dom = isPortalComponent(fiber) ?
      (fiber.element as MyPortalElement).containerInfo
      : document.createElement(
        [
          FRAGMENTCOMPONENT,
          PROVIDERCOMPONENT,
          SUSPENSECOMPONENT
        ].includes(fiber.tag) ? 'fragment' : fiber.type as keyof HTMLElementTagNameMap);
    fiber.stateNode = dom;
    // console.log('创建dom', dom);
    updateDom(fiber);
    mountChildDom(fiber, dom);
    // console.log(dom, '添加', ret, fiber)
    return dom;
  }
  return null;
}

export function mountChildDom(fiber: MyFiber, dom: HTMLElement) {
  let f = fiber.child;
  const ret = []
  while (f) {
    if (isPortalComponent(f)) {
      f = f.sibling;
      continue;
    }
    const childDom = findChildStateNode(f);
    if (childDom) {
      dom.appendChild(childDom)
      ret.push(childDom)
    }
    f = f.sibling;
  }
}