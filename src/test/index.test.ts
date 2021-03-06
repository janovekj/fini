import { renderHook, act } from "@testing-library/react-hooks";
import { useMachine, createMachine } from "../index";
import { suite } from "uvu";
import { is, equal, type, ok, not, unreachable } from "uvu/assert";

const test = suite("useMachine");

test("falsy event handler return value", () => {
  type M = {
    states: {
      a: {
        events: {
          p: void;
        };
      };
    };
  };

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: () => false,
        },
      },
      ({ a }) => a()
    )
  );
  act(() => {
    result.current.p();
  });

  is(result.current.current, "a");
});

test("initial state with context", () => {
  type M = {
    states: {
      a: {};
    };
    context: {
      prop: number;
    };
  };
  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {},
      },
      ({ a }) => a({ prop: 123 })
    )
  );
  is(result.current.current, "a");
  is(result.current.context.prop, 123);
});

test("context and state update object", () => {
  type M = {
    states: {
      a: {
        events: {
          p: void;
        };
      };
      b: {};
    };
    context: { prop: string };
  };

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: ({ update }) => update.b({ prop: "new value" }),
        },
        b: {},
      },
      ({ a }) => a({ prop: "old value" })
    )
  );

  act(() => {
    result.current.p();
  });

  is(result.current.current, "b");
  is(result.current.context.prop, "new value");
});

test("void event handler", () => {
  type M = {
    states: {
      state1: {
        events: {
          event1: void;
        };
      };
    };
  };

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        state1: {
          event1: () => void 0,
        },
      },
      ({ state1 }) => state1()
    )
  );
  act(() => result.current.event1());

  is(result.current.current, "state1");
});

test("dispatch event with payload", () => {
  type M = {
    states: {
      a: {
        events: {
          p: string;
        };
      };
      b: {};
    };
    context: { prop: string };
  };

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: ({ update }, payload) => update.b({ prop: payload }),
        },
        b: {},
      },
      ({ a }) => a({ prop: "old value" })
    )
  );

  act(() => {
    result.current.p("new value");
  });

  is(result.current.context.prop, "new value");
});

test("dispatch event with optional payload", () => {
  type M = {
    states: {
      a: {
        events: {
          p?: string;
        };
      };
      b: {
        context: {
          prop: string;
        };
      };
    };
  };

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: ({ update }, payload) => {
            return payload ? update.b({ prop: payload }) : update.a();
          },
        },
        b: {},
      },
      ({ a }) => a()
    )
  );

  act(() => {
    result.current.p();
  });

  ok(result.current.a);
});

test("event handler with side-effect", () => {
  type M = {
    states: {
      a: {
        events: {
          p: void;
          next: void;
        };
      };
      b: {};
    };
  };

  let value = "old value";

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          p: ({ update }) =>
            update(() => {
              value = "new value";
              return () => void (value = "final value");
            }),
          next: ({ update }) => update.b(),
        },
        b: {},
      },
      ({ a }) => a()
    )
  );

  act(() => {
    result.current.p();
  });

  is(value, "new value");

  act(() => {
    result.current.next();
  });

  // should have run cleanup
  is(value, "final value");
});

test("entry effect on initial state", () => {
  type M = {
    states: {
      a: {};
      b: {};
    };
    events: {
      stop: void;
    };
  };

  let hasRunEffect = false;
  let hasCleanedUp = false;

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          $entry: (machine) => {
            is(machine.previousState, undefined);
            is(machine.state, "a");
            equal(machine.context, {});
            hasRunEffect = true;
            return () => {
              hasCleanedUp = true;
            };
          },
          stop: ({ update }) => update.b(),
        },
        b: {},
      },
      ({ a }) => a()
    )
  );

  ok(hasRunEffect);
  not(hasCleanedUp);

  act(() => {
    result.current.stop();
  });

  // Should run cleanup upon leaving the state
  ok(hasCleanedUp);
});

test("exit and entry effect", async () => {
  type M = {
    states: {
      a: {
        events: { next: void };
      };
      b: {
        events: { previous: void };
        context: { prop: string };
      };
    };
  };

  const effects: string[] = [];

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        a: {
          $exit: (machine) => {
            effects.push("exit");
            // should be called with the updated context
            // @ts-ignore: TS doesn't know the next state
            is(machine.context.prop, "test");
            is(machine.nextState, "b");
            is(machine.state, "a");

            return () => effects.push("exit cleanup");
          },
          next: ({ update }) =>
            update.b({
              prop: "test",
            }),
        },
        b: {
          $entry: (machine) => {
            effects.push("entry");
            // should be called with the updated context
            is(machine.context.prop, "test");
            is(machine.previousState, "a");
            is(machine.state, "b");
            type(machine.dispatch.next, "function");
            return () => effects.push("entry cleanup");
          },
          previous: ({ update }) => update.a(),
        },
      },
      ({ a }) => a()
    )
  );

  equal(effects, []);

  act(() => {
    result.current.next();
  });

  is(result.current.current, "b");

  // should have been called in the correct order
  equal(effects, ["exit", "exit cleanup", "entry"]);

  act(() => {
    result.current.previous();
  });

  is(result.current.current, "a");

  // should cleanup entry effect upon leaving
  equal(effects, ["exit", "exit cleanup", "entry", "entry cleanup"]);

  act(() => {
    result.current.next();
  });

  // should run effects again
  equal(effects, [
    "exit",
    "exit cleanup",
    "entry",
    "entry cleanup",
    "exit",
    "exit cleanup",
    "entry",
  ]);
});

