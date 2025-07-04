import _ from "lodash";
import { useEffect, useState } from "./utils";
import { AliveScope, KeepAlive, useActivate, useUnactivate } from "./KeepAlive";


function Counter() {
  const [count, setCount] = useState(0)

  useActivate(() => {
    console.log('Counter activate');
  })
  useUnactivate(() => {
    console.log('Counter unactivate');
  })

  return <div>
    <button onClick={() =>{ 
      console.log('加1');
      setCount(count + 1)
    }}>+</button>
    <span>{count}</span>
    <button onClick={() => setCount(count - 1)}>-</button>
  </div>
}

function A() {
  console.log('A------>');

  useEffect(() => {
    console.log('A useEffect create');
    return () => {
      console.log('A useEffect destroy');
    }
  }, [])

  return <KeepAlive cacheKey={'a'}>
    <div>A<input /><Counter /></div>
  </KeepAlive>
}

const routes = [
  {
    path: "a",
    component: A
  },
  {
    path: "b",
    component: function B() {
      useActivate(() => {
        console.log('B activate')
      })
      useUnactivate(() => {
        console.log('B inactivate')
      })
      return <KeepAlive cacheKey="b"><div id="b">B<input type="text" /></div></KeepAlive> }
  },
  {
    path: "c",
    component: function C() {

      return<div id="c">C<input type="text" /></div> }
  }
]

function Outlet(props: any) {
  const [id, setId] = useState(0);
  useEffect(() => {
    const fn = () => {
      setId(c => c + 1);
    }
    window.addEventListener("hashchange", fn);
    return () => {
      window.removeEventListener("hashchange", fn);
    }
  }, [])
  const route = routes.find(r => r.path === window.location.hash.slice(1));
  return route ? <route.component {...props} /> : null;
}

export function useHash() {
  const [hash, setHash] = useState(window.location.hash.slice(1));
  useEffect(() => {
    const fn = () => {
      setHash(window.location.hash.slice(1));
    }
    window.addEventListener("hashchange", fn);
    return () => {
      window.removeEventListener("hashchange", fn);
    }
  }, [])
  return hash;
}

export function Test15() {
  const hash = useHash();
  console.log('hash', hash)
  return <AliveScope>
    {/* <KeepAlive cacheKey={hash}> */}
      <Outlet />
    {/* </KeepAlive> */}
  </AliveScope>
}

const dom = <Test15 />;

export default dom;