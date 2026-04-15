import { createApi } from "./factory";
import { serverApiClient } from "./server-client";

export const serverApi = createApi(serverApiClient);
