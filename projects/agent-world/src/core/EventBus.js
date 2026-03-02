/**
 * Simple event emitter — replaces Phaser scene events.
 */
export class EventBus {
  constructor() {
    this._listeners = {};
  }

  on(event, fn) {
    (this._listeners[event] ||= []).push(fn);
    return this;
  }

  off(event, fn) {
    const list = this._listeners[event];
    if (list) this._listeners[event] = list.filter(f => f !== fn);
    return this;
  }

  emit(event, data) {
    const list = this._listeners[event];
    if (list) for (const fn of list) fn(data);
  }
}
