// Mention suggestion factory for TipTap
// Returns a properly configured suggestion object

export function createMentionSuggestion() {
    return {
        char: '@',

        items: async ({ query }) => {
            if (!query || query.length < 1) {
                return [];
            }

            try {
                const response = await fetch('https://api.hive.blog', {
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'condenser_api.lookup_accounts',
                        params: [query.toLowerCase(), 10],
                        id: 1
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    method: 'POST',
                });

                const data = await response.json();
                const accounts = data.result || [];

                return accounts.map(username => ({
                    id: username,
                    label: username
                }));
            } catch (error) {
                console.error('Error fetching Hive accounts:', error);
                return [];
            }
        },

        render: () => {
            let popup;
            let component;

            return {
                onStart: props => {
                    // Get tippy from the global bundle
                    const tiptapBundle = window.TiptapCollaboration?.default || window.TiptapCollaboration || {};
                    const tippy = tiptapBundle.tippy || window.tippy;

                    if (!tippy) {
                        console.error('Tippy not available for mention suggestions');
                        return;
                    }

                    // Create dropdown container
                    const container = document.createElement('div');
                    container.className = 'mention-dropdown';

                    component = {
                        element: container,
                        updateProps: (newProps) => {
                            container.innerHTML = '';

                            if (newProps.items.length === 0) {
                                container.innerHTML = '<div class="mention-item mention-empty">No users found</div>';
                            } else {
                                newProps.items.forEach((item, index) => {
                                    const button = document.createElement('button');
                                    button.className = 'mention-item';
                                    if (index === 0) button.classList.add('is-selected');

                                    button.innerHTML = `
                                        <img src="https://images.hive.blog/u/${item.id}/avatar" 
                                             alt="${item.id}" 
                                             class="mention-avatar" 
                                             onerror="this.src='/img/no-user.png'">
                                        <span class="mention-username">@${item.label}</span>
                                    `;

                                    button.onclick = () => newProps.command(item);
                                    container.appendChild(button);
                                });
                            }
                        }
                    };

                    component.updateProps(props);

                    popup = tippy('body', {
                        getReferenceClientRect: props.clientRect,
                        appendTo: () => document.body,
                        content: container,
                        showOnCreate: true,
                        interactive: true,
                        trigger: 'manual',
                        placement: 'bottom-start',
                        theme: 'dlux-dark mention-popup',
                    });
                },

                onUpdate(props) {
                    if (component) {
                        component.updateProps(props);
                    }

                    if (popup && popup[0]) {
                        popup[0].setProps({
                            getReferenceClientRect: props.clientRect,
                        });
                    }
                },

                onKeyDown(props) {
                    if (!component || !component.element) return false;

                    if (props.event.key === 'Escape') {
                        if (popup && popup[0]) {
                            popup[0].hide();
                        }
                        return true;
                    }

                    // Handle arrow key navigation
                    const items = component.element.querySelectorAll('.mention-item:not(.mention-empty)');
                    const selected = component.element.querySelector('.is-selected');
                    let index = Array.from(items).indexOf(selected);

                    if (props.event.key === 'ArrowUp') {
                        index = Math.max(0, index - 1);
                        items.forEach((item, i) => item.classList.toggle('is-selected', i === index));
                        return true;
                    } else if (props.event.key === 'ArrowDown') {
                        index = Math.min(items.length - 1, index + 1);
                        items.forEach((item, i) => item.classList.toggle('is-selected', i === index));
                        return true;
                    } else if (props.event.key === 'Enter') {
                        if (items[index]) {
                            items[index].click();
                        }
                        return true;
                    }

                    return false;
                },

                onExit() {
                    if (popup && popup[0]) {
                        popup[0].destroy();
                    }
                },
            };
        },
    };
}
