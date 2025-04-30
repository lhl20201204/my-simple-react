import React, { ReactDOM } from './MyMiniReact';
import { useState } from './MyMiniReact/render';

const App = () => {
        const [count, setCount] = useState(1);
        return <div id="7" onClick={() => {
           console.log('点击', count)
           setCount(count + 1)
        }}>
        {count === 2 && <span id="9">hhh</span> }   
        ap<span id="8">p</span>{count}</div>
}

const App2 = () => {
        const [count2, setCount2] = useState(1);
        return <div id="9" style={{
                background: count2 === 2 ? 'green' : 'red'
        }} onClick={() => {
           console.log('点击', count2)
           setCount2(count2 + 1)
        }}>      
        fun<span id="10">ction</span>{count2}</div>
}

const dom = <div id="1" key={1} ref={2}>
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
        <App2 />
</div>;
ReactDOM.createRoot(document.getElementById('app') as HTMLElement)
        .render(dom)
