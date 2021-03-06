module.exports = {
  title: "Fini",
  tagline: "Small and Capable State Machines for React",
  url: "https://fini.js.org",
  baseUrl: "/",
  onBrokenLinks: "throw",
  favicon: "img/fini_plain_regular.svg",
  organizationName: "janovekj",
  projectName: "fini",
  themeConfig: {
    prism: {
      theme: require("prism-react-renderer/themes/nightOwl"),
    },
    navbar: {
      logo: {
        alt: "Fini logo",
        src: "img/fini_normal.svg",
      },
      items: [
        {
          href: "https://github.com/janovekj/fini",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      copyright: `Copyright © ${new Date().getFullYear()} Jan Ove Kjærland. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl: "https://github.com/janovekj/fini/edit/master/site/",
          routeBasePath: "/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
};
