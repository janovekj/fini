# Fini

Small state machine library for React, built on top of the brilliant [use-effect-reducer](https://github.com/davidkpiano/useEffectReducer/).

[![npm version](http://img.shields.io/npm/v/fini.svg?style=flat)](https://npmjs.org/package/fini "View this project on npm") [![GitHub license](https://img.shields.io/github/license/janovekj/fini)](https://github.com/janovekj/fini/blob/master/LICENSE "MIT license")

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Motivation](#motivation)
- [Features](#features)
- [Quick start](#quick-start)
- [Concepts](#concepts)
  - [Schema definition](#schema-definition)
  - [Event handlers and transitions](#event-handlers-and-transitions)
  - [State and dispatch](#state-and-dispatch)
  - [Summary and next steps](#summary-and-next-steps)
- [Step-by-step tutorial](#step-by-step-tutorial)
  - [Defining the schema](#defining-the-schema)
  - [Implementing a basic machine](#implementing-a-basic-machine)
  - [States and side-effects](#states-and-side-effects)
  - [Finished result](#finished-result)
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
import * as React from "react";
import { useMachine, Machine, State } from "fini";

type CounterMachine = Machine<
  {
    idle: State<{
      started: never;
    }>;
    counting: State<
      {
        incremented: never;
        set: number;
      },
      { count: number }
    >;
  },
  { maxCount: number }
>;

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
      {state.idle && (
        <button onClick={dispatch.started}>Start counting!</button>
      )}
      {state.counting && (
        <div>
          <p>{`Count: ${state.context.count}`}</p>
          <button onClick={dispatch.incremented}>Increment</button>
          <button onClick={() => dispatch.set(100)}>Set to 100</button>
        </div>
      )}
    </div>
  );
}
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
  // State which supports the `started` event
  idle: State<{
    // Event with no payload
    started: never;
  }>;

  // State which supports the `incremented` and `set` events
  counting: State<{
    incremented: never;
    // Event which accepts a `number` payload
    set: number;
  }>;
}>;
```

Let's break this down a bit. If you've worked with TypeScript in Redux or XState, you might be used to events/actions being defined as a separate type. Typically something similar to this:

```tsx
type CounterEvent =
  | {
      type: "started";
    }
  | {
      type: "incremented";
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

### Context

Fini also supports the concept of context, also known as extended state. One of the best things about Fini, is the support for _state-specific context_, or _typestate_, as the concept is more formally called. Using typestates is an easy way to ensure you never enter new states without the required data, or try to access properties that aren't defined in a given state.

Contexts are defined by supplying a second type argument to the `Machine` and `State` types. Like this:

```tsx
// Helper types for schema definitons
import { Machine, State } from "fini";

type CounterMachine = Machine<
  {
    idle: State<{
      started: never;
    }>;
    counting: State<
      {
        incremented: never;
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

All event handler functions also receive the current context as a parameter:

```tsx
useMachine({
  counting: {
    incremented: ({ context }) => ({
      count: context.count + 1,
    }),
  },
});
```

Updates to context works the same way you normally update state in reducer functions: you have to return the entire context object, not just the properties you're updating. If the state you're transitioning to has its own context properties, you must also make sure that the returned context is compatible.

### Event payloads

A state machine would be quite useless if we couldn't pass along data with the events we're dispatching. If the event supports a payload, this is the second parameter passed into the event handler function:

```tsx
type CounterMachine = Machine<
  {
    counting: {
      countModified: number;
    };
  },
  {
    count: number;
  }
>;

useMachine({
  counting: {
    countModified: ({ context }, newCount) => ({
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
    loggedIn: ({ context, exec }, userId) => {
      exec(() => {
        fetchUser(userId).then(user => console.log(user));
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
    loggedIn: ({ context, exec }, userId) => {
      exec(dispatch => {
        fetchUser(userId).then(user => dispatch.succeeded(user));
      });
      return "fetchingUser";
    },
  },
  fetchingUser: {
    succeeded: ({ context }, user) => ({
      ...context,
      user,
    }),
  },
});
```

## State and dispatch

Implementing the machine is only half the fun. Let's look at how to use the machine in your React components.

The `useMachine` hook returns a tuple of the current state, and a dispatcher object - pretty similar to the regular `useReducer` signature.

```tsx
const [state, dispatch] = useMachine(...);
```

### Dispatching events

Dispatching events is a bit different in Fini, compared to how it works with `useReducer`, `Redux` and `XState`. Instead of dispatching action/event objects, `dispatch` is an object that's predefined with functions to dispatch the various events. Example:

```tsx
type CounterMachine = Machine<{
  counting: State<{
    incremented: never
  }>
}>

const [state, dispatch] = useMachine<CounterMachine>(...);

return <button onClick={() => dispatch.incremented()}>Increment!</button>
```

This is so you won't have to either create action creators or manually write `dispatch({ type: "incremented" })`.

### The `state` object

The `state` object contains everything you need to know about the current state of the machine.

To examine its properties, it's easiest with an example.

```tsx
type CounterMachine = Machine<
  {
    idle: State<{
      started: never;
    }>;
    counting: State<
      {
        incremented: never;
        set: number;
      },
      { count: number }
    >;
  },
  { maxCount: number }
>;

const [state] = useMachine(
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
  },
  { state: "idle", context: { maxCount: 100 } }
);
```

`console.log(state)` will output

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

If we were to run `dispatch.started()`, `state` would look like this:

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

### State matching

In this example, we also have a state-specific context, i.e. `{ count: 0 }`. Since Fini tries to protect you from run-time errors, you cannot access `state.context.count` without first checking that you're in the `counting` state:

```tsx
console.log(state.context.count); // ❌

if (state.current === "counting") {
  console.log(state.context.count); // ✅
}

if (state.counting) {
  console.log(state.context.count); // ✅
}
```

Meanwhile, `state.context.maxCount` is "globally" defined, and is accessible in all states.

Finally, these state matchers are also very handing when determining what to render:

```tsx
return (
  <div>
    {state.idle && <button onClick={dispatch.started}>Start counting!</button>}
    {state.counting && (
      <div>
        <p>{`Count: ${state.context.count}`}</p>
        <button onClick={dispatch.incremented}>Increment</button>
        <button onClick={() => dispatch.set(100)}>Set to 100</button>
      </div>
    )}
  </div>
);
```

## Summary and next steps

Hopefully you've gotten a good grasp on how Fini works. If not, try reading the [step-by-step tutorial](#step-by-step-tutorial), which gives you the different parts of Fini in bite-sized chunks. Also feel free to create an issue if you see something that could be explained better. Fini is meant to be easy to pickup by anyone, and that all starts with good docs.

If you're not convinced by Fini or state machines in general, head over to the [resources section](#resources) for some more material.

# Step-by-step tutorial

Creating stuff is the best way to showcase Fini's features, so let's do exactly that. We'll build a state machine step-by-step to support a simple login sequence.

## Defining the schema

Fini encourages type safety by defining fully typed schemas for your machines. As such, it exposes some helpers for defining these types.

The first type we'll look at, is the `Machine` type. It isn't very interesting on its own - it's simply sort of a wrapper for everything else.

```tsx
import { Machine } from "fini";

type LoginMachine = Machine;
```

Not very exciting. Let's add a state by using the `State` helper type. We'll start simple by only adding the `input` state - the state where we await the user's credentials.

```tsx
import { Machine, State } from "fini";

type LoginMachine = Machine<{
  input: State;
}>;
```

As you can see, `Machine` accepts a type argument: an object type where we can define our states.

The `State` type also accepts a type argument like this, but instead it's a map for the events it should handle. Let's add one!

```tsx
import { Machine, State } from "fini";

type LoginMachine = Machine<{
  input: State<{
    emailChanged: string;
  }>;
}>;
```

Each event name is mapped to a corresponding _payload type_. This refers to the data that we might want to pass along with the event. In our case, we're sending an email, which is a `string`, and `emailChanged` is typed accordingly.

If you're coming from Redux, it's pretty much the exact same as the concept of payloads in action objects (because behind the scenes, this _is_ an action object - Fini just calls them events instead).

Anyways, we'll need an event to handle password input as well.

```tsx
type LoginMachine = Machine<{
  input: State<{
    emailChanged: string;
    passwordChanged: string;
  }>;
}>;
```

There's no point to handling all these changes if we can't actually _save_ the data. That is, we'll need to actually specify that our `LoginMachine` operates with a _context_, where we'll keep the password and email.

We can define such a context in two ways:
**1. For the specific state(s) where the data are available**

```tsx
type LoginMachine = Machine<{
  input: State<
    {
      emailChanged: string;
      passwordChanged: string;
    },
    // Defined inside the `State`
    { email: string; password: string }
  >;
}>;
```

**2. "Globally" for the entire machine**

```tsx
type LoginMachine = Machine<
  {
    input: State<{
      emailChanged: string;
      passwordChanged: string;
    }>;
  },
  // Defined inside the `Machine`
  { email: string; password: string }
>;
```

If the same properties are defined both globally and for a state, Fini will prefer the state-specific context, _if_ it is currently in that state.

In our case, we'll use email and password throughout most of the state, so we'll just define it for the entire machine (the second method).

To put everything we have covered so far into context, let's actually just start working on implementing the machine.

## Implementing a basic machine

We'll import the `useMachine` hook, and give it `LoginMachine` as a type argument, and an empty object which we'll expand shortly:

```tsx
import { Machine, State, useMachine } from "fini";

type LoginMachine = Machine<
  {
    input: State<{
      emailChanged: string;
      passwordChanged: string;
    }>;
  },
  { email: string; password: string }
>;

const LoginComponent = () => {
  const [state, dispatch] = useMachine<LoginMachine>({});
};
```

To keep TypeScript from complaining too much, I also like to provide the initial values right away:

```tsx
const [state, dispatch] = useMachine<LoginMachine>(
  {},
  {
    state: "input",
    context: {
      email: "",
      password: "",
    },
  }
);
```

Tip: If it weren't for `email` and `password` being required, we could just have passed in `"input"` as a shorthand, instead of an entire object.

Next we'll add the `input` state and the `emailChanged` event handler:

```tsx
const [state, dispatch] = useMachine<LoginMachine>(
  {
    input: {
      emailChanged: (machine, payload) => ({
        state: "input",
        context: {
          ...machine.context,
          email: payload,
        },
      }),
    },
  },
  {
    state: "input",
    context: {
      email: "",
      password: "",
    },
  }
);
```

As you can see, `emailChanged` accepts a function where two parameters are provided:

1. `machine` is an object containing the current context, as well as some other things that we'll cover later
2. `payload`, which is the value being passed along with the event. It is of the same type as the one defined on the state's event in our schema

The purpose of the function is to return the next state. In our case, we're not actually going into a new state - we're only updating the context. For cases like this, Fini allows you to simply just return the updated context object directly, instead of explicitly specifying what state we're in:

```tsx
const [state, dispatch] = useMachine<LoginMachine>(
  {
    input: {
      emailChanged: (machine, payload) => ({
        ...machine.context,
        email: payload,
      }),
    },
  },
  {
    state: "input",
    context: {
      email: "",
      password: "",
    },
  }
);
```

Let's add the `passwordChanged` event handler as well (and make things a bit more readably, while we're at it):

```tsx
const [state, dispatch] = useMachine<LoginMachine>(
  {
    input: {
      emailChanged: ({ context }, email) => ({
        ...context,
        email,
      }),
      passwordChanged: ({ context }, password) => ({
        ...context,
        password,
      }),
    },
  },
  {
    state: "input",
    context: {
      email: "",
      password: "",
    },
  }
);
```

Let's also quickly hook it up with some input fields so we can see how interacting with the machine works:

```tsx
const LoginComponent = () => {
  const [state, dispatch] = useMachine<LoginMachine>(...)

  return <div>
    <input
      value={state.context.email}
      onChange={event => dispatch.emailChanged(event.target.value)}
    />
    <input
      value={state.context.password}
      onChange={event => dispatch.passwordChanged(event.target.value)}
    />
  </div>
}
```

Now, I know what you're probably thinking: _all this code for a couple of inputs?! 🤯_

And you would be right for thinking it. However, now that we have covered the basics from schema to implementation, we're getting ready to finish the rest of our schema, and hopefully start showing the parts where all this typing pays off!

## States and side-effects

Moving on, we'll add support for attempting to log in.

```tsx
type User = {
  id: string;
  name: string;
};

type LoginMachine = Machine<
  {
    input: State<{
      emailChanged: string;
      passwordChanged: string;
      submitted: never;
    }>;
    submitting: State<{
      succeeded: User;
    }>;
  },
  { email: string; password: string }
>;
```

Note that `submitted` has a payload type of `never`! This is because it literally never accepts a payload, since `email` and `password` is already available through the machine's context.

We have also added a second state. How exciting! We'll head right over to our implementation and attempt to make a transition.

```tsx
const LoginComponent = () => {
  const [state, dispatch] = useMachine<LoginMachine>(
    {
      input: {
        emailChanged: ({ context }, email) => ({
          ...context,
          email,
        }),
        passwordChanged: ({ context }, password) => ({
          ...context,
          password,
        }),
        submitted: "submitting",
      },
      submitting: {
        succeeded: () => {}, // TODO
      },
    },
    {
      state: "input",
      context: {
        email: "",
        password: "",
      },
    }
  );

  return (
    <div>
      <input
        value={state.context.email}
        onChange={event => dispatch.emailChanged(event.target.value)}
      />
      <input
        value={state.context.password}
        onChange={event => dispatch.passwordChanged(event.target.value)}
      />
      <button onClick={dispatch.submitted}>Submit</button>
    </div>
  );
};
```

There are a couple of new things to go over here. First of all, we're using a string shorthand to define the next state for our machine. This is handy when there aren't any context updates required for the event. Secondly, we've added the (for now empty) `submitted` state. And finally, we've added a simple button to dispatch the event for us.

You might however notice that something is missing: we're not actually doing any requests to the server! Let's go right ahead and create our first _side-effect_ 💯

```tsx
const [state, dispatch] = useMachine<LoginMachine>(
  {
    input: {
      emailChanged: ({ context }, email) => ({
        ...context,
        email,
      }),
      passwordChanged: ({ context }, password) => ({
        ...context,
        password,
      }),
      submitted: ({ context, exec }) => {
        exec(() => {
          fetch("/api/login", {
            method: "POST",
            body: JSON.stringify(context),
          })
            .then(res => res.json())
            .then((user: User) => dispatch.succeeded(user));
        });
        return "submitting";
      },
    },
    submitting: {
      succeeded: () => {}, // TODO
    },
  },
  {
    state: "input",
    context: {
      email: "",
      password: "",
    },
  }
);
```

Alongside `context`, all event handlers have an `exec` function at their disposal. Simply put, `exec` is just a function that is set up to call whatever function we put inside it when the next state update happens.

In our case, we've given it a simple function that will make a request to our endpoint, and when it resolves, it will dispatch the `succeeded` event. Now we're getting somewhere!

(For simplicity, we're assuming the request will never fail, which you probably shouldn't do in real life. Please don't use this example in production.)

Let's set ourselves up for success, and create a transition to the `loggedIn` state:

```tsx
type User = {
  id: string;
  name: string;
};

type LoginMachine = Machine<
  {
    input: State<{
      emailChanged: string;
      passwordChanged: string;
      submitted: never;
    }>;
    submitting: State<{
      succeeded: User;
    }>;
    loggedIn: State<{
      loggedOut: never
    }, { user: User }>
  },
  { email: string; password: string }
>;

...

const [state, dispatch] = useMachine<LoginMachine>(
  {
    input: {
      emailChanged: ({ context }, email) => ({
        ...context,
        email,
      }),
      passwordChanged: ({ context }, password) => ({
        ...context,
        password,
      }),
      submitted: ({ context, exec }) => {
        exec(() => {
            fetch("/api/login", {
              method: "POST",
              body: JSON.stringify(context)
            })
              .then((res) => res.json())
              .then((user: User) => dispatch.succeeded(user));
          });
        return "submitting";
      },
    },
    submitting: {
      succeeded: ({ context }, user) => ({
        state: "loggedIn",
        context: {
          ...context,
          user
        }
      }),
    },
    loggedIn: {
      loggedOut: {
        state: "input",
        context: {
          email: "",
          password: ""
        }
      }
    }
  },
  {
    state: "input",
    context: {
      email: "",
      password: "",
    },
  }
);
```

There's a couple of things going on here. Let's talk about the _implementation_ of the `loggedIn` state first. Immediately, you might notice another shorthand syntax for defining the next state. That is, simply declaring an object directly on the event, instead of returning it from a function. Neat!

Then there's the schema definition. This is a prime example of state-specific context: the `user` object is only available if we're in the `loggedIn` state, and Fini allows us to model that with ease! If we're attempting to access `state.context.user` without checking that we're in the `loggedIn` state first, TypeScript will do all kinds of yelling at us. Instead, let's have a look at how we can show and hide the correct parts of our UI based on the state.

Fini gives us a couple of ways to check the current state. The first one is using the `state.current` property, which can be any of the state names. In our case that would be `"input" | "submitting" | "loggedIn"`, so a check would look like this: `state.current === "loggedIn"`.

The second way is simply doing `state.loggedIn`, which returns `true`/`false` depending on whether the state is active.

```tsx
const LoginComponent = () => {
  const [state, dispatch] = useMachine<LoginMachine>(...);

  return (
    <div>
      {
        state.input && <div>
          <input
            value={state.context.email}
            onChange={event => dispatch.emailChanged(event.target.value)}
          />
          <input
            value={state.context.password}
            onChange={event => dispatch.passwordChanged(event.target.value)}
          />
          <button onClick={dispatch.submitted}>Submit</button>
        </div>
      }
      { state.current === "submitting" && <p>Loading user...</p> }
      {
        state.loggedIn && <div>
          <p>Welcome, {state.context.user.name}!</p>
          <button onClick={dispatch.loggedOut} >Log out</button>
        </div>
      }
    </div>
  );
};
```

## Finished result

Finally, the component in its entirety ([CodeSandbox](https://codesandbox.io/s/fini-loginmachine-4ut16)):

```tsx
import { Machine, State, useMachine } from "fini";

type User = {
  id: string;
  name: string;
};

type LoginMachine = Machine<
  {
    input: State<{
      emailChanged: string;
      passwordChanged: string;
      submitted: never;
    }>;
    submitting: State<{
      succeeded: User;
    }>;
    loggedIn: State<
      {
        loggedOut: never;
      },
      { user: User }
    >;
  },
  { email: string; password: string }
>;

const LoginComponent = () => {
  const [state, dispatch] = useMachine<LoginMachine>(
    {
      input: {
        emailChanged: ({ context }, email) => ({
          ...context,
          email,
        }),
        passwordChanged: ({ context }, password) => ({
          ...context,
          password,
        }),
        submitted: ({ context, exec }) => {
          exec(() => {
            fetch("/api/login", {
              method: "POST",
              body: JSON.stringify(context),
            })
              .then(res => res.json())
              .then((user: User) => dispatch.succeeded(user));
          });
          return "submitting";
        },
      },
      submitting: {
        succeeded: ({ context }, user) => ({
          state: "loggedIn",
          context: {
            ...context,
            user,
          },
        }),
      },
      loggedIn: {
        loggedOut: {
          state: "input",
          context: {
            email: "",
            password: "",
          },
        },
      },
    },
    {
      state: "input",
      context: {
        email: "",
        password: "",
      },
    }
  );

  return (
    <div>
      {state.input && (
        <div>
          <input
            value={state.context.email}
            onChange={event => dispatch.emailChanged(event.target.value)}
          />
          <input
            value={state.context.password}
            onChange={event => dispatch.passwordChanged(event.target.value)}
          />
          <button onClick={dispatch.submitted}>Submit</button>
        </div>
      )}
      {state.current === "submitting" && <p>Loading user...</p>}
      {state.loggedIn && (
        <div>
          <p>Welcome, {state.context.user.name}!</p>
          <button onClick={dispatch.loggedOut}>Log out</button>
        </div>
      )}
    </div>
  );
};
```

# Resources

These are some of the resources that have been important for my own learning, and in the development of Fini.

- [XState](https://xstate.js.org)
- [The Statecharts project](https://statecharts.github.io)
- _[No, disabling a button is not app logic](https://dev.to/davidkpiano/no-disabling-a-button-is-not-app-logic-598i)_ by [David Khourshid](https://twitter.com/davidkpiano)
- [_Stop using isLoading booleans_](https://kentcdodds.com/blog/stop-using-isloading-booleans) by [Kent C. Dodds](https://twitter.com/kentcdodds)
- [Pure UI Control](https://medium.com/@asolove/pure-ui-control-ac8d1be97a8d) by Adam Solove
- [_Redux is half of a pattern_](https://dev.to/davidkpiano/redux-is-half-of-a-pattern-1-2-1hd7) by [David Khourshid](https://twitter.com/davidkpiano)
