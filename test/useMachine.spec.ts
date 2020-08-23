import { renderHook, act } from "@testing-library/react-hooks";
import { useMachine, CreateEventMap, EventMap, CreateStateMap } from "../src/useMachine";

test("basic transitions", () => {
  const something = { value: "foo" };

  type State =
    | {
        state: "idle";
        value?: string;
      }
    | {
        state: "editing";
        value: string;
      }
    | {
        state: "submitted";
        value: string;
        id: string;
      };

  type Event = CreateEventMap<{
    focus: null;
    change: { value: string };
    submit: { isValid: boolean };
  }>;

  type AKAK = CreateStateMap<Event, {
    idle: {
      data: {},
      events: {}
    }
  }>

  // type StateMap<E extends EventMap> = {
  //   [key: string]: Partial<Record<keyof E, E[keyof E]>>
  // }

  // type CreateStateMap<E extends EventMap, S extends StateMap<E>> = S

  // type SSS = CreateStateMap<Event, {
  //   idle: Pick<Event, "focus">,
  //   editing: {
  //     kaka: {}
  //   }
  // }>

  // type Stattt = {
  //   idle: Pick<Event, "focus">,
  //   editing: Pick<Event, "change"|"submit">
  //   submitted: {
  //     kook: {}
  //   }
  // }

  const errors = [];

  const { result } = renderHook(() =>
    useMachine<State, Event>(
      (state, event) => ({
        idle: {
          focus: {
            state: "editing",
            value: "",
          },
        },
        editing: {
          change: (state, { value }) => ({
            ...state,
            value,
          }),
          submit: (state, { isValid }) =>
            isValid
              ? [
                () => { console.log("submitted!") },
                {
                  ...state,
                  state: "submitted",
                  id: "lol",
                  value: state.
                }
              ]
              : [
                  () => {
                    errors.push("error when submitting");
                  },
                  state,
                ],
        },
        submitted: {},
      }),
      {
        state: "idle",
      }
    )
  );

  act(() => {
    console.log(result.current[1]);

    result.current[1].focus();
  });

  expect(result.current[0].state).toBe("editing");

  act(() => {
    result.current[1].change();
  });

  expect(something.value).toBe("bar");

  act(() => {
    result.current[1].blur();
  });

  expect(result.current[0].state).toBe("idle");
});
