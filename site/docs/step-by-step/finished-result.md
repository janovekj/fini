---
title: Finished Result
---

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
            onChange={(event) => loginMachine.changeEmail(event.target.value)}
          />
          <input
            value={loginMachine.context.password}
            onChange={(event) =>
              loginMachine.changePassword(event.target.value)
            }
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
