---
title: Event Handlers and Transitions
---

State machines are all about responding to events and transitioning to new states. In Fini, this should feel effortless.

## Changing states

Transitioning to a new state is simple. Showing is better than telling, so let's look at an example:

```tsx
useMachine({
  state1: {
    event1: ({ next }) => next.state2(),
  },
  state2: {},
});
```

That's all there's to it! The `next` object that is provided to our event handler function, has functions attached to it that will help us in creating state and context updates. It's important to note that this function only _creates_ a new state, it does not actually update the state of our machine. This means that we must return the result for anything to actually happen.

:::note
The event handler function should be [pure](https://en.wikipedia.org/wiki/Pure_function). If you need to perform side-effects, we'll talk about that in just a minute.
:::

## Updating context

In addition to transitioning between states, an event may also update the [context](schema-definition.md#context):

```tsx
useMachine({
  state1: {
    event1: ({ next }) =>
      // Will create a context update while staying in the same state
      next.state1({
        someContextProperty: "some value",
      }),
  },
});
```

If the next state you're transitioning to requires a different set of context properties, Fini will tell if something is missing when creating the update.

It's also completely fine to not return nothing at all. This is often the case if you just want to run some side-effects, which we'll talk about later! If nothing is returned, nothing will be updated.

## Event payloads

A state machine would be quite useless if we couldn't pass along data with the events we're dispatching. If the event supports a payload, this is the second parameter passed into the event handler function:

```tsx
type CounterMachine = {
  states: {
    counting: {
      events: {
        setCount: number;
      };
    };
  };
  context: {
    count: number;
  };
};

useMachine({
  counting: {
    setCount: ({ context }, newCount) => ({
      count: newCount,
    }),
  },
});
```

## Executing side-effects

Event handler functions should be pure, so side-effects must be handled on Fini's terms. Luckily, this is also trivial. Alongside the `context` property, the `exec` function is also passed into the event handler function. You can use `exec` to safely fire away any and all side-effects.

```tsx
useMachine({
  idle: {
    login: ({ context, exec }, userId) => {
      // highlight-start
      exec(() => {
        fetchUser(userId).then((user) => console.log(user));
      });
      // highlight-end
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
      // highlight-start
      exec((dispatch) => {
        fetchUser(userId).then((user) => dispatch.success(user));
      });
      // highlight-end
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

From your side-effect functions, you can also return a cleanup function, which will run when the current state is left, or when the React component is unmounted (similar to [how `useEffect` works](https://reactjs.org/docs/hooks-effect.html#example-using-hooks-1))

## State life cycle effects

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

`$entry` and `$exit` are pretty similar to regular event handler functions, except they don't return a new state. They are only for running effects, which is also why you don't need to wrap them in the `exec` function - Fini will do that for you behind the scenes.

Both functions also receive an object containing the current `state`, `context` and the `dispatch` function. Additionally, `$entry` receives `previousState`, and `$exit` receieves `nextState`.
