import WindomDom from "./test15";
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