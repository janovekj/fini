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

type CompatibleContextStates<S extends StateMap, Current extends keyof S> = {
  [K in keyof S]: S[Current]["context"] extends S[K]["context"] ? K : never;
}[keyof S];

type EventNode<CurrentState extends StateLike, AllState extends StateMap, P> =
  | CompatibleContextStates<AllState, CurrentState["state"]>
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
    // @ts-expect-error
    if (!state.state in schema) {
      console.error(`State '${state.state}' does not exist in schema`);
      return state;
    }
    const currentNode = schema[state.state];

    const eventNode = currentNode[event.type];

    if (!eventNode) {
      console.warn(
        `Event handler for '${event.type}' does not exist in state '${state.state}'`
      );
      return state;
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
        // @ts-ignore: TS doesn't understand that we're type safe here (are we?)
        return handleEffectStateTuple(result);
      } else {
        return result;
      }
    } else if (Array.isArray(eventNode)) {
      // @ts-ignore: TS doesn't understand that we're type safe here (are we?)
      return handleEffectStateTuple(eventNode);
    } else if (isObject(eventNode)) {
      return eventNode;
    } else if (typeof eventNode === "string" && eventNode in schema) {
      return {
        state: eventNode,
        context: state.context,
      };
    } else {
      console.error(`unknown type of EventNode`, eventNode);
    }
    return state;
  };

  // @ts-ignore: Event<S> is not assignable to EventObject
  const [reducerState, dispatch] = useEffectReducer(reducer, initialState);

  type Current<S extends StateMap> = {
    [K in keyof S]: {
      state: {
        current: K;
        is: {
          [KK in keyof S]: KK extends K ? true : false;
        };
      };
      context: S[K]["context"] extends undefined ? {} : S[K]["context"];
    };
  }[keyof S];

  // @ts-ignore: TS doesn't like assigning {} to context
  const state: Current<S> = {
    state: {
      current: reducerState.state,
      is: Object.assign(
        {},
        ...Object.keys(schema).map(s => ({ [s]: s === reducerState.state }))
      ),
    },
    context: reducerState.context ?? {},
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
