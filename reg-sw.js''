var activeWorker = 0;
const enableServiceWorker = true; // Set to true for testing
if ('serviceWorker' in navigator && enableServiceWorker) {
    const version = '2025.03.12.16'; // Increment for each test
    console.log('Registering service worker with version:', version);
    navigator.serviceWorker.register(`/sw.js?v=${version}`, { scope: '/' })
        .then(reg => {
            console.log('Registration succeeded. Scope is ' + reg.scope);
            activeWorker = reg.active;
            console.log('Active worker:', activeWorker);

            // Immediate update check
            reg.update().then(() => {
                console.log('Update check completed');
            }).catch(err => console.error('Update failed:', err));

            // Handle waiting worker
            if (reg.waiting) {
                console.log('Found waiting worker:', reg.waiting);
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            // Handle installing worker
            if (reg.installing) {
                console.log('Found installing worker:', reg.installing.state);
                reg.installing.addEventListener('statechange', () => {
                    console.log('Installing worker state:', reg.installing.state);
                    if (reg.installing.state === 'installed') {
                        console.log('Sending SKIP_WAITING to installing worker');
                        reg.installing.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            }

            // Listen for updates
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                console.log('Update found. New worker state:', newWorker.state);
                newWorker.addEventListener('statechange', () => {
                    console.log('New worker state:', newWorker.state);
                    if (newWorker.state === 'installed') {
                        console.log('New worker installed, forcing SKIP_WAITING');
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                    if (newWorker.state === 'activated') {
                        console.log('New worker fully activated');
                    }
                });
            });

            // Manual trigger for testing
            window.forceSWUpdate = () => {
                if (reg.waiting) {
                    console.log('Manual trigger: Forcing waiting worker to activate');
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            };
        })
        .catch(error => {
            console.error('Registration failed:', error);
        });

    // Controller change handler
    let hasChanged = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hasChanged) {
            hasChanged = true;
            console.log('Controller changed, reloading page...');
            window.location.reload();
        }
    });

    // Periodic update check (every 30 seconds for testing)
    setInterval(() => {
        navigator.serviceWorker.getRegistration().then(reg => {
            reg.update();
            console.log('Periodic update check');
        });
    }, 30 * 1000);
} else {
    console.log('Service worker disabled');
}