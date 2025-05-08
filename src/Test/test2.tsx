import { useEffect, useLayoutEffect, useState } from "./utils"

function App2({ id, children }: {id: string, children?: any}) {
  const [c, setC] = useState(1);
  Promise.resolve(0 + id).then(console.log)
  useEffect(() => {
    console.log(id + 'useEffect-create', c);
    return () => {
      console.log(id +'useEffect-destroy', c)
    }
  }, [c])
  Promise.resolve(1 + id).then(console.log)

  useLayoutEffect(() => {
    console.log(id +'useLayoutEffect-create', c);
    return () => {
      console.log(id +'useLayoutEffect-destroy', c)
    }
  }, [c])
  Promise.resolve(2 + id).then(console.log)
  console.log('render-App2' + id, c)
  return <div onClick={() => {
    console.log(id + '触发setState')
    setC(c + 1)
  }}>{id}有-&gt;&nbsp;{c}
  {children}
  </div>
}

function App() {
  const [bol, setBol] = useState(true)
  console.log('App-render')
  useEffect(() => {
    console.log('useEffect-App-create', bol);
    return () => {
      console.log('useEffect-App-destroy', bol);
    }
  }, [bol])

  useLayoutEffect(() => {
    console.log('AppUseLayoutEffect-create', bol);
    return () => {
      console.log('AppUseLayoutEffect-destroy', bol);
    }
  }, [bol])

  return <div ref={(x) => {
    console.log([x])
  }}>{bol ? <App2 key={'A'} id={'A'} /> : <div key={'A_'}>空A</div>}
  {bol ? <App2 key={'C'} id={'C'} /> : <div key={'C_'}>空C</div>}
    <button key={1} onClick={() => {
      setBol(!bol)
    }}>点击切换隐藏</button>
    <App2 key={'B'} id={'B'} >
      <App2 key={'D'} id="D"></App2>
      <App2 key={'E'} id="E"></App2>
    </App2>
  </div>
}

const dom = <App />

export default dom;