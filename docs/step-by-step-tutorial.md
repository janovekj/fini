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
    changeEmail: string;
  }>;
}>;
```

Each event name is mapped to a corresponding _payload type_. This refers to the data that we might want to pass along with the event. In our case, we're sending an email, which is a `string`, and `changeEmail` is typed accordingly.

If you're coming from Redux, it's pretty much the exact same as the concept of payloads in action objects (because behind the scenes, this _is_ an action object - Fini just calls them events instead).

Anyways, we'll need an event to handle password input as well.

```tsx
type LoginMachine = Machine<{
  input: State<{
    changeEmail: string;
    changePassword: string;
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
      changeEmail: string;
      changePassword: string;
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
      changeEmail: string;
      changePassword: string;
    }>;
  },
  // Defined inside the `Machine`
  { email: string; password: string }
>;
```

If the same properties are defined both globally and for a state, Fini will prefer the state-specific context, _if_ the machine is currently in that state.

In our case, we'll use email and password throughout most of the state, so we'll just define it for the entire machine (the second method).

To put everything we have covered so far into context, let's actually just start working on implementing the machine.

## Implementing a basic machine

We'll import the `useMachine` hook, and give it `LoginMachine` as a type argument, and an empty object which we'll expand shortly:

```tsx
import { Machine, State, useMachine } from "fini";

type LoginMachine = Machine<
  {
    input: State<{
      changeEmail: string;
      changePassword: string;
    }>;
  },
  { email: string; password: string }
>;

