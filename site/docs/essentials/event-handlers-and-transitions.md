---
title: Event Handlers and Transitions
---

State machines are all about responding to events and transitioning to new states. In Fini, this should feel effortless.

## Changing states

There's different ways to transition between states, so let's get a quick overview. The next example shows all the possible ways of expressing a transition from `state1` to `state2`.

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

## Updating context

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

Updating the context works the same way you normally update state in reducer functions: you have to return the entire context object, not just the properties you're updating. If the state you're transitioning to has its own context properties, you must also make sure that the returned context is compatible with this new shape.

It's also completely fine to not return nothing at all. This is often the case if you just want to run some side-effects, which we'll talk about later! If nothing is returned, nothing will be updated.

## Event payloads

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

## Life cycle effects

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
