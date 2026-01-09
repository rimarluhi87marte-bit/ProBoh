// --- Ejercicio de atencion dividida unidad 10, parar el tiempo y clickear objetos ---

window.ProBot.Estrategias.CRONOMETRO_MONEDA = {
    nombre: "Cronómetro y Moneda/Bomba",
    huella: '[estilotiempodetiene]', 
    
    intervaloMonitor: null,
    
    // Variables Reloj
    ultimoTiempoObjetivo: "",
    
    // Variables Objetivo Visual
    ultimoElementoClickeado: null, 
    ultimoClickTime: 0,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloMonitor) return;

        console.log("Extensión: ⏱️ Monitor Dual (Velocidad Rápida) Activo...");
        
        this.resetEstado();

        this.intervaloMonitor = setInterval(() => {
            this.cicloGeneral();
        }, 50);
    },

    resetEstado: function() {
        this.ultimoTiempoObjetivo = "";
        this.ultimoElementoClickeado = null;
        this.ultimoClickTime = 0;
    },

    cicloGeneral: function() {
        this.gestionarRelojes();
        this.gestionarObjetivos();
    },

    // --- TAREA A: RELOJES (MULTICLICK) ---
    gestionarRelojes: function() {
        const divInstruccion = document.querySelector('[estilotiempodetiene]');
        if (!divInstruccion) return;

        const textoInstruccion = divInstruccion.innerText.trim(); 
        const match = textoInstruccion.match(/(\d{2}:\d{2})/);
        if (!match) return;

        const tiempoObjetivo = match[1];

        if (tiempoObjetivo !== this.ultimoTiempoObjetivo) {
            this.ultimoTiempoObjetivo = tiempoObjetivo;
            console.log(`Extensión: 🎯 Nuevo tiempo: ${tiempoObjetivo}`);
        }

        const relojes = document.querySelectorAll('[data-reloj-digital-contenido]');
        
        relojes.forEach(reloj => {
            const spanTiempo = reloj.querySelector('[data-label-tiempo]');
            if (spanTiempo) {
                const tiempoActual = spanTiempo.innerText.trim();

                // Si coincide y no le hemos dado clic a este reloj específico en este segundo
                if (tiempoActual === tiempoObjetivo && reloj.dataset.lastClicked !== tiempoObjetivo) {
                    
                    console.log(`Extensión: ⚡ Click en reloj (${tiempoActual})`);
                    reloj.click();
                    
                    // Marcamos para no repetir en este mismo segundo
                    reloj.dataset.lastClicked = tiempoObjetivo;
                    
                    window.ProBot.UI.setAccion('executing');
                    setTimeout(() => window.ProBot.UI.setAccion('idle'), 300);
                }
            }
        });
    },

    // --- TAREA B: OBJETIVOS VISUALES (RÁPIDO) ---
    gestionarObjetivos: async function() {
        // 1. IDENTIFICAR QUÉ BUSCAMOS
        const imgObjetivo = document.querySelector('.titulo img');
        if (!imgObjetivo) return;

        const nombreObjetivo = this.getNombreArchivo(imgObjetivo.src);

        // 2. BUSCAR EN LAS OPCIONES
        const opciones = document.querySelectorAll('div[data-opciones]');
        
        for (let opcion of opciones) {
            const imgOpcion = opcion.querySelector('img');
            
            if (!imgOpcion || imgOpcion.style.display === 'none') continue;

            if (this.getNombreArchivo(imgOpcion.src) === nombreObjetivo) {
                
                // Lógica Anti-Repetición (Solo para no clickear el mismo elemento 2 veces seguidas al instante)
                // Pero permitimos clickear otros elementos diferentes inmediatamente.
                if (opcion === this.ultimoElementoClickeado && (Date.now() - this.ultimoClickTime < 1200)) {
                    continue;
                }

                // Clic Inmediato
                opcion.click();
                
                this.ultimoElementoClickeado = opcion;
                this.ultimoClickTime = Date.now();
                
                window.ProBot.UI.setAccion('learning'); 
                
                // Pequeña pausa técnica (100ms) para estabilidad, pero se siente rápido
                await window.ProBot.Utils.esperar(100); 
                window.ProBot.UI.setAccion('idle');
                
                break; 
            }
        }
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
        if (this.intervaloMonitor) clearInterval(this.intervaloMonitor);
        this.intervaloMonitor = null;
    }
};