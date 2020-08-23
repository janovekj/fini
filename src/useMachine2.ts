import { useEffectReducer, EffectReducer } from "use-effect-reducer";
import { isFunction, isObject } from "./util";

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;

type StateMap = {
  [state: string]: {
    events: {
      [event: string]: Record<string, {}> | null;
    };
    data?: Record<string, any>;
  };
};

export type CreateState<BaseData, S extends StateMap> = {
  // use BaseData and overwrite them with explicit data for state
  [K in keyof S]: Overwrite<
    S[K],
    Overwrite<
      {
        data: BaseData;
      },
      { data: BaseData & S[K]["data"] }
    >
  >;
};

type ToState<S extends StateMap> = {
  [K in keyof S]: {
    state: K;
    data: S[K]["data"];
  };
}[keyof S];

type CleanupFunction = () => void;
type EffectFunction = () => void | CleanupFunction;

type StateLike = {
  state: string;
  data: Record<string, any>;
};

type EffectStateTuple<S extends StateMap> =
  | [EffectFunction]
  | [EffectFunction, ToState<S>];

type EventNode<CurrentState extends StateLike, AllState extends StateMap, P> =
  | ToState<AllState>
  | EffectStateTuple<AllState>
  | (P extends {}
      ? (
          state: CurrentState,
          payload: P
        ) => ToState<AllState> | EffectStateTuple<AllState>
      : (
          state: CurrentState
        ) => ToState<AllState> | EffectStateTuple<AllState>);

type LolSc<S extends StateMap> = {
  [K in keyof S]: {
    [E in keyof S[K]["events"]]: {
      state: K;
      data: S[K]["data"];
    };
  };
};

type Schema<S extends StateMap> = {
  [K in keyof S]: {
    [E in keyof S[K]["events"]]: K extends string
      ? EventNode<
          { state: K; data: S[K]["data"] extends {} ? S[K]["data"] : {} },
          S,
          S[K]["events"][E]
        >
      : never;
  };
};

type KOKOl = CreateState<
  { active: boolean; value?: string },
  {
    idle: {
      events: {
        onFocus: null;
      };
    };
    editing: {
      events: {
        onChange: { value: string };
      };
      data: {
        value: string;
      };
    };
  }
>;

const fn2 = <S extends StateMap>(s: Schema<S>) => {};

fn2<KOKOl>({
  idle: {
    onFocus: state => state,
  },
  editing: {
    onChange: [
      () => {},
      {
        state: "editing",
        data: {
          value: "asd",
          active: true,
        },
      },
    ],
  },
});

type ToEvent<S extends StateMap> = {
  [K in keyof S]: {
    [E in keyof S[K]["events"]]: S[K]["events"][E] extends {}
      ? { type: E; payload: S[K]["events"][E] }
      : { type: E };
  }[keyof S[K]["events"]];
}[keyof S];

type Dispatcher<S extends StateMap> = {
  [K in keyof S]: {
    [E in keyof S[K]["events"]]: S[K]["events"][E] extends {}
      ? (payload: S[K]["events"][E]) => void
      : () => void;
  };
}[keyof S];

export const useMachine = <S extends StateMap>(
  schema: Schema<S>,
  initialState: S
) => {
  // @ts-ignore
  const reducer: EffectReducer<ToState<S>, ToEvent<S>> = (
    state,
    event,
    exec
  ) => {
    const ex = (effect: EffectFunction) => exec(effect);

    for (const ss in schema) {
      if (ss === state.state) {
        const currentNode = schema[ss as keyof typeof schema];
        for (const ee in currentNode) {
          if (ee === event.type) {
            const eventNode = currentNode[ee as keyof typeof currentNode];

            if (!eventNode) {
              console.error(`This shouldn't happen`);
            }

            const handleEffectStateTuple = (result: EffectStateTuple<S>) => {
              if (result.length === 2) {
                const [effect, newState] = result;
                ex(effect);
                return newState;
              } else {
                const [effect] = result;
                ex(effect);
                return state;
              }
            };

            if (isFunction(eventNode)) {
              // @ts-ignore
              const result = eventNode(state, event?.payload);
              if (Array.isArray(result)) {
                // @ts-ignore
                return handleEffectStateTuple(result);
              } else {
                return result;
              }
            } else if (Array.isArray(eventNode)) {
              // @ts-ignore
              return handleEffectStateTuple(eventNode);
            } else if (isObject(eventNode)) {
              return eventNode;
            } else {
              console.error(`unknown type of EventNode`, eventNode);
            }
            return state;
          }
        }
      }
    }
    return state;
  };

  // @ts-ignore
  const [state, dispatch] = useEffectReducer(reducer, initialState);

  const events = Array.from(
    new Set(Object.values(schema).flatMap(Object.keys))
  );
  const dispatcher = Object.assign(
    {},
    ...events.map(event => ({
      // @ts-expect-error
      [event]: payload => dispatch({ type: event, payload }),
    }))
  ) as Dispatcher<S>;

  return [state, dispatcher] as const;
};
