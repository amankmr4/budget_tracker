const staticFilesToPreCache = [
    "/",
    "/index.html",
    "/styles.css",
    "/index.js",
    "/manifest.webmanifest",
    "/db.js",
]

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";


// install
self.addEventListener("install", function (evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Your files were pre-cached successfully!");
            return cache.addAll(staticFilesToPreCache);
        })
    );

    self.skipWaiting();
});

// activate
self.addEventListener("activate", function (evt) {
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

// fetch
self.addEventListener("fetch", function (evt) {
    const { url } = evt.request;
    if (url.includes("/api")) {
        evt.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(evt.request)
                    .then(response => {

                        if (response.status === 200) {
                            cache.put(evt.request, response.clone());
                        }

                        return response;
                    })
                    .catch(err => {

                        return cache.match(evt.request);
                    });
            }).catch(err => console.log(err))
        );
    } else {

        evt.respondWith(

            caches.match(evt.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return caches
                    .open(DATA_CACHE_NAME)
                    .then(cache =>
                        fetch(evt.request).then(response =>
                            cache.put(evt.request, response.clone()).then(() => response)
                        )
                    );
            })

        );
    }
});