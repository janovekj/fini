type StateNodeLike = {
  [key: string]: EventLike | StateNodeLike;
  // | [() => void, StateNodeLike]
  // | [() => void, StateNodeLike, () => void];
};

type State<S> = {
  [K in keyof S]: S[K] extends EventLike
    ? EventLike
    : S[K] extends State<any>
    ? S[K]
    : never;
};

type CreateSchema<S extends State<any>> = {
  [K in keyof S]: S[K];
};

type EventLike = (s: any) => void;

type CreateEvent<Schema> = (s: Schema) => void;

type MyEvent = CreateEvent<MySchema>;

type MySchema = CreateSchema<{
  test: {
    cool: MyEvent;
    teskkk: {};
  };
}>;

type MyEvent2 = CreateEvent<MyShema2>;

type MyShema2 = {
  test: {
    cool: MyEvent2;
  };
};

const a: MySchema = {
  test: {
    cool: (s) => s,
    teskkk: {
      k: "asd",
    },
  },
};

type Machine = {
  root: {};
  current: {};
};

export const useMachine = <S>(
  name: string,
  rootState: Machine
): [Machine, () => void] => {};
