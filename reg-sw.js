var activeWorker = 0;
const enableServiceWorker = true; // Toggle: false for local dev, true for production/test
if ('serviceWorker' in navigator && enableServiceWorker) {
    const version = '2025.03.12.10'; // Update to latest
    navigator.serviceWorker.register(`/sw.js?v=${version}`)
        .then(reg => {
            console.log('Registration succeeded. Scope is ' + reg.scope);
            activeWorker = reg.active;
            console.log('Service Worker Ready for VUE', activeWorker);
            reg.update().then(() => {
                console.log('Service worker updated');
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