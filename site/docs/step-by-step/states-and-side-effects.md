---
title: States and side-effects
---

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
        onChange={(event) => loginMachine.changeEmail(event.target.value)}
      />
      <input
        value={loginMachine.context.password}
        onChange={(event) => loginMachine.changePassword(event.target.value)}
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
            .then((res) => res.json())
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
