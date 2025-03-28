if (window.location.hostname.includes('dlux') && 'serviceWorker' in navigator) {
    const version = '2025.03.28.22';
    console.log('Registering service worker with version:', version);

    navigator.serviceWorker.getRegistration('/')
        .then(reg => {
            if (reg) {
                console.log('Found existing registration:', reg.active?.scriptURL);
                return reg.unregister().then(() => {
                    console.log('Unregistered existing service worker');
                    return new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                });
            } else {
                console.log('No existing registration found');
                return Promise.resolve();
            }
        })
        .then(() => {
            console.log('Registering new service worker...');
            return navigator.serviceWorker.register(`/sw.js?v=${version}`, { scope: '/' });
        })
        .then(reg => {
            console.log('Service worker registered successfully. Scope:', reg.scope);
        })
        .catch(error => {
            console.error('Service worker registration failed:', error);
        });
} else {
    console.log('Service workers not supported.');
}