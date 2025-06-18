import { createContext, useContext, useMemo, useState } from "./utils";

const Context = createContext('');

const Context2 = createContext('static')

function Grand() {
  const ccc = useContext(Context)
  const ccc2 = useContext(Context2);
  const ccc3 = useContext(Context)
  console.log('Grand', [ccc, ccc2, ccc3])
  return <div ref={(x) => {
    console.log('ref', [x])
  }}>
    {ccc}
  </div>
}

function Child({ children, debuggerKey }) {
  const [id, setId] = useState(0);

  const consumer = useMemo(
    () => <Context.Consumer>
      {
        value => {
          console.log('consumer')
          return <>
            <span>
              consumer =={value}</span>
            <div>
              fdsjfosdf
            </div>
          </>
        }}
    </Context.Consumer>, [])

  console.log('child', consumer)
  return <div >
    <div id={debuggerKey} style={{ border: '1px solid red', padding: '8px' }} onClick={() => {
      console.log('middle', debuggerKey)
      setId(id + 1)
    }}>middle</div>
    {children}
    {consumer}
  </div>
}
let c = 0;
function App() {
  const arr = useState(6)
  const arr2 = useState(8)

  if (c++ > 100) {
    throw new Error('fff')
  }

  const dom = useMemo(() => {
    return <Child debuggerKey={'A'}>
      <Grand></Grand>
    </Child>
  }, [])

  const dom2 = useMemo(() => {
    return <Child debuggerKey={'B'}>
      <Grand></Grand>
    </Child>
  }, [])

  const fn = ([x, fn], i) => {
    const t = [dom, dom2][i];
    return <div key={i} style={{ border: '1px solid blue', padding: '8px' }}>
      <Context2.Provider value={'fdsfsdf'}>
        <Context.Provider value={x}>
          <Context.Provider value={x + '_inner'}>
            {t}
            <div onClick={() => {
              console.log('点击----')
              fn(f => f + 1)
            }}>group{i}</div>
          </Context.Provider>
        </Context.Provider>
      </Context2.Provider>
    </div>
  }

  const ret = <>
    {
      [arr, arr2].map(fn)
    }</>;

  console.log('Context.Provider ', Context.Provider, ret, [dom, dom1])
  return ret;
}

const dom1 = <App />

export default dom1;