import { disconnectDb } from "./helpers/database";

const globalTeardown = async () => {
  await disconnectDb();
};

export default globalTeardown;
