import { createClient, Client } from 'graphql-ws';

const HASURA_URL = process.env.NEXT_PUBLIC_HASURA_URL || 'http://localhost:8080/v1/graphql';
const HASURA_WS_URL = HASURA_URL.replace('http', 'ws');
const HASURA_ADMIN_SECRET = process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET || 'hasura_admin_secret';

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

// Helper pour les queries/mutations HTTP
export async function graphqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['x-hasura-admin-secret'] = HASURA_ADMIN_SECRET;
  }

  const response = await fetch(HASURA_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const result: GraphQLResponse<T> = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  if (!result.data) {
    throw new Error('No data returned');
  }

  return result.data;
}

// Client WebSocket singleton
let wsClient: Client | null = null;

function getWsClient(): Client {
  if (!wsClient) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    wsClient = createClient({
      url: HASURA_WS_URL,
      connectionParams: () => {
        if (token) {
          return { headers: { Authorization: `Bearer ${token}` } };
        }
        return { headers: { 'x-hasura-admin-secret': HASURA_ADMIN_SECRET } };
      },
    });
  }
  return wsClient;
}

// Helper pour les subscriptions WebSocket
export function graphqlSubscribe<T>(
  query: string,
  variables: Record<string, unknown> | undefined,
  onData: (data: T) => void,
  onError?: (error: Error) => void
): () => void {
  const client = getWsClient();

  const unsubscribe = client.subscribe<T>(
    { query, variables },
    {
      next: (result) => {
        if (result.data) {
          onData(result.data);
        }
        if (result.errors) {
          onError?.(new Error(result.errors[0].message));
        }
      },
      error: (err) => {
        onError?.(err instanceof Error ? err : new Error(String(err)));
      },
      complete: () => {},
    }
  );

  return unsubscribe;
}
