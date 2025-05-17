import { ReactDOM, sleep, useCallback, useEffect, useLayoutEffect, useMemo } from './utils'
import { useChildState, useParentState } from "./useGroupState";

const Parent = (props: { children: any }) => {
  const [state, setState, setInnerState] = useParentState('test', 0);
  console.log('Parent', state);

  useLayoutEffect(() => {
    console.log(state, 'useLayoutEffect')
  }, [state])

  console.log('before')
  if (state < 4) {
    setState(state + 1)
    setState(state => state + 1)
  }

  // sleep(1000)


  const cb = useCallback(() => {
    // ReactDOM.unstable_batchedUpdates(() => {
      console.error('step1')
      setState((c) => c + 1)
      console.error('step2')
      setState((c) => c + 1)
      console.error('step3')
      setState((c) => c + 1)
      console.error('step4')
    // })
  }, [])

  const cb2 = useCallback(() => {
    // ReactDOM.unstable_batchedUpdates(() => {
      console.log('step1')
      setInnerState((c) => c + 1)
      console.log('step2')
      setInnerState((c) => c + 1)
      console.log('step3')
      setInnerState((c) => c + 1)
      console.log('step4')
    // })
  }, [])

  console.log('after')

  useEffect(() => {
    // setTimeout(cb, 3000)
    // setTimeout(cb2, 3000)
  }, [])

  const dom = useMemo(() => {
    return state % 3 < 1 ? <Middle base={3} key={'GROUP2'} /> : null;
  }, [state % 3 < 1])
  
  console.log('render---Parent', state)

  return <div style={{
    border: '1px solid green',
    padding: '10px',
    margin: '10px'
  }}>Parent--{state}
    <button  key={"button"} onClick={() => setState(state + 1)}>setState</button>
    {props.children}
    {dom}
  </div>;
}

const Middle = ({ base }: { base: number }) => {
  console.log('Middle')
  return <div style={{ border: '1px solid blue', padding: '10px' }}>
    middle
    <Child name={`${base + 4}`} key={`${base + 4}`} />
    <Child name={`${base + 5}`} key={`${base + 5}`} />
    <Child name={`${base + 6}`} key={`${base + 6}`} />
  </div>;
}

const Child = (props: { name: string }) => {
  const [state, setState] = useChildState<number>('test');

  useEffect(() => {
    console.log(props.name +'-state-create', state)
    return () => {
      console.log(props.name +'-state-destroy', state)
    }
  }, [state])

  console.log('Child', props.name, state);
  return <div style={{ border: '1px solid red', padding: '10px', marginBottom: '20px' }}>
    <div>Child--{state}
      <button  key={props.name + '_btn'} onClick={() => setState(state + 1)}>setState</button>
    </div>
  </div>;
}

const dom =  <div>
  <Parent key={'Parent'}>
    <Child name="1" key={"1"} />
    <Child name="2" key={"2"} />
    <Child name="3"  key={"3"}/>
  </Parent>
  <Middle base={0} key={'GROUP1'} />
</div>

export default dom;