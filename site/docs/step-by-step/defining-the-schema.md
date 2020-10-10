---
title: Defining the Schema
---

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
  // highlight-next-line
  input: State;
}>;
```

As you can see, `Machine` accepts a type argument: an object type where we can define our states.

The `State` type also accepts a type argument like this, but instead it's a map for the events it should handle. Let's add one!

```tsx
import { Machine, State } from "fini";

type LoginMachine = Machine<{
  input: State<{
    // highlight-next-line
    changeEmail: string;
  }>;
}>;
```

Each event name is mapped to a corresponding _payload type_. This refers to the data that we might want to pass along with the event. In our case, we're sending an email address, which is a `string`, and `changeEmail` is typed accordingly.

:::info
If you're coming from Redux, it's pretty much the exact same as the concept of payloads in action objects (because behind the scenes, this _is_ an action object - Fini just calls them events instead).
:::

Anyways, we'll need an event to handle password input as well.

```tsx
type LoginMachine = Machine<{
  input: State<{
    changeEmail: string;
    // highlight-next-line
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
    // highlight-start
    // Defined inside the `State`
    { email: string; password: string }
    // highlight-end
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
  // highlight-start
  // Defined inside the `Machine`
  { email: string; password: string }
  // highlight-end
>;
```

If the same properties are defined both globally and for a state, Fini will prefer the state-specific context, _if_ the machine is currently in that state.

In our case, we'll use email and password throughout most of the state, so we'll just define it for the entire machine (the second method).

To put everything we have covered so far into context, let's begin implementing the machine.
