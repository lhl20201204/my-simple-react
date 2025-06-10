import _ from "lodash";
import { MyFiber } from "./type";

let globalPromise: Promise<any> | null = null;

export let promiseIsPending = false;

function clear(index: number) {
  promiseResolve = null;
  globalPromise = null;
  promiseIsPending = false;
  lastLogResult.splice(0, lastLogResult.length, ...tempLogResult.splice(0, tempLogResult.length));
  // console.warn('lastLogResult', lastLogResult)
  // originConsoleLog('%c' + lastLogResult, 'color: green')
}

export let promiseResolve: (() => void) | null = () => {
  if (promiseIsPending) {
    clear(2);
  }
}

resetGlobalPromise();

export const tempLogResult = [];

export const lastLogResult = [];

export const fiberWeakMap = new WeakMap<MyFiber, number>();
let fiberCount = 0;
const fiberIds = new Set<number>();

export function resetGlobalPromise() {
  if (promiseIsPending) {
    return;
  }
  // console.error('清空所有tempLogResult', [...tempLogResult])
  // console.trace();
  // console.error('清空所有tempLogResult1', [...tempLogResult])
  // tempLogResult.splice(0, tempLogResult.length);
  // console.error('setState开始执行')
  promiseIsPending = true;
  globalPromise = new Promise((resolve) => {
    promiseResolve = () => {
      if (promiseIsPending) {
        // console.error('useEffect执行完毕')
        resolve(null);
        clear(3);
      }
    }
  })
}

export function getGlobalPromise() {
  return globalPromise;
}

export const originConsoleLog = console.log;

export const originSetTimeout = window.setTimeout;

export function runInRecordLog(cb: () => void) {
  console.log = (...args) => {
    tempLogResult.push(args[0])
    originConsoleLog('%c' + args[0], 'color: green', ...args.slice(1))
  }
  const ret = cb();
  console.log = originConsoleLog
  return ret
}

export async function test3DiffDFS(setState: any, lastArr: string[], count: number | string[][]) {
  const base = Math.floor(Math.random() * 20);
  const expectArr = _.isNumber(count) ? new Array(Math.floor(Math.random() * 20) + 1).fill(0).map((c, i) => `${base + i + 1}`).sort(() => Math.random() - 0.5) : count.shift();
  originConsoleLog({ expectArr, count: _.isNumber(count) ? count : [...count] })
  setState(expectArr);
  await getGlobalPromise();
  const dom = document.getElementById('test-diff-dom');
  if (!dom) {
    throw new Error('dom not found')
  }
  const children = dom.children;
  const currentArr = []
  for (let i = 0; i < children.length; i++) {
    currentArr.push(children[i].id)
  }
  if (!_.isEqual(currentArr, expectArr)) {
    console.warn({
      lastArr,
      currentArr,
      expectArr
    })
    throw new Error('diff error')
  }
  //  console.log({
  //   tempLogResult: [...tempLogResult],
  //   lastArr,
  //   currentArr
  // })

  const expectLogResult = [
    ..._.filter(currentArr, (c) => !_.includes(lastArr, c)),
    ..._.map(_.filter(lastArr, (c) => !_.includes(currentArr, c)), f => `destroy-${f}`),
    ..._.map(_.filter(currentArr, (c) => !_.includes(lastArr, c)), f => `create-${f}`)
  ];
  // console.warn(_.cloneDeep({ lastLogResult, expectLogResult }))
  if (!_.isEqual(lastLogResult, expectLogResult)) {
    console.warn({
      tempLogResult: [...lastLogResult],
      expectLogResult: [...expectLogResult],
      lastArr,
      currentArr
    })
    throw new Error('effect-error')
  }



  if (_.isNumber(count) ? count > 1 : count.length > 0) {
    setTimeout(() => {
      test3DiffDFS(setState, expectArr, _.isNumber(count) ? count - 1 : count)
    }, 1000)
  }
}

