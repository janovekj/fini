(window.webpackJsonp=window.webpackJsonp||[]).push([[4],{53:function(n,e,t){"use strict";t.r(e),t.d(e,"frontMatter",(function(){return a})),t.d(e,"metadata",(function(){return s})),t.d(e,"rightToc",(function(){return c})),t.d(e,"default",(function(){return p}));var r=t(2),i=t(6),o=(t(0),t(76)),a={title:"Finished result"},s={unversionedId:"step-by-step/finished-result",id:"step-by-step/finished-result",isDocsHomePage:!1,title:"Finished result",description:"Finally, the component in its entirety (CodeSandbox):",source:"@site/docs/step-by-step/finished-result.md",slug:"/step-by-step/finished-result",permalink:"/step-by-step/finished-result",editUrl:"https://github.com/janovekj/fini/edit/gh-pages/website/docs/step-by-step/finished-result.md",version:"current",sidebar:"docs",previous:{title:"States and side-effects",permalink:"/step-by-step/states-and-side-effects"}},c=[],u={rightToc:c};function p(n){var e=n.components,t=Object(i.a)(n,["components"]);return Object(o.b)("wrapper",Object(r.a)({},u,t,{components:e,mdxType:"MDXLayout"}),Object(o.b)("p",null,"Finally, the component in its entirety (",Object(o.b)("a",Object(r.a)({parentName:"p"},{href:"https://codesandbox.io/s/fini-loginmachine-4ut16"}),"CodeSandbox"),"):"),Object(o.b)("pre",null,Object(o.b)("code",Object(r.a)({parentName:"pre"},{className:"language-tsx"}),'import { Machine, State, useMachine } from "fini";\n\ntype User = {\n  id: string;\n  name: string;\n};\n\ntype LoginMachine = Machine<\n  {\n    input: State<{\n      changeEmail: string;\n      changePassword: string;\n      submit: never;\n    }>;\n    submitting: State<{\n      success: User;\n    }>;\n    loggedIn: State<\n      {\n        logOut: never;\n      },\n      { user: User }\n    >;\n  },\n  { email: string; password: string }\n>;\n\nconst LoginComponent = () => {\n  const loginMachine = useMachine<LoginMachine>(\n    {\n      input: {\n        changeEmail: ({ context }, email) => ({\n          ...context,\n          email,\n        }),\n        changePassword: ({ context }, password) => ({\n          ...context,\n          password,\n        }),\n        submit: ({ context, exec }) => {\n          exec(() => {\n            fetch("/api/login", {\n              method: "POST",\n              body: JSON.stringify(context),\n            })\n              .then((res) => res.json())\n              .then((user: User) => dispatch.success(user));\n          });\n          return "submitting";\n        },\n      },\n      submitting: {\n        success: ({ context }, user) => ({\n          state: "loggedIn",\n          context: {\n            ...context,\n            user,\n          },\n        }),\n      },\n      loggedIn: {\n        logOut: {\n          state: "input",\n          context: {\n            email: "",\n            password: "",\n          },\n        },\n      },\n    },\n    {\n      state: "input",\n      context: {\n        email: "",\n        password: "",\n      },\n    }\n  );\n\n  return (\n    <div>\n      {loginMachine.input && (\n        <div>\n          <input\n            value={loginMachine.context.email}\n            onChange={(event) => loginMachine.changeEmail(event.target.value)}\n          />\n          <input\n            value={loginMachine.context.password}\n            onChange={(event) =>\n              loginMachine.changePassword(event.target.value)\n            }\n          />\n          <button onClick={loginMachine.submit}>Submit</button>\n        </div>\n      )}\n      {loginMachine.current === "submitting" && <p>Loading user...</p>}\n      {loginMachine.loggedIn && (\n        <div>\n          <p>Welcome, {loginMachine.context.user.name}!</p>\n          <button onClick={loginMachine.logOut}>Log out</button>\n        </div>\n      )}\n    </div>\n  );\n};\n')))}p.isMDXComponent=!0},76:function(n,e,t){"use strict";t.d(e,"a",(function(){return l})),t.d(e,"b",(function(){return b}));var r=t(0),i=t.n(r);function o(n,e,t){return e in n?Object.defineProperty(n,e,{value:t,enumerable:!0,configurable:!0,writable:!0}):n[e]=t,n}function a(n,e){var t=Object.keys(n);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(n);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(n,e).enumerable}))),t.push.apply(t,r)}return t}function s(n){for(var e=1;e<arguments.length;e++){var t=null!=arguments[e]?arguments[e]:{};e%2?a(Object(t),!0).forEach((function(e){o(n,e,t[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(n,Object.getOwnPropertyDescriptors(t)):a(Object(t)).forEach((function(e){Object.defineProperty(n,e,Object.getOwnPropertyDescriptor(t,e))}))}return n}function c(n,e){if(null==n)return{};var t,r,i=function(n,e){if(null==n)return{};var t,r,i={},o=Object.keys(n);for(r=0;r<o.length;r++)t=o[r],e.indexOf(t)>=0||(i[t]=n[t]);return i}(n,e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(n);for(r=0;r<o.length;r++)t=o[r],e.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(n,t)&&(i[t]=n[t])}return i}var u=i.a.createContext({}),p=function(n){var e=i.a.useContext(u),t=e;return n&&(t="function"==typeof n?n(e):s(s({},e),n)),t},l=function(n){var e=p(n.components);return i.a.createElement(u.Provider,{value:e},n.children)},d={inlineCode:"code",wrapper:function(n){var e=n.children;return i.a.createElement(i.a.Fragment,{},e)}},g=i.a.forwardRef((function(n,e){var t=n.components,r=n.mdxType,o=n.originalType,a=n.parentName,u=c(n,["components","mdxType","originalType","parentName"]),l=p(t),g=r,b=l["".concat(a,".").concat(g)]||l[g]||d[g]||o;return t?i.a.createElement(b,s(s({ref:e},u),{},{components:t})):i.a.createElement(b,s({ref:e},u))}));function b(n,e){var t=arguments,r=e&&e.mdxType;if("string"==typeof n||r){var o=t.length,a=new Array(o);a[0]=g;var s={};for(var c in e)hasOwnProperty.call(e,c)&&(s[c]=e[c]);s.originalType=n,s.mdxType="string"==typeof n?n:r,a[1]=s;for(var u=2;u<o;u++)a[u]=t[u];return i.a.createElement.apply(null,a)}return i.a.createElement.apply(null,t)}g.displayName="MDXCreateElement"}}]);