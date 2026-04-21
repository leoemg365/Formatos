// Contador clics // 
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