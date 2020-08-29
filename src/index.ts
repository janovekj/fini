import { useEffectReducer, EffectReducer } from "use-effect-reducer";

const isFunction = (arg: any): arg is Function => typeof arg === "function";

const isObject = (arg: any): arg is object => typeof arg === "object";

type StateMap = {
  [state: string]: {
    on: {
      [event: string]: Record<string, {}> | null;
    };
    context?: Record<string, any>;
  };
};

export type CreateState<BaseContext, S extends StateMap> = {
  // use BaseData and overwrite them with explicit data for state
  [K in keyof S]: Omit<S[K], "context"> & {
    context: BaseContext & S[K]["context"];
  };
};

/*
TODO use this instead of the stuff below?

type CanBeOmitted<T, Y = T, N = never> = {} extends T
  ? Y // T is weak (all props are optional), or
  : undefined extends T
  ? Y // T can be undefined
  : N;
*/
// context is optional if's a weak object, i.e. all it's props are optional
type State<S extends StateMap> = {
  [K in keyof S]: {
    state: K;
  } & ({} extends S[K]["context"]
    ? { context?: S[K]["context"] }
    : S[K]["context"] extends undefined
    ? {}
    : { context: S[K]["context"] });
}[keyof S];

type StateWithContext<S extends StateMap> = {
  [K in keyof S]: {
    state: K;
    context: S[K]["context"] extends undefined ? {} : S[K]["context"];
  };
}[keyof S];

type CleanupFunction = () => void;
type EffectFunction = () => void | CleanupFunction;

type StateLike = {
  state: string;
  context: Record<string, any>;
};

type EffectStateTuple<S extends StateMap> =
  | [EffectFunction]
  | [EffectFunction, State<S>];

type EventNode<CurrentState extends StateLike, AllState extends StateMap, P> =
  | State<AllState>
  | EffectStateTuple<AllState>
  | (P extends {}
      ? (
          state: CurrentState,
          payload: P
        ) => State<AllState> | EffectStateTuple<AllState>
      : (state: CurrentState) => State<AllState> | EffectStateTuple<AllState>);

type Schema<S extends StateMap> = {
  [K in keyof S]: {
    [E in keyof S[K]["on"]]: K extends string
      ? EventNode<
          {
            state: K;
            context: S[K]["context"] extends {} ? S[K]["context"] : {};
          },
          S,
          S[K]["on"][E]
        >
      : never;
  };
};

type Event<S extends StateMap> = {
  [K in keyof S]: {
    [E in keyof S[K]["on"]]: S[K]["on"][E] extends {}
      ? { type: E; payload: S[K]["on"][E] }
      : { type: E };
  }[keyof S[K]["on"]];
}[keyof S];

type UnionToIntersection<U> = (U extends any
? (k: U) => void
: never) extends (k: infer I) => void
  ? I
  : never;

type Dispatcher<S extends StateMap> = UnionToIntersection<
  {
    [K in keyof S]: {
      [E in keyof S[K]["on"]]: S[K]["on"][E] extends null
        ? () => void
        : (payload: S[K]["on"][E]) => void;
    };
  }[keyof S]
>;

export const useMachine = <S extends StateMap>(
  schema: Schema<S>,
  initialState: State<S>
) => {
  // @ts-ignore: Event<S> is not assignable to EventObject
  const reducer: EffectReducer<StateWithContext<S>, Event<S>> = (
    state,
    event,
    exec
  ) => {
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
                exec(effect);
                return newState;
              } else {
                const [effect] = result;
                exec(effect);
                return state;
              }
            };

            if (isFunction(eventNode)) {
              // @ts-ignore
              const result = eventNode(state, event?.payload);
              if (Array.isArray(result)) {
                // @ts-ignore: TS doesn't understand that we're type safe here (?)
                return handleEffectStateTuple(result);
              } else {
                return result;
              }
            } else if (Array.isArray(eventNode)) {
              // @ts-ignore: TS doesn't understand that we're type safe here (?)
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

  // @ts-ignore: Event<S> is not assignable to EventObject
  const [reducerState, dispatch] = useEffectReducer(reducer, initialState);

  const state = reducerState.context
    ? reducerState
    : {
        ...reducerState,
        context: {},
      };

  const events = Array.from(
    new Set(Object.values(schema).flatMap(Object.keys))
  );
  const dispatcher = Object.assign(
    {},
    ...events.map(event => ({
      [event]: (payload: unknown) => dispatch({ type: event, payload }),
    }))
  ) as Dispatcher<S>;

  return [state, dispatcher] as const;
};
