import _ from "lodash";
import { useEffect, useState } from "./utils";
import { AliveScope, KeepAlive, useActivate, useUnactivate } from "./KeepAlive";

function Routes(props: { children: any }) {
  const [, setId] = useState(0);

  useEffect(() => {
    const fn = () => {
      setId(c => c + 1);
    }
    window.addEventListener('hashchange', fn);
    return () => {
      window.removeEventListener("hashchange", fn);
    }
  }, [])

  for (const r of props.children) {
    if (r.props.path === window.location.hash.slice(1)) {
      return r.props.element;
    }
  }
  return null;
}

function Route(props: { path: string, element: any }) {
  return null;
}


function A() {
  useActivate(() => {
    console.log('A activate')
  })
  useUnactivate(() => {
    console.log('A inactivate')
  })
  return <div>A<input type="text" /></div>
}

function B() {
  useActivate(() => {
    console.log('B activate')
  })
  useUnactivate(() => {
    console.log('B inactivate')
  })
  return <div>B<input type="text" /></div>
}

function Test14() {

  return <AliveScope>
    <Routes>
      <Route
        path="a"
        element={
          <KeepAlive cacheKey="/a">
            <A />
          </KeepAlive>
        }
      />
      <Route
        path="b"
        element={
          <KeepAlive cacheKey="/b">
            <B />
          </KeepAlive>
        }
      />
    </Routes>
  </AliveScope>
}

const dom = <Test14 />;

export default dom;
