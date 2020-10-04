# Fini

Small and capable state machine library for React.

[![npm version](http://img.shields.io/npm/v/fini.svg?style=flat)](https://npmjs.org/package/fini "View this project on npm") [![GitHub license](https://img.shields.io/github/license/janovekj/fini)](https://github.com/janovekj/fini/blob/master/LICENSE "MIT license")

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Motivation](#motivation)
- [Features](#features)
- [Quick start](#quick-start)
- [Concepts](#concepts)
  - [Schema definition](#schema-definition)
  - [Event handlers and transitions](#event-handlers-and-transitions)
  - [The machine object](#the-machine-object)
  - [Next steps](#next-steps)
- [Resources](#resources)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Motivation

Fini aims to be a simpler alternative to fully-fledged statechart libraries, such as [XState](https://xstate.js.org). It aims to capture the features I find myself using most of the time, with type-safety and simplicity in mind.

You might like Fini if you

- want something slightly more structured than the regular reducer
- enjoy typing 😉
- want to get into basic state machines

# Features

- A plain old finite state machine hook
- Type-safe all the way with state-specific context types (typestates)
- Simple schema definition
- Dispatcher with events predefined - no action objects needed

While Fini is intended to be used with TypeScript, it's perfectly fine to use it with plain JavaScript.

# Quick start

```bash
npm install fini
```

Simple counter example ([Codesandbox](https://codesandbox.io/s/fini-counter-example-ul43u?file=/src/App.tsx))

```tsx
import React from "react";
import { useMachine, Machine, State } from "fini";

type CounterMachine = Machine<
  {
    idle: State<{
      start: never;
    }>;
    counting: State<
      {
        increment: never;
        set: number;
      },
      { count: number }
    >;
  },
  { maxCount: number }
>;

const App = () => {
  const machine = useMachine<CounterMachine>(
    {
      idle: {
        start: ({ context }) => ({
          state: "counting",
          context: {
            ...context,
            count: 0,
          },
        }),
      },
      counting: {
        increment: ({ context }) => ({
          ...context,
          count:
            context.count === context.maxCount
              ? context.count
              : context.count + 1,
        }),
        set: (_, count) => ({
          count,
        }),
      },
    },
    { state: "idle", context: { maxCount: 120 } }
  );

  return (
    <div>
      {machine.idle && <button onClick={machine.start}>Start counting!</button>}
      {machine.counting && (
        <div>
          <p>{`Count: ${machine.context.count}`}</p>
          <button onClick={machine.increment}>Increment</button>
          <button onClick={() => machine.set(100)}>Set to 100</button>
        </div>
      )}
    </div>
  );
};
```

# Concepts

Fini sticks to the core concepts that are associated with most finite state machines:

- finite states (duh!)
- transitions between states
- extended state (context)
- side-effects

If you're new to state machines, don't worry! This documentation assumes some knowledge, but give the [Statecharts projects introduction](https://statecharts.github.io/what-is-a-state-machine.html) a quick read, and you'll be up to speed in no time!

The next sections show Fini's approach to these concepts, as well as how it all works together with React and TypeScript.

## Schema definition

Fini aims to make it easy to work with state machines in a type-safe manner. While TypeScript is very good at inferring types automatically, this isn't always enough for some of Fini's features, and thus it is recommended to define a full schema for the machine you're building.

### States and events

Here is the schema for a simple counter machine:

```tsx
// Helper types for schema definitons
import { Machine, State } from "fini";

type CounterMachine = Machine<{
  // State which supports the `start` event
  idle: State<{
    // Event with no payload
    start: never;
  }>;

  // State which supports the `increment` and `set` events
  counting: State<{
    increment: never;
    // Event which accepts a `number` payload
    set: number;
  }>;
}>;
```

Let's break this down a bit. If you've worked with TypeScript in Redux or XState, you might be used to events/actions being defined as a separate type. Typically something similar to this:

```tsx
type CounterEvent =
  | {
      type: "start";
    }
  | {
      type: "increment";
    }
  | {
      type: "set";
      payload: number;
    };
```

The benefit of doing it like this, is that you'll only have to define the event/action once. Instead, Fini requires you to define the event for each state that should respond to it. This has its own benefits:

- TypeScript will complain if you don't implement the event handler, or if you implement it in a state that shouldn't support it
- everything is kept within the same schema/type
- slightly less typing if you don't have many duplicate events

Note that duplicate events should be defined with the same payload type everywhere, otherwise TypeScript will get confused.

Also, this documentation uses camelCase for naming events. If you [PREFER_SHOUTING_NAMES](https://twitter.com/dan_abramov/status/1191487701058543617), that's also fine!

### Context

Fini also supports the concept of context, also known as extended state. One of the best things about Fini, is the support for _state-specific context_, or _typestate_, as the concept is more formally called. Using typestates is an easy way to ensure you never enter new states without the required data, or try to access properties that aren't defined in a given state.

Contexts are defined by supplying a second type argument to the `Machine` and `State` types. Like this:

```tsx
// Helper types for schema definitons
import { Machine, State } from "fini";

type CounterMachine = Machine<
  {
    idle: State<{
      start: never;
    }>;
    counting: State<
      {
        increment: never;
        set: number;
      },
      // State-specific context
      // Only available when machine is in the `counting` state
      { count: number }
    >;
  },
  // Common context for all states
  { maxCount: number }
>;
```

Note: If the current state has a specific context where some properties overlap with the machine context, the state's context will override the machine context.

Finally, the schema is simply provided as a type argument to the `useMachine` hook, which we'll look at in a minute.

```tsx
useMachine<CounterMachine>(...)
```

**Why all the typing?**

Two key benefits can be gained with fully typed machines:

1. Great Intellisense support when implementing and using the machines
2. Compile-time errors when attempting to access invalid properties for the current state

You _can_ use Fini without explicit typing, but this will likely result in some false-positive errors here and there which you'll have to ignore.

## Event handlers and transitions

State machines are all about responding to events and transitioning to new states. In Fini, this should feel effortless.

### Changing states

There's different ways to transition between states, so let's get a quick overview.

```tsx
useMachine({
  state1: {
    // String shorthand
    event1: "state2",

    // Update object
    event2: {
      state: "state2"
    }

    // String shorthand returned from event handler function
    event3: () => "state2",

    // Update object returned from event handler function
    event4: () => ({
      state: "state2"
    })
  },
  state2: {}
})
```

The first two methods are fine for transitions where no logic is involved, but for everything else, you'll probably want to use a function.

Note: the event handler function should be [pure](https://en.wikipedia.org/wiki/Pure_function). If you need to perform side-effects, we'll talk about that in just a minute.

### Updating context

Handling an event will often include some changes to the context. Fini has a couple of ways to achieve this as well.

```tsx
type M = Machine<
  {
    state1: State<{
      event1: never;
      event2: never;
      event3: never;
      event4: never;
    }>;
  },
  {
    contextProperty: string;
  }
>;

useMachine({
  state1: {
    // Context update object
    // Current state stays the same
    event1: {
      contextProperty: "some value",
    },

    // Update object
    event2: {
      state: "state1",
      context: {
        contextProperty: "some value",
      },
    },

    // Context update object returned from event handler function
    event3: () => ({
      contextProperty: "some value",
    }),

    // Update object returned from event handler function
    event4: () => ({
      state: "state1",
      context: {
        contextProperty: "some value",
      },
    }),
  },
});
```

This is pretty similar to how changing state works. It's worth noting that `event1` and `event3` just returns the new context directly, and since the object doesn't include a `state` property, Fini will assume that this is a context update.

All event handler functions also receive the current context and state name as the first parameter:

```tsx
useMachine({
  counting: {
    increment: ({ state, context }) => ({
      count: context.count + 1,
    }),
  },
});
```

Updates to context works the same way you normally update state in reducer functions: you have to return the entire context object, not just the properties you're updating. If the state you're transitioning to has its own context properties, you must also make sure that the returned context is compatible.

It's also completely fine to not return nothing at all. This is often the case if you just want to run some side-effects, which we'll talk about later! If nothing is returned, nothing will be updated.

### Event payloads

A state machine would be quite useless if we couldn't pass along data with the events we're dispatching. If the event supports a payload, this is the second parameter passed into the event handler function:

```tsx
type CounterMachine = Machine<
  {
    counting: {
      setCount: number;
    };
  },
  {
    count: number;
  }
>;

useMachine({
  counting: {
    setCount: ({ context }, newCount) => ({
      count: newCount,
    }),
  },
});
```

### Executing side-effects

Event handler functions should be pure, so side-effects have to be handled on Fini's terms. Luckily, this is also trivial. Alongside the `context` property, the `exec` function is also passed into the event handler function. You can use `exec` to safely fire away any and all side-effects.

```tsx
useMachine({
  idle: {
    login: ({ context, exec }, userId) => {
      exec(() => {
        fetchUser(userId).then((user) => console.log(user));
      });
      return "fetchingUser";
    },
  },
  fetchingUser: {},
});
```

As you can see, `exec` accepts a function that triggers the side-effects. The function passed into `exec` also receives a dispatcher you can use to dispatch events from your side-effect, like in the example below:

```tsx
useMachine({
  idle: {
    login: ({ context, exec }, userId) => {
      exec((dispatch) => {
        fetchUser(userId).then((user) => dispatch.success(user));
      });
      return "fetchingUser";
    },
  },
  fetchingUser: {
    success: ({ context }, user) => ({
      ...context,
      user,
    }),
  },
});
```

### Life cycle effects

Sometimes you'll want to define effects that should run every time a state is entered or exited. Fini allows you to achieve this by specifying the special `$entry` and `$exit` events, respectively.

```tsx
useMachine(
  {
    state1: {
      // will be run every time `state1` is entered
      // is also run if state is the initial state
      $entry: () => console.log("Entered state1"),

      // will be run every time `state1` is exited
      $exit: () => console.log("Exited state1"),
    },
  },
  "state1"
);
```

`$entry` and `$exit` are pretty similar to regular event handler functions, except they don't return a new state. They are only for running effects, which is also why you don't need to wrap them in the `exec` function - this is done automatically behind the scenes.

Both functions also receive an object containing the current `state`, `context` and the `dispatch` function. Additionally, `$entry` receives `previousState`, and `$exit` receieves `nextState`.

## The machine object

Implementing the machine is only half the fun. Let's look at how to use the machine in your React components.

The `useMachine` hook returns an object with all the stuff you need to work with your machine:

- the current state (and various ways to [match it](#inspecting-the-state))
- the current context
- pre-bound event dispatchers

### Dispatching events

Dispatching events is a bit different in Fini, compared to how it works with `useReducer`, `Redux` and `XState`. Instead of using a `dispatch` function to dispatch action/event objects, the object returned from `useMachine` provides event functions that are pre-bound to Fini's internal dispatch function. This means you can dispatch events as simple as this:

```tsx
type CounterMachine = Machine<{
  counting: State<{
    increment: never
    set: number
  }>
}>

const counterMachine = useMachine<CounterMachine>(...);

return <div>
  <button onClick={() => counterMachine.increment()}>Increment!</button>
  <button onClick={() => counterMachine.set(100)}>Set to 100</button>
</div>
```

This is so you won't have to either create action creators or manually write `dispatch({ type: "increment" })` (this is what happens internally, though!).

### Inspecting the state

As mentioned, the `machine` object also contains everything you need to know about the current state of the machine.

To examine its properties, it's easiest with an example.

```tsx
type CounterMachine = Machine<
  {
    idle: State<{
      start: never;
    }>;
    counting: State<
      {
        increment: never;
        set: number;
      },
      { count: number }
    >;
  },
  { maxCount: number }
>;

const counterMachine = useMachine(
  {
    idle: {
      start: ({ context }) => ({
        state: "counting",
        context: {
          ...context,
          count: 0,
        },
      }),
    },
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

Finally, these state matchers are also very handing when determining what to render:

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

## Next steps

Hopefully you've gotten a good grasp on how Fini works. If not, try reading the [step-by-step tutorial](docs/step-by-step-tutorial.md#step-by-step-tutorial), which gives you the different parts of Fini in bite-sized chunks. Also feel free to create an issue if you see something that could be explained better. Fini is meant to be easy to pickup by anyone, and that all starts with good docs.

If you're not convinced by Fini or state machines in general, keep reading for some resources which may or may not change your mind.

# Resources

These are some of the resources that have been important for my own learning, and in the development of Fini.

In particular, Fini is built on top of [use-effect-reducer](https://github.com/davidkpiano/useEffectReducer/), which handles all the heavy lifting related to handling effects. Check it out!

- [XState](https://xstate.js.org)
- [The Statecharts project](https://statecharts.github.io)
- _[No, disabling a button is not app logic](https://dev.to/davidkpiano/no-disabling-a-button-is-not-app-logic-598i)_ by [David Khourshid](https://twitter.com/davidkpiano)
- [_Stop using isLoading booleans_](https://kentcdodds.com/blog/stop-using-isloading-booleans) by [Kent C. Dodds](https://twitter.com/kentcdodds)
- [_Pure UI Control_](https://medium.com/@asolove/pure-ui-control-ac8d1be97a8d) by Adam Solove
- [_Redux is half of a pattern_](https://dev.to/davidkpiano/redux-is-half-of-a-pattern-1-2-1hd7) by [David Khourshid](https://twitter.com/davidkpiano)
