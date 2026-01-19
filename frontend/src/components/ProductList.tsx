'use client';

import { useState, useEffect } from 'react';
import { graphqlFetch, graphqlSubscribe } from '@/lib/graphql';
import type { GetProductsQuery } from '@/generated/graphql';

const GET_PRODUCTS = `
  query GetProducts {
    product {
      id
      name
      comment
      quantity
      company_id
      company {
        id
        name
      }
    }
  }
`;

const PRODUCTS_SUBSCRIPTION = `
  subscription ProductsSubscription {
    product {
      id
      name
      comment
      quantity
      company_id
      company {
        id
        name
      }
    }
  }
`;

export default function ProductList() {
  const [data, setData] = useState<GetProductsQuery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtime, setRealtime] = useState(false);

  // Fetch initial (HTTP)
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await graphqlFetch<GetProductsQuery>(GET_PRODUCTS);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Mode HTTP
  useEffect(() => {
    if (!realtime) {
      fetchProducts();
    }
  }, [realtime]);

  // Mode WebSocket
  useEffect(() => {
    if (!realtime) return;

    setLoading(true);
    setError(null);

    const unsubscribe = graphqlSubscribe<GetProductsQuery>(
      PRODUCTS_SUBSCRIPTION,
      undefined,
      (result) => {
        setData(result);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [realtime]);

  if (loading) return <div className="p-4">Loading products...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Products (GraphQL)</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={realtime}
              onChange={(e) => setRealtime(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Temps réel (WebSocket)</span>
          </label>
          {!realtime && (
            <button
              onClick={fetchProducts}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {realtime && (
        <div className="mb-4 px-3 py-2 bg-green-100 text-black rounded text-sm">
          Mode temps réel actif - Les modifications apparaissent automatiquement
        </div>
      )}

      {data?.product.length === 0 ? (
        <p className="text-black">No products found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b-2">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Company</th>
                <th className="px-4 py-2">Comment</th>
              </tr>
            </thead>
            <tbody>
              {data?.product.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{product.name}</td>
                  <td className="px-4 py-2">{product.quantity}</td>
                  <td className="px-4 py-2">{product.company.name}</td>
                  <td className="px-4 py-2 truncate max-w-xs">{product.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
