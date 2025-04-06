// Service Worker for Memory Mirror
const CACHE_NAME = 'memory-mirror-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/generated-icon.png',
  // Add paths to critical CSS and JS files
  // These will be determined by your build system
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache first, fall back to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Skip API requests - don't cache them
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response from cache
        if (response) {
          return response;
        }
        
        // Clone the request - request can only be used once
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response - response can only be used once
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                // Store response in cache for future use
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // If fetch fails, serve the offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            
            // Return nothing for other assets - the browser will show its own
            // offline indicator for now
            return;
          });
      })
  );
});

// Background sync for offline capabilities
self.addEventListener('sync', event => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Handle messages from the client
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Function to sync messages when back online
async function syncMessages() {
  // Implementation depends on application requirements
  // Typically involves:
  // 1. Getting pending messages from local storage or IndexedDB
  // 2. Sending them to the server
  // 3. Clearing the local cache once sent
  
  // For simple implementation:
  const pendingMessages = localStorage.getItem('pendingMessages');
  
  if (pendingMessages) {
    try {
      const messages = JSON.parse(pendingMessages);
      
      // Send each message to the server
      await Promise.all(messages.map(async message => {
        const response = await fetch('/api/chat-messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        });
        
        return response.ok;
      }));
      
      // Clear the pending messages
      localStorage.removeItem('pendingMessages');
    } catch (error) {
      console.error('Sync failed:', error);
      // Leave messages in local storage to try again later
    }
  }
}