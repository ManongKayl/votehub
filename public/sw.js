// Service Worker for PWA functionality
const CACHE_NAME = 'votehub-v1.0.0';
const STATIC_CACHE_NAME = 'votehub-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'votehub-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/components.css',
    '/css/responsive.css',
    '/js/config.js',
    '/js/auth.js',
    '/js/api.js',
    '/js/ui.js',
    '/js/polls.js',
    '/js/admin.js',
    '/js/realtime.js',
    '/js/app.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
    /\/api\/polls(\?.*)?$/,
    /\/api\/auth\/me$/
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Error caching static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME &&
                            cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    // For API requests, try to fetch fresh data in background
                    if (isApiRequest(url)) {
                        fetchAndCache(request);
                    }
                    return cachedResponse;
                }
                
                // Fetch from network
                return fetchAndCache(request);
            })
            .catch(() => {
                // Network failed, try to serve offline page for navigation requests
                if (request.destination === 'document') {
                    return caches.match('/index.html');
                }
                
                // For other requests, return a generic offline response
                return new Response('Offline', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/plain' }
                });
            })
    );
});

// Helper function to fetch and cache responses
async function fetchAndCache(request) {
    try {
        const response = await fetch(request);
        
        // Only cache successful responses
        if (response.status === 200) {
            const responseClone = response.clone();
            const url = new URL(request.url);
            
            // Determine which cache to use
            let cacheName = DYNAMIC_CACHE_NAME;
            if (STATIC_FILES.includes(url.pathname) || isStaticAsset(url)) {
                cacheName = STATIC_CACHE_NAME;
            }
            
            // Cache the response
            caches.open(cacheName)
                .then((cache) => {
                    cache.put(request, responseClone);
                })
                .catch((error) => {
                    console.error('Service Worker: Error caching response:', error);
                });
        }
        
        return response;
    } catch (error) {
        console.error('Service Worker: Fetch failed:', error);
        throw error;
    }
}

// Helper function to check if request is for API
function isApiRequest(url) {
    return url.pathname.startsWith('/api/') || 
           API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname + url.search));
}

// Helper function to check if request is for static asset
function isStaticAsset(url) {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf'];
    return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered:', event.tag);
    
    if (event.tag === 'background-vote') {
        event.waitUntil(syncOfflineVotes());
    } else if (event.tag === 'background-poll-create') {
        event.waitUntil(syncOfflinePollCreations());
    }
});

// Sync offline votes when connection is restored
async function syncOfflineVotes() {
    try {
        const offlineVotes = await getOfflineData('votes');
        
        for (const vote of offlineVotes) {
            try {
                const response = await fetch('/api/votes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': vote.authToken
                    },
                    body: JSON.stringify(vote.data)
                });
                
                if (response.ok) {
                    await removeOfflineData('votes', vote.id);
                    console.log('Service Worker: Offline vote synced successfully');
                }
            } catch (error) {
                console.error('Service Worker: Error syncing offline vote:', error);
            }
        }
    } catch (error) {
        console.error('Service Worker: Error in syncOfflineVotes:', error);
    }
}

// Sync offline poll creations when connection is restored
async function syncOfflinePollCreations() {
    try {
        const offlinePolls = await getOfflineData('polls');
        
        for (const poll of offlinePolls) {
            try {
                const response = await fetch('/api/polls', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': poll.authToken
                    },
                    body: JSON.stringify(poll.data)
                });
                
                if (response.ok) {
                    await removeOfflineData('polls', poll.id);
                    console.log('Service Worker: Offline poll creation synced successfully');
                }
            } catch (error) {
                console.error('Service Worker: Error syncing offline poll creation:', error);
            }
        }
    } catch (error) {
        console.error('Service Worker: Error in syncOfflinePollCreations:', error);
    }
}

// Helper functions for offline data management
async function getOfflineData(type) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const response = await cache.match(`/offline-${type}`);
        
        if (response) {
            return await response.json();
        }
        
        return [];
    } catch (error) {
        console.error('Service Worker: Error getting offline data:', error);
        return [];
    }
}

async function removeOfflineData(type, id) {
    try {
        const offlineData = await getOfflineData(type);
        const updatedData = offlineData.filter(item => item.id !== id);
        
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        await cache.put(`/offline-${type}`, new Response(JSON.stringify(updatedData)));
    } catch (error) {
        console.error('Service Worker: Error removing offline data:', error);
    }
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');
    
    let notificationData = {
        title: 'VoteHub',
        body: 'You have a new notification',
        icon: '/images/icon-192x192.png',
        badge: '/images/icon-72x72.png',
        tag: 'votehub-notification',
        requireInteraction: false,
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/images/action-view.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/images/action-dismiss.png'
            }
        ]
    };
    
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = { ...notificationData, ...data };
        } catch (error) {
            console.error('Service Worker: Error parsing push data:', error);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();
    
    const action = event.action;
    const notificationData = event.notification.data || {};
    
    if (action === 'dismiss') {
        return;
    }
    
    // Default action or 'view' action
    let urlToOpen = '/';
    
    if (notificationData.url) {
        urlToOpen = notificationData.url;
    } else if (notificationData.pollId) {
        urlToOpen = `/#polls?poll=${notificationData.pollId}`;
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin)) {
                        client.focus();
                        client.postMessage({
                            type: 'NOTIFICATION_CLICK',
                            url: urlToOpen,
                            data: notificationData
                        });
                        return;
                    }
                }
                
                // Open new window if app is not open
                return clients.openWindow(urlToOpen);
            })
    );
});

// Message handling from main app
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_POLL_DATA':
            cachePollData(data);
            break;
            
        case 'STORE_OFFLINE_VOTE':
            storeOfflineVote(data);
            break;
            
        case 'STORE_OFFLINE_POLL':
            storeOfflinePoll(data);
            break;
            
        default:
            console.log('Service Worker: Unknown message type:', type);
    }
});

// Cache poll data for offline viewing
async function cachePollData(pollData) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const response = new Response(JSON.stringify(pollData));
        await cache.put(`/poll-data/${pollData.id}`, response);
        console.log('Service Worker: Poll data cached for offline viewing');
    } catch (error) {
        console.error('Service Worker: Error caching poll data:', error);
    }
}

// Store offline vote for later sync
async function storeOfflineVote(voteData) {
    try {
        const offlineVotes = await getOfflineData('votes');
        offlineVotes.push({
            id: Date.now().toString(),
            data: voteData.vote,
            authToken: voteData.authToken,
            timestamp: Date.now()
        });
        
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        await cache.put('/offline-votes', new Response(JSON.stringify(offlineVotes)));
        
        // Register for background sync
        if ('sync' in self.registration) {
            await self.registration.sync.register('background-vote');
        }
        
        console.log('Service Worker: Offline vote stored for sync');
    } catch (error) {
        console.error('Service Worker: Error storing offline vote:', error);
    }
}

// Store offline poll creation for later sync
async function storeOfflinePoll(pollData) {
    try {
        const offlinePolls = await getOfflineData('polls');
        offlinePolls.push({
            id: Date.now().toString(),
            data: pollData.poll,
            authToken: pollData.authToken,
            timestamp: Date.now()
        });
        
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        await cache.put('/offline-polls', new Response(JSON.stringify(offlinePolls)));
        
        // Register for background sync
        if ('sync' in self.registration) {
            await self.registration.sync.register('background-poll-create');
        }
        
        console.log('Service Worker: Offline poll creation stored for sync');
    } catch (error) {
        console.error('Service Worker: Error storing offline poll creation:', error);
    }
}
