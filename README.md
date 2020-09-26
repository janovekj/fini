# Fini

Small state machine library for React, built on top of the brilliant [use-effect-reducer](https://github.com/davidkpiano/useEffectReducer/).

[![npm version](http://img.shields.io/npm/v/fini.svg?style=flat)](https://npmjs.org/package/fini "View this project on npm") [![GitHub license](https://img.shields.io/github/license/janovekj/fini)](https://github.com/janovekj/fini/blob/master/LICENSE "MIT license")

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Fini](#fini)
- [Motivation](#motivation)
- [Features](#features)
- [Quick start](#quick-start)
- [In-depth tutorial](#in-depth-tutorial)
  - [Defining the schema](#defining-the-schema)
  - [Implementing a basic machine](#implementing-a-basic-machine)
  - [States and side-effects](#states-and-side-effects)
  - [Finished result](#finished-result)

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

# Quick start

```bash
npm install fini
```

Simple counter example ([Codesandbox](https://codesandbox.io/s/fini-counter-example-ul43u?file=/src/App.tsx))

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
      set: Event<number>;
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
        set: (_, count) => ({
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
          <button onClick={() => dispatch.set(100)}>Set to 100</button>
        </div>
      )}
    </div>
  );
}
```

# In-depth tutorial

Creating stuff is the best way to showcase Fini's features, so let's do exactly that. We'll build a state machine to support a simple login sequence.

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

The `State` type also accepts a type argument like this, but instead it is for the events it should handle. Let's add one!

```tsx
import { Machine, State, Event } from "fini";

type LoginMachine = Machine<{
  input: State<{
    emailChanged: Event;
  }>;
}>;
```

And guess what, `Event` also accepts a type. Often you'll want to send some data with an event, and that's exactly what you can specify for `Event`. In our case, we're passing along a `string`:

```tsx
type LoginMachine = Machine<{
  input: State<{
    emailChanged: Event<string>;
  }>;
}>;
```

If you're coming from Redux, it's pretty much the exact same as the concept of payloads in action objects (because it _is_ an action object - Fini just calls them events instead).

Anyways, we'll need an event to handle password input as well.

```tsx
type LoginMachine = Machine<{
  input: State<{
    emailChanged: Event<string>;
    passwordChanged: Event<string>;
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
      emailChanged: Event<string>;
      passwordChanged: Event<string>;
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
      emailChanged: Event<string>;
      passwordChanged: Event<string>;
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
import { Machine, State, Event, useMachine } from "fini";

type LoginMachine = Machine<
  {
    input: State<{
      emailChanged: Event<string>;
      passwordChanged: Event<string>;
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
2. `payload`, which is the value being passed along with the event. It is of the same type as the one defined on `Event` in our schema

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
      emailChanged: Event<string>;
      passwordChanged: Event<string>;
      submitted: Event;
    }>;
    submitting: State<{
      succeeded: Event<User>;
    }>;
  },
  { email: string; password: string }
>;
```

Note that payload type for `submitted`'s event is needed, since `email` and `password` is already available through the machine's context.

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
      emailChanged: Event<string>;
      passwordChanged: Event<string>;
      submitted: Event;
    }>;
    submitting: State<{
      succeeded: Event<User>;
    }>;
    loggedIn: State<{
      loggedOut: Event
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
import { Machine, State, Event, useMachine } from "fini";

type User = {
  id: string;
  name: string;
};

type LoginMachine = Machine<
  {
    input: State<{
      emailChanged: Event<string>;
      passwordChanged: Event<string>;
      submitted: Event;
    }>;
    submitting: State<{
      succeeded: Event<User>;
    }>;
    loggedIn: State<
      {
        loggedOut: Event;
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
