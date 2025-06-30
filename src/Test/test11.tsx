
import { Suspense, use, useEffect } from "./utils";

async function fetchData(xx: string) {
  return new Promise(resolve => setTimeout(() => resolve(xx), 5000));
}

const p = fetchData('1111').then(res => {
  console.log('p resolved');
  return res;
});

function B() {
  console.log('B rendered');
  const data: any = use(p);
  console.log(data);
  useEffect(() => {
    console.log('B mounted');
    return () => console.log('B unmounted');
  }, []);
  return <div>{data}</div>;
}

function C({ children }: any) {
  console.log('C rendered');
  useEffect(() => {
    console.log('C mounted');
    return () => console.log('C unmounted');
  }, []);
  return <div>C</div>;
}

function A({ children }: any) {
  console.log('A rendered');
  useEffect(() => {
    console.log('A mounted');
    return () => console.log('A unmounted');
  }, []);
  return <div>{children}</div>;
}

function Loading() {
  console.log('Loading rendered');
  useEffect(() => {
    console.log('Loading mounted');
    return () => console.log('Loading unmounted');
  }, []);
  return <div>loading...</div>;
}

function App() {
  console.log('App rendered');
  return (
    <Suspense fallback={<Loading />}>
      <A>
        <B key={'B'} />
        <C key={'C'} />
      </A>
    </Suspense>
  );
}

const dom = <App key={'test11'} />

export default dom;

