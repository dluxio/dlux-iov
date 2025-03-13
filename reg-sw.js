if ('serviceWorker' in navigator) {
    const version = '2025.03.12.28'; // Update this with each new version
    console.log('Registering service worker with version:', version);

    // Utility function for delay
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Step 1: Clean up all existing registrations
    navigator.serviceWorker.getRegistrations()
        .then(registrations => {
            const unregistrations = registrations.map(reg => {
                console.log('Found registration:', reg.active?.scriptURL || 'No active worker');
                return reg.unregister().then(() => {
                    console.log('Unregistered:', reg.active?.scriptURL || 'Unknown');
                });
            });
            return Promise.all(unregistrations);
        })
        .then(() => {
            console.log('All old registrations cleared. Waiting 1 second...');
            return delay(1000); // Wait to ensure unregistration completes
        })
        .then(() => {
            // Step 2: Register the new service worker
            console.log('Registering new service worker...');
            return navigator.serviceWorker.register(`/sw.js?v=${version}`, { scope: '/' });
        })
        .then(reg => {
            console.log('Service worker registered successfully. Scope:', reg.scope);

            // Handle installing/waiting workers
            if (reg.installing) {
                console.log('Installing worker detected, state:', reg.installing.state);
                reg.installing.addEventListener('statechange', () => {
                    if (reg.installing.state === 'installed') {
                        console.log('Worker installed, sending SKIP_WAITING');
                        reg.installing.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            } else if (reg.waiting) {
                console.log('Waiting worker detected, sending SKIP_WAITING');
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            // Listen for controller changes
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('Controller changed, reloading page...');
                window.location.reload();
            });
        })
        .catch(error => {
            console.error('Service worker registration failed:', error);
        });
} else {
    console.log('Service workers not supported in this browser.');
}