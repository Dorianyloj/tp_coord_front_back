import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: [
    {
      'http://localhost:8080/v1/graphql': {
        headers: {
          'x-hasura-admin-secret': 'hasura_admin_secret',
        },
      },
    },
  ],
  documents: 'src/**/*.graphql',
  generates: {
    'src/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
      ],
      config: {
        skipTypename: false,
        // Pas de hooks, juste les types !
        withHooks: false,
        withComponent: false,
        withHOC: false,
      },
    },
  },
};

export default config;
