import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

interface UseDebouncedSearchProps {
  searchFn: (query: string) => Promise<any[]>;
  delay?: number;
  minLength?: number;
}

export function useDebouncedSearch({ 
  searchFn, 
  delay = 300, 
  minLength = 2 
}: UseDebouncedSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  // Use React Query for caching and deduplication
  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchFn(debouncedQuery),
    enabled: debouncedQuery.length >= minLength,
    staleTime: 2 * 60 * 1000, // 2 minutes cache for search results
    gcTime: 5 * 60 * 1000, // Keep in memory for 5 minutes
  });

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearQuery = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
  }, []);

  return {
    query,
    debouncedQuery,
    results,
    isLoading: isLoading && debouncedQuery.length >= minLength,
    error,
    updateQuery,
    clearQuery,
  };
}