import { MyContext } from "./type";

export function MyCreateContext<T>(obj: T): MyContext<T> {
  const context = {
    $$typeof: window.reactContextType,
    Provider: {
      $$typeof: window.reactProviderType,
      _context: null,
    },
    Consumer: {
      $$typeof: window.reactContextType,
      _context: null,
    },
    _currentValue: obj
  }
  context.Provider._context = context;
  context.Consumer._context = context;
  return context as MyContext<T>;
}