const LoginComponent = () => {
  const loginMachine = useMachine<LoginMachine>({});
};
```

To keep TypeScript from complaining too much, I also like to provide the initial values right away:

```tsx
const loginMachine = useMachine<LoginMachine>(
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

Next we'll add the `input` state and the `changeEmail` event handler:

```tsx
const loginMachine = useMachine<LoginMachine>(
  {
    input: {
      changeEmail: (machine, payload) => ({
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

As you can see, `changeEmail` accepts a function where two parameters are provided:

1. `machine` is an object containing the current context, as well as some other things that we'll cover later
2. `payload`, which is the value being passed along with the event. It is of the same type as the one defined on the state's event in our schema

The purpose of the function is to return the next state. In our case, we're not actually going into a new state - we're only updating the context. For cases like this, Fini allows you to simply just return the updated context object directly, instead of explicitly specifying what state we're in:

```tsx
const loginMachine = useMachine<LoginMachine>(
  {
    input: {
      changeEmail: (machine, payload) => ({
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

Let's add the `changePassword` event handler as well (and make things a bit more readably, while we're at it):

```tsx
const loginMachine = useMachine<LoginMachine>(
  {
    input: {
      changeEmail: ({ context }, email) => ({
        ...context,
        email,
      }),
      changePassword: ({ context }, password) => ({
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
  const loginMachine = useMachine<LoginMachine>(...)

  return <div>
    <input
      value={loginMachine.context.email}
      onChange={event => loginMachine.changeEmail(event.target.value)}
    />
    <input
      value={loginMachine.context.password}
      onChange={event => loginMachine.changePassword(event.target.value)}
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
      changeEmail: string;
      changePassword: string;
      submit: never;
    }>;
    submitting: State<{
      success: User;
    }>;
  },
  { email: string; password: string }
>;
```

Note that `submit` has a payload type of `never`! This is because it literally never accepts a payload, since `email` and `password` is already available through the machine's context.

We have also added a second state. How exciting! We'll head right over to our implementation and attempt to make a transition.

```tsx
const LoginComponent = () => {
  const loginMachine = useMachine<LoginMachine>(
    {
      input: {
        changeEmail: ({ context }, email) => ({
          ...context,
          email,
        }),
        changePassword: ({ context }, password) => ({
          ...context,
          password,
        }),
        submit: "submitting",
      },
      submitting: {
        success: () => {}, // TODO
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
        value={loginMachine.context.email}
        onChange={event => loginMachine.changeEmail(event.target.value)}
      />
      <input
        value={loginMachine.context.password}
        onChange={event => loginMachine.changePassword(event.target.value)}
      />
      <button onClick={loginMachine.submit}>Submit</button>
    </div>
  );
};
```

There are a couple of new things to go over here. First of all, we're using a string shorthand to define the next state for our machine. This is handy when there aren't any context updates required for the event. Secondly, we've added the (for now empty) `submitting` state. And finally, we've added a simple button to dispatch the event for us.

You might however notice that something is missing: we're not actually doing any requests to the server! Let's go right ahead and create our first _side-effect_ 💯

```tsx
const loginMachine = useMachine<LoginMachine>(
  {
    input: {
      changeEmail: ({ context }, email) => ({
        ...context,
        email,
      }),
      changePassword: ({ context }, password) => ({
        ...context,
        password,
      }),
      submit: ({ context, exec }) => {
        exec(() => {
          fetch("/api/login", {
            method: "POST",
            body: JSON.stringify(context),
          })
            .then(res => res.json())
            .then((user: User) => dispatch.success(user));
        });
        return "submitting";
      },
    },
    submitting: {
      success: () => {}, // TODO
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

In our case, we've given it a simple function that will make a request to our endpoint, and when it resolves, it will dispatch the `success` event. Now we're getting somewhere!

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
      changeEmail: string;
      changePassword: string;
      submit: never;
    }>;
    submitting: State<{
      success: User;
    }>;
    loggedIn: State<{
      logOut: never
    }, { user: User }>
  },
  { email: string; password: string }
>;

...

const loginMachine = useMachine<LoginMachine>(
  {
    input: {
      changeEmail: ({ context }, email) => ({
        ...context,
        email,
      }),
      changePassword: ({ context }, password) => ({
        ...context,
        password,
      }),
      submit: ({ context, exec }) => {
        exec(() => {
            fetch("/api/login", {
              method: "POST",
              body: JSON.stringify(context)
            })
              .then((res) => res.json())
              .then((user: User) => dispatch.success(user));
          });
        return "submitting";
      },
    },
    submitting: {
      success: ({ context }, user) => ({
        state: "loggedIn",
        context: {
          ...context,
          user
        }
      }),
    },
    loggedIn: {
      logOut: {
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

Then there's the schema definition. This is a prime example of state-specific context: the `user` object is only available if we're in the `loggedIn` state, and Fini allows us to model that with ease! If we're attempting to access `loginMachine.context.user` without checking that we're in the `loggedIn` state first, TypeScript will do all kinds of yelling at us. Instead, let's have a look at how we can show and hide the correct parts of our UI based on the state.

Fini gives us a couple of ways to check the current state. The first one is using the `loginMachine.current` property, which can be any of the state names. In our case that would be `"input" | "submitting" | "loggedIn"`, so a check would look like this: `loginMachine.current === "loggedIn"`.

The second way is simply doing `loginMachine.loggedIn`, which returns `true`/`false` depending on whether the state is active.

```tsx
const LoginComponent = () => {
  const loginMachine = useMachine<LoginMachine>(...);

  return (
    <div>
      {
        loginMachine.input && <div>
          <input
            value={loginMachine.context.email}
            onChange={event => loginMachine.changeEmail(event.target.value)}
          />
          <input
            value={loginMachine.context.password}
            onChange={event => loginMachine.changePassword(event.target.value)}
          />
          <button onClick={loginMachine.submit}>Submit</button>
        </div>
      }
      { loginMachine.current === "submitting" && <p>Loading user...</p> }
      {
        loginMachine.loggedIn && <div>
          <p>Welcome, {loginMachine.context.user.name}!</p>
          <button onClick={loginMachine.logOut}>Log out</button>
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
      changeEmail: string;
      changePassword: string;
      submit: never;
    }>;
    submitting: State<{
      success: User;
    }>;
    loggedIn: State<
      {
        logOut: never;
      },
      { user: User }
    >;
  },
  { email: string; password: string }
>;

const LoginComponent = () => {
  const loginMachine = useMachine<LoginMachine>(
    {
      input: {
        changeEmail: ({ context }, email) => ({
          ...context,
          email,
        }),
        changePassword: ({ context }, password) => ({
          ...context,
          password,
        }),
        submit: ({ context, exec }) => {
          exec(() => {
            fetch("/api/login", {
              method: "POST",
              body: JSON.stringify(context),
            })
              .then(res => res.json())
              .then((user: User) => dispatch.success(user));
          });
          return "submitting";
        },
      },
      submitting: {
        success: ({ context }, user) => ({
          state: "loggedIn",
          context: {
            ...context,
            user,
          },
        }),
      },
      loggedIn: {
        logOut: {
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
      {loginMachine.input && (
        <div>
          <input
            value={loginMachine.context.email}
            onChange={event => loginMachine.changeEmail(event.target.value)}
          />
          <input
            value={loginMachine.context.password}
            onChange={event => loginMachine.changePassword(event.target.value)}
          />
          <button onClick={loginMachine.submit}>Submit</button>
        </div>
      )}
      {loginMachine.current === "submitting" && <p>Loading user...</p>}
      {loginMachine.loggedIn && (
        <div>
          <p>Welcome, {loginMachine.context.user.name}!</p>
          <button onClick={loginMachine.logOut}>Log out</button>
        </div>
      )}
    </div>
  );
};
```
