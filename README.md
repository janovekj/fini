# Fini

[![npm version](http://img.shields.io/npm/v/fini.svg?style=flat)](https://npmjs.org/package/fini "View this project on npm") [![GitHub license](https://img.shields.io/github/license/janovekj/fini)](https://github.com/janovekj/fini/blob/master/LICENSE "MIT license")

Fini is a small state machine library built on top of the brilliant [use-effect-reducer](https://github.com/davidkpiano/useEffectReducer/).

# Motivation

Fini aims to be a simpler alternative to fully-fledged statechart libraries, such as [XState](https://xstate.js.org). It aims to capture the features I find myself using most of the time, with type-safety and simplicity in mind.

You might like Fini if you

- want something slightly more structured than the regular reducer
- enjoy typing 😉
- want to get into basic state machines

# Get started

```bash
npm install fini
```

# Simple counter example

```tsx
import * as React from "react";
import { useMachine, Machine, State, Event } from "fini";

type CounterMachine = Machine<{
  idle: State<{
    started: Event;
  }>;
  counting: State<
    {
      incremented: Event;
      set: Event<{ count: number }>;
    },
    { count: number }
  >;
}>;

export default function App() {
  const [state, dispatch] = useMachine<CounterMachine>(
    {
      idle: {
        started: ({ context }) => ({
          state: "counting",
          context: {
            ...context,
            count: 0,
          },
        }),
      },
      counting: {
        incremented: ({ context }) => ({
          ...context,
          count: context.count + 1,
        }),
        set: (_, { count }) => ({
          count,
        }),
      },
    },
    "idle"
  );

  return (
    <div>
      {state.idle && (
        <button onClick={dispatch.started}>Start counting!</button>
      )}
      {state.counting && (
        <div>
          <p>{`Count: ${state.context.count}`}</p>
          <button onClick={dispatch.incremented}>Increment</button>
          <button onClick={() => dispatch.set({ count: 100 })}>
            Set to 100
          </button>
        </div>
      )}
    </div>
  );
}
```

[Live Codesandbox](https://codesandbox.io/s/fini-counter-example-ul43u?file=/src/App.tsx)
