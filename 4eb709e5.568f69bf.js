(window.webpackJsonp=window.webpackJsonp||[]).push([[10],{66:function(e,n,t){"use strict";t.r(n),t.d(n,"frontMatter",(function(){return r})),t.d(n,"metadata",(function(){return i})),t.d(n,"rightToc",(function(){return u})),t.d(n,"default",(function(){return l}));var c=t(2),a=t(6),o=(t(0),t(76)),r={title:"The machine object"},i={unversionedId:"concepts/the-machine-object",id:"concepts/the-machine-object",isDocsHomePage:!1,title:"The machine object",description:"Implementing the machine is only half the fun. Let's look at how to use the machine in your React components.",source:"@site/docs/concepts/the-machine-object.md",slug:"/concepts/the-machine-object",permalink:"/concepts/the-machine-object",editUrl:"https://github.com/janovekj/fini/edit/gh-pages/website/docs/concepts/the-machine-object.md",version:"current",sidebar:"docs",previous:{title:"Event handlers and transitions",permalink:"/concepts/event-handlers-and-transitions"},next:{title:"Next steps",permalink:"/concepts/next-steps"}},u=[{value:"Dispatching events",id:"dispatching-events",children:[]},{value:"Inspecting the state",id:"inspecting-the-state",children:[]}],s={rightToc:u};function l(e){var n=e.components,t=Object(a.a)(e,["components"]);return Object(o.b)("wrapper",Object(c.a)({},s,t,{components:n,mdxType:"MDXLayout"}),Object(o.b)("p",null,"Implementing the machine is only half the fun. Let's look at how to use the machine in your React components."),Object(o.b)("p",null,"The ",Object(o.b)("inlineCode",{parentName:"p"},"useMachine")," hook returns an object with all the stuff you need to work with your machine:"),Object(o.b)("ul",null,Object(o.b)("li",{parentName:"ul"},"the current state (and various ways to ",Object(o.b)("a",Object(c.a)({parentName:"li"},{href:"#inspecting-the-state"}),"match it"),")"),Object(o.b)("li",{parentName:"ul"},"the current context"),Object(o.b)("li",{parentName:"ul"},"pre-bound event dispatchers")),Object(o.b)("h3",{id:"dispatching-events"},"Dispatching events"),Object(o.b)("p",null,"Dispatching events is a bit different in Fini, compared to how it works with ",Object(o.b)("inlineCode",{parentName:"p"},"useReducer"),", ",Object(o.b)("inlineCode",{parentName:"p"},"Redux")," and ",Object(o.b)("inlineCode",{parentName:"p"},"XState"),". Instead of using a ",Object(o.b)("inlineCode",{parentName:"p"},"dispatch")," function to dispatch action/event objects, the object returned from ",Object(o.b)("inlineCode",{parentName:"p"},"useMachine")," provides event functions that are pre-bound to Fini's internal dispatch function. This means you can dispatch events as simple as this:"),Object(o.b)("pre",null,Object(o.b)("code",Object(c.a)({parentName:"pre"},{className:"language-tsx"}),"type CounterMachine = Machine<{\n  counting: State<{\n    increment: never\n    set: number\n  }>\n}>\n\nconst counterMachine = useMachine<CounterMachine>(...);\n\nreturn <div>\n  <button onClick={() => counterMachine.increment()}>Increment!</button>\n  <button onClick={() => counterMachine.set(100)}>Set to 100</button>\n</div>\n")),Object(o.b)("p",null,"This is so you won't have to either create action creators or manually write ",Object(o.b)("inlineCode",{parentName:"p"},'dispatch({ type: "increment" })')," (this is what happens internally, though!)."),Object(o.b)("h3",{id:"inspecting-the-state"},"Inspecting the state"),Object(o.b)("p",null,"As mentioned, the ",Object(o.b)("inlineCode",{parentName:"p"},"machine")," object also contains everything you need to know about the current state of the machine."),Object(o.b)("p",null,"To examine its properties, it's easiest with an example."),Object(o.b)("pre",null,Object(o.b)("code",Object(c.a)({parentName:"pre"},{className:"language-tsx"}),'type CounterMachine = Machine<\n  {\n    idle: State<{\n      start: never;\n    }>;\n    counting: State<\n      {\n        increment: never;\n        set: number;\n      },\n      { count: number }\n    >;\n  },\n  { maxCount: number }\n>;\n\nconst counterMachine = useMachine(\n  {\n    idle: {\n      start: ({ context }) => ({\n        state: "counting",\n        context: {\n          ...context,\n          count: 0,\n        },\n      }),\n    },\n  },\n  { state: "idle", context: { maxCount: 100 } }\n);\n')),Object(o.b)("p",null,"Ignoring event dispatching functions, ",Object(o.b)("inlineCode",{parentName:"p"},"console.log(counterMachine)")," will output"),Object(o.b)("pre",null,Object(o.b)("code",Object(c.a)({parentName:"pre"},{className:"language-js"}),'{\n  // name of the current state\n  current: "idle",\n  // the current context\n  context: {\n    maxCount: 100\n  },\n  // all the possible states,\n  // and whether they\'re the current one:\n  idle: true,\n  counting: false\n}\n')),Object(o.b)("p",null,"If we were to run ",Object(o.b)("inlineCode",{parentName:"p"},"counterMachine.start()"),", ",Object(o.b)("inlineCode",{parentName:"p"},"machine")," would look like this:"),Object(o.b)("pre",null,Object(o.b)("code",Object(c.a)({parentName:"pre"},{className:"language-js"}),'{\n  current: "counting",\n  context: {\n    maxCount: 100,\n    count: 0\n  },\n  idle: false,\n  counting: true\n}\n')),Object(o.b)("p",null,"This example also has a state-specific context, i.e. ",Object(o.b)("inlineCode",{parentName:"p"},"{ count: 0 }"),". Since Fini tries to protect you from run-time errors, you cannot access ",Object(o.b)("inlineCode",{parentName:"p"},"counterMachine.context.count")," without first checking that you're in the ",Object(o.b)("inlineCode",{parentName:"p"},"counting")," state:"),Object(o.b)("pre",null,Object(o.b)("code",Object(c.a)({parentName:"pre"},{className:"language-tsx"}),'console.log(counterMachine.context.count); // \u274c\n\nif (counterMachine.current === "counting") {\n  console.log(counterMachine.context.count); // \u2705\n}\n\nif (counterMachine.counting) {\n  console.log(counterMachine.context.count); // \u2705\n}\n')),Object(o.b)("p",null,"Meanwhile, ",Object(o.b)("inlineCode",{parentName:"p"},"counterMachine.context.maxCount"),' is "globally" defined, and is accessible in all states.'),Object(o.b)("p",null,"Finally, these state matchers are also very handing when determining what to render:"),Object(o.b)("pre",null,Object(o.b)("code",Object(c.a)({parentName:"pre"},{className:"language-tsx"}),"return (\n  <div>\n    {counterMachine.idle && (\n      <button onClick={counterMachine.start}>Start counting!</button>\n    )}\n    {counterMachine.counting && (\n      <div>\n        <p>{`Count: ${counterMachine.context.count}`}</p>\n        <button onClick={counterMachine.increment}>Increment</button>\n        <button onClick={() => counterMachine.set(100)}>Set to 100</button>\n      </div>\n    )}\n  </div>\n);\n")))}l.isMDXComponent=!0},76:function(e,n,t){"use strict";t.d(n,"a",(function(){return p})),t.d(n,"b",(function(){return m}));var c=t(0),a=t.n(c);function o(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function r(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);n&&(c=c.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,c)}return t}function i(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?r(Object(t),!0).forEach((function(n){o(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):r(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function u(e,n){if(null==e)return{};var t,c,a=function(e,n){if(null==e)return{};var t,c,a={},o=Object.keys(e);for(c=0;c<o.length;c++)t=o[c],n.indexOf(t)>=0||(a[t]=e[t]);return a}(e,n);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(c=0;c<o.length;c++)t=o[c],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(a[t]=e[t])}return a}var s=a.a.createContext({}),l=function(e){var n=a.a.useContext(s),t=n;return e&&(t="function"==typeof e?e(n):i(i({},n),e)),t},p=function(e){var n=l(e.components);return a.a.createElement(s.Provider,{value:n},e.children)},b={inlineCode:"code",wrapper:function(e){var n=e.children;return a.a.createElement(a.a.Fragment,{},n)}},h=a.a.forwardRef((function(e,n){var t=e.components,c=e.mdxType,o=e.originalType,r=e.parentName,s=u(e,["components","mdxType","originalType","parentName"]),p=l(t),h=c,m=p["".concat(r,".").concat(h)]||p[h]||b[h]||o;return t?a.a.createElement(m,i(i({ref:n},s),{},{components:t})):a.a.createElement(m,i({ref:n},s))}));function m(e,n){var t=arguments,c=n&&n.mdxType;if("string"==typeof e||c){var o=t.length,r=new Array(o);r[0]=h;var i={};for(var u in n)hasOwnProperty.call(n,u)&&(i[u]=n[u]);i.originalType=e,i.mdxType="string"==typeof e?e:c,r[1]=i;for(var s=2;s<o;s++)r[s]=t[s];return a.a.createElement.apply(null,r)}return a.a.createElement.apply(null,t)}h.displayName="MDXCreateElement"}}]);