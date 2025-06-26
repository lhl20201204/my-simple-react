import { useEffect, useLayoutEffect, useRef, useState } from "./utils"

const set = new Set()
function App2({ id, children }: {id: string, children?: any}) {
  const [c, setC] = useState(1);
  Promise.resolve(0 + id).then(console.log)

  useLayoutEffect(() => {
    console.log(id +'useLayoutEffect-first-create', c);
    return () => {
      console.log(id +'useLayoutEffect-first-destroy', c)
    }
  }, [c])

  useEffect(() => {
    console.log(id + 'useEffect-create', c);
    return () => {
      console.log(id +'useEffect-destroy', c)
    }
  }, [c])
  // Promise.resolve(1 + id).then(console.log)

  useLayoutEffect(() => {
    console.log(id +'useLayoutEffect-second-create', c);
    return () => {
      console.log(id +'useLayoutEffect-second-destroy', c)
    }
  }, [c])
  // Promise.resolve(2 + id).then(console.log)
  // console.log('render-App2' + id, c)
  // console.error('children',)
  return <div onClick={() => {
    console.log(id + '触发setState')
    setC(c + 1)
  }} ref={(c) =>{
    console.log(id, [c])
    set.add(c)
  }} id={'div' + id}>{id}<span 
     key={'span' + id}
     id={'span' + id}
   ref={
    (d) => {
      console.log('span', id, [d])
    }
  }>有-&gt;&nbsp;</span>{c}
  {children}
  </div>
}

function App() {
  const [bol, setBol] = useState(true)
  const [cnt, setCnt] = useState(1)
  const ref = useRef(null)
  console.log('App-render')
  useEffect(() => {
    console.log('set', [...set]);
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
  }, [bol]);

  useLayoutEffect(() => {
    console.log('APP', ref.current)
  }, [ref.current])

  return <div ref={ref}>{bol ? 
  <App2 key={'A'} id={'A'} >
     <App2 key={'F'} id={'F'} />
  </App2>
   : 
   <div key={'A_'}>
     空A
     <div key={'F_'}>空F</div>
   </div>}
  {bol ? <App2 key={'C'} id={'C'} /> : <div key={'C_'}>空C</div>}
    <button key={1} onClick={() => {
      setBol(!bol)
    }}>点击切换隐藏</button>
        <button key={2} onClick={() => {
      setCnt(cnt + 1)
    }}>点击加数字{cnt}</button>
    <App2 key={'B'} id={'B'} >
      <App2 key={'D'} id="D"></App2>
      <App2 key={'E'} id="E"></App2>
    </App2>
    { bol ? <App2 key={'G'} id={'G'} /> : <div key={'G_'}>空G</div>}
  </div>
}

const dom = <App />

export default dom;