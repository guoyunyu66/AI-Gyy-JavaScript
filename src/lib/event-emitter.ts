// src/lib/event-emitter.ts

type Listener = () => void;

interface Listeners {
  [event: string]: Listener[];
}

const listeners: Listeners = {};

/**
 * Subscribes to an event.
 * @param event The name of the event to subscribe to.
 * @param listener The callback function to execute when the event is emitted.
 * @returns A function to unsubscribe the listener.
 */
export const on = (event: string, listener: Listener): (() => void) => {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  listeners[event].push(listener);

  // Return an unsubscribe function
  return () => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter(l => l !== listener);
      if (listeners[event].length === 0) {
        delete listeners[event]; // Optional: clean up empty event arrays
      }
    }
  };
};

/**
 * Emits an event, calling all subscribed listeners.
 * @param event The name of the event to emit.
 */
export const emit = (event: string): void => {
  if (listeners[event]) {
    // Iterate over a copy of the listeners array in case a listener unsubscribes itself
    [...listeners[event]].forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error);
      }
    });
  }
}; 