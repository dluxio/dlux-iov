var activeWorker = null;
if (window.location.hostname.includes('dlux') && 'serviceWorker' in navigator) {
    const version = '2025.06.21.1'; // Ensure this version matches sw.js
    console.log('Desired service worker version:', version);

    navigator.serviceWorker.getRegistration('/')
        .then(registration => {
            if (registration && registration.active) {
                const activeSWURL = registration.active.scriptURL;
                console.log('Found active service worker:', activeSWURL);
                
                const urlParams = new URLSearchParams(activeSWURL.split('?')[1]);
                const activeVersion = urlParams.get('v');

                if (activeVersion === version) {
                    console.log('Active service worker version matches desired version. No action needed.');
                    activeWorker = registration.active;
                    return null; // Indicate that no further registration steps are needed
                } else {
                    console.log(`Active service worker version (${activeVersion}) does not match desired version (${version}). Unregistering.`);
                    return registration.unregister().then(() => {
                        console.log('Unregistered existing (old active) service worker');
                        return true; // Indicate that registration should proceed
                    });
                }
            } else {
                // No *active* worker.
                if (!registration) {
                    console.log('No service worker registration found at all. Proceeding with new registration.');
                    return true; // Proceed to register.
                } else {
                    // Registration exists, but registration.active is null.
                    console.log('Service worker registration found, but no *active* worker. Checking for waiting/installing workers of the desired version.');

                    if (registration.waiting) {
                        const waitingSWURL = registration.waiting.scriptURL;
                        const urlParams = new URLSearchParams(waitingSWURL.split('?')[1]);
                        const waitingVersion = urlParams.get('v');
                        if (waitingVersion === version) {
                            console.log(`Found a WAITING service worker (version ${version}). Attempting to activate it.`);
                            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                            activeWorker = registration.waiting;
                            return null; // Don't proceed to re-register; let the waiting one activate.
                        } else {
                            console.log(`Found WAITING service worker with old version (${waitingVersion}). Will unregister and register new version.`);
                            // Proceed to unregister this registration and then register new.
                        }
                    } else if (registration.installing) {
                        const installingSWURL = registration.installing.scriptURL;
                        const urlParams = new URLSearchParams(installingSWURL.split('?')[1]);
                        const installingVersion = urlParams.get('v');
                        if (installingVersion === version) {
                            console.log(`Found an INSTALLING service worker (version ${version}). Allowing it to complete.`);
                            activeWorker = registration.installing;
                            return null; // Don't proceed to re-register.
                        } else {
                             console.log(`Found INSTALLING service worker with old version (${installingVersion}). Will proceed to register new version over it.`);
                             // Proceed to unregister this registration and then register new.
                        }
                    } else {
                        console.log('Registration exists but no active, waiting, or installing worker of the desired version. Proceeding with new registration.');
                    }
                    
                    // If we've reached here, it means the existing registration (though not active)
                    // isn't a suitable candidate (e.g., old waiting/installing, or just empty).
                    // So, unregister it before registering the new one.
                    console.log('Unregistering existing (non-active, unsuitable) service worker before new registration.');
                    return registration.unregister().then(() => {
                        console.log('Unregistered existing service worker.');
                        return true; // Proceed to register
                    });
                }
            }
        })
        .then(shouldRegister => {
            if (shouldRegister === null) { // null means no registration needed
                if(activeWorker) console.log('Correct service worker already in place.');
                return;
            }
            if (shouldRegister === true) {
                console.log('Registering new service worker...');
                return navigator.serviceWorker.register(`/sw.js?v=${version}`, { scope: '/' });
            }
        })
        .then(reg => {
            if (reg) { // reg will be undefined if registration was skipped or failed in promise chain
                console.log('Service worker registration attempt completed. Scope:', reg.scope);
                activeWorker = reg.installing || reg.waiting || reg.active; // Update activeWorker reference

                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    console.log('Update found. New worker installing:', newWorker);
                    newWorker.addEventListener('statechange', () => {
                        console.log('New worker state changed to:', newWorker.state);
                        if (newWorker.state === 'installed') {
                             activeWorker = newWorker;
                            if (navigator.serviceWorker.controller) {
                                console.log('New service worker installed. Ready to take over from current controller.');
                                // Optionally, prompt user or send SKIP_WAITING
                                // newWorker.postMessage({ type: 'SKIP_WAITING' }); 
                            } else {
                                console.log('New service worker installed. Ready to control on next load or after activation.');
                                // newWorker.postMessage({ type: 'SKIP_WAITING' }); // Can also send here
                            }
                        }
                        if (newWorker.state === 'activated') {
                             activeWorker = newWorker;
                             console.log('New service worker activated and controlling.');
                        }
                    });
                });
            }
        })
        .catch(error => {
            console.error('Service worker lifecycle error:', error);
        });
} else {
    console.log('Service workers not supported or not on dlux domain.');
}