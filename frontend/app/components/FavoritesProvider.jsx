"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { normalizeProduct } from "../lib/productApi";
import { useAuth } from "./AuthProvider";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user, isReady, request } = useAuth();
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [pendingProductIds, setPendingProductIds] = useState(() => new Set());
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);

  const loadFavorites = useCallback(async (signal) => {
    setIsLoadingFavorites(true);

    try {
      const response = await request("/favorites", { signal });
      const normalizedFavorites = (response.favorites || []).map(normalizeProduct);
      setFavoriteProducts(normalizedFavorites);
      setErrorMessage("");
    } finally {
      if (!signal?.aborted) setIsLoadingFavorites(false);
    }
  }, [request]);

  useEffect(() => {
    if (!isReady) return undefined;

    if (!user) {
      setFavoriteProducts([]);
      setErrorMessage("");
      setIsLoadingFavorites(false);
      return undefined;
    }

    const controller = new AbortController();

    loadFavorites(controller.signal).catch((error) => {
      if (error.name !== "AbortError") {
        setErrorMessage(error.message || "تعذر تحميل قائمة الأمنيات.");
      }
    });

    return () => controller.abort();
  }, [isReady, user, loadFavorites]);

  const toggleFavorite = useCallback(async (product) => {
    if (!user) return false;

    const productId = String(product.id || product._id);
    const isAlreadyFavorite = favoriteProducts.some((favorite) => favorite.id === productId);
    const method = isAlreadyFavorite ? "DELETE" : "POST";

    setPendingProductIds((currentIds) => new Set(currentIds).add(productId));
    setErrorMessage("");

    try {
      const response = await request(`/favorites/${productId}`, { method });
      setFavoriteProducts((response.favorites || []).map(normalizeProduct));
      return true;
    } catch (error) {
      setErrorMessage(error.message || "تعذر تحديث قائمة الأمنيات.");
      return false;
    } finally {
      setPendingProductIds((currentIds) => {
        const updatedIds = new Set(currentIds);
        updatedIds.delete(productId);
        return updatedIds;
      });
    }
  }, [favoriteProducts, request, user]);

  const favoriteIds = useMemo(
    () => new Set(favoriteProducts.map((product) => product.id)),
    [favoriteProducts],
  );

  const contextValue = useMemo(() => ({
    favoriteProducts,
    favoriteIds,
    pendingProductIds,
    errorMessage,
    isLoading: !isReady || isLoadingFavorites,
    toggleFavorite,
    loadFavorites,
  }), [
    favoriteProducts,
    favoriteIds,
    pendingProductIds,
    errorMessage,
    isReady,
    isLoadingFavorites,
    user,
    toggleFavorite,
    loadFavorites,
  ]);

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }

  return context;
}
