import { nextJsConfig } from "@repo/eslint-config/next-js";
import { reactQueryConfig } from "@repo/eslint-config/react-query";

export default [...nextJsConfig, ...reactQueryConfig];
