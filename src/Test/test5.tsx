import { memo, ReactDOM, sleep, useCallback, useEffect, useLayoutEffect, useMemo } from './utils'
import { payloadChildState, useChildState, useParentState } from "./useGroupState";

const Parent = (props: { children: any }) => {
  const [state, setState, setInnerState] = useParentState('test', 0);
  console.log('Parent', state);

  useLayoutEffect(() => {
    console.log(state, 'Parent-useLayoutEffect');
    return () => {
      console.log(state, 'Parent-useLayoutEffect-destroy');
    }
  }, [state])

  function parentEffect() {
    console.log(state, 'Parent-useEffect')
    return () => {
      console.log(state, 'Parent-useEffect-destroy');
    }
  }

  useEffect(parentEffect, [state])

  console.log('before')
  const cb = useCallback(() => {
    console.error('step1')
    setState((c) => c + 1)
    console.error('step2')
    setState((c) => c + 1)
    console.error('step3')
    setState((c) => c + 1)
    console.error('step4')
  }, [])

  const cb2 = useCallback(() => {
    console.log('step1')
    setInnerState((c) => c + 1)
    console.log('step2')
    setInnerState((c) => c + 1)
    console.log('step3')
    setInnerState((c) => c + 1)
    console.log('step4')
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
  const refCb = useCallback((x) => {
    console.log('parent-ref', [x])
  }, [])

  return <div id="parent" ref={refCb} style={{
    border: '1px solid green',
    padding: '10px',
    margin: '10px'
  }}>Parent--{state}
    <button key={"button"} onClick={() => setState(state + 1)}>setState</button>
    {props.children}
    {dom}
  </div>;
}


const Middle = ({ base }: { base: number }) => {
  console.log('Middle')

  return <div style={{ border: '1px solid blue', padding: '10px' }}>
    middle
    <MemoChild name={`${base + 4}`} key={`${base + 4}`} />
    <MemoChild name={`${base + 5}`} key={`${base + 5}`} />
    <MemoChild name={`${base + 6}`} key={`${base + 6}`} />
  </div>;
}

const Child = (props: { name: string }) => {
  const [state, setState, setInnerState] = useChildState<number>('test', props.name);

  const obj = {
    [props.name]: function () {
      console.log(props.name + '-useEffect-state-create', state)
      return () => {
        console.log(props.name + '-useEffect-state-destroy', state)
      }
    }
  }

  useEffect(obj[props.name], [state])

  console.log('before-child', props.name, state)
  if (props.name === '3' && state !== 10) {
    // 使用 setTimeout 来测试批处理行为
    setTimeout(() => {
      console.warn('setTimeout-child');
      setInnerState(10)
    }, 0)
  }

  console.log('Child', props.name, state);
  return <div
    id={props.name}
    style={{ border: '1px solid red', padding: '10px', marginBottom: '20px' }}
    ref={(x) => {
      console.log('ref-child', props.name, state, [x])
    }}
  >
    <div>{props.name}Child--{state}
      <button key={props.name + '_btn'} onClick={() => {
        setState(state + 1)
      }}>setState</button>
    </div>
  </div>;
}
const MemoChild = memo(Child);


const dom = <div>
  <Parent key={'Parent'}>
    <Child name="1" key={"1"} />
    <Child name="2" key={"2"} />
    <Child name="3" key={"3"} />
  </Parent>
  <Middle base={0} key={'GROUP1'} />
</div>

export default dom;
