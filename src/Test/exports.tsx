import WindomDom from "./test13";
import { useEffect } from "./utils";

function A() {
  useEffect(() => {
  }, [])
  return <>
    <div key={'nullDiv'}></div>
    {WindomDom}
  </>;
}

export default <A />;