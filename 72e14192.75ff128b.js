(window.webpackJsonp=window.webpackJsonp||[]).push([[11],{79:function(t,n,e){"use strict";e.r(n),e.d(n,"frontMatter",(function(){return c})),e.d(n,"metadata",(function(){return i})),e.d(n,"toc",(function(){return u})),e.d(n,"default",(function(){return l}));var r=e(3),o=e(7),a=(e(0),e(88)),c={title:"Quick-ish Start"},i={unversionedId:"quick-start",id:"quick-start",isDocsHomePage:!1,title:"Quick-ish Start",description:"`bash",source:"@site/docs/quick-start.md",slug:"/quick-start",permalink:"/quick-start",editUrl:"https://github.com/janovekj/fini/edit/master/site/docs/quick-start.md",version:"current",sidebar:"docs",previous:{title:"Introduction",permalink:"/"},next:{title:"Other resources",permalink:"/other-resources"}},u=[],s={toc:u};function l(t){var n=t.components,e=Object(o.a)(t,["components"]);return Object(a.b)("wrapper",Object(r.a)({},s,e,{components:n,mdxType:"MDXLayout"}),Object(a.b)("pre",null,Object(a.b)("code",Object(r.a)({parentName:"pre"},{className:"language-bash"}),"npm install fini\n")),Object(a.b)("p",null,"Simple counter example (",Object(a.b)("a",Object(r.a)({parentName:"p"},{href:"https://codesandbox.io/s/fini-counter-example-ul43u?file=/src/App.tsx"}),"Codesandbox"),")"),Object(a.b)("pre",null,Object(a.b)("code",Object(r.a)({parentName:"pre"},{className:"language-tsx"}),'import React from "react";\nimport { useMachine } from "fini";\n\n// Define a typed schema for the machine\ntype CounterMachine = {\n  states: {\n    // Idle state which handles the `start` event\n    idle: {\n      events: {\n        start: void;\n      };\n    };\n    // Counting state which handles the `increment` and `set` events\n    counting: {\n      events: {\n        increment: void;\n        // the `set` event comes with a number payload\n        set: number;\n      };\n      // Contextual data that is specific to,\n      // and only available in, the `counting` state\n      context: { count: number };\n    };\n  };\n  // Context that is common for all states\n  context: { maxCount: number };\n  // Events that may or may not be handled by all states\n  events: {\n    log: void;\n  };\n};\n\nconst App = () => {\n  const machine = useMachine<CounterMachine>(\n    {\n      // Object that describes the `idle` state and its supported events\n      idle: {\n        // Event handler function which transitions into\n        // the `counting` state, and sets the current count to 0\n        start: ({ update }) => update.counting({ count: 0 }),\n        log: ({ update }) => {\n          // execute a side-effect\n          update(() => console.log("Haven\'t started counting yet"));\n        },\n      },\n      counting: {\n        // Updates the context by incrementing the current count,\n        // if max count hasn\'t already been reached\n        increment: ({ update, context }) =>\n          update.counting({\n            count:\n              context.count === context.maxCount\n                ? context.count\n                : context.count + 1,\n          }),\n        set: ({ next }, count) =>\n          // Update context and run a side-effect\n          update.counting(\n            {\n              count,\n            },\n            () => console.log(`Count was set to ${count}`)\n          ),\n        log: ({ update, context }) => {\n          update(() => console.log(`Current count is ${context.count}`));\n        },\n      },\n    },\n    // Set the initial state and context\n    (initial) => initial.idle({ maxCount: 120 })\n  );\n\n  return (\n    <div>\n      {\n        // Use the returned `machine` object to match states,\n        // read the context, and dispatch events\n        machine.idle && <button onClick={machine.start}>Start counting!</button>\n      }\n      {machine.counting && (\n        <div>\n          <p>{`Count: ${machine.context.count}`}</p>\n          <button onClick={machine.increment}>Increment</button>\n          <button onClick={() => machine.set(100)}>Set to 100</button>\n        </div>\n      )}\n      <button onClick={machine.log}>Log the count</button>\n    </div>\n  );\n};\n')))}l.isMDXComponent=!0},88:function(t,n,e){"use strict";e.d(n,"a",(function(){return p})),e.d(n,"b",(function(){return b}));var r=e(0),o=e.n(r);function a(t,n,e){return n in t?Object.defineProperty(t,n,{value:e,enumerable:!0,configurable:!0,writable:!0}):t[n]=e,t}function c(t,n){var e=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(t,n).enumerable}))),e.push.apply(e,r)}return e}function i(t){for(var n=1;n<arguments.length;n++){var e=null!=arguments[n]?arguments[n]:{};n%2?c(Object(e),!0).forEach((function(n){a(t,n,e[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(e)):c(Object(e)).forEach((function(n){Object.defineProperty(t,n,Object.getOwnPropertyDescriptor(e,n))}))}return t}function u(t,n){if(null==t)return{};var e,r,o=function(t,n){if(null==t)return{};var e,r,o={},a=Object.keys(t);for(r=0;r<a.length;r++)e=a[r],n.indexOf(e)>=0||(o[e]=t[e]);return o}(t,n);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(t);for(r=0;r<a.length;r++)e=a[r],n.indexOf(e)>=0||Object.prototype.propertyIsEnumerable.call(t,e)&&(o[e]=t[e])}return o}var s=o.a.createContext({}),l=function(t){var n=o.a.useContext(s),e=n;return t&&(e="function"==typeof t?t(n):i(i({},n),t)),e},p=function(t){var n=l(t.components);return o.a.createElement(s.Provider,{value:n},t.children)},d={inlineCode:"code",wrapper:function(t){var n=t.children;return o.a.createElement(o.a.Fragment,{},n)}},m=o.a.forwardRef((function(t,n){var e=t.components,r=t.mdxType,a=t.originalType,c=t.parentName,s=u(t,["components","mdxType","originalType","parentName"]),p=l(e),m=r,b=p["".concat(c,".").concat(m)]||p[m]||d[m]||a;return e?o.a.createElement(b,i(i({ref:n},s),{},{components:e})):o.a.createElement(b,i({ref:n},s))}));function b(t,n){var e=arguments,r=n&&n.mdxType;if("string"==typeof t||r){var a=e.length,c=new Array(a);c[0]=m;var i={};for(var u in n)hasOwnProperty.call(n,u)&&(i[u]=n[u]);i.originalType=t,i.mdxType="string"==typeof t?t:r,c[1]=i;for(var s=2;s<a;s++)c[s]=e[s];return o.a.createElement.apply(null,c)}return o.a.createElement.apply(null,e)}m.displayName="MDXCreateElement"}}]);