import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Local storage cache keys
const CACHE_PREFIX = 'memory-mirror-cache-';
const CACHE_TIMESTAMP_PREFIX = 'memory-mirror-cache-timestamp-';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper to check if we're offline
function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

// Helper to handle network errors gracefully
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Cache data to localStorage for offline use
function cacheToLocalStorage(key: string, data: any): void {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(data));
    localStorage.setItem(`${CACHE_TIMESTAMP_PREFIX}${key}`, Date.now().toString());
  } catch (error) {
    console.error('Failed to cache data:', error);
    // If localStorage is full, clear old caches
    clearOldCaches();
  }
}

// Get cached data from localStorage
function getFromLocalStorageCache(key: string): any {
  try {
    const timestamp = localStorage.getItem(`${CACHE_TIMESTAMP_PREFIX}${key}`);
    if (!timestamp || Date.now() - parseInt(timestamp) > CACHE_TTL) {
      return null; // Cache expired or doesn't exist
    }
    
    const data = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to retrieve cached data:', error);
    return null;
  }
}

// Clear old caches when storage is full
function clearOldCaches(): void {
  try {
    // Get all cache keys
    const cacheKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_TIMESTAMP_PREFIX)) {
        const actualKey = key.replace(CACHE_TIMESTAMP_PREFIX, '');
        const timestamp = localStorage.getItem(key);
        cacheKeys.push({ key: actualKey, timestamp: timestamp ? parseInt(timestamp) : 0 });
      }
    }
    
    // Sort by timestamp (oldest first)
    cacheKeys.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove oldest 20% of caches
    const removeCount = Math.max(1, Math.floor(cacheKeys.length * 0.2));
    for (let i = 0; i < removeCount; i++) {
      if (cacheKeys[i]) {
        localStorage.removeItem(`${CACHE_PREFIX}${cacheKeys[i].key}`);
        localStorage.removeItem(`${CACHE_TIMESTAMP_PREFIX}${cacheKeys[i].key}`);
      }
    }
  } catch (error) {
    console.error('Failed to clear old caches:', error);
  }
}

// Enhanced API request with offline support
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  parseJson: boolean = false
): Promise<Response | any> {
  // For GET requests, check cache first when offline
  if (method === 'GET' && isOffline()) {
    const cachedData = getFromLocalStorageCache(url);
    if (cachedData) {
      if (parseJson) {
        return cachedData;
      }
      // Return a mock Response object with cached data
      return new Response(JSON.stringify(cachedData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    
    // Cache successful GET responses
    if (method === 'GET') {
      const clonedRes = res.clone();
      const jsonData = await clonedRes.json();
      cacheToLocalStorage(url, jsonData);
      
      if (parseJson) {
        return jsonData;
      }
      
      // Return a new response since we consumed the original
      return new Response(JSON.stringify(jsonData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // For other methods, parse JSON if requested
    if (parseJson) {
      const jsonData = await res.json();
      return jsonData;
    }
    
    return res;
  } catch (error) {
    // If offline and we have cached data, use it
    if (isOffline()) {
      const cachedData = getFromLocalStorageCache(url);
      if (cachedData) {
        if (parseJson) {
          return cachedData;
        }
        return new Response(JSON.stringify(cachedData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Re-throw if we can't handle it
    throw error;
  }
}

// Enhanced query function with offline support
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    // Check cache first when offline
    if (isOffline()) {
      const cachedData = getFromLocalStorageCache(url);
      if (cachedData) {
        return cachedData;
      }
    }
    
    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      
      // Cache successful responses
      cacheToLocalStorage(url, data);
      return data;
    } catch (error) {
      // Last resort: check cache again
      if (isOffline()) {
        const cachedData = getFromLocalStorageCache(url);
        if (cachedData) {
          return cachedData;
        }
      }
      throw error;
    }
  };

// Configured QueryClient with enhanced offline capabilities
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60 * 60 * 1000, // 1 hour
      gcTime: 24 * 60 * 60 * 1000, // 24 hours (formerly cacheTime in v4)
      retry: isOffline() ? false : 2, // Don't retry if offline
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: false,
    },
  },
});
