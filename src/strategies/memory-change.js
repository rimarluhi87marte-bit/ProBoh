// --- Decir cual figura ha cambiado ---

window.ProBot.Estrategias.MEMORIA_CAMBIO = {
    nombre: "Memoria de Cambio (Snapshot)",
    huella: '.ejercicio__figuras__titulo strong', 
    
    snapshotMemoria: [], 
    intervaloScanner: null,
    buscandoSolucion: false,

    validar: function(elementoHuella) {
        return elementoHuella.innerText.toLowerCase().includes('cambió');
    },

    iniciar: function() {
        const titulo = document.querySelector('.ejercicio__figuras__titulo strong');
        if (!titulo || !titulo.innerText.toLowerCase().includes('cambió')) return;

        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 🧠 Monitor de Cambio (Snapshot) Activo...");
        this.snapshotMemoria = [];
        this.buscandoSolucion = false;

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    ciclo: function() {
        const titulo = document.querySelector('.ejercicio__figuras__titulo strong');
        if (!titulo) return;

        // Detectar si el título está visible
        const esVisible = titulo.offsetParent !== null && 
                          titulo.style.display !== 'none' && 
                          !titulo.hasAttribute('hidden');

        if (!esVisible) {
            // --- FASE 1: MEMORIZAR ---
            this.buscandoSolucion = false; 
            window.ProBot.UI.setAccion('idle');

            const imgs = document.querySelectorAll('.ejercicio__figuras__figura img');
            if (imgs.length > 0) {
                // Guardamos foto actual
                this.snapshotMemoria = Array.from(imgs).map(img => this.getNombreArchivo(img.src));
                
                if (this.snapshotMemoria.length > 0) {
                    window.ProBot.UI.setAccion('learning');
                }
            }
        } 
        else {
            // --- FASE 2: RESOLVER ---
            if (this.snapshotMemoria.length > 0 && !this.buscandoSolucion) {
                this.resolver();
            }
        }
    },

    resolver: async function() {
        this.buscandoSolucion = true; 
        window.ProBot.UI.setAccion('executing');

        console.log("Extensión: 🛑 Título visible. Esperando transición (2.2s)...");
        
        // --- DELAY SOLICITADO ---
        await window.ProBot.Utils.esperar(2200);

        let intentos = 0;
        let encontrado = false;

        // Bucle de búsqueda (3 segundos extra)
        while (intentos < 30 && !encontrado) {
            
            const figurasActuales = document.querySelectorAll('.ejercicio__figuras__figura');
            
            for (let fig of figurasActuales) {
                const img = fig.querySelector('img');
                if (!img) continue;

                const nombreActual = this.getNombreArchivo(img.src);

                // Si NO estaba en mi memoria -> ES EL NUEVO
                if (!this.snapshotMemoria.includes(nombreActual)) {
                    
                    console.log(`Extensión: 🎯 ¡INTRUSO! "${nombreActual}". Ataque Nuclear.`);
                    
                    // --- CLICK NUCLEAR SIMULTÁNEO ---
                    // Disparamos a la imagen
                    this.clickNuclear(img);
                    // Disparamos al contenedor figura
                    this.clickNuclear(fig);
                    // Disparamos al div intermedio si existe
                    const divImg = fig.querySelector('.ejercicio__figuras__figura__imagen');
                    if (divImg) this.clickNuclear(divImg);

                    encontrado = true;
                    break; 
                }
            }

            if (!encontrado) {
                await window.ProBot.Utils.esperar(100);
                intentos++;
            }
        }

        if (!encontrado) {
            console.warn("Extensión: ⚠️ No encontré diferencia.");
            // Soltamos para reintentar en la siguiente ronda o manual
            this.snapshotMemoria = []; 
        } else {
            // Éxito. Limpiamos memoria.
            this.snapshotMemoria = [];
            window.ProBot.UI.setAccion('idle');
        }
    },

    // Función de clic ultra-agresiva
    clickNuclear: function(elemento) {
        if (!elemento) return;

        // 1. Mouse Events Clásicos
        ['mousedown', 'mouseup', 'click'].forEach(tipo => {
            elemento.dispatchEvent(new MouseEvent(tipo, {
                view: window,
                bubbles: true,
                cancelable: true,
                buttons: 1
            }));
        });

        // 2. Pointer Events (Modernos/Touch)
        // Algunos frameworks solo escuchan esto
        ['pointerdown', 'pointerup'].forEach(tipo => {
            try {
                elemento.dispatchEvent(new PointerEvent(tipo, {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    pointerId: 1,
                    width: 1,
                    height: 1,
                    isPrimary: true,
                    buttons: 1
                }));
            } catch(e) {} // Ignorar si el navegador es viejo
        });
    },

    getNombreArchivo: function(url) {
        try {
            return url.split('/').pop().split('?')[0];
        } catch (e) {
            return "";
        }
    },

    aprender: function() { },
    
    detener: function() {
        if (this.intervaloScanner) clearInterval(this.intervaloScanner);
        this.intervaloScanner = null;
    }
};