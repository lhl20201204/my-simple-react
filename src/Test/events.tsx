type EventHandler<T = any> = (payload: T) => void;

export default class EventEmitter<Events extends Record<string, any> = Record<string, any>> {
  private events: { [K in keyof Events]?: EventHandler<Events[K]>[] } = {};

  // 订阅事件
  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event]!.push(handler);
  }

  // 取消订阅
  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event]!.filter(fn => fn !== handler);
  }

  // 触发事件
  emit<K extends keyof Events>(event: K, payload: Events[K]) {
    if (!this.events[event]) return;
    this.events[event]!.forEach(fn => fn(payload));
  }
}

// const x = new EventEmitter();

// x.on('eeee', (t: { x: number }) => {
//   console.log(t)
// })

// x.emit('eeee', { x: 1})
