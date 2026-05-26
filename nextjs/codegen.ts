import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: {
    [process.env.WIKIJS_GRAPHQL_URL ?? "http://localhost:3000/graphql"]: {
      headers: {
        Authorization: `Bearer ${process.env.WIKIJS_SERVICE_TOKEN ?? ""}`,
      },
    },
  },
  documents: ["lib/**/*.ts", "app/**/*.tsx"],
  generates: {
    "./lib/__generated__/": {
      preset: "client",
      presetConfig: {
        gqlTagName: "gql",
      },
    },
  },
};

export default config;