test("passing machine from createMachine into useMachine", () => {
  type M = {
    states: {
      a: {
        events: {
          p: string;
        };
      };
      b: {};
    };
    context: { prop: string };
  };

  const machine = createMachine<M>({
    a: {
      p: ({ update }, payload) => update.b({ prop: payload }),
    },
    b: {},
  });

  const { result } = renderHook(() =>
    useMachine(machine, ({ a }) => a({ prop: "old value" }))
  );

  act(() => {
    result.current.p("new value");
  });

  is(result.current.context.prop, "new value");
});

/* #### Various examples #### */

test("simple counter example", () => {
  type CounterMachine = {
    states: {
      counting: {
        events: {
          increment: void;
          decrement: void;
        };
      };
      maxedOut: {
        events: {
          reset: void;
        };
      };
    };
    context: { count: number };
  };

  const { result } = renderHook(() =>
    useMachine<CounterMachine>(
      {
        counting: {
          increment: ({ update, context: { count } }) =>
            count < 7
              ? update.counting({
                  count: count + 1,
                })
              : update.maxedOut(),
          decrement: ({ update, context }) =>
            update.counting({ count: context.count - 1 }),
        },
        maxedOut: {
          reset: ({ update }) => update.counting({ count: 0 }),
        },
      },
      ({ counting }) => counting({ count: 0 })
    )
  );

  act(() => {
    result.current.increment();
  });

  is(result.current.context.count, 1);

  act(() => {
    result.current.increment();
    result.current.increment();
    result.current.increment();
    result.current.increment();
    result.current.decrement();
  });

  is(result.current.context.count, 4);

  act(() => {
    result.current.increment();
    result.current.increment();
    result.current.increment();
    result.current.increment();
  });

  is(result.current.context.count, 7);
  is(result.current.current, "maxedOut");

  act(() => {
    result.current.reset();
  });

  is(result.current.context.count, 0);
  is(result.current.current, "counting");
});

test("async thing", async () => {
  type User = {
    name: string;
    age: number;
  };

  type FetcherMachine = {
    states: {
      initial: {
        events: {
          fetch: string;
        };
      };
      fetching: {
        events: {
          succeeded: User;
          failed: string;
        };
        context: { params: { id: string } };
      };
      success: {
        events: {
          refetch: void;
        };
        context: {
          params: { id: string };
          user: User;
        };
      };
      error: {
        context: { error: string };
      };
    };
  };

  const fetchUser = (_: string): Promise<User> =>
    new Promise((resolve) =>
      setTimeout(() => {
        resolve({ name: "Fini", age: 100 });
      }, 30)
    );

  const { result, waitForNextUpdate } = renderHook(() =>
    useMachine<FetcherMachine>(
      {
        initial: {
          fetch: ({ update }, id) =>
            update.fetching(
              {
                params: {
                  id,
                },
              },
              (dispatch) =>
                void fetchUser(id).then((user) => {
                  dispatch.succeeded(user);
                })
            ),
        },
        fetching: {
          succeeded: ({ update }, user) =>
            update.success({
              user,
            }),
          failed: ({ update }) =>
            update.error({
              error: "failed big time",
            }),
        },
        success: {
          refetch: ({ update, context }) =>
            update.fetching(
              (dispatch) =>
                void fetchUser(context.params.id).then((user) => {
                  dispatch.succeeded(user);
                })
            ),
        },
        error: {},
      },
      ({ initial }) => initial()
    )
  );

  act(() => {
    result.current.fetch("test");
  });

  is(result.current.current, "fetching");

  await waitForNextUpdate();

  is(result.current.current, "success");

  act(() => {
    result.current.refetch();
  });

  is(result.current.current, "fetching");

  await waitForNextUpdate();

  is(result.current.current, "success");
});

