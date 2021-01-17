---
title: The Machine Object
---

Implementing the machine is only half the fun. Let's look at how to use the machine in your React components.

The `useMachine` hook returns an object with all the stuff you need to work with your machine:

- the current state (and various ways to [match it](#inspecting-the-state))
- the current context
- pre-bound event dispatchers

### Dispatching events

Dispatching events is a bit different in Fini, compared to how it works with `useReducer`, `Redux` and `XState`. Instead of using a `dispatch` function to dispatch action/event objects, the object returned from `useMachine` provides event functions that are pre-bound to Fini's internal dispatch function. This means dispatching events becomes as easy as this:

```tsx
type CounterMachine = {
  states: {
    counting: {
      events: {
        increment: void
        set: number
      }
    }
  }
}

const counterMachine = useMachine<CounterMachine>(...);

return <div>
  // highlight-start
  <button onClick={() => counterMachine.set(100)}>Set to 100</button>
  <button onClick={counterMachine.increment}>Increment!</button>
  // highlight-end
</div>
```

This is so you won't have to either create action creators or manually write `dispatch({ type: "increment" })` (this is what happens internally, though!).

### Inspecting the state

As mentioned, the `machine` object also contains everything you need to know about the current state of the machine.

To examine its properties, it's easiest with an example.

```tsx
type CounterMachine = {
  states: {
    idle: {
      events: {
        start: never;
      };
    };
    counting: {
      events: {
        increment: never;
        set: number;
      };
      context: { count: number };
    };
  };
  context: { maxCount: number };
};

const counterMachine = useMachine(
  {
    idle: {
      start: ({ next, context }) => next.counting({ count: 0 }),
    },
    // [the `counting` state implementation]
  },
  { state: "idle", context: { maxCount: 100 } }
);
```

Ignoring event dispatching functions, `console.log(counterMachine)` will output

```js
{
  // name of the current state
  current: "idle",
  // the current context
  context: {
    maxCount: 100
  },
  // all the possible states,
  // and whether they're the current one:
  idle: true,
  counting: false
}
```

If we were to run `counterMachine.start()`, `machine` would look like this:

```js
{
  current: "counting",
  context: {
    maxCount: 100,
    count: 0
  },
  idle: false,
  counting: true
}
```

This example also has a state-specific context, i.e. `{ count: 0 }`. Since Fini tries to protect you from run-time errors, you cannot access `counterMachine.context.count` without first checking that you're in the `counting` state:

```tsx
console.log(counterMachine.context.count); // ❌

if (counterMachine.current === "counting") {
  console.log(counterMachine.context.count); // ✅
}

if (counterMachine.counting) {
  console.log(counterMachine.context.count); // ✅
}
```

Meanwhile, `counterMachine.context.maxCount` is "globally" defined, and is accessible in all states.

Finally, these state matchers are also very handy when determining what parts of our UI we should render:

```tsx
return (
  <div>
    {counterMachine.idle && (
      <button onClick={counterMachine.start}>Start counting!</button>
    )}
    {counterMachine.counting && (
      <div>
        <p>{`Count: ${counterMachine.context.count}`}</p>
        <button onClick={counterMachine.increment}>Increment</button>
        <button onClick={() => counterMachine.set(100)}>Set to 100</button>
      </div>
    )}
  </div>
);
```
