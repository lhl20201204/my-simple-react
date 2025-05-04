import React, { ReactDOM } from './MyMiniReact';
import { useEffect, useRef, useState } from './MyMiniReact/render';

const App = () => {
        const [count, setCount] = useState(1);
        const ref = useRef(null);
        useEffect(() => {
          console.log('count1-> create', count)
          return () =>  console.log('count1-> destroy', count)
        }, [count])
        function onClick(e) {
                console.log('点击', e,  count);setCount(count + 1)
        }
        return <div id="7" ref={(x) => {
                // console.log([x])
        }} onClick={onClick}>{count === 2 && <App2 id={3} />}
                ap<span id="8" ref={ref}>p</span>{count}</div>
}

const App2 = ({id }: { id: number}) => {
        // console.log('render---function-APP2', id)
        const [count2, setCount2] = useState(1);
        useEffect(() => {
                console.log('count'+id+' -> create', count2)
                return () => console.log('count'+id+'-> destroy', count2)
        }, [count2])

        function onClick() {
                console.log('组件' + id+ '被点击', count2);
                setCount2(count2 + 1)
        }
        return <div id="9" style={{ background: count2 === id ? 'green' : 'red' }} onClick={onClick}>
                等于{id}会变绿, fun<span id="10">ction</span>{count2}</div>
}

const dom = <div id="1" key={1}>
        <App />
        hello
        <div id="2">
                <span id="3"> w</span>
                <span id="4">
                        o
                        <span id="5">r</span>
                </span>
        </div>
        <span id="6">ld</span>
        <App2 id={2}/>
</div>;
ReactDOM.createRoot(document.getElementById('app') as HTMLElement)
        .render(dom)
