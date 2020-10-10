---
title: Schema Definition
---

Fini aims to make it easy to work with state machines in a type-safe manner. While TypeScript is very good at inferring types automatically, this isn't always enough for some of Fini's features, and thus it is recommended to define a full schema for the machine you're building.

In general, two key benefits can be gained with fully typed machines:

1. Great Intellisense support when implementing and using the machines
2. Compile-time errors when attempting to access invalid properties for the current state

You _can_ drop the types altogether, and let TypeScript try to infer all the types from usage, but this will likely result in some "false positives" in terms of TS errors. This might be improved in the future, but for now it's recommended to add explicit typings for your machines.

If you're using JavaScript, however, you won't have to worry about any of this, so feel free to skip ahead.

## States and events

Here is the schema for a simple counter machine:

```tsx
// Helper types for schema definitons
import { Machine, State } from "fini";

type CounterMachine = Machine<{
  // `idle` state which supports the `start` event
  idle: State<{
    // Event with no payload
    start: never;
  }>;

  // `counting` state which supports the `increment` and `setCount` events
  counting: State<{
    increment: never;
    // The `setCount` event accepts a `number` payload
    setCount: number;
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
      type: "setCount";
      payload: number;
    };
```

The benefit of doing it like this, is that you'll only have to define the event/action once. Instead, Fini requires you to define the event for each state that should respond to it. This has its own benefits:

- TypeScript will complain if you don't implement the event handler, or if you implement it in a state that shouldn't support it
- everything is kept within the same schema/type
- slightly less typing if you don't have many duplicate events

Note that duplicate events should be defined with the same payload type everywhere, otherwise TypeScript will get confused.

:::tip
In these articles, we'll be using `camelCase` for naming events. If you [PREFER_SHOUTING_NAMES](https://twitter.com/dan_abramov/status/1191487701058543617), that's also fine!
:::

## Context

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
        setCount: number;
      },
      // highlight-start
      // State-specific context
      // Only available when machine is in the `counting` state
      { count: number }
      // highlight-end
    >;
  },
  // highlight-start
  // Common context for all states
  { maxCount: number }
  // highlight-end
>;
```

:::info
If the current state has a specific context where some properties overlap with the machine context, the state's context will override the machine context.
:::

Finally, the schema is simply provided as a type argument to the `useMachine` hook, which we'll check out in [the next article.](./event-handlers-and-transitions.md)

```tsx
const counterMachine = useMachine<CounterMachine>();
```
