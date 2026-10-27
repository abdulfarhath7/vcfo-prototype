import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: ["reference/**", ".next/**", "node_modules/**"] },
  {
    rules: {
      // The prototype syncs browser-only state (theme, client state, URL tab, pathname) after hydration.
      // That is a setState in an effect by design; the rule is off for this project.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
