(window.webpackJsonp=window.webpackJsonp||[]).push([[15],{71:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return c})),n.d(t,"metadata",(function(){return s})),n.d(t,"rightToc",(function(){return o})),n.d(t,"default",(function(){return l}));var a=n(2),i=n(6),r=(n(0),n(76)),c={title:"Defining the Schema"},s={unversionedId:"step-by-step/defining-the-schema",id:"step-by-step/defining-the-schema",isDocsHomePage:!1,title:"Defining the Schema",description:"Fini encourages type safety by defining fully typed schemas for your machines. As such, it exposes some helpers for defining these types.",source:"@site/docs/step-by-step/defining-the-schema.md",slug:"/step-by-step/defining-the-schema",permalink:"/step-by-step/defining-the-schema",editUrl:"https://github.com/janovekj/fini/edit/master/site/docs/step-by-step/defining-the-schema.md",version:"current",sidebar:"docs",previous:{title:"Creating a Login Machine",permalink:"/step-by-step/creating-a-login-machine"},next:{title:"Implementing a Basic Machine",permalink:"/step-by-step/implementing-a-basic-machine"}},o=[],p={rightToc:o};function l(e){var t=e.components,n=Object(i.a)(e,["components"]);return Object(r.b)("wrapper",Object(a.a)({},p,n,{components:t,mdxType:"MDXLayout"}),Object(r.b)("p",null,"Fini encourages type safety by defining fully typed schemas for your machines. As such, it exposes some helpers for defining these types."),Object(r.b)("p",null,"The first type we'll look at, is the ",Object(r.b)("inlineCode",{parentName:"p"},"Machine")," type. It isn't very interesting on its own - it's simply sort of a wrapper for everything else."),Object(r.b)("pre",null,Object(r.b)("code",Object(a.a)({parentName:"pre"},{className:"language-tsx"}),'import { Machine } from "fini";\n\ntype LoginMachine = Machine;\n')),Object(r.b)("p",null,"Not very exciting. Let's add a state by using the ",Object(r.b)("inlineCode",{parentName:"p"},"State")," helper type. We'll start simple by only adding the ",Object(r.b)("inlineCode",{parentName:"p"},"input")," state - the state where we await the user's credentials."),Object(r.b)("pre",null,Object(r.b)("code",Object(a.a)({parentName:"pre"},{className:"language-tsx"}),'import { Machine, State } from "fini";\n\ntype LoginMachine = Machine<{\n  // highlight-next-line\n  input: State;\n}>;\n')),Object(r.b)("p",null,"As you can see, ",Object(r.b)("inlineCode",{parentName:"p"},"Machine")," accepts a type argument: an object type where we can define our states."),Object(r.b)("p",null,"The ",Object(r.b)("inlineCode",{parentName:"p"},"State")," type also accepts a type argument like this, but instead it's a map for the events it should handle. Let's add one!"),Object(r.b)("pre",null,Object(r.b)("code",Object(a.a)({parentName:"pre"},{className:"language-tsx"}),'import { Machine, State } from "fini";\n\ntype LoginMachine = Machine<{\n  input: State<{\n    // highlight-next-line\n    changeEmail: string;\n  }>;\n}>;\n')),Object(r.b)("p",null,"Each event name is mapped to a corresponding ",Object(r.b)("em",{parentName:"p"},"payload type"),". This refers to the data that we might want to pass along with the event. In our case, we're sending an email address, which is a ",Object(r.b)("inlineCode",{parentName:"p"},"string"),", and ",Object(r.b)("inlineCode",{parentName:"p"},"changeEmail")," is typed accordingly."),Object(r.b)("div",{className:"admonition admonition-info alert alert--info"},Object(r.b)("div",Object(a.a)({parentName:"div"},{className:"admonition-heading"}),Object(r.b)("h5",{parentName:"div"},Object(r.b)("span",Object(a.a)({parentName:"h5"},{className:"admonition-icon"}),Object(r.b)("svg",Object(a.a)({parentName:"span"},{xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"}),Object(r.b)("path",Object(a.a)({parentName:"svg"},{fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"})))),"info")),Object(r.b)("div",Object(a.a)({parentName:"div"},{className:"admonition-content"}),Object(r.b)("p",{parentName:"div"},"If you're coming from Redux, this is the same as the concept of payloads in action objects (because behind the scenes, this ",Object(r.b)("em",{parentName:"p"},"is")," an action object - Fini just calls them events instead)."))),Object(r.b)("p",null,"Anyways, we'll need an event to handle password input as well."),Object(r.b)("pre",null,Object(r.b)("code",Object(a.a)({parentName:"pre"},{className:"language-tsx"}),"type LoginMachine = Machine<{\n  input: State<{\n    changeEmail: string;\n    // highlight-next-line\n    changePassword: string;\n  }>;\n}>;\n")),Object(r.b)("p",null,"There's no point to handling all these changes if we can't actually ",Object(r.b)("em",{parentName:"p"},"save")," the data. That is, we'll need to actually specify that our ",Object(r.b)("inlineCode",{parentName:"p"},"LoginMachine")," operates with a ",Object(r.b)("em",{parentName:"p"},"context"),", where we'll keep the password and email."),Object(r.b)("p",null,"We can define such a context in two ways:"),Object(r.b)("p",null,Object(r.b)("strong",{parentName:"p"},"1. For the specific state(s) where the data are available")),Object(r.b)("pre",null,Object(r.b)("code",Object(a.a)({parentName:"pre"},{className:"language-tsx"}),"type LoginMachine = Machine<{\n  input: State<\n    {\n      changeEmail: string;\n      changePassword: string;\n    },\n    // highlight-start\n    // Defined inside the `State`\n    { email: string; password: string }\n    // highlight-end\n  >;\n}>;\n")),Object(r.b)("p",null,Object(r.b)("strong",{parentName:"p"},'2. "Globally" for the entire machine')),Object(r.b)("pre",null,Object(r.b)("code",Object(a.a)({parentName:"pre"},{className:"language-tsx"}),"type LoginMachine = Machine<\n  {\n    input: State<{\n      changeEmail: string;\n      changePassword: string;\n    }>;\n  },\n  // highlight-start\n  // Defined inside the `Machine`\n  { email: string; password: string }\n  // highlight-end\n>;\n")),Object(r.b)("p",null,"If the same properties are defined both globally and for a state, Fini will prefer the state-specific context, ",Object(r.b)("em",{parentName:"p"},"if")," the machine is currently in that state."),Object(r.b)("p",null,"In our case, we'll use email and password throughout most of the state, so we'll just define it for the entire machine (the second method)."),Object(r.b)("p",null,"To put everything we have covered so far into context, let's begin implementing the machine."))}l.isMDXComponent=!0},76:function(e,t,n){"use strict";n.d(t,"a",(function(){return h})),n.d(t,"b",(function(){return d}));var a=n(0),i=n.n(a);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function c(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?c(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):c(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function o(e,t){if(null==e)return{};var n,a,i=function(e,t){if(null==e)return{};var n,a,i={},r=Object.keys(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var p=i.a.createContext({}),l=function(e){var t=i.a.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},h=function(e){var t=l(e.components);return i.a.createElement(p.Provider,{value:t},e.children)},b={inlineCode:"code",wrapper:function(e){var t=e.children;return i.a.createElement(i.a.Fragment,{},t)}},m=i.a.forwardRef((function(e,t){var n=e.components,a=e.mdxType,r=e.originalType,c=e.parentName,p=o(e,["components","mdxType","originalType","parentName"]),h=l(n),m=a,d=h["".concat(c,".").concat(m)]||h[m]||b[m]||r;return n?i.a.createElement(d,s(s({ref:t},p),{},{components:n})):i.a.createElement(d,s({ref:t},p))}));function d(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var r=n.length,c=new Array(r);c[0]=m;var s={};for(var o in t)hasOwnProperty.call(t,o)&&(s[o]=t[o]);s.originalType=e,s.mdxType="string"==typeof e?e:a,c[1]=s;for(var p=2;p<r;p++)c[p]=n[p];return i.a.createElement.apply(null,c)}return i.a.createElement.apply(null,n)}m.displayName="MDXCreateElement"}}]);