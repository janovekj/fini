(window.webpackJsonp=window.webpackJsonp||[]).push([[8],{64:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return o})),n.d(t,"metadata",(function(){return s})),n.d(t,"rightToc",(function(){return c})),n.d(t,"default",(function(){return p}));var a=n(2),i=n(6),r=(n(0),n(76)),o={title:"Schema definition"},s={unversionedId:"concepts/schema-definition",id:"concepts/schema-definition",isDocsHomePage:!1,title:"Schema definition",description:"Fini aims to make it easy to work with state machines in a type-safe manner. While TypeScript is very good at inferring types automatically, this isn't always enough for some of Fini's features, and thus it is recommended to define a full schema for the machine you're building.",source:"@site/docs/concepts/schema-definition.md",slug:"/concepts/schema-definition",permalink:"/concepts/schema-definition",editUrl:"https://github.com/janovekj/fini/edit/master/site/docs/concepts/schema-definition.md",version:"current",sidebar:"docs",previous:{title:"Overview",permalink:"/concepts/overview"},next:{title:"Event handlers and transitions",permalink:"/concepts/event-handlers-and-transitions"}},c=[{value:"States and events",id:"states-and-events",children:[]},{value:"Context",id:"context",children:[]}],l={rightToc:c};function p(e){var t=e.components,n=Object(i.a)(e,["components"]);return Object(r.b)("wrapper",Object(a.a)({},l,n,{components:t,mdxType:"MDXLayout"}),Object(r.b)("p",null,"Fini aims to make it easy to work with state machines in a type-safe manner. While TypeScript is very good at inferring types automatically, this isn't always enough for some of Fini's features, and thus it is recommended to define a full schema for the machine you're building."),Object(r.b)("h2",{id:"states-and-events"},"States and events"),Object(r.b)("p",null,"Here is the schema for a simple counter machine:"),Object(r.b)("pre",null,Object(r.b)("code",Object(a.a)({parentName:"pre"},{className:"language-tsx"}),'// Helper types for schema definitons\nimport { Machine, State } from "fini";\n\ntype CounterMachine = Machine<{\n  // State which supports the `start` event\n  idle: State<{\n    // Event with no payload\n    start: never;\n  }>;\n\n  // State which supports the `increment` and `set` events\n  counting: State<{\n    increment: never;\n    // Event which accepts a `number` payload\n    set: number;\n  }>;\n}>;\n')),Object(r.b)("p",null,"Let's break this down a bit. If you've worked with TypeScript in Redux or XState, you might be used to events/actions being defined as a separate type. Typically something similar to this:"),Object(r.b)("pre",null,Object(r.b)("code",Object(a.a)({parentName:"pre"},{className:"language-tsx"}),'type CounterEvent =\n  | {\n      type: "start";\n    }\n  | {\n      type: "increment";\n    }\n  | {\n      type: "set";\n      payload: number;\n    };\n')),Object(r.b)("p",null,"The benefit of doing it like this, is that you'll only have to define the event/action once. Instead, Fini requires you to define the event for each state that should respond to it. This has its own benefits:"),Object(r.b)("ul",null,Object(r.b)("li",{parentName:"ul"},"TypeScript will complain if you don't implement the event handler, or if you implement it in a state that shouldn't support it"),Object(r.b)("li",{parentName:"ul"},"everything is kept within the same schema/type"),Object(r.b)("li",{parentName:"ul"},"slightly less typing if you don't have many duplicate events")),Object(r.b)("p",null,"Note that duplicate events should be defined with the same payload type everywhere, otherwise TypeScript will get confused."),Object(r.b)("p",null,"Also, this documentation uses camelCase for naming events. If you ",Object(r.b)("a",Object(a.a)({parentName:"p"},{href:"https://twitter.com/dan_abramov/status/1191487701058543617"}),"PREFER_SHOUTING_NAMES"),", that's also fine!"),Object(r.b)("h2",{id:"context"},"Context"),Object(r.b)("p",null,"Fini also supports the concept of context, also known as extended state. One of the best things about Fini, is the support for ",Object(r.b)("em",{parentName:"p"},"state-specific context"),", or ",Object(r.b)("em",{parentName:"p"},"typestate"),", as the concept is more formally called. Using typestates is an easy way to ensure you never enter new states without the required data, or try to access properties that aren't defined in a given state."),Object(r.b)("p",null,"Contexts are defined by supplying a second type argument to the ",Object(r.b)("inlineCode",{parentName:"p"},"Machine")," and ",Object(r.b)("inlineCode",{parentName:"p"},"State")," types. Like this:"),Object(r.b)("pre",null,Object(r.b)("code",Object(a.a)({parentName:"pre"},{className:"language-tsx"}),'// Helper types for schema definitons\nimport { Machine, State } from "fini";\n\ntype CounterMachine = Machine<\n  {\n    idle: State<{\n      start: never;\n    }>;\n    counting: State<\n      {\n        increment: never;\n        set: number;\n      },\n      // State-specific context\n      // Only available when machine is in the `counting` state\n      { count: number }\n    >;\n  },\n  // Common context for all states\n  { maxCount: number }\n>;\n')),Object(r.b)("p",null,"Note: If the current state has a specific context where some properties overlap with the machine context, the state's context will override the machine context."),Object(r.b)("p",null,"Finally, the schema is simply provided as a type argument to the ",Object(r.b)("inlineCode",{parentName:"p"},"useMachine")," hook, which we'll look at in a minute."),Object(r.b)("pre",null,Object(r.b)("code",Object(a.a)({parentName:"pre"},{className:"language-tsx"}),"useMachine<CounterMachine>(...)\n")),Object(r.b)("p",null,Object(r.b)("strong",{parentName:"p"},"Why all the typing?")),Object(r.b)("p",null,"Two key benefits can be gained with fully typed machines:"),Object(r.b)("ol",null,Object(r.b)("li",{parentName:"ol"},"Great Intellisense support when implementing and using the machines"),Object(r.b)("li",{parentName:"ol"},"Compile-time errors when attempting to access invalid properties for the current state")),Object(r.b)("p",null,"You ",Object(r.b)("em",{parentName:"p"},"can")," use Fini without explicit typing, but this will likely result in some false-positive errors here and there which you'll have to ignore."))}p.isMDXComponent=!0},76:function(e,t,n){"use strict";n.d(t,"a",(function(){return u})),n.d(t,"b",(function(){return b}));var a=n(0),i=n.n(a);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function c(e,t){if(null==e)return{};var n,a,i=function(e,t){if(null==e)return{};var n,a,i={},r=Object.keys(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var l=i.a.createContext({}),p=function(e){var t=i.a.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},u=function(e){var t=p(e.components);return i.a.createElement(l.Provider,{value:t},e.children)},h={inlineCode:"code",wrapper:function(e){var t=e.children;return i.a.createElement(i.a.Fragment,{},t)}},m=i.a.forwardRef((function(e,t){var n=e.components,a=e.mdxType,r=e.originalType,o=e.parentName,l=c(e,["components","mdxType","originalType","parentName"]),u=p(n),m=a,b=u["".concat(o,".").concat(m)]||u[m]||h[m]||r;return n?i.a.createElement(b,s(s({ref:t},l),{},{components:n})):i.a.createElement(b,s({ref:t},l))}));function b(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var r=n.length,o=new Array(r);o[0]=m;var s={};for(var c in t)hasOwnProperty.call(t,c)&&(s[c]=t[c]);s.originalType=e,s.mdxType="string"==typeof e?e:a,o[1]=s;for(var l=2;l<r;l++)o[l]=n[l];return i.a.createElement.apply(null,o)}return i.a.createElement.apply(null,n)}m.displayName="MDXCreateElement"}}]);