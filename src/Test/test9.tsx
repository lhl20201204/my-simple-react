import { useEffect, useLayoutEffect, useState } from "./utils";

function Child({ value, onChange }: { value: number, onChange: (x: number) => void }) {
  console.log('render-child', value)
  const [str, setStr] = useState('')
  useEffect(() => {
    console.log('child-effect-create', value, str)
    return () => {
      console.log('child-effect-destroy', value, str)
    }
  }, [value, str])

  useLayoutEffect(() => {
    console.log('child-layout-effect-create', value, str)
    return () => {
      console.log('child-layout-effect-destroy', value, str)
    }
  }, [value, str])

  if (str === '') {
    console.log('render-child-middle', value)
    onChange(1)
    // setStr('str')
  }
  console.log('render-child-end', value)
  return <div ref={(x) => {
    console.log('child-ref', [x]);
  }}>
    {value}==={str}
    <Child3 value={str} onChange={setStr} />
  </div>
}

function Child3<T extends string>({ value, onChange }: { value: T, onChange: (x: T) => void }) {
  console.log('%c render-child3', 'color: red', [value])
  if (value === '') {
    // onChange('callback' as T);
  }
  return <div>Child3</div>
}

function Child2() {
  console.log('%c render-child2', 'color: red')
  return <div>Child2</div>
}

let id = 0;
function App() {
  console.log('%c render-app', 'color: red', id)
  const test = <div id="test">test</div>
  console.log('%c render-cnt', 'color: red')
  const [cnt, setCnt] = useState(0);
  const tempId = id;
  console.log('%c render-app--middle', 'color: red', id, cnt)
  useEffect(() => {
    console.log('%c effect-create', 'color: red', cnt)
    return () => {
      console.log('%c effect-destroy', 'color: red', cnt)
    }
  }, [cnt])

  useLayoutEffect(() => {
    console.log('%c layout-effect-create', 'color: red', cnt)
    return () => {
      console.log('%c layout-effect-destroy', 'color: red', cnt)
    }
  }, [cnt])


  //  if (cnt < 2) {
  //   setCnt(c => c + 1)
  //  }

  console.log('%c cnt, id, tempId', 'color: red', cnt, id, tempId)

  function g(x) {
    console.log('%c ref', 'color: red', [x], g.id);
  }
  g.id = id++;

  return <div id={"parent"} style={{ border: '1px solid red', padding: '10px' }} ref={g} >
    <span>{'全局global=>' + id}</span>
    <div onClick={() => {
      setCnt(t => {
        console.log('setCnt-cb', t + 1)
        return t + 1
      })
    }} style={{ border: '1px solid blue', padding: '10px' }}>parent={cnt}</div>
    <Child key={1} value={cnt} onChange={setCnt}></Child>
    <Child2></Child2>
  </div>
}

const dom = <App />

export default dom;