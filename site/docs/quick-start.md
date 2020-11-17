---
title: Quick-ish Start
---

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
