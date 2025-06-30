import { ReactDOM } from "./MyMiniReact";
import A from "./Test/exports";

window.WindomDom = A;
window.promiseResolve2();

if (window.useSelfReact) {
        ReactDOM.createRoot(document.getElementById('app') as HTMLElement)
                .render(window.WindomDom)
}
