import WindomDom from "./test8";
import { useEffect } from "./utils";

function A() {
  useEffect(() => {
  }, [])
  return <>
  <div></div>
  {WindomDom}
  </>;
}

export default <A />;