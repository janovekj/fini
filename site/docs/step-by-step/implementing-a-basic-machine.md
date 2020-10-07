---
title: Implementing a basic machine
---

We'll import the `useMachine` hook, and give it `LoginMachine` as a type argument, and an empty object which we'll expand shortly:

```tsx
import { Machine, State, useMachine } from "fini";
≈
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
