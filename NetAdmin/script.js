
        /*
         * Copyright (c) 2026 [Leonardo Montiel / Espiral].
         * Todos los derechos reservados.
         */
        /* memorizar sección */ 
        // --- Lógica de Persistencia ---

                document.addEventListener("DOMContentLoaded", () => {
                    // 1. Recuperar sesión y pestaña guardada
                    const sessionActive = localStorage.getItem("isLoggedIn");
                    const lastTab = localStorage.getItem("currentTab");
                
                    // 2. Si hay sesión activa, ocultar login y mostrar la app
                    if (sessionActive === "true") {
                        document.getElementById("login-screen").classList.add("hidden");
                        document.getElementById("app-container").classList.add("visible"); // Asegúrate que no tenga display:none
                        
                        // 3. Restaurar la última pestaña visitada
                        if (lastTab) {
                            switchTab(lastTab);
                        }
                    }
                });
                
                // 4. Modificar tu función de Login existente para guardar el éxito
                // (Busca tu función authLogin y asegúrate de añadir esta línea al validar la contraseña)
                function authLogin(mode) {
                    // ... tu lógica de validación actual ...
                    // Si el password es correcto:
                    localStorage.setItem("isLoggedIn", "true");
                    // ... resto de tu función para mostrar el app-container ...
                }
                
                // 5. Envolver la función switchTab para que memorice cada cambio
                const originalSwitchTab = window.switchTab; 
                window.switchTab = function(tabName) {
                    // Guardamos en el navegador el nombre de la pestaña
                    localStorage.setItem("currentTab", tabName);
                    
                    // Llamamos a la lógica original que ya tienes escrita
                    if (typeof originalSwitchTab === "function") {
                        originalSwitchTab(tabName);
                    } else {
                        // Si no tienes la función definida aún, aquí está la lógica básica:
                        document.querySelectorAll('.searchable-view, #view-tools').forEach(v => v.classList.add('hidden'));
                        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                        
                        const targetView = document.getElementById('view-' + tabName);
                        if (targetView) targetView.classList.remove('hidden');
                        // Aquí deberías añadir la clase active al elemento del menú correspondiente
                    }
                };
                
                // 6. Opcional: Botón de Cerrar Sesión
                function logout() {
                    localStorage.removeItem("isLoggedIn");
                    localStorage.removeItem("currentTab");
                    location.reload(); // Recarga para volver al login
                }

        document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'F12' || e.keyCode === 123) { e.preventDefault(); return false; }
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) { e.preventDefault(); return false; }
            if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) { e.preventDefault(); return false; }
        });
        
        const GH = { USER: 'leoemg365', REPO: 'Formatos', FILE: 'db.json' };
        
        let db = null;
        let isAdmin = false; let adminPass = ''; let ghToken = ''; let fileSha = null;
        let hasUnsavedChanges = false; 
        
        let currentRespFilterMain = 'General'; let currentRespFilterSub = 'Todas';
        let currentNewsFilter = 'Todas';
        let currentToolMode = 'rep'; 
        
        let dailyExitTime = null; let alarmTriggered = false; const alarmAudio = document.getElementById('alarm-sound');
        let formCallback = null; let confirmCallback = null; let textToCopyFromPreview = "";
        
        // REPORTE 5 VARIABLES
        let currentRepMode = 1; let r4Status = 'PRESENTADA'; let finalReportAsterisks = "";
        let r5Nodes = []; let r5Status = 'ACTIVO'; 

        window.onbeforeunload = function() {
            if(hasUnsavedChanges) return "¿Tienes cambios sin guardar. Seguro que quieres salir?";
        };

        window.onload = function() {
            const hourSelects = ['ts-hour','r1-hin','r1-hout','r2-h','r3-hin','r3-hout','r4-hin','r4-hout'];
            hourSelects.forEach(id => {
                const el = document.getElementById(id);
                for(let i=1; i<=12; i++) el.appendChild(new Option(i, i));
                if(id.includes('hin') || id.includes('hout')) el.value = "7";
            });
            document.getElementById('r4-fecha').value = new Date().toLocaleDateString('es-VE');

            const savedName = localStorage.getItem('report_operator');
            if(savedName) document.getElementById('rep-operador').value = savedName;
            loadRepTimes();

            if(localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
            const savedToken = localStorage.getItem('gh_token');
            if(savedToken) document.getElementById('token-admin').value = savedToken;

            setInterval(checkTime, 30000);

            const session = JSON.parse(localStorage.getItem('netAdminSession'));
            if(session) {
                isAdmin = session.isAdmin; adminPass = session.adminPass; ghToken = session.ghToken; dailyExitTime = session.exitTime;
                enterApp(session.name, true);
            }

            document.body.addEventListener('click', function unlockAudio() {
                alarmAudio.play().then(() => {
                    alarmAudio.pause();
                    alarmAudio.currentTime = 0;
                }).catch(e => {}); 
                document.body.removeEventListener('click', unlockAudio);
            }, { once: true });

            document.addEventListener('paste', e => {
                if(currentToolMode === 'ocr') {
                    const items = e.clipboardData.items;
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf('image') !== -1) {
                            processOCR(items[i].getAsFile());
                            break;
                        }
                    }
                }
            });

            const dropzone = document.getElementById('ocr-dropzone');
            if(dropzone) {
                dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.style.borderColor = 'var(--primary)'; });
                dropzone.addEventListener('dragleave', e => { e.preventDefault(); dropzone.style.borderColor = 'var(--border)'; });
                dropzone.addEventListener('drop', e => {
                    e.preventDefault(); dropzone.style.borderColor = 'var(--border)';
                    if(e.dataTransfer.files.length > 0) processOCR(e.dataTransfer.files[0]);
                });
            }
        };

        function switchLoginMode(mode) {
            document.getElementById('login-title').innerText = mode === 'admin' ? "Acceso Admin" : "Acceso Soporte";
            document.getElementById('login-mode-support').classList.toggle('hidden', mode === 'admin');
            document.getElementById('login-mode-admin').classList.toggle('hidden', mode !== 'admin');
            if(mode === 'support') document.getElementById('pass-support').focus(); else document.getElementById('pass-admin').focus();
        }

        function setExitTime() {
            let h = parseInt(document.getElementById('ts-hour').value); const m = document.getElementById('ts-min').value; const ampm = document.getElementById('ts-ampm').value;
            if(ampm === 'PM' && h !== 12) h += 12; if(ampm === 'AM' && h === 12) h = 0;
            dailyExitTime = `${String(h).padStart(2,'0')}:${m}`;
        }

        async function authLogin(mode) {
            const btn = mode === 'admin' ? document.getElementById('btn-login-admin') : document.getElementById('btn-login-support');
            const loader = btn.querySelector('.loader'); const span = btn.querySelector('span:not(.loader)');
            loader.style.display = 'inline-block'; span.innerText = 'Verificando...'; btn.disabled = true;

            try {
                const url = `https://api.github.com/repos/${GH.USER}/${GH.REPO}/contents/${GH.FILE}`;
                const res = await fetch(url);
                if(!res.ok) throw new Error("Error al conectar con la Nube");
                const data = await res.json(); fileSha = data.sha;
                db = JSON.parse(decodeURIComponent(escape(atob(data.content))));
                if(!db.config) db.config = { supportPass: "45637954", adminPass: "0800" };
                if(!db.electricalNodes) db.electricalNodes = ['Mecocal', 'Ciudad Ojeda']; // Inicializa BD Rep 5

                if(mode === 'support') {
                    const p = document.getElementById('pass-support').value;
                    if(p !== db.config.supportPass) throw new Error("Contraseña Incorrecta");
                    isAdmin = false; enterApp("Soporte", false);
                } else {
                    const p = document.getElementById('pass-admin').value; const t = document.getElementById('token-admin').value.trim();
                    if(p !== db.config.adminPass) throw new Error("Contraseña Admin Incorrecta");
                    if(!t) throw new Error("Falta Token de GitHub");
                    isAdmin = true; adminPass = p; ghToken = t; localStorage.setItem('gh_token', t);
                    enterApp("Administrador", false);
                }
            } catch(e) { alert(e.message); } 
            finally { loader.style.display = 'none'; span.innerText = mode === 'admin' ? 'Acceso Total' : 'Ingresar'; btn.disabled = false; }
        }

        function enterApp(name, isAuto = false) {
            if(!isAuto) {
                setExitTime();
                localStorage.setItem('netAdminSession', JSON.stringify({ name: name, isAdmin: isAdmin, adminPass: adminPass, ghToken: ghToken, exitTime: dailyExitTime }));
            }
            if(dailyExitTime) {
                let [h, m] = dailyExitTime.split(':'); let ampm = h >= 12 ? 'PM' : 'AM'; let h12 = h % 12 || 12;
                document.getElementById('display-time').innerText = `${h12}:${m} ${ampm}`;
            }

            document.getElementById('login-screen').classList.add('hidden'); document.getElementById('app-container').classList.add('visible');
            document.getElementById('username-display').innerText = name;
            
            if(isAdmin) { 
                document.getElementById('admin-badge').style.display = 'inline-block'; 
                document.getElementById('admin-security-box').classList.remove('hidden'); 
                document.getElementById('r5-admin-tools').classList.remove('hidden');
            }
            if ("Notification" in window) Notification.requestPermission();
            
            if(isAuto && !db) fetchData(); 
            else {
                document.getElementById('sync-status').innerHTML = "☁️ <span>Conectado</span>"; document.getElementById('sync-status').style.color = "var(--success)";
                renderAll(); updateR5Dropdown(); updateLivePreview(); checkNotifications();
                if(isAdmin) { document.getElementById('cfg-sup-pass').value = db.config.supportPass; document.getElementById('cfg-adm-pass').value = db.config.adminPass; }
            }
        }

        function openSettings() { openModal('settings-modal'); }
        
        function logoutApp() { 
            let msg = hasUnsavedChanges ? "⚠️ TIENES CAMBIOS SIN GUARDAR.\nSi sales ahora, los cambios hechos en esta sesión se perderán para siempre.\n\n¿Seguro que deseas salir y borrar la sesión?" : "¿Seguro que deseas salir y borrar la sesión actual?";
            openConfirm("Cerrar Sesión", msg, false, () => { 
                hasUnsavedChanges = false; localStorage.removeItem('netAdminSession'); location.reload(); 
            }); 
        }

        function markUnsaved() {
            hasUnsavedChanges = true;
            document.getElementById('sync-status').classList.add('hidden');
            document.getElementById('btn-save-batch').classList.remove('hidden');
            renderAll(); checkNotifications();
        }

        async function fetchData() {
            const status = document.getElementById('sync-status');
            const url = `https://api.github.com/repos/${GH.USER}/${GH.REPO}/contents/${GH.FILE}`;
            const headers = isAdmin ? { 'Authorization': `token ${ghToken}` } : {}; 
            try {
                const res = await fetch(url, { headers }); if(!res.ok) throw new Error();
                const data = await res.json(); fileSha = data.sha;
                db = JSON.parse(decodeURIComponent(escape(atob(data.content))));
                if(!db.config) db.config = { supportPass: "45637954", adminPass: "0800" };
                if(!db.electricalNodes) db.electricalNodes = ['Mecocal', 'Ciudad Ojeda']; 
                
                status.innerHTML = "☁️ <span>Conectado</span>"; status.style.color = "var(--success)";
                renderAll(); updateR5Dropdown(); updateLivePreview(); checkNotifications();
                if(isAdmin) { document.getElementById('cfg-sup-pass').value = db.config.supportPass; document.getElementById('cfg-adm-pass').value = db.config.adminPass; }
            } catch(e) { status.innerHTML = "⚠️ <span>Sin conexión</span>"; status.style.color = "var(--danger)"; }
        }

        async function pushData() {
            if(!isAdmin) return;
            const btn = document.getElementById('btn-save-batch'); const loader = document.getElementById('save-loader'); const txt = document.getElementById('save-text');
            loader.style.display = 'inline-block'; txt.innerText = 'Guardando...'; btn.disabled = true;

            const url = `https://api.github.com/repos/${GH.USER}/${GH.REPO}/contents/${GH.FILE}`;
            const body = { message: "Update via WebApp (Batch)", content: btoa(unescape(encodeURIComponent(JSON.stringify(db, null, 2)))), sha: fileSha };
            try {
                const res = await fetch(url, { method:'PUT', headers: {'Authorization': `token ${ghToken}`, 'Content-Type': 'application/json'}, body: JSON.stringify(body) });
                if(res.ok) { 
                    fileSha = (await res.json()).content.sha; hasUnsavedChanges = false; btn.classList.add('hidden');
                    const status = document.getElementById('sync-status'); status.classList.remove('hidden'); status.innerHTML = "☁️ <span>Guardado con éxito</span>"; 
                    setTimeout(()=>status.innerHTML="☁️ <span>Conectado</span>", 2500); 
                } else throw new Error();
            } catch(e) { alert("Error al subir a GitHub. Verifica tu Token."); }
            finally { loader.style.display = 'none'; txt.innerText = '💾 Guardar en la Nube'; btn.disabled = false; }
        }

        function checkNotifications() {
            if(!db) return;
            let maxNewsId = db.news.length > 0 ? Math.max(...db.news.map(n => n.id)) : 0;
            let lastSeenNews = parseInt(localStorage.getItem('lastSeenNews')) || 0;
            let bNews = document.getElementById('badge-news'); let unseenNews = db.news.filter(n => n.id > lastSeenNews).length;
            if(unseenNews > 0 && document.getElementById('view-news').classList.contains('hidden')) { bNews.innerText = unseenNews; bNews.style.display = 'inline-block'; } 
            else { bNews.style.display = 'none'; if(!document.getElementById('view-news').classList.contains('hidden')) localStorage.setItem('lastSeenNews', maxNewsId); }

            let maxRespId = 0; let unseenResp = 0; let lastSeenResp = parseInt(localStorage.getItem('lastSeenResp')) || 0;
            db.responses.forEach(list => list.cards.forEach(c => { maxRespId = Math.max(maxRespId, c.id); if(c.id > lastSeenResp) unseenResp++; }));
            let bResp = document.getElementById('badge-resp');
            if(unseenResp > 0 && document.getElementById('view-resp').classList.contains('hidden')) { bResp.innerText = unseenResp; bResp.style.display = 'inline-block'; } 
            else { bResp.style.display = 'none'; if(!document.getElementById('view-resp').classList.contains('hidden')) localStorage.setItem('lastSeenResp', maxRespId); }
        }

        function switchTab(t) {
            document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active')); event.target.classList.add('active');
            ['clip','pass','resp','news','tools'].forEach(v => document.getElementById(`view-${v}`).classList.add('hidden'));
            document.getElementById(`view-${t}`).classList.remove('hidden'); document.getElementById('search-bar').value = ''; filterUniversal(); checkNotifications(); 
        }

        function filterUniversal() {
            const query = document.getElementById('search-bar').value.toLowerCase();
            const views = document.querySelectorAll('.searchable-view:not(.hidden)');
            if(query.trim() === '') {
                document.querySelectorAll('.card, .list-box').forEach(el => el.style.display = '');
                if(!document.getElementById('view-resp').classList.contains('hidden')) filterRespSub(currentRespFilterSub);
                if(!document.getElementById('view-news').classList.contains('hidden')) filterNews(currentNewsFilter);
                return;
            }
            if(!document.getElementById('view-resp').classList.contains('hidden')) document.querySelectorAll('#view-resp .card').forEach(c => c.style.display = '');
            if(!document.getElementById('view-news').classList.contains('hidden')) document.querySelectorAll('#view-news .card').forEach(c => c.style.display = '');

            views.forEach(view => {
                view.querySelectorAll('.list-box, #resp-grid, #news-grid').forEach(container => {
                    let hasVis = false;
                    container.querySelectorAll('.card').forEach(card => {
                        if(card.innerText.toLowerCase().includes(query)) { card.style.display = ''; hasVis = true; } else card.style.display = 'none';
                    });
                    if(container.classList.contains('list-box')) {
                        if(container.querySelector('.list-head span').innerText.toLowerCase().includes(query)) { container.style.display = ''; container.querySelectorAll('.card').forEach(c => c.style.display = ''); } 
                        else container.style.display = hasVis ? '' : 'none';
                    }
                });
            });
        }

        function renderAll() {
            if(!db) return;
            renderGeneric('clipboard', 'view-clip'); renderGeneric('passwords', 'view-pass'); renderResp(); renderNews(); filterUniversal();
        }

        function getMoveBtnsHtml(type, lIdx, cIdx, arrLength) {
            if(!isAdmin) return '';
            let up = cIdx > 0 ? `<button class="mini-btn move-btn" title="Subir" onclick="event.stopPropagation(); moveCard('${type}',${lIdx},${cIdx},-1)">⬆️</button>` : '';
            let down = cIdx < arrLength - 1 ? `<button class="mini-btn move-btn" title="Bajar" onclick="event.stopPropagation(); moveCard('${type}',${lIdx},${cIdx},1)">⬇️</button>` : '';
            return up + down;
        }

        function renderGeneric(type, divId) {
            const div = document.getElementById(divId); div.innerHTML='';
            db[type].forEach((list, lIdx) => {
                const box = document.createElement('div'); box.className='list-box';
                let moveListBtns = isAdmin ? (lIdx > 0 ? `<button class="mini-btn move-btn" onclick="moveList('${type}',${lIdx},-1)">⬆️</button>` : '') + (lIdx < db[type].length - 1 ? `<button class="mini-btn move-btn" onclick="moveList('${type}',${lIdx},1)">⬇️</button>` : '') : '';
                let adminBtns = isAdmin ? `<div style="display:flex; gap:5px">${moveListBtns}<button class="mini-btn" title="Editar Lista" onclick="reqAdminEditList('${type}',${lIdx})">✏️</button><button class="mini-btn" style="color:var(--danger);" onclick="reqAdminDel(()=>delList('${type}',${lIdx}))">🗑️</button></div>` : '';
                box.innerHTML = `<div class="list-head"><span>${list.title}</span>${adminBtns}</div><div class="grid"></div>`;
                const grid = box.querySelector('.grid');
                list.cards.forEach((c, cIdx) => {
                    const d = document.createElement('div');
                    let actHtml = `<div class="actions">${getMoveBtnsHtml(type, lIdx, cIdx, list.cards.length)}<button class="mini-btn" title="Ver completo" onclick="event.stopPropagation(); openPreview('${c.label}', \`${type==='passwords' ? `Usuario: ${c.user}\nClave: ${c.pass}` : c.content}\`, \`${type==='passwords'? c.pass : c.content}\`)">👁️</button>${isAdmin ? `<button class="mini-btn" onclick="event.stopPropagation(); reqAdminEditCard('${type}',${lIdx},${cIdx})">✏️</button><button class="mini-btn" style="color:var(--danger);" onclick="event.stopPropagation(); reqAdminDel(()=>delCard('${type}',${lIdx},${cIdx}))">🗑️</button>` : ''}</div>`;
                    if(type==='clipboard') { d.className='card'; d.onclick=()=>copy(c.content); d.innerHTML=`<div class="card-label">${c.label}</div><div class="card-val">${c.content}</div>${actHtml}`; } 
                    else { d.className='card pass-card'; d.innerHTML=`<div class="card-label">${c.label}</div><div class="cred-row"><span>👤 <strong style="color:var(--text-main)">${c.user}</strong></span><button class="mini-btn" style="width:auto; padding:2px 8px" onclick="event.stopPropagation(); copy('${c.user}')">Copiar</button></div><div class="cred-row"><span class="blur">🔑 <strong>${c.pass}</strong></span><button class="mini-btn" style="width:auto; padding:2px 8px" onclick="event.stopPropagation(); copy('${c.pass}')">Copiar</button></div>${actHtml}`; }
                    grid.appendChild(d);
                });
                if(isAdmin) { const add = document.createElement('div'); add.className='card btn-add'; add.innerHTML='<span>+ Tarjeta</span>'; add.onclick=()=> reqAdminAddCard(type, lIdx); grid.appendChild(add); }
                div.appendChild(box);
            });
            if(isAdmin) { const btn = document.createElement('button'); btn.className='btn-large'; btn.style.background='var(--bg-input)'; btn.style.color='var(--text-main)'; btn.innerHTML='+ Crear Lista'; btn.onclick=()=> openForm("Nueva Lista", [{id:'l_name', p:'Nombre'}], (v)=>{ db[type].push({id:Date.now(), title:v[0], cards:[]}); markUnsaved(); }); div.appendChild(btn); }
        }

        function renderResp() {
            const grid = document.getElementById('resp-grid'); grid.innerHTML = '';
            const targetList = db.responses.find(r => r.title === currentRespFilterMain);
            let subcats = new Set(['Todas']);

            if(targetList) {
                const lIdx = db.responses.indexOf(targetList);
                targetList.cards.forEach((c, cIdx) => {
                    if(c.subcat) subcats.add(c.subcat);
                    if(currentRespFilterSub !== 'Todas' && c.subcat !== currentRespFilterSub) return;

                    const d = document.createElement('div'); d.className = `card resp-card color-${c.color || 'neutro'}`; d.onclick=()=>copy(c.content);
                    let actHtml = `<div class="actions">${getMoveBtnsHtml('responses', lIdx, cIdx, targetList.cards.length)}<button class="mini-btn" onclick="event.stopPropagation(); openPreview('${c.label}', \`${c.content}\`, \`${c.content}\`)">👁️</button>${isAdmin ? `<button class="mini-btn" onclick="event.stopPropagation(); reqAdminEditCardResp(${lIdx},${cIdx})">✏️</button><button class="mini-btn" style="color:var(--danger);" onclick="event.stopPropagation(); reqAdminDel(()=>delCardResp(${lIdx},${cIdx}))">🗑️</button>` : ''}</div>`;
                    let subBadge = c.subcat && c.subcat !== 'General' ? `<span style="font-size:0.7rem; color:var(--text-sec); display:block; margin-bottom:2px">📁 ${c.subcat}</span>` : '';
                    d.innerHTML = `${subBadge}<div class="card-label">${c.label}</div><div class="card-val">${c.content}</div>${actHtml}`; grid.appendChild(d);
                });
            } else grid.innerHTML = '<div style="color:var(--text-sec); text-align:center; padding:20px; width:100%">No hay respuestas aquí.</div>';
            
            const subFilterBox = document.getElementById('resp-filters-sub'); subFilterBox.innerHTML = '';
            if(subcats.size > 1) {
                subcats.forEach(sc => {
                    const p = document.createElement('div'); p.className = `pill pill-sec ${sc === currentRespFilterSub ? 'active' : ''}`;
                    p.innerText = sc; p.onclick = () => filterRespSub(sc); subFilterBox.appendChild(p);
                });
            }
            document.querySelectorAll('#resp-filters-main .pill').forEach(p => p.classList.toggle('active', p.innerText.includes(currentRespFilterMain)));
            const tools = document.getElementById('resp-admin-tools'); tools.innerHTML = '';
            if(isAdmin && targetList) tools.innerHTML = `<button class="btn-large" style="background:var(--bg-input); color:var(--text-main)" onclick="reqAdminAddResp(${db.responses.indexOf(targetList)})">+ Agregar a ${currentRespFilterMain}</button>`;
        }
        function filterRespMain(f) { currentRespFilterMain = f; currentRespFilterSub = 'Todas'; document.getElementById('search-bar').value=''; renderResp(); }
        function filterRespSub(f) { currentRespFilterSub = f; renderResp(); }

        function renderNews() {
            const grid = document.getElementById('news-grid'); grid.innerHTML = ''; let cats = new Set(['Todas']);
            db.news.forEach((n, idx) => {
                if(n.cat) cats.add(n.cat);
                if(currentNewsFilter !== 'Todas' && n.cat !== currentNewsFilter) return;

                const d = document.createElement('div'); d.className = 'card news-card';
                let actHtml = `<div class="actions">${isAdmin && idx > 0 ? `<button class="mini-btn move-btn" onclick="moveList('news',${idx},-1)">⬆️</button>` : ''}${isAdmin && idx < db.news.length - 1 ? `<button class="mini-btn move-btn" onclick="moveList('news',${idx},1)">⬇️</button>` : ''}<button class="mini-btn" onclick="openPreview('${n.title}', \`${n.content}\`, '')">👁️</button>${isAdmin ? `<button class="mini-btn" onclick="reqAdminEditNews(${idx})">✏️</button><button class="mini-btn" style="color:var(--danger);" onclick="reqAdminDel(()=>delNews(${idx}))">🗑️</button>` : ''}</div>`;
                let catBadge = n.cat ? `<div class="news-cat">${n.cat}</div>` : '';
                d.innerHTML = `${catBadge}<div class="news-date">📅 ${n.date}</div><div class="news-title">${n.title}</div><div class="card-val">${n.content}</div>${actHtml}`; grid.appendChild(d);
            });

            const subFilterBox = document.getElementById('news-filters'); subFilterBox.innerHTML = '';
            if(cats.size > 1) {
                cats.forEach(sc => {
                    const p = document.createElement('div'); p.className = `pill pill-sec ${sc === currentNewsFilter ? 'active' : ''}`;
                    p.innerText = sc; p.onclick = () => filterNews(sc); subFilterBox.appendChild(p);
                });
            }

            if(grid.innerHTML === '') grid.innerHTML = '<div style="color:var(--text-sec); text-align:center; padding:20px; width:100%">No hay comunicados.</div>';
            const tools = document.getElementById('news-admin-tools'); tools.innerHTML = '';
            if(isAdmin) tools.innerHTML = `<button class="btn-large" style="background:var(--bg-input); color:var(--text-main)" onclick="reqAdminAddNews()">+ Redactar Comunicado</button>`;
        }
        function filterNews(f) { currentNewsFilter = f; document.getElementById('search-bar').value=''; renderNews(); }

        function moveCard(type, lIdx, cIdx, dir) {
            let arr = db[type][lIdx].cards;
            if (dir === -1 && cIdx > 0) [arr[cIdx-1], arr[cIdx]] = [arr[cIdx], arr[cIdx-1]];
            else if (dir === 1 && cIdx < arr.length - 1) [arr[cIdx+1], arr[cIdx]] = [arr[cIdx], arr[cIdx+1]];
            markUnsaved();
        }
        function moveList(type, idx, dir) {
            let arr = db[type];
            if (dir === -1 && idx > 0) [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
            else if (dir === 1 && idx < arr.length - 1) [arr[idx+1], arr[idx]] = [arr[idx], arr[idx+1]];
            markUnsaved();
        }

        // --- 5. HERRAMIENTAS / OCR / CALC / REPORTE 5 ---
        function switchToolMode(mode) {
            currentToolMode = mode;
            ['rep', 'fmt', 'ocr', 'calc'].forEach(m => {
                document.getElementById(`pill-tool-${m}`).classList.toggle('active', mode === m);
                document.getElementById(`tool-box-${m}`).classList.toggle('hidden', mode !== m);
            });
        }

        function calcDivisas() {
            let usd = parseFloat(document.getElementById('calc-usd').value) || 0;
            let tasa = parseFloat(document.getElementById('calc-tasa').value) || 0;
            document.getElementById('calc-bs-res').innerText = (usd * tasa).toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2});
            calcProrrateo();
        }

        function calcProrrateo() {
            let plan = parseFloat(document.getElementById('calc-plan').value) || 0;
            let dias = parseInt(document.getElementById('calc-dias').value) || 0;
            let tasa = parseFloat(document.getElementById('calc-tasa').value) || 0;
            let resUsd = (plan / 30) * dias;
            document.getElementById('calc-pro-usd').innerText = resUsd.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2});
            if(tasa > 0) document.getElementById('calc-pro-bs').innerText = `Equivale a: ${(resUsd * tasa).toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})} Bs`;
            else document.getElementById('calc-pro-bs').innerText = `Ingresa la Tasa arriba para ver en Bs`;
        }

        let calcVal = "";
        function calcInput(k) {
            const screen = document.getElementById('calc-screen');
            if(k === 'C') calcVal = "";
            else if(k === 'DEL') calcVal = calcVal.slice(0, -1);
            else if(k === '=') {
                try { 
                    calcVal = eval(calcVal).toString(); 
                    if(calcVal.includes('.')) calcVal = parseFloat(calcVal).toFixed(2).replace(/\.?0+$/, "");
                } catch(e) { calcVal = "Error"; }
            }
            else { if(calcVal === "Error") calcVal = ""; calcVal += k; }
            screen.value = calcVal || "0";
        }

        async function processOCR(file) {
            if(!file) return;
            const reader = new FileReader();
            reader.onload = async (e) => {
                const img = document.getElementById('ocr-img-preview');
                const instructions = document.getElementById('ocr-instructions');
                img.src = e.target.result; img.style.display = 'inline-block'; instructions.style.display = 'none';
                const status = document.getElementById('ocr-status'); const bar = document.getElementById('ocr-bar');
                const progress = document.getElementById('ocr-progress'); const resultBox = document.getElementById('ocr-result');
                bar.style.display = 'block'; resultBox.value = ''; status.innerHTML = "⏳ Iniciando motor OCR..."; status.style.color = "var(--primary)";
                try {
                    const result = await Tesseract.recognize(e.target.result, 'spa', {
                        logger: m => { if(m.status === 'recognizing text') { status.innerHTML = `🔍 Escaneando imagen: ${Math.round(m.progress * 100)}%`; progress.style.width = `${m.progress * 100}%`; } else status.innerHTML = `⏳ Preparando... (${m.status})`; }
                    });
                    resultBox.value = result.data.text; status.innerHTML = "✅ Escaneo completado"; status.style.color = "var(--success)";
                } catch(err) { status.innerHTML = "❌ Error al leer la imagen"; status.style.color = "var(--danger)"; } 
                finally { setTimeout(() => { bar.style.display = 'none'; progress.style.width = '0%'; }, 1500); }
            };
            reader.readAsDataURL(file);
        }

        function resetOCR() {
            document.getElementById('ocr-input').value = ''; document.getElementById('ocr-img-preview').src = ''; document.getElementById('ocr-img-preview').style.display = 'none';
            document.getElementById('ocr-instructions').style.display = 'block'; document.getElementById('ocr-result').value = '';
            document.getElementById('ocr-status').innerHTML = ''; document.getElementById('ocr-bar').style.display = 'none'; document.getElementById('ocr-progress').style.width = '0%';
        }
        function copyOCR() { copy(document.getElementById('ocr-result').value); }
        function sendOCRtoFmt() { document.getElementById('tool-text').value = document.getElementById('ocr-result').value; switchToolMode('fmt'); updateTextTools(); }

        // --- REPORTES ---
        function saveRepTimes() {
            const times = {
                r1: { hin: document.getElementById('r1-hin').value, min: document.getElementById('r1-min').value, ain: document.getElementById('r1-ain').value, hout: document.getElementById('r1-hout').value, mout: document.getElementById('r1-mout').value, aout: document.getElementById('r1-aout').value },
                r2: { h: document.getElementById('r2-h').value, m: document.getElementById('r2-m').value, a: document.getElementById('r2-a').value },
                r3: { hin: document.getElementById('r3-hin').value, min: document.getElementById('r3-min').value, ain: document.getElementById('r3-ain').value, hout: document.getElementById('r3-hout').value, mout: document.getElementById('r3-mout').value, aout: document.getElementById('r3-aout').value }
            }; localStorage.setItem('report_times', JSON.stringify(times));
        }

        function loadRepTimes() {
            const savedStr = localStorage.getItem('report_times');
            if (savedStr) {
                try {
                    const t = JSON.parse(savedStr);
                    if(t.r1) { document.getElementById('r1-hin').value = t.r1.hin; document.getElementById('r1-min').value = t.r1.min; document.getElementById('r1-ain').value = t.r1.ain; document.getElementById('r1-hout').value = t.r1.hout; document.getElementById('r1-mout').value = t.r1.mout; document.getElementById('r1-aout').value = t.r1.aout; }
                    if(t.r2) { document.getElementById('r2-h').value = t.r2.h; document.getElementById('r2-m').value = t.r2.m; document.getElementById('r2-a').value = t.r2.a; }
                    if(t.r3) { document.getElementById('r3-hin').value = t.r3.hin; document.getElementById('r3-min').value = t.r3.min; document.getElementById('r3-ain').value = t.r3.ain; document.getElementById('r3-hout').value = t.r3.hout; document.getElementById('r3-mout').value = t.r3.mout; document.getElementById('r3-aout').value = t.r3.aout; }
                } catch(e) {}
            }
        }

        function switchRepMode(mode) {
            currentRepMode = mode;
            for(let i=1; i<=5; i++) {
                document.getElementById(`pill-r${i}`).classList.remove('active'); document.getElementById(`pill-r${i}`).style.background = ''; document.getElementById(`pill-r${i}`).style.color = '';
                document.getElementById(`rep-mode-${i}`).classList.add('hidden');
            }
            const activePill = document.getElementById(`pill-r${mode}`);
            activePill.classList.add('active'); 
            if(mode === 4) { activePill.style.background = 'var(--danger)'; activePill.style.color = 'white'; }
            if(mode === 5) { activePill.style.background = 'var(--warning)'; activePill.style.color = '#5c4e06'; border: 'none';}
            document.getElementById(`rep-mode-${mode}`).classList.remove('hidden'); updateLivePreview();
        }

        function calcAtendidosR1() { let c = parseInt(document.getElementById('r1-cer').value) || 0; let p = parseInt(document.getElementById('r1-pen').value) || 0; document.getElementById('r1-ate').innerText = c + p; }
        function toggleR1Inst() { document.getElementById('r1-inst').classList.toggle('hidden', !document.getElementById('r1-chk-inst').checked); }
        function toggleR1Otro() { document.getElementById('r1-otro-txt').classList.toggle('hidden', !document.getElementById('r1-chk-otro').checked); }

        function setR4Status(status) {
            r4Status = status;
            document.getElementById('btn-r4-pres').style.background = status === 'PRESENTADA' ? 'var(--danger)' : 'var(--bg-surface)'; document.getElementById('btn-r4-pres').style.color = status === 'PRESENTADA' ? 'white' : 'var(--text-main)';
            document.getElementById('btn-r4-solv').style.background = status === 'SOLVENTADA' ? 'var(--success)' : 'var(--bg-surface)'; document.getElementById('btn-r4-solv').style.color = status === 'SOLVENTADA' ? 'white' : 'var(--text-main)'; document.getElementById('btn-r4-solv').style.borderColor = status === 'SOLVENTADA' ? 'var(--success)' : 'var(--border)';
            document.getElementById('r4-hora-fin-box').classList.toggle('hidden', status === 'PRESENTADA'); updateLivePreview();
        }
        function toggleR4Device() {
            const t = document.getElementById('r4-tipo').value;
            document.querySelectorAll('.r4-is-nap').forEach(el => el.classList.toggle('hidden', t !== 'NAP')); document.querySelectorAll('.r4-is-nodo').forEach(el => el.classList.toggle('hidden', t === 'NAP')); updateLivePreview();
        }

        // LÓGICA REPORTE 5
        function reqAdminEditNodes() {
            if(!isAdmin) return;
            openForm("Nodos de Respaldo", [{id:'n_list', p:'Ej: Mecocal, Ciudad Ojeda', type:'textarea', value: (db.electricalNodes || []).join(', ')}], (v) => {
                db.electricalNodes = v[0].split(',').map(s=>s.trim()).filter(Boolean);
                markUnsaved(); updateR5Dropdown();
            });
        }
        function updateR5Dropdown() {
            const sel = document.getElementById('r5-node-select');
            sel.innerHTML = '<option value="">Seleccione Nodo...</option>';
            if(db && db.electricalNodes) db.electricalNodes.forEach(n => sel.appendChild(new Option(n, n)));
        }
        function autoFillTimeR5() {
            if(document.getElementById('r5-node-select').value !== '') {
                const now = new Date(); let h = now.getHours(); let m = now.getMinutes(); let ampm = h >= 12 ? 'PM' : 'AM';
                h = h % 12 || 12; m = m < 10 ? '0'+m : m;
                document.getElementById('r5-time-input').value = `${h < 10 ? '0'+h : h}:${m}${ampm}`;
            }
        }
        function addR5Node() {
            const name = document.getElementById('r5-node-select').value;
            const time = document.getElementById('r5-time-input').value;
            if(!name) return alert('Selecciona un nodo');
            r5Nodes.push({name, time});
            document.getElementById('r5-node-select').value = ''; document.getElementById('r5-time-input').value = '';
            renderR5Nodes(); updateLivePreview();
        }
        function renderR5Nodes() {
            const box = document.getElementById('r5-nodes-list'); box.innerHTML = '';
            r5Nodes.forEach((n, idx) => {
                const d = document.createElement('div');
                d.style = "display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); padding:8px 12px; border-radius:8px; font-size:0.9rem; font-weight:bold;";
                d.innerHTML = `<span>${n.name} ${r5Status === 'ACTIVO' && n.time ? `- ${n.time}` : ''}</span> <button class="mini-btn" style="color:var(--danger)" onclick="removeR5Node(${idx})">X</button>`;
                box.appendChild(d);
            });
        }
        function removeR5Node(idx) { r5Nodes.splice(idx, 1); renderR5Nodes(); updateLivePreview(); }
        function setR5Status(s) {
            r5Status = s;
            document.getElementById('btn-r5-act').style.background = s==='ACTIVO'?'var(--warning)':'var(--bg-surface)';
            document.getElementById('btn-r5-act').style.color = s==='ACTIVO'?'#5c4e06':'var(--text-main)';
            document.getElementById('btn-r5-res').style.background = s==='RESTABLECIDO'?'var(--success)':'var(--bg-surface)';
            document.getElementById('btn-r5-res').style.color = s==='RESTABLECIDO'?'white':'var(--text-main)';
            document.getElementById('r5-time-box').classList.toggle('hidden', s==='RESTABLECIDO');
            renderR5Nodes(); updateLivePreview();
        }


        function updateLivePreview() {
            saveRepTimes(); localStorage.setItem('report_operator', document.getElementById('rep-operador').value);
            const op = document.getElementById('rep-operador').value || "[Tu Nombre]";
            let htmlText = ""; let plainText = "";

            if(currentRepMode === 1) {
                const hi = `${document.getElementById('r1-hin').value}:${document.getElementById('r1-min').value} ${document.getElementById('r1-ain').value}`;
                const ho = `${document.getElementById('r1-hout').value}:${document.getElementById('r1-mout').value} ${document.getElementById('r1-aout').value}`;
                const cer = parseInt(document.getElementById('r1-cer').value) || 0; const pen = parseInt(document.getElementById('r1-pen').value) || 0;
                let instHtml = document.getElementById('r1-chk-inst').checked ? `\nInstalaciones: ${document.getElementById('r1-inst').value || 0}` : "";
                let acts = []; document.querySelectorAll('.r1-act:checked').forEach(c => acts.push(c.value));
                if(document.getElementById('r1-chk-otro').checked) acts.push(document.getElementById('r1-otro-txt').value || "Otra");
                let actStr = acts.length > 0 ? acts.join(" / ") : "Ninguna";

                htmlText = `<strong>Entrega de Guardia Soporte Técnico</strong>\nOperador: ${op}\nHora: ${hi} a ${ho}\nAtendidos: ${cer+pen}\nCerrados: ${cer}\nPendientes: ${pen}${instHtml}\nActividad: ${actStr}`;
                plainText = `*Entrega de Guardia Soporte Técnico*\nOperador: ${op}\nHora: ${hi} a ${ho}\nAtendidos: ${cer+pen}\nCerrados: ${cer}\nPendientes: ${pen}${instHtml}\nActividad: ${actStr}`;
            } 
            else if(currentRepMode === 2) {
                const h = `${document.getElementById('r2-h').value}:${document.getElementById('r2-m').value} ${document.getElementById('r2-a').value}`;
                let muns = []; document.querySelectorAll('.r2-mun:checked').forEach(c => muns.push(c.value)); let munStr = muns.length > 0 ? muns.join("-") : "Ninguno";
                const cha = document.getElementById('r2-chats').value || 0; const fac = document.getElementById('r2-fac').value || 0; const cer = document.getElementById('r2-cer').value || 0;
                
                htmlText = `<strong>Entrega de Guardia:</strong> ${op}\n<strong>Hora:</strong> ${h}\n<strong>Administración:</strong> ${munStr}\nNúmero de chats reasignado: ${cha}\nFacturas Fiscales: ${fac}\nCasos Cerrados: ${cer}`;
                plainText = `*Entrega de Guardia:* ${op}\n*Hora:* ${h}\n*Administración:* ${munStr}\nNúmero de chats reasignado: ${cha}\nFacturas Fiscales: ${fac}\nCasos Cerrados: ${cer}`;
            }
            else if(currentRepMode === 3) {
                const hi = `${document.getElementById('r3-hin').value}:${document.getElementById('r3-min').value} ${document.getElementById('r3-ain').value}`;
                const ho = `${document.getElementById('r3-hout').value}:${document.getElementById('r3-mout').value} ${document.getElementById('r3-aout').value}`;
                const ins = document.getElementById('r3-inst').value || 0; const est = document.getElementById('r3-estatus').value;
                
                htmlText = `<strong>Entrega de Guardia</strong>\nActividad: Empresarial\nOperador: ${op}\nHora: ${hi} a ${ho}\nInstalaciones: ${ins}\nInforme de instalaciones: ${est}`;
                plainText = `*Entrega de Guardia*\nActividad: Empresarial\nOperador: ${op}\nHora: ${hi} a ${ho}\nInstalaciones: ${ins}\nInforme de instalaciones: ${est}`;
            }
            else if(currentRepMode === 4) {
                const f = document.getElementById('r4-fecha').value || "--/--/----";
                const hi = `${document.getElementById('r4-hin').value}:${document.getElementById('r4-min').value} ${document.getElementById('r4-ain').value}`;
                const ho = r4Status === 'SOLVENTADA' ? `${document.getElementById('r4-hout').value}:${document.getElementById('r4-mout').value} ${document.getElementById('r4-aout').value}` : "--:--";
                const t = document.getElementById('r4-tipo').value;
                const eqStr = t === 'NAP' ? `NAP: ${document.getElementById('r4-nap-city').value}-${document.getElementById('r4-nap-num').value || "X"}` : `${t}: ${document.getElementById('r4-nodo-nom').value || "X"}`;
                const st = document.getElementById('r4-estatus').value;
                const zo = document.getElementById('r4-zona').value || "No especificada";
                const cl = document.getElementById('r4-clientes').value || 0;

                htmlText = `<strong>EMERGENCIA ${r4Status}</strong>\nDepartamento de Soporte Técnico TECNOVEN SERVICES, C.A.\nFecha: ${f}\nHora: ${hi}\nHora fin: ${ho}\n<strong>${eqStr} ${st}</strong>\nZona: ${zo}\nClientes Afectados: ${cl}`;
                plainText = `*EMERGENCIA ${r4Status}*\nDepartamento de Soporte Técnico TECNOVEN SERVICES, C.A.\nFecha: ${f}\nHora: ${hi}\nHora fin: ${ho}\n*${eqStr} ${st}*\nZona: ${zo}\nClientes Afectados: ${cl}`;
            }
            else if(currentRepMode === 5) {
                if(r5Status === 'ACTIVO') {
                    let listH = r5Nodes.map(n => `${n.name}: ${n.time}`).join('<br>');
                    let listP = r5Nodes.map(n => `${n.name}: ${n.time}`).join('\n');
                    htmlText = `<strong>Nodos trabajando con respaldo eléctrico</strong><br>${listH}`;
                    plainText = `*Nodos trabajando con respaldo eléctrico*\n${listP}`;
                } else {
                    let listH = r5Nodes.map(n => n.name).join('<br>');
                    let listP = r5Nodes.map(n => n.name).join('\n');
                    htmlText = `<strong>Servicio eléctrico restablecido</strong><br>${listH}`;
                    plainText = `*Servicio eléctrico restablecido*\n${listP}`;
                }
            }

            document.getElementById('live-preview-box').innerHTML = htmlText; finalReportAsterisks = plainText; 
        }

        function copyGeneratedReport() { if(finalReportAsterisks) copy(finalReportAsterisks); }

        function updateTextTools() { const text = document.getElementById('tool-text').value; document.getElementById('char-count').innerText = text.length; document.getElementById('word-count').innerText = text.trim() === '' ? 0 : text.trim().split(/\s+/).length; }
        function formatText(type) { const el = document.getElementById('tool-text'); if(type === 'UPPER') el.value = el.value.toUpperCase(); if(type === 'LOWER') el.value = el.value.toLowerCase(); if(type === 'TITLE') el.value = el.value.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase()); updateTextTools(); }
        function copyToolText() { const val = document.getElementById('tool-text').value; if(val.trim() !== '') copy(val); }

        // --- 7. MODALES, FORMS Y CRUD LOCAL ---
        function openModal(id) { const m = document.getElementById(id); m.classList.remove('hidden'); m.style.display = 'flex'; setTimeout(() => m.classList.add('show'), 10); }
        function closeModal(id) { const m = document.getElementById(id); m.classList.remove('show'); setTimeout(() => { m.style.display = 'none'; m.classList.add('hidden'); }, 300); }

        function openPreview(title, viewText, copyText) {
            document.getElementById('preview-title').innerText = title; document.getElementById('preview-content').innerText = viewText; textToCopyFromPreview = copyText;
            document.getElementById('btn-copy-preview').style.display = copyText ? 'block' : 'none'; openModal('preview-modal');
        }
        function copyFromPreview() { if(textToCopyFromPreview) copy(textToCopyFromPreview); closeModal('preview-modal'); }

        function openForm(title, fields, onSubmit) {
            document.getElementById('form-title').innerText = title; const container = document.getElementById('form-inputs'); container.innerHTML = '';
            fields.forEach(f => {
                let el;
                if(f.type === 'select') {
                    el = document.createElement('select'); el.className = 'big-input';
                    f.options.forEach(opt => { const o = document.createElement('option'); o.value = opt.v; o.text = opt.l; el.appendChild(o); });
                } else if(f.type === 'datalist') {
                    el = document.createElement('input'); el.type = 'text'; el.className = 'big-input'; el.setAttribute('list', f.id+'-list');
                    let dl = document.createElement('datalist'); dl.id = f.id+'-list';
                    f.options.forEach(opt => { const o = document.createElement('option'); o.value = opt; dl.appendChild(o); });
                    container.appendChild(dl);
                } else {
                    el = document.createElement(f.type === 'textarea' ? 'textarea' : 'input'); el.className = 'big-input';
                    if(f.type === 'textarea') el.rows = 4; else el.type = 'text';
                    if(f.type !== 'textarea') el.onkeydown = (e) => { if(e.key === 'Enter') document.getElementById('form-submit').click(); };
                }
                el.id = f.id; el.placeholder = f.p || ''; if(f.value) el.value = f.value;
                
                let wrapper = document.createElement('div');
                if(f.l) { let lbl = document.createElement('label'); lbl.className = 'form-label'; lbl.innerText = f.l; wrapper.appendChild(lbl); }
                wrapper.appendChild(el); container.appendChild(wrapper);
            });
            formCallback = () => {
                const values = fields.map(f => document.getElementById(f.id).value.trim());
                if(values.some(v => !v && f.required !== false)) return alert("Completa los campos principales");
                onSubmit(values); closeModal('form-modal');
            };
            document.getElementById('form-submit').onclick = formCallback; openModal('form-modal');
            setTimeout(() => document.getElementById(fields[0].id).focus(), 100);
        }

        function updateSystemPasswords(type) {
            const newPass = type === 'support' ? document.getElementById('cfg-sup-pass').value.trim() : document.getElementById('cfg-adm-pass').value.trim();
            if(!newPass) return alert("La contraseña no puede estar vacía");
            if(type === 'support') db.config.supportPass = newPass; else db.config.adminPass = newPass;
            markUnsaved(); closeModal('settings-modal'); showToastMsg("Clave actualizada en memoria. Recuerda Guardar.");
        }

        function reqAdminDel(callback) { if(!isAdmin) return; openConfirm("Autorización", "Verifica tu identidad.", true, callback); }
        function openConfirm(title, msg, requirePin, onConfirm) {
            document.getElementById('confirm-title').innerText = title; document.getElementById('confirm-msg').innerText = msg;
            const pinArea = document.getElementById('confirm-pin-area'); const pinInput = document.getElementById('sec-pin');
            if(requirePin) { pinArea.classList.remove('hidden'); pinInput.value = ''; } else pinArea.classList.add('hidden');
            confirmCallback = () => { if(requirePin && pinInput.value !== adminPass) return alert("Contraseña incorrecta"); onConfirm(); closeModal('confirm-modal'); };
            document.getElementById('confirm-btn-ok').onclick = confirmCallback; openModal('confirm-modal');
            if(requirePin) setTimeout(() => pinInput.focus(), 100);
        }

        // CRUD AHORA SOLO LOCAL (Llama a markUnsaved)
        function reqAdminAddCard(type, lIdx) {
            let fields = type==='clipboard' ? [{id:'f_title', p:'Título'}, {id:'f_val', p:'IP/Link', type:'textarea'}] : [{id:'f_title', p:'Equipo'}, {id:'f_user', p:'Usuario'}, {id:'f_pass', p:'Contraseña'}];
            openForm("Nueva Tarjeta", fields, (v) => { if(type==='clipboard') db[type][lIdx].cards.push({id:Date.now(), label:v[0], content:v[1]}); else db[type][lIdx].cards.push({id:Date.now(), label:v[0], user:v[1], pass:v[2]}); markUnsaved(); });
        }
        
        function reqAdminAddResp(lIdx) { 
            let existingCats = [...new Set(db.responses[lIdx].cards.map(c => c.subcat).filter(Boolean))];
            openForm("Nueva Respuesta", [
                {id:'r_t', l:'Título', p:'Ej: Saludo'}, 
                {id:'r_sc', l:'Subcategoría (Opcional)', type:'datalist', options: existingCats, p:'Ej: Pagos', required: false},
                {id:'r_col', l:'Color', type:'select', options: [{v:'neutro', l:'⚪ Neutro'}, {v:'info', l:'🔵 Información'}, {v:'exito', l:'🟢 Éxito / Pagos'}, {v:'aviso', l:'🟡 Advertencia'}, {v:'urgente', l:'🔴 Urgente'}]},
                {id:'r_c', l:'Mensaje a copiar', type:'textarea'}
            ], (v)=>{ db.responses[lIdx].cards.push({id:Date.now(), label:v[0], subcat:v[1], color:v[2], content:v[3]}); markUnsaved(); }); 
        }

        function reqAdminAddNews() { 
            let existingCats = [...new Set(db.news.map(n => n.cat).filter(Boolean))];
            openForm("Comunicado", [
                {id:'n_t', l:'Título', p:'Ej: Mantenimiento'}, 
                {id:'n_c', l:'Categoría (Opcional)', type:'datalist', options: existingCats, p:'Ej: Administrativo', required: false},
                {id:'n_msg', l:'Mensaje', type:'textarea'}
            ], (v)=>{ db.news.unshift({id:Date.now(), date: new Date().toLocaleDateString('es-VE'), title:v[0], cat:v[1], content:v[2]}); markUnsaved(); }); 
        }

        function reqAdminEditList(type, lIdx) { openForm("Editar Lista", [{id:'l_name', p:'Nombre', value: db[type][lIdx].title}], (v)=>{ db[type][lIdx].title = v[0]; markUnsaved(); }); }
        
        function reqAdminEditCard(type, lIdx, cIdx) {
            let item = db[type][lIdx].cards[cIdx];
            let fields = type==='clipboard' ? [{id:'f_title', p:'Título', value: item.label}, {id:'f_val', p:'Contenido', type:'textarea', value: item.content}] : [{id:'f_title', p:'Equipo', value: item.label}, {id:'f_user', p:'Usuario', value: item.user}, {id:'f_pass', p:'Contraseña', value: item.pass}];
            openForm("Editar Tarjeta", fields, (v) => { item.label = v[0]; if(type==='clipboard') item.content = v[1]; else { item.user = v[1]; item.pass = v[2]; } markUnsaved(); });
        }
        
        function reqAdminEditCardResp(lIdx, cIdx) { 
            let item = db.responses[lIdx].cards[cIdx]; 
            let existingCats = [...new Set(db.responses[lIdx].cards.map(c => c.subcat).filter(Boolean))];
            openForm("Editar Respuesta", [
                {id:'r_t', l:'Título', value: item.label}, 
                {id:'r_sc', l:'Subcategoría', type:'datalist', options: existingCats, value: item.subcat || '', required: false},
                {id:'r_col', l:'Color', type:'select', value: item.color || 'neutro', options: [{v:'neutro', l:'⚪ Neutro'}, {v:'info', l:'🔵 Información'}, {v:'exito', l:'🟢 Éxito'}, {v:'aviso', l:'🟡 Advertencia'}, {v:'urgente', l:'🔴 Urgente'}]},
                {id:'r_c', l:'Mensaje', type:'textarea', value: item.content}
            ], (v)=>{ item.label = v[0]; item.subcat = v[1]; item.color = v[2]; item.content = v[3]; markUnsaved(); }); 
        }

        function reqAdminEditNews(idx) { 
            let item = db.news[idx]; 
            let existingCats = [...new Set(db.news.map(n => n.cat).filter(Boolean))];
            openForm("Editar Comunicado", [
                {id:'n_t', l:'Título', value: item.title}, 
                {id:'n_c', l:'Categoría', type:'datalist', options: existingCats, value: item.cat || '', required: false},
                {id:'n_msg', l:'Cuerpo', type:'textarea', value: item.content}
            ], (v)=>{ item.title = v[0]; item.cat = v[1]; item.content = v[2]; markUnsaved(); }); 
        }

        function delCard(type, l, c) { db[type][l].cards.splice(c,1); markUnsaved(); } 
        function delList(type, l) { db[type].splice(l,1); markUnsaved(); } 
        function delCardResp(lIdx, cIdx) { db.responses[lIdx].cards.splice(cIdx,1); markUnsaved(); } 
        function delNews(idx) { db.news.splice(idx,1); markUnsaved(); }

        // UTILS
        async function copy(x) { 
            showToastMsg("Copiado al portapapeles ✅");
            try { await navigator.clipboard.writeText(x); } 
            catch { const t=document.createElement('textarea'); t.value=x; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); } 
        }
        function showToastMsg(msg) { const t=document.getElementById('toast'); t.innerText = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2500); }
        function toggleTheme() { document.body.classList.toggle('dark-mode'); localStorage.setItem('theme', document.body.classList.contains('dark-mode')?'dark':'light'); }
        
        // COMPROBADOR DE HORA Y ALARMA NATIVA
        function checkTime() { 
            if(!dailyExitTime || alarmTriggered) return; 
            const now = new Date(); const [h, m] = dailyExitTime.split(':'); const exit = new Date(); exit.setHours(h, m, 0); 
            
            if((exit - now)/1000/60 <= 60 && (exit - now) > 0) { 
                alarmTriggered = true; 
                openModal('alarm-modal'); 
                
                try { alarmAudio.play(); } catch(e) { console.log("Audio bloqueado por el navegador"); }
                
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("🚨 FIN DE TURNO (NetAdmin)", {
                        body: "Falta 1 hora para tu salida. ¡Recuerda llenar tu Reporte!",
                        icon: "https://cdn-icons-png.flaticon.com/128/4565/4565968.png",
                        vibrate: [200, 100, 200]
                    });
                }
            } 
        }
        
        function stopAlarm() { closeModal('alarm-modal'); alarmAudio.pause(); alarmAudio.currentTime = 0; }

        // Contador clics // 
             // --- 6. CONTADOR FLOTANTE (CON MEMORIA DE VALOR Y POSICIÓN) ---
        const elContador = document.querySelector('.floating-counter');
        const valor = document.getElementById('valor-contador');

        // 1. CARGAR MEMORIA AL INICIAR
        let cuenta = localStorage.getItem('contador-valor') || 0;
        valor.innerText = cuenta;

        const pos = JSON.parse(localStorage.getItem('contador-posicion'));
        if (pos) {
            elContador.style.bottom = 'auto';
            elContador.style.right = 'auto';
            elContador.style.left = pos.x;
            elContador.style.top = pos.y;
        }

        // 2. LÓGICA DEL CONTADOR (CON GUARDADO)
        const guardarCuenta = () => {
            valor.innerText = cuenta;
            localStorage.setItem('contador-valor', cuenta);
        };

        document.getElementById('btn-sumar').onclick = () => { cuenta++; guardarCuenta(); };
        document.getElementById('btn-restar').onclick = () => { cuenta--; guardarCuenta(); };
        document.getElementById('btn-reset').onclick = () => { cuenta = 0; guardarCuenta(); };

        // 3. LÓGICA DE ARRASTRE
        let isDragging = false;
        let offsetX, offsetY;

        elContador.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            isDragging = true;
            
            const rect = elContador.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            elContador.style.bottom = 'auto';
            elContador.style.right = 'auto';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;

            elContador.style.left = `${x}px`;
            elContador.style.top = `${y}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                // 4. GUARDAR POSICIÓN AL SOLTAR
                const posicion = {
                    x: elContador.style.left,
                    y: elContador.style.top
                };
                localStorage.setItem('contador-posicion', JSON.stringify(posicion));
            }
            isDragging = false;
        });
        
        
        // --- 📱 INSTALACIÓN DE APP (PWA) ---
let deferredPrompt;

// 1. Registrar el Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW Error:', err));
    });
}

// 2. Escuchar cuando Android nos da permiso de instalar
window.addEventListener('beforeinstallprompt', (e) => {
    // Evitar que Chrome muestre su propio mini-aviso automáticamente
    e.preventDefault();
    // Guardar el evento para usarlo luego
    deferredPrompt = e;
    
    // Mostrar nuestro botón mágico "📲"
    const installBtn = document.getElementById('btn-install-app');
    installBtn.classList.remove('hidden');

    // Darle la acción al botón
    installBtn.addEventListener('click', async () => {
        // Ocultar el botón
        installBtn.classList.add('hidden');
        // Mostrar la ventana emergente nativa de Android
        deferredPrompt.prompt();
        // Esperar a ver qué responde el usuario
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('El técnico instaló la App');
        }
        // Limpiar la variable
        deferredPrompt = null;
    });
});


// Detector de iOS
const isIos = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
};

// Saber si ya está instalada o está en el navegador normal
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

if (isIos() && !isStandalone) {
    // Aquí puedes lanzar un mensaje Toast que diga: 
    // "Para instalar en iPhone: Toca 'Compartir' y luego 'Agregar a Inicio'"
    console.log("Usuario en iOS desde Safari");
}

