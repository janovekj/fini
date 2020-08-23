import { useEffectReducer, EffectReducer } from "use-effect-reducer";
import { isFunction, isObject } from "./util";
type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;
// & BaseData extends {} ? { data: BaseData } : { data: {} }

type Statty = {
  [state: string]: {
    events: {
      [event: string]: Record<string, {}> | null;
    };
    data?: Record<string, any>;
  };
};

type CreSta<BaseData, S extends Statty> = {
  // [K in keyof S]: Overwrite<S[K], {
  //   data: keyof S[K] extends "data" ? S[K]["data"] : BaseData;
  // }>
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

type Schema2<S extends Statty> = {
  [K in keyof S]: {
    [E in keyof S[K]["events"]]: EventNode2<S, S[K]["events"][E]>;
  };
};

type EffectStateTuple2<S extends Statty> =
  | [EffectFunction]
  | [EffectFunction, ToState<S>];

type EventNode2<S extends Statty, P> =
  | ToState<S>
  | EffectStateTuple2<S>
  | (P extends {}
      ? (state: S, payload: P) => S | EffectStateTuple2<S>
      : (state: S) => S | EffectStateTuple2<S>);

type ToState<S extends Statty> = {
  [K in keyof S]: {
    state: K;
    data: S[K]["data"];
  };
}[keyof S];

type KOKOl = CreSta<
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

const fn2 = <S extends Statty>(s: Schema2<S>) => {};

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

// fn2<KOKOl>({
//   idle: {
//     onFocus: {
//       active: true,
//       state: "idle"
//     }
//   },
//   editing: {
//     onChange: {
//       state: "editing",
//       active: false,
//       value: "sds",
//     }
//   }
// })

type Kss = ToState<KOKOl>;

const kk: Kss = {
  state: "idle",
  active: true,
};

const a: KOKOl = {
  idle: {
    data: {
      active: true,
    },
    events: {
      onFocus: null,
    },
  },
  editing: {
    data: {
      value: "asd",
      active: true,
    },
    events: {
      onChange: { value: "asd" },
    },
  },
};

type StateLike = {
  state: string;
  data: Record<string, any>;
};

export type EventMap = {
  [key: string]: Record<string, {}> | null;
};

export type CreateEventMap<M extends EventMap> = M;

type ToEvent<E extends EventMap> = {
  [K in keyof E]: E[K] extends {} ? { type: K; payload: E[K] } : { type: K };
}[keyof E];

type Dispatcher<E extends EventMap> = {
  [K in keyof E]: E[K] extends {} ? (payload: E[K]) => void : () => void;
};

type StateMap<E extends EventMap> = Record<
  string,
  {
    events: Partial<Record<keyof E, E[keyof E]>>;
    data: any;
  }
>;

export type CreateStateMap<E extends EventMap, S extends StateMap<E>> = S;

type CleanupFunction = () => void;
type EffectFunction = () => void | CleanupFunction;

type EffectStateTuple<S extends StateLike> =
  | [EffectFunction]
  | [EffectFunction, S];

type EventNode<S extends StateLike, P> =
  | S
  | EffectStateTuple<S>
  | (P extends {}
      ? (state: S, payload: P) => S | EffectStateTuple<S>
      : (state: S) => S | EffectStateTuple<S>);

type Schema<S extends StateMap<E>, E extends EventMap> = (
  state: S,
  event: ToEvent<E>
) => {
  [SK in S["state"]]: {
    [EK in keyof E]?: EventNode<S, E[EK]>;
  };
};

export const useMachine = <S extends StateLike, E extends EventMap>(
  createSchema: Schema<S, E>,
  initialState: S
) => {
  // @ts-expect-error - dummy event to get a copy of the schema
  const states = createSchema(initialState, { type: "TEST" });
  // @ts-expect-error
  const eventMaps = Object.values<{ [key: string]: EventNode<S> }>(states);

  const events: Array<keyof E> = Array.from(
    new Set(eventMaps.flatMap(Object.keys))
  );

  // @ts-ignore
  const reducer: EffectReducer<
    S,
    // @ts-ignore - useEffectReducer expects an EventObject which allows [key:string]: any, which is laxer than our EventMap
    ToEvent<E>
  > = (state, event, exec) => {
    const ex = (effect: EffectFunction) => exec(effect);

    // const schema = createSchema(state, event, ex);
    const schema = createSchema(state, event);

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
              // @ts-expect-error ---- for test only remove
              const result = eventNode(state, event?.payload);
              if (Array.isArray(result)) {
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
  const dispatcher = Object.assign(
    {},
    ...events.map(event => ({
      // @ts-expect-error
      [event]: payload => dispatch({ type: event, payload }),
    }))
  ) as Dispatcher<E>;

  return [state, dispatcher] as const;
};
