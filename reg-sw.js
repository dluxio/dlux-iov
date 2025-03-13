var activeWorker = null;
const enableServiceWorker = true; // Keep true for testing

if ('serviceWorker' in navigator && enableServiceWorker) {
    const version = '2025.03.12.27'; // Increment for new versions
    console.log('Registering service worker with version:', version);

    // Clean up old registrations and register new worker sequentially
    navigator.serviceWorker.getRegistrations()
        .then(regs => {
            const unregistrations = regs.map(reg => {
                if (reg.active && reg.active.scriptURL.includes('sw.js') && !reg.active.scriptURL.includes(version)) {
                    console.log('Unregistering old worker:', reg.active.scriptURL);
                    return reg.unregister();
                }
                return Promise.resolve();
            });
            return Promise.all(unregistrations);
        })
        .then(() => {
            console.log('All old workers unregistered, registering new worker...');
            return navigator.serviceWorker.register(`/sw.js?v=${version}`, { scope: '/' });
        })
        .then(reg => {
            console.log('Registration succeeded. Scope is ' + reg.scope);
            activeWorker = reg.active;
            console.log('Active worker:', activeWorker ? activeWorker.state : 'None');

            // Immediate update check
            reg.update()
                .then(() => console.log('Update check completed'))
                .catch(err => console.error('Update failed:', err));

            // Handle waiting or installing workers
            if (reg.waiting) {
                console.log('Found waiting worker, sending SKIP_WAITING');
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } else if (reg.installing) {
                console.log('Found installing worker, state:', reg.installing.state);
                reg.installing.addEventListener('statechange', () => {
                    if (reg.installing.state === 'installed') {
                        console.log('Installing worker installed, sending SKIP_WAITING');
                        reg.installing.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            } else {
                console.log('No installing or waiting worker found');
            }

            // Listen for updates
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                console.log('Update found. New worker state:', newWorker ? newWorker.state : 'null');
                newWorker?.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed') {
                        console.log('New worker installed, sending SKIP_WAITING');
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
                } else {
                    console.log('No waiting worker found for manual trigger');
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

    // Periodic update check (every 5 minutes for production)
    setInterval(() => {
        navigator.serviceWorker.getRegistration()
            .then(reg => {
                reg.update();
                console.log('Periodic update check');
            })
            .catch(err => console.error('Periodic update failed:', err));
    }, 5 * 60 * 1000); // 5 minutes
} else {
    console.log('Service worker disabled');
}