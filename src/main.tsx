import { ReactDOM } from "./MyMiniReact";
import WindomDom from "./Test/test3";

window.WindomDom = WindomDom;
window.promiseResolve2();

if (window.useSelfReact) {
        ReactDOM.createRoot(document.getElementById('app') as HTMLElement)
        .render(WindomDom)
}
