// --- MODO LOCAL ---
        try {
            // --- 2. ESTADO GLOBAL DE LA APLICACIÓN (STATE) ---
            let state = { 
                currentUser: null, currentRestaurantId: null, 
                users: [
                    { docId: 'superadmin_user', id: 'superadmin', name: 'Super Administrador', role: 'superadmin', password: 'superadminpass' }
                ], 
                orders: [], 
                restaurants: [], 
                menuItems: [],
                appSettings: {},
                adminCurrentView: 'waiter', 
                adminCurrentTab: 'dashboard', 
            };
            
            // --- 3. PERSISTENCIA DE DATOS LOCALSTORAGE ---
            function saveState() {
                localStorage.setItem('restaurantAppState', JSON.stringify(state));
            }

            function loadState() {
                const savedState = localStorage.getItem('restaurantAppState');
                if (savedState) {
                    const parsedState = JSON.parse(savedState);
                    // Asegurarse de que las fechas se rehidraten correctamente
                    parsedState.orders.forEach(order => {
                        if (order.createdAt) order.createdAt = new Date(order.createdAt);
                        if (order.paidAt) order.paidAt = new Date(order.paidAt);
                    });
                    Object.assign(state, parsedState);
                }
            }

            // --- 4. FUNCIONES UTILITARIAS ---
            function showNotification(message, isError = false) {
                const toast = document.getElementById('notification-toast');
                toast.querySelector('#notification-message').textContent = message;
                toast.className = `fixed top-5 right-5 text-white py-3 px-6 rounded-lg shadow-lg transform translate-x-[120%] ${isError ? 'bg-red-500' : 'bg-green-500'}`;
                toast.style.transform = 'translateX(0)';
                setTimeout(() => { toast.style.transform = 'translateX(120%)'; }, 3000);
            }

            function showConfirmation(message, onConfirm) {
                const modal = document.getElementById('confirm-modal');
                modal.innerHTML = `
                    <div class="bg-content rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
                        <p class="mb-6 text-lg">${message}</p>
                        <div class="flex justify-center gap-4">
                            <button class="confirm-cancel px-6 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold">Cancelar</button>
                            <button class="confirm-ok px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold">Confirmar</button>
                        </div>
                    </div>`;
                modal.classList.remove('hidden');
                
                const close = () => modal.classList.add('hidden');
                modal.querySelector('.confirm-ok').addEventListener('click', () => { onConfirm(); close(); }, { once: true });
                modal.querySelector('.confirm-cancel').addEventListener('click', close, { once: true });
            }
            
            function getStatusInfo(status) {
                switch (status) {
                    case 'pending': return { text: 'Pendiente', color: 'bg-red-100 text-red-800' };
                    case 'preparing': return { text: 'En Preparación', color: 'bg-yellow-100 text-yellow-800' };
                    case 'ready': return { text: 'Listo', color: 'bg-green-100 text-green-800' };
                    case 'delivered': return { text: 'Entregado', color: 'bg-blue-100 text-blue-800' };
                    case 'paid': return { text: 'Pagado', color: 'bg-gray-200 text-gray-600' };
                    default: return { text: 'Desconocido', color: 'bg-gray-100' };
                }
            }
            
            // --- 5. FUNCIONES DE RENDERIZADO (VISTAS) ---
            function render() {
                saveState();
                const loginModal = document.getElementById('login-modal');
                const appContainer = document.getElementById('app');
                if (!state.currentUser) { appContainer.classList.add('hidden'); loginModal.classList.remove('hidden'); return; }
                appContainer.classList.remove('hidden'); loginModal.classList.add('hidden');
                
                document.getElementById('welcome-message').textContent = `Bienvenido/a, ${state.currentUser.name}`;
                document.querySelectorAll('.view').forEach(v => v.innerHTML = '');

                const viewId = `${state.currentUser.role}-view`;
                const viewContainer = document.getElementById(viewId);

                if (state.currentUser.role === 'superadmin') {
                    document.getElementById('app-title').textContent = 'Panel de Super Admin';
                    renderSuperAdminView(viewContainer);
                } else {
                    const restaurant = state.restaurants.find(r => r.id === state.currentRestaurantId);
                    document.getElementById('app-title').textContent = restaurant ? restaurant.name : 'Gestión de Comandas';
                    
                    const settings = state.appSettings[state.currentRestaurantId] || { theme: 'default' };
                    applyTheme(settings.theme);

                    if (state.currentUser.role === 'admin') renderAdminView(viewContainer);
                    else if (state.currentUser.role === 'waiter') renderWaiterView(viewContainer);
                    else if (state.currentUser.role === 'kitchen') renderKitchenView(viewContainer);
                    else if (state.currentUser.role === 'cashier') renderCashierView(viewContainer);
                }
            }

            function renderSuperAdminView(container) {
                container.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="md:col-span-1 bg-content p-6 rounded-lg shadow">
                            <h3 class="text-lg font-bold mb-4 border-b border-color pb-2">Crear Restaurante</h3>
                            <form id="restaurant-form" class="space-y-4">
                                <div><label for="res-name" class="block text-sm font-medium">Nombre del Restaurante</label><input type="text" id="res-name" class="mt-1 block w-full p-2 border border-color rounded-md bg-content" required></div>
                                <div><label for="res-id" class="block text-sm font-medium">ID Numérico (ej: 0250)</label><input type="number" id="res-id" class="mt-1 block w-full p-2 border border-color rounded-md bg-content" required></div>
                                <hr class="my-2 border-color"/>
                                <h4 class="text-md font-semibold">Primer Usuario Administrador</h4>
                                <div><label for="res-admin-user" class="block text-sm font-medium">Usuario Admin</label><input type="text" id="res-admin-user" class="mt-1 block w-full p-2 border border-color rounded-md bg-content" required></div>
                                <div><label for="res-admin-pass" class="block text-sm font-medium">Contraseña Admin</label><input type="password" id="res-admin-pass" class="mt-1 block w-full p-2 border border-color rounded-md bg-content" required></div>
                                <button type="submit" class="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover">Crear Restaurante</button>
                            </form>
                        </div>
                        <div class="md:col-span-2 bg-content p-6 rounded-lg shadow overflow-x-auto">
                            <h3 class="text-lg font-bold mb-4 border-b border-color pb-2">Lista de Restaurantes</h3>
                            <table class="w-full text-left">
                                <thead><tr class="border-b border-color"><th class="p-2">ID</th><th class="p-2">Nombre</th><th class="p-2">Acceso</th><th class="p-2">Acciones</th></tr></thead>
                                <tbody id="restaurants-list-body"></tbody>
                            </table>
                        </div>
                    </div>`;
                
                const tbody = container.querySelector('#restaurants-list-body');
                tbody.innerHTML = '';
                state.restaurants.sort((a,b) => a.id - b.id).forEach(res => {
                    const tr = document.createElement('tr');
                    tr.className = 'border-b border-color hover:bg-main';
                    tr.innerHTML = `
                        <td class="p-2 font-mono">${res.id}</td>
                        <td class="p-2">${res.name}</td>
                        <td class="p-2">
                            <label class="toggle-label">
                                <input type="checkbox" class="toggle-input access-toggle" data-id="${res.id}" ${res.isActive ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                                <span class="toggle-text text-xs">${res.isActive ? 'Activo' : 'Bloqueado'}</span>
                            </label>
                        </td>
                        <td class="p-2"><button data-id="${res.id}" class="edit-restaurant-btn text-primary hover:underline text-sm">Editar</button></td>`;
                    tbody.appendChild(tr);
                });

                container.querySelector('#restaurant-form').onsubmit = handleRestaurantFormSubmit;
                tbody.onchange = (e) => {
                    if (e.target.classList.contains('access-toggle')) {
                        handleAccessToggle(e.target.dataset.id, e.target.checked);
                    }
                };
                tbody.onclick = (e) => {
                     if (e.target.classList.contains('edit-restaurant-btn')) {
                        openEditRestaurantModal(e.target.dataset.id);
                    }
                }
            }
            
            function renderAdminView(container) {
                container.innerHTML = `
                    <div class="mb-4 border-b border-color bg-content p-2 rounded-t-lg shadow">
                        <nav id="admin-tabs" class="flex flex-wrap space-x-2" aria-label="Tabs"></nav>
                    </div>
                    <div id="admin-content"></div>`;
                
                const tabs = [ { id: 'dashboard', label: 'Dashboard' }, { id: 'users', label: 'Gestión de Usuarios' }, { id: 'settings', label: 'Configuración' }, { id: 'reports', label: 'Reportes' } ];
                const tabsContainer = container.querySelector('#admin-tabs');
                tabsContainer.innerHTML = '';
                tabs.forEach(tab => {
                    const tabButton = document.createElement('button');
                    tabButton.dataset.tab = tab.id;
                    tabButton.className = `nav-tab ${state.adminCurrentTab === tab.id ? 'tab-active' : ''}`;
                    tabButton.textContent = tab.label;
                    tabButton.onclick = () => { state.adminCurrentTab = tab.id; renderAdminView(container); };
                    tabsContainer.appendChild(tabButton);
                });
                
                const contentContainer = container.querySelector('#admin-content');
                if (state.adminCurrentTab === 'dashboard') renderAdminDashboard(contentContainer);
                else if (state.adminCurrentTab === 'users') renderUsersManagement(contentContainer);
                else if (state.adminCurrentTab === 'settings') renderSettings(contentContainer);
                else if (state.adminCurrentTab === 'reports') renderSalesReportView(contentContainer);
            }

            function renderAdminDashboard(container) {
                container.innerHTML = `
                    <div class="mb-4 border-b border-color bg-content p-2 rounded-lg shadow">
                        <nav id="admin-view-selector" class="flex flex-wrap space-x-2" aria-label="Tabs"></nav>
                    </div>
                    <div id="admin-dynamic-view"></div>`;
                
                const views = [ { id: 'waiter', label: 'Mesas' }, { id: 'kitchen', label: 'Cocina' }, { id: 'cashier', label: 'Caja' } ];
                const viewSelector = container.querySelector('#admin-view-selector');
                viewSelector.innerHTML = '';
                views.forEach(view => {
                    const viewButton = document.createElement('button');
                    viewButton.dataset.view = view.id;
                    viewButton.className = `nav-tab ${state.adminCurrentView === view.id ? 'tab-active' : ''}`;
                    viewButton.textContent = view.label;
                    viewButton.onclick = () => { state.adminCurrentView = view.id; renderAdminDashboard(container); };
                    viewSelector.appendChild(viewButton);
                });

                const dynamicViewContainer = container.querySelector('#admin-dynamic-view');
                if (state.adminCurrentView === 'waiter') renderWaiterView(dynamicViewContainer);
                else if (state.adminCurrentView === 'kitchen') renderKitchenView(dynamicViewContainer);
                else if (state.adminCurrentView === 'cashier') renderCashierView(dynamicViewContainer);
            }
            
            function renderKitchenView(container) {
                container.innerHTML = `<h2 class="text-xl font-semibold mb-4">Panel de Cocina</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="bg-content rounded-lg shadow p-4 kanban-column"><h3 class="font-bold text-lg border-b border-color pb-2 mb-4 text-red-600">Pendiente</h3><div class="space-y-4 orders-container"></div></div>
                        <div class="bg-content rounded-lg shadow p-4 kanban-column"><h3 class="font-bold text-lg border-b border-color pb-2 mb-4 text-yellow-600">En Preparación</h3><div class="space-y-4 orders-container"></div></div>
                        <div class="bg-content rounded-lg shadow p-4 kanban-column"><h3 class="font-bold text-lg border-b border-color pb-2 mb-4 text-green-600">Listo para Servir</h3><div class="space-y-4 orders-container"></div></div>
                    </div>`;
                
                const statuses = ['pending', 'preparing', 'ready'];
                statuses.forEach((status, index) => {
                    const ordersContainer = container.querySelectorAll('.orders-container')[index];
                    ordersContainer.innerHTML = '';
                    const filteredAndSorted = state.orders
                        .filter(o => o.restaurantId === state.currentRestaurantId && o.status === status)
                        .sort((a, b) => a.createdAt - b.createdAt);

                    filteredAndSorted.forEach(order => {
                        const itemsHtml = order.items.map(item => 
                            `<li class="text-sm">
                                <span class="text-primary font-semibold">${item.quantity} x ${item.name}</span>
                                ${item.notes ? `<span class="block text-xs text-secondary italic pl-4">&hookrightarrow; ${item.notes}</span>` : ''}
                            </li>`
                        ).join('');
                        const orderCard = document.createElement('div');
                        orderCard.className = 'p-3 bg-main border border-color rounded-lg shadow-sm';
                        let buttonHtml = '';
                        if(order.status === 'pending'){
                            buttonHtml = `<button data-id="${order.id}" data-action="preparing" class="kitchen-action-btn w-full mt-2 text-white text-sm py-1 rounded bg-yellow-500 hover:bg-yellow-600">Empezar Preparación</button>`;
                        } else if(order.status === 'preparing'){
                            buttonHtml = `<button data-id="${order.id}" data-action="ready" class="kitchen-action-btn w-full mt-2 text-white text-sm py-1 rounded bg-green-500 hover:bg-green-600">Marcar como Listo</button>`;
                        } else {
                            buttonHtml = '<p class="text-xs mt-2 text-center text-green-700 font-semibold">Esperando a ser recogido</p>';
                        }
                        orderCard.innerHTML = `<h4 class="font-bold">Mesa ${order.tableNumber}</h4><ul class="my-2 space-y-1">${itemsHtml}</ul>${buttonHtml}`;
                        ordersContainer.appendChild(orderCard);
                    });
                });
                container.querySelectorAll('.kitchen-action-btn').forEach(btn => {
                    btn.onclick = (e) => updateOrderStatus(e.target.dataset.id, e.target.dataset.action);
                });
            }
            
            function renderCashierView(container) { 
                container.innerHTML = `
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-semibold">Gestión de Caja</h2>
                        ${(state.currentUser.role === 'admin' || state.currentUser.role === 'cashier') ? '<button id="eod-btn" class="bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-hover">Cierre de Caja</button>' : ''}
                    </div>
                    <div class="mb-4 border-b border-color bg-content p-2 rounded-t-lg shadow">
                        <nav class="cashier-tabs flex space-x-2" aria-label="Tabs"></nav>
                    </div>
                    <div class="bg-content rounded-b-lg shadow p-4 overflow-x-auto">
                        <table class="w-full text-left">
                            <thead><tr class="border-b border-color"><th class="p-2">Mesa</th><th class="p-2">Total</th><th class="p-2">Estado</th><th class="p-2">Acciones</th></tr></thead>
                            <tbody class="cashier-orders-body"></tbody>
                        </table>
                    </div>`;

                if (container.querySelector('#eod-btn')) container.querySelector('#eod-btn').onclick = handleEndOfDayClick;
                
                let currentTab = 'active';
                const tabs = [{id: 'active', label: 'Órdenes Activas'}, {id: 'history', label: 'Historial'}];
                const tabsContainer = container.querySelector('.cashier-tabs');
                tabsContainer.innerHTML = '';
                tabs.forEach(tab => {
                    const tabBtn = document.createElement('button');
                    tabBtn.className = `nav-tab ${currentTab === tab.id ? 'tab-active' : ''}`;
                    tabBtn.textContent = tab.label;
                    tabBtn.onclick = () => { currentTab = tab.id; renderTable(); };
                    tabsContainer.appendChild(tabBtn);
                });

                const renderTable = () => {
                    const tbody = container.querySelector('.cashier-orders-body');
                    tbody.innerHTML = '';
                    const filteredOrders = state.orders.filter(o => o.restaurantId === state.currentRestaurantId && (
                        (currentTab === 'active' ? o.status !== 'paid' && !o.isArchived : o.status === 'paid' && !o.isArchived)
                    ));
                    
                    filteredOrders.forEach(order => {
                        const statusInfo = getStatusInfo(order.status);
                        const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                        const tr = document.createElement('tr');
                        tr.className = 'border-b border-color hover:bg-main';
                        let actionsHtml = '';
                        if(order.status === 'ready') {
                            actionsHtml = `<button data-id="${order.id}" data-action="delivered" class="cashier-action-btn bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600">Entregado</button>`;
                        } else if(order.status === 'delivered'){
                            actionsHtml = `<button data-id="${order.id}" class="cashier-pay-btn bg-green-500 text-white text-xs px-2 py-1 rounded hover:bg-green-600">Pagar</button>`;
                        }
                        tr.innerHTML = `<td class="p-2 font-semibold">${order.tableNumber}</td><td class="p-2">$${total.toFixed(2)}</td><td class="p-2"><span class="px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}">${statusInfo.text}</span></td><td class="p-2 space-x-2">${actionsHtml}</td>`;
                        tbody.appendChild(tr);
                    });
                };
                
                container.querySelector('.cashier-orders-body').addEventListener('click', (e) => {
                    if (e.target.classList.contains('cashier-action-btn')) {
                        updateOrderStatus(e.target.dataset.id, e.target.dataset.action);
                    } else if (e.target.classList.contains('cashier-pay-btn')) {
                        openPOSModal(e.target.dataset.id);
                    }
                });
                renderTable();
            }
            
            function renderUsersManagement(container) { 
                container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="md:col-span-1 bg-content p-6 rounded-lg shadow">
                            <h3 class="text-lg font-bold mb-4 border-b border-color pb-2">Crear/Editar Usuario</h3>
                            <form id="user-form" class="space-y-4">
                                <input type="hidden" id="user-doc-id">
                                <div><label for="user-username" class="block text-sm font-medium">Usuario</label><input type="text" id="user-username" class="mt-1 block w-full p-2 border border-color rounded-md bg-content" required></div>
                                <div><label for="user-name" class="block text-sm font-medium">Nombre Completo</label><input type="text" id="user-name" class="mt-1 block w-full p-2 border border-color rounded-md bg-content" required></div>
                                <div><label for="user-password" class="block text-sm font-medium">Contraseña</label><input type="password" id="user-password" class="mt-1 block w-full p-2 border border-color rounded-md bg-content" placeholder="Dejar en blanco para no cambiar"></div>
                                <div><label for="user-role" class="block text-sm font-medium">Rol</label><select id="user-role" class="mt-1 block w-full p-2 border border-color rounded-md bg-content"><option value="waiter">Mesero</option><option value="kitchen">Cocina</option><option value="cashier">Caja</option></select></div>
                                <div class="flex space-x-2"><button type="submit" class="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover">Guardar Usuario</button><button type="button" id="cancel-edit-btn" class="w-full bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 hidden">Cancelar</button></div>
                            </form>
                        </div>
                        <div class="md:col-span-2 bg-content p-6 rounded-lg shadow overflow-x-auto">
                            <h3 class="text-lg font-bold mb-4 border-b border-color pb-2">Lista de Usuarios</h3>
                            <table class="w-full text-left">
                                <thead><tr class="border-b border-color"><th class="p-2">Usuario</th><th class="p-2">Nombre</th><th class="p-2">Rol</th><th class="p-2">Acciones</th></tr></thead>
                                <tbody id="users-list-body"></tbody>
                            </table>
                        </div>
                    </div>`;
                
                const tbody = container.querySelector('#users-list-body');
                tbody.innerHTML = '';
                state.users.filter(u => u.restaurantId === state.currentRestaurantId).forEach(user => {
                    const tr = document.createElement('tr');
                    tr.className = 'border-b border-color hover:bg-main';
                    tr.innerHTML = `<td class="p-2">${user.id}</td><td class="p-2">${user.name}</td><td class="p-2">${user.role}</td>
                    <td class="p-2 space-x-2"><button data-docid="${user.docId}" class="edit-user-btn text-primary hover:underline text-sm">Editar</button><button data-docid="${user.docId}" data-id="${user.id}" class="delete-user-btn text-red-600 hover:underline text-sm">Eliminar</button></td>`;
                    tbody.appendChild(tr);
                });
                container.querySelector('#user-form').addEventListener('submit', handleUserFormSubmit);
                container.querySelector('#cancel-edit-btn').addEventListener('click', () => resetUserForm(container));
                container.querySelector('#users-list-body').addEventListener('click', (e) => handleUserActions(e, container));
            }
            
            function renderWaiterView(container) { 
                container.innerHTML = `<h2 class="text-xl font-semibold mb-4">Mesas</h2>
                                    <div id="tables-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"></div>`;
                const tablesGrid = container.querySelector('#tables-grid');
                tablesGrid.innerHTML = '';
                const currentSettings = state.appSettings[state.currentRestaurantId] || { tableCount: 12 };
                for (let i = 1; i <= currentSettings.tableCount; i++) {
                    let order = state.orders.find(o => o.restaurantId === state.currentRestaurantId && o.tableNumber === i && o.status !== 'paid' && !o.isArchived);
                    let tableState = 'free';
                    let statusInfo = { text: 'Libre' };

                    if (order) {
                        tableState = 'occupied';
                        statusInfo = getStatusInfo(order.status);
                    } else {
                        order = state.orders.find(o => o.restaurantId === state.currentRestaurantId && o.tableNumber === i && o.status === 'paid' && o.tableCleaned !== true && !o.isArchived);
                        if (order) {
                            tableState = 'needs_cleaning';
                            statusInfo = { text: 'Por Limpiar', color: 'bg-red-200 text-red-800' };
                        }
                    }

                    const tableEl = document.createElement('button');
                    let classList = `p-4 rounded-lg shadow-md text-center font-bold text-lg transition-all `;
                    
                    if (tableState === 'occupied') {
                        classList += 'bg-yellow-200 text-yellow-800' + (order.status === 'ready' ? ' ready-for-pickup' : '');
                    } else if (tableState === 'needs_cleaning') {
                        classList += 'needs-cleaning';
                    } else {
                        classList += 'bg-green-200 text-green-800 hover:bg-green-300';
                    }
                    
                    tableEl.className = classList;
                    tableEl.innerHTML = `Mesa ${i} <div class="text-sm font-normal mt-1 px-2 py-0.5 rounded-full inline-block ${statusInfo.color || ''}">${statusInfo.text}</div>`;
                    tableEl.onclick = () => handleTableClick(i, tableState, order ? order.id : null);
                    tablesGrid.appendChild(tableEl);
                }
            }
            
            function renderSettings(container) {
                const currentSettings = state.appSettings[state.currentRestaurantId] || { theme: 'default', tableCount: 12 };
                container.innerHTML = `<div class="bg-content p-6 rounded-lg shadow space-y-8">
                    <div>
                        <h3 class="text-lg font-bold mb-4 border-b border-color pb-2">Gestión de Mesas</h3>
                        <div class="flex items-center gap-4">
                            <label for="table-count-input" class="font-medium">Número de Mesas:</label>
                            <input type="number" id="table-count-input" min="1" class="w-24 p-2 border border-color rounded-md bg-content" value="${currentSettings.tableCount}">
                            <button id="save-tables-btn" class="bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-hover">Guardar</button>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold mb-4 border-b border-color pb-2">Tema de la Aplicación</h3>
                        <div id="theme-selector" class="flex flex-col sm:flex-row gap-4">
                            <label class="flex items-center gap-2 p-4 border border-color rounded-lg cursor-pointer"><input type="radio" name="theme" value="default" class="form-radio"> Clásico (Azul)</label>
                            <label class="flex items-center gap-2 p-4 border border-color rounded-lg cursor-pointer"><input type="radio" name="theme" value="green" class="form-radio"> Fresco (Verde)</label>
                            <label class="flex items-center gap-2 p-4 border border-color rounded-lg cursor-pointer"><input type="radio" name="theme" value="dark" class="form-radio"> Nocturno (Oscuro)</label>
                        </div>
                    </div>
                </div>
                <div id="menu-management-section" class="mt-8"></div>
                `;
                container.querySelector(`#theme-selector input[value="${currentSettings.theme}"]`).checked = true;
                container.querySelector('#theme-selector').onchange = (e) => updateTheme(e.target.value);
                container.querySelector('#save-tables-btn').onclick = handleSaveTableCount;
                renderMenuManagement(container.querySelector('#menu-management-section'));
            }

            function renderMenuManagement(container) {
                container.innerHTML = `
                 <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="md:col-span-1 bg-content p-6 rounded-lg shadow">
                            <h3 class="text-lg font-bold mb-4 border-b border-color pb-2">Añadir/Editar Platillo</h3>
                            <form id="menu-item-form" class="space-y-4">
                                <input type="hidden" id="menu-item-doc-id">
                                <div><label for="menu-item-name" class="block text-sm font-medium">Nombre del Platillo</label><input type="text" id="menu-item-name" class="mt-1 block w-full p-2 border border-color rounded-md bg-content" required></div>
                                <div><label for="menu-item-price" class="block text-sm font-medium">Precio</label><input type="number" id="menu-item-price" class="mt-1 block w-full p-2 border border-color rounded-md bg-content" step="0.01" min="0" required></div>
                                <div><label for="menu-item-category" class="block text-sm font-medium">Categoría</label><input type="text" id="menu-item-category" class="mt-1 block w-full p-2 border border-color rounded-md bg-content" placeholder="Ej: Platos Fuertes" required></div>
                                <div class="flex space-x-2"><button type="submit" class="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover">Guardar Platillo</button><button type="button" id="cancel-edit-menu-item-btn" class="w-full bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 hidden">Cancelar</button></div>
                            </form>
                        </div>
                        <div class="md:col-span-2 bg-content p-6 rounded-lg shadow overflow-x-auto">
                            <h3 class="text-lg font-bold mb-4 border-b border-color pb-2">Menú Actual</h3>
                            <table class="w-full text-left">
                                <thead><tr class="border-b border-color"><th class="p-2">Platillo</th><th class="p-2">Categoría</th><th class="p-2">Precio</th><th class="p-2">Acciones</th></tr></thead>
                                <tbody id="menu-items-list-body"></tbody>
                            </table>
                        </div>
                    </div>
                `;
                
                const tbody = container.querySelector('#menu-items-list-body');
                tbody.innerHTML = '';
                state.menuItems.filter(item => item.restaurantId === state.currentRestaurantId).sort((a,b) => a.name.localeCompare(b.name)).forEach(item => {
                    const tr = document.createElement('tr');
                    tr.className = 'border-b border-color hover:bg-main';
                    tr.innerHTML = `<td class="p-2">${item.name}</td><td class="p-2">${item.category}</td><td class="p-2">$${item.price.toFixed(2)}</td>
                    <td class="p-2 space-x-2"><button data-docid="${item.docId}" class="edit-menu-item-btn text-primary hover:underline text-sm">Editar</button><button data-docid="${item.docId}" data-id="${item.id}" class="delete-menu-item-btn text-red-600 hover:underline text-sm">Eliminar</button></td>`;
                    tbody.appendChild(tr);
                });

                container.querySelector('#menu-item-form').onsubmit = handleMenuItemFormSubmit;
                container.querySelector('#cancel-edit-menu-item-btn').onclick = () => resetMenuItemForm(container);
                tbody.onclick = (e) => handleMenuItemActions(e, container);
            }
            
            function renderSalesReportView(container) {
                 container.innerHTML = `
                    <div class="bg-content p-6 rounded-lg shadow space-y-6">
                        <div class="flex justify-between items-center border-b border-color pb-2">
                            <h2 class="text-xl font-semibold">Reportes de Ventas</h2>
                            <button id="clear-reports-btn" class="bg-red-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-600">Limpiar Reportes</button>
                        </div>
                        <div class="flex flex-wrap items-center gap-4">
                            <button data-range="today" class="date-filter-btn bg-primary text-white px-3 py-1.5 rounded-md text-sm">Hoy</button>
                            <button data-range="yesterday" class="date-filter-btn bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm">Ayer</button>
                            <button data-range="week" class="date-filter-btn bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm">Últimos 7 Días</button>
                            <button data-range="month" class="date-filter-btn bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm">Este Mes</button>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div class="bg-main p-4 rounded-lg"><h4 class="text-sm text-secondary">Ventas Totales</h4><p id="report-total-sales" class="text-2xl font-bold">$0.00</p></div>
                            <div class="bg-main p-4 rounded-lg"><h4 class="text-sm text-secondary">Nº de Órdenes</h4><p id="report-order-count" class="text-2xl font-bold">0</p></div>
                            <div class="bg-main p-4 rounded-lg"><h4 class="text-sm text-secondary">Ticket Promedio</h4><p id="report-avg-ticket" class="text-2xl font-bold">$0.00</p></div>
                        </div>
                         <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div class="overflow-x-auto"><h3 class="text-lg font-semibold mb-2">Platillos Más Vendidos</h3><table class="w-full text-left"><thead class="border-b border-color"><th class="p-2">Platillo</th><th class="p-2">Cantidad</th></thead><tbody id="report-top-items"></tbody></table></div>
                             <div class="overflow-x-auto"><h3 class="text-lg font-semibold mb-2">Transacciones</h3><table class="w-full text-left"><thead class="border-b border-color"><th class="p-2">Hora</th><th class="p-2">Mesa</th><th class="p-2">Monto</th><th class="p-2">Método</th></thead><tbody id="report-transactions"></tbody></table></div>
                         </div>
                    </div>`;
                
                container.querySelector('#clear-reports-btn').onclick = handleClearReports;
                container.querySelectorAll('.date-filter-btn').forEach(btn => {
                    btn.onclick = (e) => {
                        container.querySelectorAll('.date-filter-btn').forEach(b => {
                            b.classList.replace('bg-primary','bg-gray-200');
                            b.classList.replace('text-white','text-gray-700');
                        });
                        e.target.classList.replace('bg-gray-200','bg-primary');
                        e.target.classList.replace('text-gray-700','text-white');
                        generateReport(e.target.dataset.range);
                    }
                });
                generateReport('today');
            }

            // --- 5. MANEJADORES DE EVENTOS ---
            document.getElementById('login-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const restaurantId = document.getElementById('restaurantId').value;
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const errorDiv = document.getElementById('login-error');
                
                const superAdmin = state.users.find(u => u.role === 'superadmin');
                if (username === superAdmin.id && password === superAdmin.password) {
                    state.currentUser = superAdmin;
                    errorDiv.classList.add('hidden');
                    render();
                    return;
                }
                
                if (!restaurantId) { errorDiv.textContent = "El ID de Restaurante es obligatorio."; return errorDiv.classList.remove('hidden'); }
                
                const restaurant = state.restaurants.find(r => r.id === restaurantId);
                if (!restaurant || !restaurant.isActive) {
                    errorDiv.textContent = "El acceso para este restaurante ha sido suspendido."; return errorDiv.classList.remove('hidden');
                }

                const user = state.users.find(u => u.id === username && u.restaurantId === restaurantId);
                if (user && user.password === password) {
                    state.currentUser = user;
                    state.currentRestaurantId = restaurantId;
                    errorDiv.classList.add('hidden');
                    loadAppSettings();
                    render();
                } else {
                    errorDiv.textContent = "Usuario, contraseña o ID de Restaurante incorrecto.";
                    errorDiv.classList.remove('hidden');
                }
            });
            
            document.getElementById('logout-btn').addEventListener('click', () => {
                state.currentUser = null; 
                state.currentRestaurantId = null;
                document.getElementById('restaurantId').value = '';
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
                render(); 
            });
            
            async function handleTableClick(tableNumber, currentTableState, orderId) { 
                if (state.currentUser.role !== 'waiter' && state.currentUser.role !== 'admin') return;

                if (currentTableState === 'needs_cleaning') {
                    return showConfirmation(`¿Marcar Mesa ${tableNumber} como limpia?`, () => cleanTable(orderId));
                }
                
                if (currentTableState === 'occupied') { 
                    return showNotification(`La mesa ${tableNumber} ya tiene una orden activa.`, true); 
                }
                
                state.selectedTable = tableNumber;
                state.currentOrderItems = [];
                renderOrderModal();
            }

            function renderOrderModal() {
                const modal = document.getElementById('generic-modal');
                const menuItemsForRestaurant = state.menuItems.filter(i => i.restaurantId === state.currentRestaurantId);
                const menuOptions = menuItemsForRestaurant.sort((a,b) => a.name.localeCompare(b.name)).map(item => `<option value="${item.docId}" data-price="${item.price}">${item.name}</option>`).join('');
                
                modal.innerHTML = `
                <div class="bg-content rounded-lg shadow-xl w-full max-w-md">
                    <div class="p-6 border-b border-color"><h3 class="text-xl font-bold">Tomar Orden - Mesa ${state.selectedTable}</h3></div>
                    <div class="p-6 max-h-[60vh] overflow-y-auto">
                        <div class="space-y-4 mb-4">
                            <div><label for="item-name-select" class="block text-sm font-medium">Platillo</label>
                                <select id="item-name-select" class="mt-1 block w-full p-2 border border-color rounded-md bg-content focus:ring-2 ring-primary">
                                    <option value="">Seleccione un platillo...</option>
                                    ${menuOptions}
                                </select>
                            </div>
                            <div><label for="item-notes" class="block text-sm font-medium">Notas (Opcional)</label><input type="text" id="item-notes" placeholder="Ej: Sin cebolla" class="mt-1 block w-full p-2 border border-color rounded-md bg-content focus:ring-2 ring-primary"></div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label for="item-price" class="block text-sm font-medium">Precio</label>
                                    <div class="flex items-center mt-1"><button class="adjust-btn rounded-l-md" data-target="item-price" data-action="decrement">-</button><input type="number" id="item-price" placeholder="0.00" min="0" step="0.50" inputmode="decimal" class="w-full p-2 border-t border-b text-center focus:ring-2 ring-primary focus:outline-none bg-content border-color"><button class="adjust-btn rounded-r-md" data-target="item-price" data-action="increment">+</button></div>
                                </div>
                                <div>
                                    <label for="item-quantity" class="block text-sm font-medium">Cantidad</label>
                                    <div class="flex items-center mt-1"><button class="adjust-btn rounded-l-md" data-target="item-quantity" data-action="decrement">-</button><input type="number" id="item-quantity" value="1" min="1" class="w-full p-2 border-t border-b text-center focus:ring-2 ring-primary focus:outline-none bg-content border-color"><button class="adjust-btn rounded-r-md" data-target="item-quantity" data-action="increment">+</button></div>
                                </div>
                            </div>
                        </div>
                        <button id="add-item-btn" class="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover transition-all font-semibold">Agregar al Pedido</button>
                        <h4 class="font-semibold mt-6 mb-2">Items del Pedido:</h4>
                        <ul id="order-items-list" class="space-y-2"></ul>
                        <div class="mt-4 pt-4 border-t border-color font-bold text-lg text-right">Total: <span id="modal-total">$0.00</span></div>
                    </div>
                    <div class="p-6 bg-main rounded-b-lg flex justify-between items-center">
                         <button class="close-modal-btn bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400">Cerrar</button>
                         <button id="place-order-btn" class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 font-bold">Emitir Comanda</button>
                    </div>
                </div>`;
                modal.classList.remove('hidden');
                
                const itemSelect = modal.querySelector('#item-name-select');
                const priceInput = modal.querySelector('#item-price');

                itemSelect.onchange = () => {
                    const selectedOption = itemSelect.options[itemSelect.selectedIndex];
                    const price = selectedOption.dataset.price;
                    priceInput.value = price ? parseFloat(price).toFixed(2) : '';
                };
                
                modal.querySelector('#add-item-btn').onclick = addItemToOrder;
                modal.querySelector('.close-modal-btn').onclick = () => modal.classList.add('hidden');
                modal.querySelector('#place-order-btn').onclick = placeOrder;
                modal.querySelector('#order-items-list').addEventListener('click', (e) => { 
                    if(e.target.closest('.remove-item-btn')) {
                        state.currentOrderItems.splice(parseInt(e.target.closest('.remove-item-btn').dataset.index), 1);
                        renderOrderItemsInModal();
                    }
                });
                modal.addEventListener('click', (e) => {
                    if (e.target.classList.contains('adjust-btn')) {
                        const targetId = e.target.dataset.target;
                        const action = e.target.dataset.action;
                        const input = modal.querySelector(`#${targetId}`);
                        let currentValue = parseFloat(input.value) || 0;
                        if (targetId === 'item-price') {
                            const step = 0.50;
                            if (action === 'increment') currentValue += step;
                            else if (action === 'decrement' && currentValue >= step) currentValue -= step;
                            input.value = currentValue.toFixed(2);
                        } else {
                            if (action === 'increment') currentValue += 1;
                            else if (action === 'decrement' && currentValue > 1) currentValue -= 1;
                            input.value = currentValue;
                        }
                    }
                });
                renderOrderItemsInModal();
            }

            function addItemToOrder() {
                const modal = document.getElementById('generic-modal');
                const nameSelect = modal.querySelector('#item-name-select');
                const selectedOption = nameSelect.options[nameSelect.selectedIndex];
                if (!selectedOption.value) { return showNotification("Por favor, seleccione un platillo.", true); }
                const name = selectedOption.text;
                const price = parseFloat(modal.querySelector('#item-price').value);
                const quantity = parseInt(modal.querySelector('#item-quantity').value);
                const notes = modal.querySelector('#item-notes').value.trim();

                if (name && !isNaN(price) && price >= 0 && !isNaN(quantity) && quantity > 0) {
                    state.currentOrderItems.push({ name, quantity, price, notes });
                    nameSelect.value = '';
                    modal.querySelector('#item-price').value = '';
                    modal.querySelector('#item-quantity').value = 1;
                    modal.querySelector('#item-notes').value = '';
                    renderOrderItemsInModal();
                } else { showNotification('Por favor, verifique los campos.', true); }
            }

            function renderOrderItemsInModal() {
                const modal = document.getElementById('generic-modal');
                const list = modal.querySelector('#order-items-list');
                const totalEl = modal.querySelector('#modal-total');
                if (!list || !totalEl) return;
                list.innerHTML = ''; let total = 0;
                if (state.currentOrderItems.length === 0) { list.innerHTML = `<li class="text-secondary">Aún no hay items.</li>`; }
                state.currentOrderItems.forEach((item, index) => {
                    const itemTotal = item.price * item.quantity; total += itemTotal;
                    const li = document.createElement('li');
                    li.className = 'bg-main p-2 rounded';
                    li.innerHTML = `<div class="flex justify-between items-start">
                        <div>
                            <span>${item.quantity} x ${item.name} <span class="text-xs text-secondary">($${item.price.toFixed(2)} c/u)</span></span>
                            ${item.notes ? `<p class="text-xs text-secondary italic pl-2">&hookrightarrow; ${item.notes}</p>` : ''}
                        </div>
                        <div class="flex items-center">
                            <span class="font-semibold mr-4">$${itemTotal.toFixed(2)}</span>
                            <button data-index="${index}" class="remove-item-btn text-red-500 hover:text-red-700 font-bold text-xl px-2">&times;</button>
                        </div>
                    </div>`;
                    list.appendChild(li);
                });
                totalEl.textContent = `$${total.toFixed(2)}`;
            }
            
            function placeOrder() { 
                if (state.currentOrderItems.length === 0) { return showNotification('Debe agregar al menos un item al pedido.', true); }
                const newOrder = { 
                    id: crypto.randomUUID(),
                    tableNumber: state.selectedTable, 
                    items: state.currentOrderItems, 
                    status: 'pending', 
                    createdAt: new Date(), 
                    isArchived: false,
                    restaurantId: state.currentRestaurantId
                };
                state.orders.push(newOrder);
                document.getElementById('generic-modal').classList.add('hidden');
                render();
            }

            function handleUserFormSubmit(e) {
                e.preventDefault();
                const form = e.target;
                const container = form.closest('.md\\:col-span-1');
                const docId = container.querySelector('#user-doc-id').value;
                const username = container.querySelector('#user-username').value.trim();
                const name = container.querySelector('#user-name').value.trim();
                const password = container.querySelector('#user-password').value;
                const role = container.querySelector('#user-role').value;

                if (!username || !name) { return showNotification("Usuario y Nombre son obligatorios.", true); }

                const userData = { id: username, name, role, restaurantId: state.currentRestaurantId };
                if (password) userData.password = password;

                if (docId) { // Editing
                    const userIndex = state.users.findIndex(u => u.docId === docId);
                    if(userIndex > -1) {
                        const existingData = state.users[userIndex];
                        state.users[userIndex] = { ...existingData, ...userData, id: existingData.id }; // Keep original ID
                    }
                } else { // Creating
                    if (!password) { return showNotification("La contraseña es obligatoria para nuevos usuarios.", true); }
                    const existingUser = state.users.find(u => u.id === username && u.restaurantId === state.currentRestaurantId);
                    if (existingUser) { return showNotification(`El usuario '${username}' ya existe.`, true); }
                    userData.docId = crypto.randomUUID();
                    state.users.push(userData);
                }
                resetUserForm(container);
                showNotification(`Usuario '${username}' guardado correctamente.`);
                render();
            }

            function resetUserForm(container) { 
                const form = container.querySelector('#user-form');
                form.reset();
                form.querySelector('#user-doc-id').value = '';
                form.querySelector('#user-username').disabled = false;
                form.querySelector('#cancel-edit-btn').classList.add('hidden');
            }

            function handleUserActions(e, container) {
                const target = e.target;
                const docId = target.dataset.docid;
                if (!docId) return;

                if (target.classList.contains('edit-user-btn')) {
                    const user = state.users.find(u => u.docId === docId);
                    if (user) {
                        const form = container.querySelector('#user-form');
                        form.querySelector('#user-doc-id').value = user.docId;
                        const usernameInput = form.querySelector('#user-username');
                        usernameInput.value = user.id;
                        usernameInput.disabled = true;
                        form.querySelector('#user-name').value = user.name;
                        form.querySelector('#user-role').value = user.role;
                        form.querySelector('#cancel-edit-btn').classList.remove('hidden');
                    }
                } else if (target.classList.contains('delete-user-btn')) {
                    const userId = target.dataset.id;
                    showConfirmation(`¿Eliminar al usuario '${userId}'?`, () => deleteUser(docId));
                }
            }

            function deleteUser(docId) {
                state.users = state.users.filter(u => u.docId !== docId);
                showNotification(`Usuario eliminado.`);
                render();
            }

            function handleEndOfDayClick() {
                const ordersToClose = state.orders.filter(o => o.restaurantId === state.currentRestaurantId && o.status === 'paid' && !o.isArchived);
                if (ordersToClose.length === 0) { return showNotification("No hay órdenes pagadas para archivar.", true); }
                const totalSales = ordersToClose.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                
                const modal = document.getElementById('generic-modal');
                modal.innerHTML = `
                    <div class="bg-content rounded-lg shadow-xl w-full max-w-md p-6">
                        <h3 class="text-xl font-bold mb-4">Resumen de Cierre de Caja</h3>
                        <div class="space-y-2 text-lg">
                            <p><strong>Órdenes a Archivar:</strong> ${ordersToClose.length}</p>
                            <p><strong>Total Facturado:</strong> <span class="font-bold text-green-600">$${totalSales.toFixed(2)}</span></p>
                        </div>
                        <p class="text-sm text-secondary mt-4">Al confirmar, estas órdenes se archivarán y el historial diario se reiniciará.</p>
                        <div class="flex justify-end gap-4 mt-6">
                            <button class="close-modal-btn bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg">Cancelar</button>
                            <button class="eod-confirm px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold">Confirmar y Archivar</button>
                        </div>
                    </div>`;
                modal.classList.remove('hidden');

                const close = () => modal.classList.add('hidden');
                modal.querySelector('.eod-confirm').onclick = () => archivePaidOrders(ordersToClose, close);
                modal.querySelector('.close-modal-btn').onclick = close;
            }

            function archivePaidOrders(orders, callback) {
                orders.forEach(order => {
                    const orderInState = state.orders.find(o => o.id === order.id);
                    if(orderInState) orderInState.isArchived = true;
                });
                showNotification("Cierre de caja exitoso. El historial ha sido archivado.");
                callback();
                render();
            }
            
            // --- 6. LÓGICA DE DATOS LOCAL ---
            function loadAppSettings() {
                if (!state.appSettings[state.currentRestaurantId]) {
                    state.appSettings[state.currentRestaurantId] = { theme: 'default', tableCount: 12 };
                }
                applyTheme(state.appSettings[state.currentRestaurantId].theme);
            }

            function openEditRestaurantModal(restaurantId) {
                const restaurant = state.restaurants.find(r => r.id === restaurantId);
                if (!restaurant) return;
                
                const adminUser = state.users.find(u => u.restaurantId === restaurantId && u.role === "admin");

                const modal = document.getElementById('generic-modal');
                modal.innerHTML = `
                <div class="bg-content rounded-lg shadow-xl w-full max-w-md">
                    <div class="p-6 border-b border-color"><h3 class="text-xl font-bold">Editar Restaurante: ${restaurant.name}</h3></div>
                    <div class="p-6 space-y-4">
                        <div><label class="block text-sm font-medium">Nombre del Restaurante</label><input type="text" id="edit-res-name" class="mt-1 block w-full p-2 border border-color rounded-md bg-content" value="${restaurant.name}" required></div>
                        <hr/>
                        <h4 class="text-md font-semibold">Admin: ${adminUser ? adminUser.id : 'No encontrado'}</h4>
                        <div><label class="block text-sm font-medium">Nueva Contraseña de Admin (opcional)</label><input type="password" id="edit-res-admin-pass" class="mt-1 block w-full p-2 border border-color rounded-md bg-content" placeholder="Dejar en blanco para no cambiar"></div>
                    </div>
                     <div class="p-6 bg-main rounded-b-lg flex justify-end gap-4">
                         <button class="close-modal-btn bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400">Cancelar</button>
                         <button class="save-edit-res-btn bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover font-bold">Guardar Cambios</button>
                    </div>
                </div>`;
                modal.classList.remove('hidden');

                modal.querySelector('.close-modal-btn').onclick = () => modal.classList.add('hidden');
                modal.querySelector('.save-edit-res-btn').onclick = () => {
                    const newName = modal.querySelector('#edit-res-name').value;
                    const newPassword = modal.querySelector('#edit-res-admin-pass').value;
                    
                    const resIndex = state.restaurants.findIndex(r => r.id === restaurantId);
                    if(resIndex > -1) state.restaurants[resIndex].name = newName;
                    
                    if (newPassword && adminUser) {
                        const adminIndex = state.users.findIndex(u => u.docId === adminUser.docId);
                        if (adminIndex > -1) state.users[adminIndex].password = newPassword;
                    }
                    
                    showNotification("Restaurante actualizado.");
                    modal.classList.add('hidden');
                    render();
                };
            }

            function handleRestaurantFormSubmit(e) {
                e.preventDefault();
                const name = e.target.querySelector('#res-name').value;
                const id = e.target.querySelector('#res-id').value;
                const adminUser = e.target.querySelector('#res-admin-user').value;
                const adminPass = e.target.querySelector('#res-admin-pass').value;

                if (!name || !id || !adminUser || !adminPass) { return showNotification("Todos los campos son obligatorios.", true); }
                
                const resDoc = state.restaurants.find(r => r.id === id);
                if (resDoc) { return showNotification("Ese ID de restaurante ya existe.", true); }

                state.restaurants.push({ id: id, name: name, isActive: true });
                state.users.push({ docId: crypto.randomUUID(), id: adminUser, name: "Administrador", password: adminPass, role: "admin", restaurantId: id });
                state.appSettings[id] = { theme: 'default', tableCount: 12 };

                showNotification("Restaurante creado exitosamente.");
                e.target.reset();
                render();
            }
            
            function handleAccessToggle(restaurantId, newStatus) {
                const resIndex = state.restaurants.findIndex(r => r.id === restaurantId);
                if (resIndex > -1) {
                    state.restaurants[resIndex].isActive = newStatus;
                    showNotification(`Acceso para '${restaurantId}' actualizado.`);
                    render();
                }
            }
            
            function handleSaveTableCount() {
                const newCount = parseInt(document.getElementById('table-count-input').value);
                if (isNaN(newCount) || newCount < 1) {
                    showNotification("Por favor, introduce un número válido de mesas.", true);
                    return;
                }
                state.appSettings[state.currentRestaurantId].tableCount = newCount;
                showNotification("Número de mesas actualizado.");
                render();
            }
            
            function updateTheme(themeName) {
                state.appSettings[state.currentRestaurantId].theme = themeName;
                showNotification('Tema actualizado.');
                render();
            }
            
            function applyTheme(theme) { 
                document.body.className = '';
                document.body.classList.add(`theme-${theme}`);
            }

            function updateOrderStatus(orderId, newStatus) {
                const order = state.orders.find(o => o.id === orderId);
                if (order) {
                    order.status = newStatus;
                    render();
                }
            }

            function cleanTable(orderId) {
                const order = state.orders.find(o => o.id === orderId);
                if (order) {
                    order.tableCleaned = true;
                    showNotification("Mesa marcada como limpia.");
                    render();
                }
            }
            
            function openPOSModal(orderId) {
                const order = state.orders.find(o => o.id === orderId);
                if (!order) return;

                const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const modal = document.getElementById('generic-modal');
                modal.innerHTML = `
                <div class="bg-content rounded-lg shadow-xl w-full max-w-lg">
                    <div class="p-6 border-b border-color"><h3 class="text-xl font-bold">Punto de Venta - Mesa ${order.tableNumber}</h3></div>
                    <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="col-span-2 md:col-span-1">
                            <h4 class="font-semibold mb-2">Resumen del Pedido</h4>
                            <ul class="space-y-1 text-sm max-h-60 overflow-y-auto pr-2">
                                ${order.items.map(item => `
                                    <li class="flex justify-between">
                                        <span>${item.quantity}x ${item.name}</span>
                                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                                    </li>
                                `).join('')}
                            </ul>
                            <div class="mt-4 pt-4 border-t border-color font-bold text-2xl text-right">Total a Pagar: $${total.toFixed(2)}</div>
                        </div>
                        <div class="col-span-2 md:col-span-1 space-y-4">
                             <h4 class="font-semibold mb-2">Métodos de Pago</h4>
                             <div class="space-y-2">
                                <div><label class="flex items-center gap-2"><input type="checkbox" data-method="Efectivo" class="payment-method-toggle form-checkbox"> Efectivo</label><input type="number" data-input="Efectivo" class="payment-amount-input mt-1 hidden w-full p-2 border border-color rounded-md bg-content text-primary" placeholder="Monto"></div>
                                <div><label class="flex items-center gap-2"><input type="checkbox" data-method="Tarjeta" class="payment-method-toggle form-checkbox"> Tarjeta</label><input type="number" data-input="Tarjeta" class="payment-amount-input mt-1 hidden w-full p-2 border border-color rounded-md bg-content text-primary" placeholder="Monto"></div>
                                <div><label class="flex items-center gap-2"><input type="checkbox" data-method="Transferencia" class="payment-method-toggle form-checkbox"> Transferencia / Otro</label><input type="number" data-input="Transferencia" class="payment-amount-input mt-1 hidden w-full p-2 border border-color rounded-md bg-content text-primary" placeholder="Monto"></div>
                             </div>
                             <div class="mt-4 pt-4 border-t border-color space-y-2 text-lg">
                                 <div>Total Pagado: <span id="total-paid" class="font-bold">$0.00</span></div>
                                 <div>Restante: <span id="remaining-due" class="font-bold text-red-600">$${total.toFixed(2)}</span></div>
                                 <div id="change-due-section" class="hidden">Cambio: <span id="change-due" class="font-bold text-green-600">$0.00</span></div>
                             </div>
                        </div>
                    </div>
                     <div class="p-6 bg-main rounded-b-lg flex justify-end gap-4">
                         <button class="close-modal-btn bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400">Cancelar</button>
                         <button id="finalize-sale-btn" class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 font-bold" disabled>Finalizar Venta</button>
                    </div>
                </div>`;
                modal.classList.remove('hidden');
                
                const amountInputs = modal.querySelectorAll('.payment-amount-input');
                const finalizeBtn = modal.querySelector('#finalize-sale-btn');

                function updatePaymentSummary() {
                    let totalPaid = 0;
                    amountInputs.forEach(input => {
                        totalPaid += parseFloat(input.value) || 0;
                    });

                    const remaining = total - totalPaid;
                    modal.querySelector('#total-paid').textContent = `$${totalPaid.toFixed(2)}`;
                    modal.querySelector('#remaining-due').textContent = `$${remaining > 0 ? remaining.toFixed(2) : '0.00'}`;
                    modal.querySelector('#remaining-due').classList.toggle('text-red-600', remaining > 0);
                    
                    const changeSection = modal.querySelector('#change-due-section');
                    if (remaining < 0) {
                        changeSection.classList.remove('hidden');
                        modal.querySelector('#change-due').textContent = `$${(-remaining).toFixed(2)}`;
                    } else {
                        changeSection.classList.add('hidden');
                    }

                    finalizeBtn.disabled = totalPaid < total;
                }

                modal.querySelectorAll('.payment-method-toggle').forEach(checkbox => {
                    checkbox.onchange = () => {
                        const input = modal.querySelector(`input[data-input="${checkbox.dataset.method}"]`);
                        input.style.display = checkbox.checked ? 'block' : 'none';
                        if (!checkbox.checked) {
                            input.value = '';
                            updatePaymentSummary();
                        }
                    };
                });

                amountInputs.forEach(input => input.oninput = updatePaymentSummary);

                modal.querySelector('.close-modal-btn').onclick = () => modal.classList.add('hidden');
                modal.querySelector('#finalize-sale-btn').onclick = () => {
                    const paymentDetails = [];
                    modal.querySelectorAll('.payment-method-toggle:checked').forEach(checkbox => {
                        const method = checkbox.dataset.method;
                        const amount = parseFloat(modal.querySelector(`input[data-input="${method}"]`).value) || 0;
                        if (amount > 0) {
                            paymentDetails.push({ method, amount });
                        }
                    });

                    if (paymentDetails.length > 0) {
                        finalizeSale(orderId, total, paymentDetails);
                        modal.classList.add('hidden');
                    } else {
                        showNotification("Debe ingresar un monto en al menos un método de pago.", true);
                    }
                };
            }

            function finalizeSale(orderId, totalAmount, paymentDetails) {
                const orderIndex = state.orders.findIndex(o => o.id === orderId);
                if (orderIndex > -1) {
                    state.orders[orderIndex] = {
                        ...state.orders[orderIndex],
                        status: 'paid',
                        tableCleaned: false,
                        paymentDetails: paymentDetails,
                        totalAmount: totalAmount,
                        paidAt: new Date()
                    };
                    showNotification("Venta finalizada exitosamente. La mesa necesita limpieza.");
                    render();
                } else {
                    showNotification("Error al finalizar la venta.", true);
                }
            }
            
            function generateReport(range) {
                let startDate = new Date();
                startDate.setHours(0, 0, 0, 0);

                switch(range) {
                    case 'yesterday': startDate.setDate(startDate.getDate() - 1); break;
                    case 'week': startDate.setDate(startDate.getDate() - 6); break;
                    case 'month': startDate.setDate(1); break;
                }
                
                const endDate = new Date();
                if (range === 'yesterday') { endDate.setDate(endDate.getDate() - 1); }
                endDate.setHours(23, 59, 59, 999);

                const paidOrders = state.orders.filter(o => o.restaurantId === state.currentRestaurantId && o.status === 'paid' && o.paidAt && o.paidAt >= startDate && o.paidAt <= endDate);

                const totalSales = paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                const orderCount = paidOrders.length;
                const avgTicket = orderCount > 0 ? totalSales / orderCount : 0;
                
                document.getElementById('report-total-sales').textContent = `$${totalSales.toFixed(2)}`;
                document.getElementById('report-order-count').textContent = orderCount;
                document.getElementById('report-avg-ticket').textContent = `$${avgTicket.toFixed(2)}`;

                const topItems = {};
                paidOrders.forEach(order => {
                    order.items.forEach(item => {
                        topItems[item.name] = (topItems[item.name] || 0) + item.quantity;
                    });
                });
                const sortedItems = Object.entries(topItems).sort((a, b) => b[1] - a[1]);
                const topItemsTbody = document.getElementById('report-top-items');
                topItemsTbody.innerHTML = sortedItems.map(item => `<tr><td class="p-2">${item[0]}</td><td class="p-2">${item[1]}</td></tr>`).join('');
                
                const transactionsTbody = document.getElementById('report-transactions');
                transactionsTbody.innerHTML = paidOrders
                    .sort((a, b) => b.paidAt - a.paidAt)
                    .map(order => {
                        const paymentMethod = order.paymentDetails ? order.paymentDetails.map(p => p.method).join(', ') : (order.paymentMethod || 'N/A');
                        return `
                        <tr>
                            <td class="p-2">${order.paidAt.toLocaleTimeString()}</td>
                            <td class="p-2">${order.tableNumber}</td>
                            <td class="p-2">$${(order.totalAmount || 0).toFixed(2)}</td>
                            <td class="p-2">${paymentMethod}</td>
                        </tr>`
                    }).join('');
            }

            function handleClearReports() {
                const paidOrders = state.orders.filter(o => o.restaurantId === state.currentRestaurantId && o.status === 'paid' && !o.isArchived);
                if (paidOrders.length === 0) {
                    return showNotification("No hay reportes para limpiar.", true);
                }
                showConfirmation(`¿Estás seguro de que quieres archivar ${paidOrders.length} órdenes pagadas? Esta acción limpiará los reportes.`, () => {
                    archivePaidOrders(paidOrders, () => {
                        showNotification("Todos los reportes han sido archivados.");
                    });
                });
            }
            
            function handleMenuItemFormSubmit(e) {
                e.preventDefault();
                const form = e.target;
                const docId = form.querySelector('#menu-item-doc-id').value;
                const name = form.querySelector('#menu-item-name').value.trim();
                const price = parseFloat(form.querySelector('#menu-item-price').value);
                const category = form.querySelector('#menu-item-category').value.trim();

                if (!name || isNaN(price) || !category) { return showNotification("Todos los campos son obligatorios.", true); }

                const menuItemData = { name, price, category, restaurantId: state.currentRestaurantId };

                if (docId) {
                    const itemIndex = state.menuItems.findIndex(i => i.docId === docId);
                    if (itemIndex > -1) state.menuItems[itemIndex] = { ...state.menuItems[itemIndex], ...menuItemData };
                } else {
                    menuItemData.docId = crypto.randomUUID();
                    state.menuItems.push(menuItemData);
                }
                resetMenuItemForm(form.closest('.md\\:col-span-1'));
                showNotification(`Platillo '${name}' guardado correctamente.`);
                render();
            }

            function resetMenuItemForm(container) {
                const form = container.querySelector('#menu-item-form');
                form.reset();
                form.querySelector('#menu-item-doc-id').value = '';
                form.querySelector('#cancel-edit-menu-item-btn').classList.add('hidden');
            }

            function handleMenuItemActions(e, container) {
                const target = e.target;
                const docId = target.dataset.docid;
                if (!docId) return;

                if (target.classList.contains('edit-menu-item-btn')) {
                    const item = state.menuItems.find(i => i.docId === docId);
                    if (item) {
                        const form = container.querySelector('#menu-item-form');
                        form.querySelector('#menu-item-doc-id').value = item.docId;
                        form.querySelector('#menu-item-name').value = item.name;
                        form.querySelector('#menu-item-price').value = item.price;
                        form.querySelector('#menu-item-category').value = item.category;
                        form.querySelector('#cancel-edit-menu-item-btn').classList.remove('hidden');
                    }
                } else if (target.classList.contains('delete-menu-item-btn')) {
                    const item = state.menuItems.find(i => i.docId === docId);
                    showConfirmation(`¿Eliminar el platillo '${item.name}'?`, () => deleteMenuItem(docId));
                }
            }

            function deleteMenuItem(docId) {
                state.menuItems = state.menuItems.filter(i => i.docId !== docId);
                showNotification(`Platillo eliminado.`);
                render();
            }

            // --- INICIALIZACIÓN ---
            loadState();
            render();

        } catch (e) {
            console.error("Error de inicialización:", e);
            document.getElementById('login-modal').innerHTML = `<div class="bg-white rounded-lg shadow-xl p-8 text-center"><h2 class="text-2xl font-bold text-red-600 mb-4">Error Crítico</h2><p>La aplicación no pudo iniciarse. Revisa la consola para más detalles.</p></div>`;
        }