import { useState, useEffect, useRef } from './utils'


const App3 = () => {
        console.log('render----before')
        const obj = useState(1);
        const [v2, setV2] = useState(3);
        const v = obj[0];
        const setV = obj[1]
        console.log('render----root', v)
        useEffect(() => {
          setV(t => {
            console.log('setV-create-v', t)
            return 2
          })
          setV(t => {
            console.log('setV-create-v-2', t)
            return 2
          })
          setV(t => {
            console.log('setV-create-v-3', t)
            return 2
          })
          console.log('create-v', v);
          return () => {
            setV(t => {
              console.log('setV-destroy-v', t)
              return t - 1
            })
            console.log('destroy-v', v);
          }
        }, [v])
    
        return <div onClick={() => {
                console.log(1, obj, obj[0])
                setV2((v) => {
                  console.log('click99999', v)
                  return v + 1;
                })
                setV((v) => {
                  console.log('click1', v);
                  return v + 1
                });
                console.log(1.5, obj, obj[0])
                setV(4);
                console.log(2, obj)
        
                setV((v) => {
                  console.log('click2', v);
                  return v + 1
                });
                console.log(3)
                setV((v) => {
                  console.log('click3', v);
                  return v + 1
                });
                console.log(4)
              }}>
                click
        </div>
       }

const App = ({ children }: { children?: any }) => {
        const [count, setCount] = useState(1);
        const ref = useRef(null);
        // useEffect(() => {
        //   console.log('count1-> create', count)
        //   return () =>  console.log('count1-> destroy', count)
        // }, [count])
        function onClick(e) {
                console.log('点击', e,  count);setCount(count + 1)
        }
        return <div id="7" ref={(x) => {
                // console.log([x])
        }} onClick={onClick}>
                <App3 key="44" />
                {children}
                {count === 2 && <App2 id={3} key="33"/>}
                ap<span id="8" ref={ref} key="8">p</span>{count}</div>
}

const App2 = ({id }: { id: number}) => {
        // console.log('render---function-APP2', id)
        const [count2, setCount2] = useState(1);
        // useEffect(() => {
        //         console.log('count'+id+' -> create', count2)
        //         return () => console.log('count'+id+'-> destroy', count2)
        // }, [count2])

        function onClick() {
                console.log('组件' + id+ '被点击', count2);
                setCount2(count2 + 1)
        }
        return <div id="9" style={{ background: count2 === id ? 'green' : 'red' }} onClick={onClick}>
                等于{id}会变绿, fun<span id="10" key="10">ction</span>{count2}</div>
}

const App4 = () => {
  console.log('App4')
  return <div>fdfff</div>
}

const dom1 = <div id="1" key={1}>
        <App key="88" >dfxc  <App4/></App>
        hello
        <div id="2" key="2">
                <span id="3" key="3"> w</span>
                <span id="4" key="4">
                        o
                        <span id="5" key="5">r</span>
                </span>
        </div>
        <span id="6" key="6">ld</span>
        <App2 key="77"  id={2}/>
</div>;

export default dom1;