var activeWorker = 0;
const enableServiceWorker = true; // Toggle: false for local dev, true for production/test
if ('serviceWorker' in navigator && enableServiceWorker) {
    const version = '2025.03.12.12'; // Update to latest
    navigator.serviceWorker.register(`/sw.js?v=${version}`)
        .then(reg => {
            console.log('Registration succeeded. Scope is ' + reg.scope);
            activeWorker = reg.active;
            console.log('Service Worker Ready for VUE', activeWorker);

            // Check for updates immediately
            reg.update().then(() => {
                console.log('Service worker updated');
            });

            // If there's a waiting worker, skip waiting
            if (reg.waiting) {
                console.log('New service worker waiting, forcing activation');
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            // Listen for updates
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                console.log('New service worker found');
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('New service worker installed, forcing activation');
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            });
        })
        .catch(error => {
            console.error('Registration failed with ' + error);
        });

    let hasChanged = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hasChanged) {
            hasChanged = true;
            console.log('New service worker activated');
            window.location.reload();
        }
    });
} else {
    console.log('Service worker disabled');
}