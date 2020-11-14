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
type CounterMachine = {
  states: {
    // `idle` state which supports the `start` event
    idle: {
      on: {
        // Event with no payload
        start: void;
      };
    };

    // `counting` state which supports the `increment` and `setCount` events
    counting: {
      on: {
        increment: never;
        // The `setCount` event accepts a `number` payload
        setCount: number;
      };
    };
  };
};
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

The benefit of doing it like this, is that you'll only have to define the event/action once. Luckily, Fini supports a version of this technique as well, which is great if you have events that are handled by multiple states.

```tsx
type CounterMachine = {
  states: {
    idle: {};
    counting: {};
  };
  // highlight-start
  // Events are defined as optional for all states
  events: {
    increment: void;
    setCount: number;
  };
  // highlight-end
};
```

:::tip
In these articles, we'll be using `camelCase` for naming events. If you [PREFER_SHOUTING_NAMES](https://twitter.com/dan_abramov/status/1191487701058543617), as is typically used with Redux and XState, that's also fine!
:::

## Context

Fini also supports the concept of context, also known as extended state. One of the best things about Fini, is the how easy it is to add _state-specific context_, or _typestates_, as the concept is more formally called. Using typestates is an easy way to ensure you never enter new states without the required data, or try to access properties that aren't defined in a given state.

```tsx
type CounterMachine = {
  states: {
    idle: {
      on: {
        start: never;
      };
    };
    counting: {
      on: {
        increment: never;
        setCount: number;
      };
      // highlight-start
      // State-specific context
      // Only available when machine is in the `counting` state
      context: { count: number };
      // highlight-end
    };
  };
  // highlight-start
  // Common context for all states
  context: { maxCount: number };
  // highlight-end
};
```

:::info
If the current state has a specific context where some properties overlap with the machine context, the state's context will override the machine context.
:::

Finally, the schema is simply provided as a type argument to the `useMachine` hook, which we'll check out in [the next article.](./event-handlers-and-transitions.md)

```tsx
const counterMachine = useMachine<CounterMachine>();
```
