import { defineSchema } from "convex/server";

import { tables } from "./generatedSchema";

const schema = defineSchema({
  ...tables,
  // Spread the generated schema and add a custom index
  walletAddress: tables.walletAddress.index("address_chainId", [
    "address",
    "chainId",
  ]),
});
export default schema;
