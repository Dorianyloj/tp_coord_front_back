'use client';

import { useState, useEffect } from 'react';
import { graphqlFetch, graphqlSubscribe } from '@/lib/graphql';
import type { GetCompaniesQuery } from '@/generated/graphql';

const GET_COMPANIES = `
  query GetCompanies {
    company {
      id
      name
      created_at
      updated_at
    }
  }
`;

const COMPANIES_SUBSCRIPTION = `
  subscription CompaniesSubscription {
    company {
      id
      name
      created_at
      updated_at
    }
  }
`;

export default function CompanyList() {
  const [data, setData] = useState<GetCompaniesQuery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtime, setRealtime] = useState(false);

  // Fetch initial (HTTP)
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await graphqlFetch<GetCompaniesQuery>(GET_COMPANIES);
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
      fetchCompanies();
    }
  }, [realtime]);

  // Mode WebSocket
  useEffect(() => {
    if (!realtime) return;

    setLoading(true);
    setError(null);

    const unsubscribe = graphqlSubscribe<GetCompaniesQuery>(
      COMPANIES_SUBSCRIPTION,
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

  if (loading) return <div className="p-4">Loading companies...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Companies (GraphQL)</h2>
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
              onClick={fetchCompanies}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-black"
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

      <ul className="space-y-2">
        {data?.company.map((company) => (
          <li key={company.id} className="p-2 border rounded hover:bg-gray-50">
            <span className="font-medium">{company.name}</span>
            <span className="text-xs text-black ml-2">
              {company.created_at
                ? `(${new Date(company.created_at).toLocaleDateString()})`
                : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
