import { serverApiClient } from "./server-client";

import { createApi } from "./index";

export const serverApi = createApi(serverApiClient);
