// --- src/strategies/position.js ---

window.ProBot.Estrategias.RECORDAR_POSICION = {
    nombre: "Recordar Posición",
    huella: '#pantallaExplicar', 
    
    iconoObjetivo: null,   
    celdasCorrectas: [],   
    esperandoCambio: false, 
    ultimoAvistamientoTablero: Date.now(), 

    iniciar: function() {
        // --- FEEDBACK VISUAL: CONOCIMIENTO ---
        // Como este ejercicio lo resolvemos por algoritmo (no DB), 
        // el bot SIEMPRE "sabe" la respuesta. Ponemos el cerebro en VERDE.
        window.ProBot.UI.setConocimiento('found');

        // 1. APRENDIZAJE INICIAL (Objetivo)
        const pantallaExplicar = document.getElementById('pantallaExplicar');
        if (pantallaExplicar && pantallaExplicar.style.display !== 'none') {
            const iconoSpan = pantallaExplicar.querySelector('.polka-dot-example');
            if (iconoSpan) {
                const dataFa = iconoSpan.getAttribute('data-fa');
                if (dataFa && dataFa !== this.iconoObjetivo) {
                    this.iconoObjetivo = dataFa;
                    this.celdasCorrectas = [];
                    this.esperandoCambio = false;
                    console.log(`Extensión: 🎯 Nuevo objetivo fijado: ${this.iconoObjetivo}`);
                }
            }
        }

        // 2. CONTROL DE VIGILANCIA (Timeout de 10 segundos)
        const tablero = document.getElementById('tablero');
        const esVisible = tablero && tablero.style.display !== 'none' && tablero.offsetParent !== null;

        if (!esVisible) {
            // Si el tablero no es visible, chequeamos hace cuánto lo vimos
            // AUMENTADO A 10 SEGUNDOS (10000ms)
            if (Date.now() - this.ultimoAvistamientoTablero > 10000) {
                if (this.iconoObjetivo) {
                    console.log("Extensión: 🏁 Timeout (10s). Reseteando memoria.");
                    this.iconoObjetivo = null;
                    this.celdasCorrectas = [];
                    this.esperandoCambio = false;
                    
                    // Reset visuales
                    window.ProBot.UI.setAccion('idle');
                    window.ProBot.UI.setConocimiento('reset');
                }
            }
            return; 
        }
        
        // Tablero visible -> Actualizamos reloj
        this.ultimoAvistamientoTablero = Date.now();

        // 3. LÓGICA DE JUEGO
        if (this.iconoObjetivo) {
            const celdasConObjetivo = tablero.querySelectorAll(`.${this.iconoObjetivo}`);
            
            if (celdasConObjetivo.length > 0) {
                // --- FASE DE MEMORIZACIÓN (Nueva Ronda) ---
                const nuevasCeldas = [];
                const filas = tablero.querySelectorAll('tr');
                
                filas.forEach((tr, rowIndex) => {
                    const celdas = tr.querySelectorAll('td');
                    celdas.forEach((td, colIndex) => {
                        if (td.querySelector(`.${this.iconoObjetivo}`)) {
                            nuevasCeldas.push({ r: rowIndex, c: colIndex });
                        }
                    });
                });

                if (JSON.stringify(nuevasCeldas) !== JSON.stringify(this.celdasCorrectas)) {
                    this.celdasCorrectas = nuevasCeldas;
                    this.esperandoCambio = true; 
                    window.ProBot.UI.setAccion('learning');
                }
            } 
            else {
                // --- FASE DE ATAQUE ---
                if (this.celdasCorrectas.length > 0 && this.esperandoCambio) {
                    this.resolver();
                }
            }
        }
    },

    resolver: async function() {
        this.esperandoCambio = false; 
        window.ProBot.UI.setAccion('executing');

        // Espera de seguridad (1s) para que termine la animación de bombas
        await window.ProBot.Utils.esperar(1000);

        const tablero = document.getElementById('tablero');
        const filas = tablero.querySelectorAll('tr');

        for (let coord of this.celdasCorrectas) {
            if (filas[coord.r]) {
                const celdas = filas[coord.r].querySelectorAll('td');
                if (celdas[coord.c]) {
                    const celdaClick = celdas[coord.c];
                    // Click Rápido (10ms)
                    celdaClick.click();
                    await window.ProBot.Utils.esperar(10); 
                }
            }
        }

        this.celdasCorrectas = [];
        window.ProBot.UI.setAccion('idle');
        console.log("Extensión: ✅ Ronda finalizada.");
    },

    aprender: function() { }
};