(window.webpackJsonp=window.webpackJsonp||[]).push([[10],{66:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return o})),n.d(t,"metadata",(function(){return s})),n.d(t,"rightToc",(function(){return c})),n.d(t,"default",(function(){return p}));var a=n(2),i=n(6),r=(n(0),n(76)),o={title:"Schema Definition"},s={unversionedId:"essentials/schema-definition",id:"essentials/schema-definition",isDocsHomePage:!1,title:"Schema Definition",description:"Fini aims to make it easy to work with state machines in a type-safe manner. While TypeScript is very good at inferring types automatically, this isn't always enough for some of Fini's features, and thus it is recommended to define a full schema for the machine you're building.",source:"@site/docs/essentials/schema-definition.md",slug:"/essentials/schema-definition",permalink:"/essentials/schema-definition",editUrl:"https://github.com/janovekj/fini/edit/master/site/docs/essentials/schema-definition.md",version:"current",sidebar:"docs",previous:{title:"Core Concepts",permalink:"/essentials/core-concepts"},next:{title:"Event Handlers and Transitions",permalink:"/essentials/event-handlers-and-transitions"}},c=[{value:"States and events",id:"states-and-events",children:[]},{value:"Context",id:"context",children:[]}],l={rightToc:c};function p(e){var t=e.components,n=Object(i.a)(e,["components"]);return Object(r.b)("wrapper",Object(a.a)({},l,n,{components:t,mdxType:"MDXLayout"}),Object(r.b)("p",null,"Fini aims to make it easy to work with state machines in a type-safe manner. While TypeScript is very good at inferring types automatically, this isn't always enough for some of Fini's features, and thus it is recommended to define a full schema for the machine you're building."),Object(r.b)("p",null,"In general, two key benefits can be gained with fully typed machines:"),Object(r.b)("ol",null,Object(r.b)("li",{parentName:"ol"},"Great Intellisense support when implementing and using the machines"),Object(r.b)("li",{parentName:"ol"},"Compile-time errors when attempting to access invalid properties for the current state")),Object(r.b)("p",null,"You ",Object(r.b)("em",{parentName:"p"},"can"),' drop the types altogether, and let TypeScript try to infer all the types from usage, but this will likely result in some "false positives" in terms of TS errors. This might be improved in the future, but for now it\'s recommended to add explicit typings for your machines.'),Object(r.b)("p",null,"If you're using JavaScript, however, you won't have to worry about any of this, so feel free to skip ahead."),Object(r.b)("h2",{id:"states-and-events"},"States and events"),Object(r.b)("p",null,"Here is the schema for a simple counter machine:"),Object(r.b)("pre",null,Object(r.b)("code",Object(a.a)({parentName:"pre"},{className:"language-tsx"}),'// Helper types for schema definitons\nimport { Machine, State } from "fini";\n\ntype CounterMachine = Machine<{\n  // `idle` state which supports the `start` event\n  idle: State<{\n    // Event with no payload\n    start: never;\n  }>;\n\n  // `counting` state which supports the `increment` and `setCount` events\n  counting: State<{\n    increment: never;\n    // The `setCount` event accepts a `number` payload\n    setCount: number;\n  }>;\n}>;\n')),Object(r.b)("p",null,"Let's break this down a bit. If you've worked with TypeScript in Redux or XState, you might be used to events/actions being defined as a separate type. Typically something similar to this:"),Object(r.b)("pre",null,Object(r.b)("code",Object(a.a)({parentName:"pre"},{className:"language-tsx"}),'type CounterEvent =\n  | {\n      type: "start";\n    }\n  | {\n      type: "increment";\n    }\n  | {\n      type: "setCount";\n      payload: number;\n    };\n')),Object(r.b)("p",null,"The benefit of doing it like this, is that you'll only have to define the event/action once. Instead, Fini requires you to define the event for each state that should respond to it. This has its own benefits:"),Object(r.b)("ul",null,Object(r.b)("li",{parentName:"ul"},"TypeScript will complain if you don't implement the event handler, or if you implement it in a state that shouldn't support it"),Object(r.b)("li",{parentName:"ul"},"everything is kept within the same schema/type"),Object(r.b)("li",{parentName:"ul"},"slightly less typing if you don't have many duplicate events")),Object(r.b)("p",null,"Note that duplicate events should be defined with the same payload type everywhere, otherwise TypeScript will get confused."),Object(r.b)("div",{className:"admonition admonition-tip alert alert--success"},Object(r.b)("div",Object(a.a)({parentName:"div"},{className:"admonition-heading"}),Object(r.b)("h5",{parentName:"div"},Object(r.b)("span",Object(a.a)({parentName:"h5"},{className:"admonition-icon"}),Object(r.b)("svg",Object(a.a)({parentName:"span"},{xmlns:"http://www.w3.org/2000/svg",width:"12",height:"16",viewBox:"0 0 12 16"}),Object(r.b)("path",Object(a.a)({parentName:"svg"},{fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"})))),"tip")),Object(r.b)("div",Object(a.a)({parentName:"div"},{className:"admonition-content"}),Object(r.b)("p",{parentName:"div"},"In these articles, we'll be using ",Object(r.b)("inlineCode",{parentName:"p"},"camelCase")," for naming events. If you ",Object(r.b)("a",Object(a.a)({parentName:"p"},{href:"https://twitter.com/dan_abramov/status/1191487701058543617"}),"PREFER_SHOUTING_NAMES"),", that's also fine!"))),Object(r.b)("h2",{id:"context"},"Context"),Object(r.b)("p",null,"Fini also supports the concept of context, also known as extended state. One of the best things about Fini, is the support for ",Object(r.b)("em",{parentName:"p"},"state-specific context"),", or ",Object(r.b)("em",{parentName:"p"},"typestate"),", as the concept is more formally called. Using typestates is an easy way to ensure you never enter new states without the required data, or try to access properties that aren't defined in a given state."),Object(r.b)("p",null,"Contexts are defined by supplying a second type argument to the ",Object(r.b)("inlineCode",{parentName:"p"},"Machine")," and ",Object(r.b)("inlineCode",{parentName:"p"},"State")," types. Like this:"),Object(r.b)("pre",null,Object(r.b)("code",Object(a.a)({parentName:"pre"},{className:"language-tsx"}),'// Helper types for schema definitons\nimport { Machine, State } from "fini";\n\ntype CounterMachine = Machine<\n  {\n    idle: State<{\n      start: never;\n    }>;\n    counting: State<\n      {\n        increment: never;\n        setCount: number;\n      },\n      // highlight-start\n      // State-specific context\n      // Only available when machine is in the `counting` state\n      { count: number }\n      // highlight-end\n    >;\n  },\n  // highlight-start\n  // Common context for all states\n  { maxCount: number }\n  // highlight-end\n>;\n')),Object(r.b)("div",{className:"admonition admonition-info alert alert--info"},Object(r.b)("div",Object(a.a)({parentName:"div"},{className:"admonition-heading"}),Object(r.b)("h5",{parentName:"div"},Object(r.b)("span",Object(a.a)({parentName:"h5"},{className:"admonition-icon"}),Object(r.b)("svg",Object(a.a)({parentName:"span"},{xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"}),Object(r.b)("path",Object(a.a)({parentName:"svg"},{fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"})))),"info")),Object(r.b)("div",Object(a.a)({parentName:"div"},{className:"admonition-content"}),Object(r.b)("p",{parentName:"div"},"If the current state has a specific context where some properties overlap with the machine context, the state's context will override the machine context."))),Object(r.b)("p",null,"Finally, the schema is simply provided as a type argument to the ",Object(r.b)("inlineCode",{parentName:"p"},"useMachine")," hook, which we'll check out in ",Object(r.b)("a",Object(a.a)({parentName:"p"},{href:"/essentials/event-handlers-and-transitions"}),"the next article.")),Object(r.b)("pre",null,Object(r.b)("code",Object(a.a)({parentName:"pre"},{className:"language-tsx"}),"const counterMachine = useMachine<CounterMachine>();\n")))}p.isMDXComponent=!0},76:function(e,t,n){"use strict";n.d(t,"a",(function(){return m})),n.d(t,"b",(function(){return b}));var a=n(0),i=n.n(a);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function c(e,t){if(null==e)return{};var n,a,i=function(e,t){if(null==e)return{};var n,a,i={},r=Object.keys(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var l=i.a.createContext({}),p=function(e){var t=i.a.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},m=function(e){var t=p(e.components);return i.a.createElement(l.Provider,{value:t},e.children)},h={inlineCode:"code",wrapper:function(e){var t=e.children;return i.a.createElement(i.a.Fragment,{},t)}},u=i.a.forwardRef((function(e,t){var n=e.components,a=e.mdxType,r=e.originalType,o=e.parentName,l=c(e,["components","mdxType","originalType","parentName"]),m=p(n),u=a,b=m["".concat(o,".").concat(u)]||m[u]||h[u]||r;return n?i.a.createElement(b,s(s({ref:t},l),{},{components:n})):i.a.createElement(b,s({ref:t},l))}));function b(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var r=n.length,o=new Array(r);o[0]=u;var s={};for(var c in t)hasOwnProperty.call(t,c)&&(s[c]=t[c]);s.originalType=e,s.mdxType="string"==typeof e?e:a,o[1]=s;for(var l=2;l<r;l++)o[l]=n[l];return i.a.createElement.apply(null,o)}return i.a.createElement.apply(null,n)}u.displayName="MDXCreateElement"}}]);