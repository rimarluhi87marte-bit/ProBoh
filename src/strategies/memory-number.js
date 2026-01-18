// --- Recordar numero y darle click cuando salga ---

window.ProBot.Estrategias.MEMORIA_NUMERO_SIMPLE = {
    nombre: "Memoria Número (Simple)",
    // Huella: El ID único del contenedor del número a memorizar
    huella: '#DivIteracionNumero', 
    
    numeroObjetivo: "", 
    ultimoNumeroVisto: "", // Para no spamear logs
    intervaloScanner: null,
    enFaseRespuesta: false,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 🔢 Monitor de Memoria Numérica Activo...");
        this.numeroObjetivo = "";
        this.enFaseRespuesta = false;

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 50);
    },

    ciclo: function() {
        const divNumero = document.getElementById('DivIteracionNumero');
        const divRespuestas = document.getElementById('DivIteracionRespuestas');

        if (!divNumero || !divRespuestas) return;

        // --- FASE 1: MEMORIZAR ---
        // Si el div del número está visible (display no es none)
        if (divNumero.style.display !== 'none') {
            
            // Si veníamos de responder, reseteamos el estado
            if (this.enFaseRespuesta) {
                this.enFaseRespuesta = false;
                window.ProBot.UI.setAccion('idle');
            }

            const texto = divNumero.innerText.trim();
            
            if (texto && texto !== this.ultimoNumeroVisto) {
                this.numeroObjetivo = texto;
                this.ultimoNumeroVisto = texto;
                
                console.log(`Extensión: 📥 Memorizado: ${this.numeroObjetivo}`);
                window.ProBot.UI.setAccion('learning');
            }
        } 
        
        // --- FASE 2: RESPONDER ---
        // Si el div de respuestas está visible
        else if (divRespuestas.style.display !== 'none') {
            if (!this.enFaseRespuesta && this.numeroObjetivo) {
                this.resolver(divRespuestas);
            }
        }
    },

    resolver: async function(contenedor) {
        this.enFaseRespuesta = true;
        window.ProBot.UI.setAccion('executing');

        console.log("Extensión: 🛑 Fase Respuesta. Buscando número...");
        
        // Espera humana
        await window.ProBot.Utils.esperar(800);

        const opciones = contenedor.querySelectorAll('.IteracionRespuesta');
        let encontrada = false;

        for (let op of opciones) {
            if (op.innerText.trim() === this.numeroObjetivo) {
                console.log(`Extensión: 🎯 Click en ${this.numeroObjetivo}`);
                
                op.click();
                encontrada = true;
                break;
            }
        }

        if (!encontrada) {
            console.warn("Extensión: ⚠️ No encontré el número en las opciones.");
            // Permitimos reintentar si falló la carga
            this.enFaseRespuesta = false; 
        } else {
            window.ProBot.UI.setAccion('idle');
        }
    },

    aprender: function() { },
    
    detener: function() {
        if (this.intervaloScanner) clearInterval(this.intervaloScanner);
        this.intervaloScanner = null;
    }
};