export function test3Diff(setState: any, lastArr: string[], count: number | string[][]) {
  // resetGlobalPromise();
  // console.error('lastArr', _.cloneDeep({ lastArr }))
  test3DiffDFS(setState, lastArr, count)
}

export async function testMemoryLeak(setState: any, lastArr: string[], count: number | string[][]) {
  const base = Math.floor(Math.random() * 20);
  const expectArr = _.isNumber(count) ? new Array(Math.floor(Math.random() * 20) + 1).fill(0).map((c, i) => `${base + i + 1}`).sort(() => Math.random() - 0.5) : count.shift();
  originConsoleLog({ expectArr, count: _.isNumber(count) ? count : [...count] })
  
  // 在更新前记录当前的 fiber 实例数量
  const beforeFiberCount = fiberCount;
  const beforeFiberIds = new Set(fiberIds);
  
  setState(expectArr);
  
  // 使用 Promise 来确保在状态更新后检查
  await getGlobalPromise().then(() => {
    // 在更新后检查 fiber 实例是否被正确清理
    const newFiberIds = Array.from(fiberIds).filter(id => !beforeFiberIds.has(id));
    const removedFiberIds = Array.from(beforeFiberIds).filter(id => !fiberIds.has(id));
    
    console.warn({
      beforeFiberCount,
      afterFiberCount: fiberCount,
      diff: fiberCount - beforeFiberCount,
      beforeFiberIds: Array.from(beforeFiberIds),
      currentFiberIds: Array.from(fiberIds),
      newFiberIds,
      removedFiberIds,
      fiberWeakMap
    });
  });
  
  const dom = document.getElementById('test-diff-dom');
  if (!dom) {
    throw new Error('dom not found')
  }
  const children = dom.children;
  const currentArr = []
  for (let i = 0; i < children.length; i++) {
    currentArr.push(children[i].id)
  }
  if (!_.isEqual(currentArr, expectArr)) {
    console.warn({
      lastArr,
      currentArr,
      expectArr
    })
    throw new Error('diff error')
  }
  //  console.log({
  //   tempLogResult: [...tempLogResult],
  //   lastArr,
  //   currentArr
  // })

  const expectLogResult = [
    ..._.filter(currentArr, (c) => !_.includes(lastArr, c)),
    ..._.map(_.filter(lastArr, (c) => !_.includes(currentArr, c)), f => `destroy-${f}`),
    ..._.map(_.filter(currentArr, (c) => !_.includes(lastArr, c)), f => `create-${f}`)
  ];
  // console.warn(_.cloneDeep({ lastLogResult, expectLogResult }))
  if (!_.isEqual(lastLogResult, expectLogResult)) {
    console.warn({
      tempLogResult: [...lastLogResult],
      expectLogResult: [...expectLogResult],
      lastArr,
      currentArr
    })
    throw new Error('effect-error')
  }



  if (_.isNumber(count) ? count > 1 : count.length > 0) {
    setTimeout(() => {
      testMemoryLeak(setState, expectArr, _.isNumber(count) ? count - 1 : count)
    }, 1000)
  }
}

// 添加一个函数来跟踪 fiber 实例
export function trackFiber(fiber: MyFiber) {
  if (fiberWeakMap.has(fiber)) {
    console.warn('重复跟踪 fiber:', fiber.id);
  }
  fiberWeakMap.set(fiber, fiber.id);
  fiberIds.add(fiber.id);
  fiberCount++;
  // originConsoleLog('跟踪 fiber:', fiber.id, '当前总数:', fiberCount);
}

// 添加一个函数来清理 fiber 实例
export function untrackFiber(fiber: MyFiber) {
  if (fiberWeakMap.has(fiber)) {
    // originConsoleLog('清理 fiber:', fiber.id);
    // fiberWeakMap.delete(fiber);
    fiberIds.delete(fiber.id);
    fiberCount--;
  } else {
    console.warn('尝试清理不存在的 fiber:', fiber.id);
  }
}