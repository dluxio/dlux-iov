var activeWorker = 0
if ('serviceWorker' in navigator) {
    const version = '2025.03.12.3'
    navigator.serviceWorker.register(`/sw.js?v=${version}`)
        .then(reg => {
            console.log('Registration succeeded. Scope is ' + reg.scope);
            activeWorker = reg.active;
            console.log('Service Worker Ready for VUE', activeWorker)
            reg.update().then(() => {
                console.log('Service worker updated');
            });
        })
        .catch(error => {
            console.log('Registration failed with ' + error);
        });
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
            console.log('New version available, reloading...');
            window.location.reload(); // Reload the page to get the latest content
        }
    });
}