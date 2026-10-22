import { QueryClient } from "@tanstack/react-query";
import {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import { get, set, del } from "idb-keyval";

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;
const FIVE_MINUTES_MS = 1000 * 60 * 5;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: THIRTY_DAYS_MS,
      staleTime: FIVE_MINUTES_MS,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const idbPersister: Persister = {
  persistClient: async (persistedClient: PersistedClient): Promise<void> => {
    await set("hysanjunior_react_query_cache", persistedClient);
  },
  restoreClient: async (): Promise<PersistedClient | undefined> => {
    return await get<PersistedClient>("hysanjunior_react_query_cache");
  },
  removeClient: async (): Promise<void> => {
    await del("hysanjunior_react_query_cache");
  },
};
