import { renderHook, act } from "@testing-library/react-hooks";
import { useMachine, CreateState } from "../src/useMachine2";

// isValid
//     ? [
//         () => {
//           console.log("submitted!");
//         },
//         {
//           ...state,
//           state: "submitted",
//           data: {
//             id: "lol",
//             value: "lasdlas",
//           },
//         },
//       ]
//     : [
//         () => {
//           errors.push("error when submitting");
//         },
//         state,
//       ]

test("basic transitions", () => {
  const something = { value: "foo" };

  type State = CreateState<
    { value?: string },
    {
      idle: {
        events: {
          focus: null;
        };
      };
      editing: {
        events: {
          change: { value: string };
          submit: { isValid: boolean };
        };
        data: {
          value: string;
        };
      };
      submitted: {
        events: {};
        data: {
          id: string;
        };
      };
    }
  >;

  const errors = [];

  const { result } = renderHook(() =>
    useMachine<State>(
      {
        idle: {
          focus: {
            state: "editing",
            data: {
              value: "asdas",
            },
          },
        },
        editing: {
          change: (state, { value }) => ({
            ...state,
            value,
          }),
          submit: (state, { isValid }) => [() => {}, state],
        },
        submitted: {},
      },
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
