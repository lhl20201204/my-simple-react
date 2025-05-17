import EventEmitter from "./events";
import _ from "lodash";
import { ReactDOM, useCallback, useEffect, useRef, useState } from "./utils";

const emitter = new EventEmitter();
const map = new Map<string, unknown>();
const IDSet = new Set<string>();


const joinSign = '#######';

function generateUUID(indicatorDataIndex: string) {
  return (
    indicatorDataIndex +
    joinSign +
    (Number(new Date()) +
      Math.random().toString(36).slice(2) +
      Math.random().toString(36).slice(2))
  );
}

function getUUID(indicatorDataIndex: string) {
  let t = generateUUID(indicatorDataIndex);
  while (IDSet.has(t)) {
    t = generateUUID(indicatorDataIndex);
  }
  IDSet.add(t);
  return t;
}

const parentSign = getUUID('@@parent');
const childSign = getUUID('@@child');

declare namespace React {
  type Dispatch<T> = (x: T) => void;
  type  SetStateAction<T> = T | ((_x: T) => T)
}

export function useParentState<T>(eventName: string, initialState: T):
  [T, React.Dispatch<React.SetStateAction<T>>, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setInnerState] = useState<T>(initialState ?? map.get(eventName) as T);
  const firstRef = useRef<boolean>(true);
  if (firstRef.current) {
    if (map.has(eventName)) {
      console.warn(`${eventName} has been set`);
    }
    map.set(eventName, initialState);
    firstRef.current = false;
  }

  const setState = useCallback((value: T | ((x: T) => T)) => {
    const totalEventName = eventName + (childSign);
    ReactDOM.unstable_batchedUpdates(() => {
    if (_.isFunction(value)) {
      setInnerState((x) => {
        const ret = value(x);
        map.set(eventName, ret);
        emitter.emit(totalEventName, ret);
        return ret;
      });
    } else {
      setInnerState(value);
      map.set(eventName, value);
      emitter.emit(totalEventName, value);
    }
    })
  }, [])

  useEffect(() => {
    const totalEventName = eventName + parentSign
    emitter.on(totalEventName, setState);
    return () => {
      emitter.off(totalEventName, setState);
      map.delete(eventName)
    }
  }, []);
  return [state, setState, setInnerState];
}

export function useChildState<T>(eventName: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setInnerState] = useState<T>(map.get(eventName) as T);
  useEffect(() => {
    const totalEventName = eventName + childSign
    emitter.on(totalEventName, setInnerState);
    return () => {
      emitter.off(totalEventName, setInnerState);
    }
  }, [])

  const setState = useCallback((value: T | ((x: T) => T)) => {
    const totalEventName = eventName + parentSign
    emitter.emit(totalEventName, value);
  }, [])

  return [state, setState];
}

