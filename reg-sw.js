var activeWorker = null;
if (window.location.hostname.includes('dlux') && 'serviceWorker' in navigator) {
    const version = '2025.05.20.3'; // Ensure this version matches sw.js
    console.log('Desired service worker version:', version);

    navigator.serviceWorker.getRegistration('/')
        .then(registration => {
            if (registration && registration.active) {
                const activeSWURL = registration.active.scriptURL;
                console.log('Found active service worker:', activeSWURL);
                
                // Extract version from activeSWURL. Assumes format like "/sw.js?v=VERSION"
                const urlParams = new URLSearchParams(activeSWURL.split('?')[1]);
                const activeVersion = urlParams.get('v');

                if (activeVersion === version) {
                    console.log('Active service worker version matches desired version. No action needed.');
                    activeWorker = registration.active; // Store the active worker
                    return null; // Indicate that no further registration steps are needed
                } else {
                    console.log(`Active service worker version (${activeVersion}) does not match desired version (${version}). Unregistering.`);
                    return registration.unregister().then(() => {
                        console.log('Unregistered existing service worker');
                        // Optional: Add a small delay to ensure unregistration completes
                        // return new Promise(resolve => setTimeout(resolve, 200));
                        return true; // Indicate that registration should proceed
                    });
                }
            } else {
                console.log('No active service worker found. Proceeding with registration.');
                return true; // Indicate that registration should proceed
            }
        })
        .then(shouldRegister => {
            if (shouldRegister === null) { // null means no registration needed
                return;
            }
            console.log('Registering new service worker...');
            return navigator.serviceWorker.register(`/sw.js?v=${version}`, { scope: '/' });
        })
        .then(reg => {
            if (reg) { // reg will be undefined if registration was skipped
                 activeWorker = reg.installing || reg.waiting || reg.active;
                console.log('Service worker registration process completed. Scope:', reg.scope);
                // Listen for the new worker to become active
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New worker is installed, but not yet controlling the page.
                            // You might want to prompt the user to reload or send a SKIP_WAITING message.
                            console.log('New service worker installed. Awaiting activation.');
                        }
                        if (newWorker.state === 'activated') {
                             activeWorker = newWorker;
                             console.log('New service worker activated.');
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