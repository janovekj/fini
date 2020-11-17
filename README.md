[![Fini logo](https://fini.js.org/img/fini_normal.svg)](https://fini.js.org)

[![npm version](http://img.shields.io/npm/v/fini.svg?style=flat)](https://npmjs.org/package/fini "View this project on npm") [![GitHub license](https://img.shields.io/github/license/janovekj/fini)](https://github.com/janovekj/fini/blob/master/LICENSE "MIT license")

**Small and capable state machines for React.**

Using finite state machines (FSM) is a great way to safely and effectively manage complexity in your UI components. Fini aims to lower the bar of getting started with this powerful concept, all while providing the important features you should expect from an FSM library:

- ✅ easy-to-use hook for defining states, transitions and effects
- ✅ type safety all the way
- ✅ simple state-matching and event-dispatching from your components

Furthermore, you might like Fini if you

- want something slightly more structured than the regular reducer
- enjoy typing 😉
- want to get into the basics of state machines

Sounds great, doesn't it? Head over to [the documentation site](https://fini.js.org), or check out the [quick-ish start](#quick-start) example.

❓ Unfamiliar with state machines? Watch this [great talk by David Khourshid](https://www.youtube.com/watch?v=RqTxtOXcv8Y)!

---

# Quick-ish start

```bash
npm install fini
```

Simple counter example ([Codesandbox](https://codesandbox.io/s/fini-counter-example-ul43u?file=/src/App.tsx))

```tsx
import React from "react";
import { useMachine } from "fini";

// Define a typed schema for the machine
type CounterMachine = {
  states: {
    // Idle state which handles the `start` event
    idle: {
      events: {
        start: void;
      };
    };
    // Counting state which handles the `increment` and `set` events
    counting: {
      events: {
        increment: void;
        // the `set` event comes with a number payload
        set: number;
      };
      // Contextual data that is specific to,
      // and only available in, the `counting` state
      context: { count: number };
    };
  };
  // Context that is common for all states
  context: { maxCount: number };
  // Events that may or may not be handled by all states
  events: {
    log: void;
  };
};

const App = () => {
  const machine = useMachine<CounterMachine>(
    {
      idle: {
        // Event handler function which transitions into
        // the `counting` state, and sets the current count to 0
        start: ({ context }) => ({
          state: "counting",
          context: {
            ...context,
            count: 0,
          },
        }),
        log: ({ exec }) => {
          // execute a side-effect
          exec(() => console.log("Haven't started counting yet"));
        },
      },
      counting: {
        // Updates the context by incrementing the current count,
        // if max count hasn't already been reached
        increment: ({ context }) => ({
          count:
            context.count === context.maxCount
              ? context.count
              : context.count + 1,
        }),
        set: (_, count) => ({
          count,
        }),
        log: ({ exec, context }) => {
          exec(() => console.log(`Current count is ${context.count}`));
        },
      },
    },
    // The initial state and context
    { state: "idle", context: { maxCount: 120 } }
  );

  return (
    <div>
      {
        // Use the returned `machine` object to match states,
        // read the context, and dispatch events
        machine.idle && <button onClick={machine.start}>Start counting!</button>
      }
      {machine.counting && (
        <div>
          <p>{`Count: ${machine.context.count}`}</p>
          <button onClick={machine.increment}>Increment</button>
          <button onClick={() => machine.set(100)}>Set to 100</button>
        </div>
      )}
      <button onClick={machine.log}>Log the count</button>
    </div>
  );
};
```
