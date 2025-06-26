import { MyForwardRefComponent, MyFunctionComponent, MyFunctionComponentProps, MyLazyComponent, MyMemoComponent, MyReactNode } from "./type";

export function MyMemo<G extends MyFunctionComponent ,T extends MyFunctionComponent | MyForwardRefComponent<
G>>(Comp: T, 
  comp?: (oldProps: MyFunctionComponentProps<T>, newProps: MyFunctionComponentProps<T>) => boolean ): MyMemoComponent<T> {
    return {
      $$typeof: window.reactMemoType,
      type: Comp,
      compare: comp ?? null,
    } as MyMemoComponent<T>
  }

export function MyForwardRef<T extends MyFunctionComponent>(Comp: T): MyForwardRefComponent<T> {
  return {
    $$typeof: window.reactForwardRefType,
    render: Comp
  } as MyForwardRefComponent<T>
}

export const MySuspense = window.reactSuspenseType as unknown as (
   (props: { fallback: MyReactNode, children: MyReactNode }) => MyReactNode
);


export function lazyInitializer(payload) {
  const Uninitialized = -1;
  const Pending = 0;
  const Resolved = 1;
  const Rejected = 2;
  if (payload._status === Uninitialized) {
      const ctor = payload._result;
      const thenable = ctor(); 

      payload._result = thenable.then(function (moduleObject) {
        if (payload._status === Pending || payload._status === Uninitialized) {
          const resolved = payload;
          resolved._status = Resolved;
          resolved._result = moduleObject;
        }
      }, function (error) {
        if (payload._status === Pending || payload._status === Uninitialized) {
          const rejected = payload;
          rejected._status = Rejected;
          rejected._result = error;
        }
      });

      if (payload._status === Uninitialized) {
        const pending = payload;
        pending._status = Pending;
        pending._result = thenable;
      }
    }

    if (payload._status === Resolved) {
      var moduleObject = payload._result;

      {
        if (moduleObject === undefined) {
          console.error('lazy: Expected the result of a dynamic imp' + 'ort() call. ' + 'Instead received: %s\n\nYour code should look like: \n  ' + // Break up imports to avoid accidentally parsing them as dependencies.
          'const MyComponent = lazy(() => imp' + "ort('./MyComponent'))\n\n" + 'Did you accidentally put curly braces around the import?', moduleObject);
        }
      }

      {
        if (!('default' in moduleObject)) {
          console.error('lazy: Expected the result of a dynamic imp' + 'ort() call. ' + 'Instead received: %s\n\nYour code should look like: \n  ' + // Break up imports to avoid accidentally parsing them as dependencies.
          'const MyComponent = lazy(() => imp' + "ort('./MyComponent'))", moduleObject);
        }
      }

      return moduleObject.default;
    } else {
      throw payload._result;
    }
}

export function MyLazy<T extends MyFunctionComponent>(init: () => Promise<{ default: T}>): MyLazyComponent<T> {
  return {
    $$typeof: window.reactLazyType,
    _init: lazyInitializer,
    _payload: {
      _status: -1,
      _result: init
    }
  } as MyLazyComponent<T>
}

