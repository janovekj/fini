(window.webpackJsonp=window.webpackJsonp||[]).push([[16],{84:function(e,n,t){"use strict";t.r(n),t.d(n,"frontMatter",(function(){return r})),t.d(n,"metadata",(function(){return o})),t.d(n,"toc",(function(){return s})),t.d(n,"default",(function(){return l}));var c=t(3),a=t(7),i=(t(0),t(88)),r={title:"The Machine Object"},o={unversionedId:"essentials/the-machine-object",id:"essentials/the-machine-object",isDocsHomePage:!1,title:"The Machine Object",description:"Implementing the machine is only half the fun. Let's look at how to use the machine in your React components.",source:"@site/docs/essentials/the-machine-object.md",slug:"/essentials/the-machine-object",permalink:"/essentials/the-machine-object",editUrl:"https://github.com/janovekj/fini/edit/master/site/docs/essentials/the-machine-object.md",version:"current",sidebar:"docs",previous:{title:"Event Handlers and Transitions",permalink:"/essentials/event-handlers-and-transitions"}},s=[{value:"Dispatching events",id:"dispatching-events",children:[]},{value:"Inspecting the state",id:"inspecting-the-state",children:[]}],u={toc:s};function l(e){var n=e.components,t=Object(a.a)(e,["components"]);return Object(i.b)("wrapper",Object(c.a)({},u,t,{components:n,mdxType:"MDXLayout"}),Object(i.b)("p",null,"Implementing the machine is only half the fun. Let's look at how to use the machine in your React components."),Object(i.b)("p",null,"The ",Object(i.b)("inlineCode",{parentName:"p"},"useMachine")," hook returns an object with all the stuff you need to work with your machine:"),Object(i.b)("ul",null,Object(i.b)("li",{parentName:"ul"},"the current state (and various ways to ",Object(i.b)("a",Object(c.a)({parentName:"li"},{href:"#inspecting-the-state"}),"match it"),")"),Object(i.b)("li",{parentName:"ul"},"the current context"),Object(i.b)("li",{parentName:"ul"},"pre-bound event dispatchers")),Object(i.b)("h3",{id:"dispatching-events"},"Dispatching events"),Object(i.b)("p",null,"Dispatching events is a bit different in Fini, compared to how it works with ",Object(i.b)("inlineCode",{parentName:"p"},"useReducer"),", ",Object(i.b)("inlineCode",{parentName:"p"},"Redux")," and ",Object(i.b)("inlineCode",{parentName:"p"},"XState"),". Instead of using a ",Object(i.b)("inlineCode",{parentName:"p"},"dispatch")," function to dispatch action/event objects, the object returned from ",Object(i.b)("inlineCode",{parentName:"p"},"useMachine")," provides event functions that are pre-bound to Fini's internal dispatch function. This means dispatching events becomes as easy as this:"),Object(i.b)("pre",null,Object(i.b)("code",Object(c.a)({parentName:"pre"},{className:"language-tsx"}),"type CounterMachine = {\n  states: {\n    counting: {\n      events: {\n        increment: void\n        set: number\n      }\n    }\n  }\n}\n\nconst counterMachine = useMachine<CounterMachine>(...);\n\nreturn <div>\n  // highlight-start\n  <button onClick={() => counterMachine.set(100)}>Set to 100</button>\n  <button onClick={counterMachine.increment}>Increment!</button>\n  // highlight-end\n</div>\n")),Object(i.b)("p",null,"This is so you won't have to either create action creators or manually write ",Object(i.b)("inlineCode",{parentName:"p"},'dispatch({ type: "increment" })')," (this is what happens internally, though!)."),Object(i.b)("h3",{id:"inspecting-the-state"},"Inspecting the state"),Object(i.b)("p",null,"As mentioned, the ",Object(i.b)("inlineCode",{parentName:"p"},"machine")," object also contains everything you need to know about the current state of the machine."),Object(i.b)("p",null,"To examine its properties, it's easiest with an example."),Object(i.b)("pre",null,Object(i.b)("code",Object(c.a)({parentName:"pre"},{className:"language-tsx"}),'type CounterMachine = {\n  states: {\n    idle: {\n      events: {\n        start: never;\n      };\n    };\n    counting: {\n      events: {\n        increment: never;\n        set: number;\n      };\n      context: { count: number };\n    };\n  };\n  context: { maxCount: number };\n};\n\nconst counterMachine = useMachine(\n  {\n    idle: {\n      start: ({ next, context }) => next.counting({ count: 0 }),\n    },\n    // [the `counting` state implementation]\n  },\n  { state: "idle", context: { maxCount: 100 } }\n);\n')),Object(i.b)("p",null,"Ignoring event dispatching functions, ",Object(i.b)("inlineCode",{parentName:"p"},"console.log(counterMachine)")," will output"),Object(i.b)("pre",null,Object(i.b)("code",Object(c.a)({parentName:"pre"},{className:"language-js"}),'{\n  // name of the current state\n  current: "idle",\n  // the current context\n  context: {\n    maxCount: 100\n  },\n  // all the possible states,\n  // and whether they\'re the current one:\n  idle: true,\n  counting: false\n}\n')),Object(i.b)("p",null,"If we were to run ",Object(i.b)("inlineCode",{parentName:"p"},"counterMachine.start()"),", ",Object(i.b)("inlineCode",{parentName:"p"},"machine")," would look like this:"),Object(i.b)("pre",null,Object(i.b)("code",Object(c.a)({parentName:"pre"},{className:"language-js"}),'{\n  current: "counting",\n  context: {\n    maxCount: 100,\n    count: 0\n  },\n  idle: false,\n  counting: true\n}\n')),Object(i.b)("p",null,"This example also has a state-specific context, i.e. ",Object(i.b)("inlineCode",{parentName:"p"},"{ count: 0 }"),". Since Fini tries to protect you from run-time errors, you cannot access ",Object(i.b)("inlineCode",{parentName:"p"},"counterMachine.context.count")," without first checking that you're in the ",Object(i.b)("inlineCode",{parentName:"p"},"counting")," state:"),Object(i.b)("pre",null,Object(i.b)("code",Object(c.a)({parentName:"pre"},{className:"language-tsx"}),'console.log(counterMachine.context.count); // \u274c\n\nif (counterMachine.current === "counting") {\n  console.log(counterMachine.context.count); // \u2705\n}\n\nif (counterMachine.counting) {\n  console.log(counterMachine.context.count); // \u2705\n}\n')),Object(i.b)("p",null,"Meanwhile, ",Object(i.b)("inlineCode",{parentName:"p"},"counterMachine.context.maxCount"),' is "globally" defined, and is accessible in all states.'),Object(i.b)("p",null,"Finally, these state matchers are also very handy when determining what parts of our UI we should render:"),Object(i.b)("pre",null,Object(i.b)("code",Object(c.a)({parentName:"pre"},{className:"language-tsx"}),"return (\n  <div>\n    {counterMachine.idle && (\n      <button onClick={counterMachine.start}>Start counting!</button>\n    )}\n    {counterMachine.counting && (\n      <div>\n        <p>{`Count: ${counterMachine.context.count}`}</p>\n        <button onClick={counterMachine.increment}>Increment</button>\n        <button onClick={() => counterMachine.set(100)}>Set to 100</button>\n      </div>\n    )}\n  </div>\n);\n")))}l.isMDXComponent=!0},88:function(e,n,t){"use strict";t.d(n,"a",(function(){return p})),t.d(n,"b",(function(){return m}));var c=t(0),a=t.n(c);function i(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function r(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);n&&(c=c.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,c)}return t}function o(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?r(Object(t),!0).forEach((function(n){i(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):r(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function s(e,n){if(null==e)return{};var t,c,a=function(e,n){if(null==e)return{};var t,c,a={},i=Object.keys(e);for(c=0;c<i.length;c++)t=i[c],n.indexOf(t)>=0||(a[t]=e[t]);return a}(e,n);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(c=0;c<i.length;c++)t=i[c],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(a[t]=e[t])}return a}var u=a.a.createContext({}),l=function(e){var n=a.a.useContext(u),t=n;return e&&(t="function"==typeof e?e(n):o(o({},n),e)),t},p=function(e){var n=l(e.components);return a.a.createElement(u.Provider,{value:n},e.children)},b={inlineCode:"code",wrapper:function(e){var n=e.children;return a.a.createElement(a.a.Fragment,{},n)}},h=a.a.forwardRef((function(e,n){var t=e.components,c=e.mdxType,i=e.originalType,r=e.parentName,u=s(e,["components","mdxType","originalType","parentName"]),p=l(t),h=c,m=p["".concat(r,".").concat(h)]||p[h]||b[h]||i;return t?a.a.createElement(m,o(o({ref:n},u),{},{components:t})):a.a.createElement(m,o({ref:n},u))}));function m(e,n){var t=arguments,c=n&&n.mdxType;if("string"==typeof e||c){var i=t.length,r=new Array(i);r[0]=h;var o={};for(var s in n)hasOwnProperty.call(n,s)&&(o[s]=n[s]);o.originalType=e,o.mdxType="string"==typeof e?e:c,r[1]=o;for(var u=2;u<i;u++)r[u]=t[u];return a.a.createElement.apply(null,r)}return a.a.createElement.apply(null,t)}h.displayName="MDXCreateElement"}}]);