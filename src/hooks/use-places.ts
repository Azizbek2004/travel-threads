"use client";

import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";

export const usePlaces = () => {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced function to fetch place suggestions
  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // In a real app, this would be a server-side API call to avoid CORS issues
        // For this demo, we'll simulate some suggestions
        const mockSuggestions = [
          `${query} City`,
          `${query} Region`,
          `${query} Country`,
          `${query} Province`,
          `${query} State`,
        ];

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        setSuggestions(mockSuggestions);
      } catch (error) {
        console.error("Error fetching place suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (input.trim()) {
      fetchSuggestions(input);
    } else {
      setSuggestions([]);
    }
  }, [input, fetchSuggestions]);

  return {
    input,
    setInput,
    suggestions,
    loading,
    clearSuggestions: () => setSuggestions([]),
  };
};
