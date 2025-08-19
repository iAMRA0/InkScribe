import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface UsePrefetchProps {
  enabled?: boolean;
}

export function usePrefetch({ enabled = true }: UsePrefetchProps = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    // Prefetch statistics on app load
    queryClient.prefetchQuery({
      queryKey: ["/api/statistics"],
      staleTime: 10 * 60 * 1000, // 10 minutes
    });

    // Prefetch common medicine searches
    const commonSearches = ["paracetamol", "aspirin", "ibuprofen", "amoxicillin"];
    
    commonSearches.forEach((search) => {
      setTimeout(() => {
        queryClient.prefetchQuery({
          queryKey: ["search", search],
          queryFn: async () => {
            const response = await fetch(`/api/medicines/search?q=${encodeURIComponent(search)}`);
            const data = await response.json();
            return data.medicines || [];
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      }, Math.random() * 2000); // Stagger requests
    });
  }, [queryClient, enabled]);

  return {
    prefetchSearch: (query: string) => {
      queryClient.prefetchQuery({
        queryKey: ["search", query],
        queryFn: async () => {
          const response = await fetch(`/api/medicines/search?q=${encodeURIComponent(query)}`);
          const data = await response.json();
          return data.medicines || [];
        },
        staleTime: 2 * 60 * 1000,
      });
    },
  };
}