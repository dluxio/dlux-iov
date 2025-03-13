var activeWorker = 0;
const enableServiceWorker = true;
if ('serviceWorker' in navigator && enableServiceWorker) {
    const version = '2025.03.12.31'; // Increment for testing
    console.log('Registering service worker with version:', version);

    // Clean up old registrations
    navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => {
            if (reg.active && reg.active.scriptURL.includes('sw.js') && !reg.active.scriptURL.includes(version)) {
                console.log('Unregistering old worker:', reg.active.scriptURL);
                reg.unregister();
            }
        });
    }).then(() => {
        return navigator.serviceWorker.register(`/sw.js?v=${version}`, { scope: '/' });
    }).then(reg => {
        console.log('Registration succeeded. Scope is ' + reg.scope);
        activeWorker = reg.active;
        console.log('Active worker:', activeWorker ? activeWorker.state : 'None');
        console.log('Current controller:', navigator.serviceWorker.controller ? navigator.serviceWorker.controller.scriptURL : 'None');

        reg.update().then(() => {
            console.log('Update check completed');
        }).catch(err => console.error('Update failed:', err));

        if (reg.waiting) {
            console.log('Found waiting worker, state:', reg.waiting.state);
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        if (reg.installing) {
            console.log('Found installing worker, state:', reg.installing.state);
            reg.installing.addEventListener('statechange', () => {
                console.log('Installing worker state:', reg.installing.state);
                if (reg.installing.state === 'installed') {
                    console.log('Sending SKIP_WAITING to installing worker');
                    reg.installing.postMessage({ type: 'SKIP_WAITING' });
                }
            });
        } else {
            console.log('No installing worker found');
        }

        reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            console.log('Update found. New worker:', newWorker ? newWorker.state : 'null');
            if (newWorker) {
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
            }
        });

        window.forceSWUpdate = () => {
            if (reg.waiting) {
                console.log('Manual trigger: Forcing waiting worker to activate');
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } else {
                console.log('No waiting worker found for manual trigger');
            }
        };
    }).catch(error => {
        console.error('Registration failed:', error);
    });

    let hasChanged = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hasChanged) {
            hasChanged = true;
            console.log('Controller changed to:', navigator.serviceWorker.controller?.scriptURL);
            console.log('Reloading page...');
            window.location.reload();
        }
    });

    setInterval(() => {
        navigator.serviceWorker.getRegistration().then(reg => {
            reg.update();
            console.log('Periodic update check');
        }).catch(err => console.error('Periodic update failed:', err));
    }, 30 * 1000);
} else {
    console.log('Service worker disabled');
}