test("login machine", async () => {
  type User = {
    id: string;
    name: string;
  };

  type LoginParams = { email: string; password: string };

  // First, define the schema for the machine
  type LoginMachine = {
    states: {
      initial: {
        events: {
          // Specify an event handler with the `Event` helper type,
          // which accepts a type argument for the event payload
          login: LoginParams;
        };
      };
      fetching: {
        events: {
          succeeded: User;
          failed: string;
        };
        // Add state-specific context data. TypeScript will only let you
        // access `context.params` while in the `fetching` state
        // (or any other state that specifies the property)
        context: { params: LoginParams };
      };
      loggedIn: {
        events: {
          logout: void;
        };
        context: {
          params: LoginParams;
          user: User;
        };
      };
      error: {
        events: {
          retry: void;
        };
        context: { error: string; params: LoginParams };
      };
    };
  };

  let succeed = true;

  const login = (_: LoginParams): Promise<User> =>
    new Promise((resolve, reject) =>
      setTimeout(() => {
        if (succeed) {
          resolve({ id: "123", name: "Fini" });
        } else {
          reject("something went wrong");
        }
      }, 30)
    );

  const { result, waitForNextUpdate } = renderHook(() =>
    // Next, let's implement the machine
    useMachine<LoginMachine>(
      {
        // Implement the `initial` state,
        // which is simply an object with event handlers as properties
        initial: {
          /* Implement the `login` event handler,
           * which is a function where two parameters are provided:
           * 1. an object containing the current context (not used here),
           *    and a function `exec`, with which we can safely execute our side-effects
           *    (and even dispatch new events!)
           * 2. the event payload
           */
          login: ({ update }, { email, password }) => {
            // Return the new state, with the new context
            return update.fetching(
              {
                params: {
                  email,
                  password,
                },
              },
              (dispatch) => {
                login({ email, password })
                  .then((user) => dispatch.succeeded(user))
                  .catch((error) => dispatch.failed(error));
              }
            );
          },
        },
        // Rinse and repeat
        fetching: {
          succeeded: ({ update }, user) => update.loggedIn({ user }),
          failed: ({ update }, error) =>
            update.error({ error }, () =>
              console.error("Test message: Something bad happened!")
            ),
        },
        loggedIn: {
          logout: ({ update }) => update.initial(),
        },
        error: {
          retry: ({ update, context }) =>
            update.fetching((dispatch) => {
              login(context.params)
                .then((user) => dispatch.succeeded(user))
                .catch((error) => dispatch.failed(error));
            }),
        },
      },
      ({ initial }) => initial()
    )
  );

  act(() => {
    result.current.login({ email: "test@example.com", password: "hunter2" });
  });

  is(result.current.current, "fetching");

  await waitForNextUpdate();

  is(result.current.current, "loggedIn");

  act(() => {
    result.current.retry();
  });

  is(result.current.current, "loggedIn");
  // @ts-expect-error
  equal(result.current.context.user, { id: "123", name: "Fini" });

  act(() => {
    result.current.logout();
  });

  is(result.current.current, "initial");
  succeed = false;

  act(() => {
    result.current.login({ email: "test@example.com", password: "hunter2" });
  });

  await waitForNextUpdate();

  is(result.current.current, "error");
});

test("counter example with enter and exit effects", () => {
  type CounterMachine = {
    states: {
      idle: {
        events: { start: void };
      };
      counting: {
        events: {
          increment: void;
          pause: void;
          stop: void;
        };
      };
      paused: {
        events: { resume: void };
      };
      stopped: {};
    };
    context: { count: number };
  };

  const { result } = renderHook(() =>
    useMachine<CounterMachine>(
      {
        idle: {
          start: ({ update }) => update.counting(),
        },
        counting: {
          $entry: ({ state, previousState, context, dispatch }) => {
            console.log(`Entered ${state}, coming from ${previousState}.`);
            console.log(`Count is ${context.count}`);
            dispatch.increment();
          },
          increment: ({ update, context }) =>
            update.counting({ count: context.count + 1 }),
          pause: ({ update }) => update.paused(),
          stop: ({ update }) => update.stopped(),
          $exit: ({ nextState }) => console.log(`Heading off to ${nextState}`),
        },
        paused: {
          resume: ({ update }) => update.counting(),
        },
        stopped: {},
      },
      ({ idle }) => idle({ count: 0 })
    )
  );

  act(() => {
    result.current.start();
  });

  // entry successfully dispatched action
  is(result.current.context.count, 1);
});

test("dispatch event that isnt handled", () => {
  type M = {
    states: {
      s1: {
        events: {
          e: void;
        };
      };
      s2: {};
    };
  };

  const { result } = renderHook(() =>
    useMachine<M>(
      {
        s1: {
          e: () => void 0,
        },
        s2: {},
      },
      ({ s2 }) => s2()
    )
  );

  act(() => {
    result.current.e();
  });
});

test("don't dispatch after unmount", async () => {
  type M = {
    states: {
      s1: {
        events: {
          e1: void;
          e2;
        };
      };
      s2: {};
    };
  };

  let affected = false;
  let cleanedUp = false;
  const { result, unmount } = renderHook(() =>
    useMachine<M>(
      {
        s1: {
          e1: ({ update }) =>
            update((dispatch) => {
              const timeout = setTimeout(() => {
                affected = true;
                dispatch.e2();
                unreachable();
              }, 0);
              unmount();

              return () => {
                clearTimeout(timeout);
                cleanedUp = true;
              };
            }),
          e2: ({ update }) => update.s2(),
        },
        s2: {
          $entry: () => {
            unreachable();
          },
        },
      },
      ({ s1 }) => s1()
    )
  );

  act(() => {
    result.current.e1();
  });

  not(affected);
  ok(cleanedUp);
});

test.run();
