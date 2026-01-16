// Recordar la secuencia de numeros ---
// --- src/strategies/number-drag.js ---

window.ProBot.Estrategias.MEMORIA_NUMEROS_ARRASTRE = {
    nombre: "Secuencia Números (Trigger Borde)",
    huella: '#etiquetaNumeros', 
    
    secuenciaMemorizada: [], 
    intervaloScanner: null,
    enFaseRespuesta: false,
    
    // Variable para rastrear el cambio de color
    ultimoColorBorde: "", 

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 🔢 Monitor de Números (Color Borde) Activo...");
        this.resetEstado();

        // Escáner muy rápido para no perderse cambios de color
        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 30);
    },

    resetEstado: function() {
        this.secuenciaMemorizada = [];
        this.enFaseRespuesta = false;
        this.ultimoColorBorde = "";
    },

    ciclo: function() {
        // 1. DETECTAR FASE DE RESPUESTA
        const pantallaPausa = document.getElementById('pantallaPausa');
        
        if (pantallaPausa && pantallaPausa.style.display !== 'none') {
            if (!this.enFaseRespuesta) {
                if (this.secuenciaMemorizada.length > 0) {
                    this.resolver(pantallaPausa);
                }
            }
            return; 
        }

        // 2. FASE DE MEMORIZACIÓN (Disparada por el Borde)
        const contenedorTabla = document.getElementById('contenedorNumeros');
        const etiqueta = document.getElementById('etiquetaNumeros');
        
        if (contenedorTabla && etiqueta) {
            // Leemos el color actual del borde
            const colorActual = contenedorTabla.style.borderColor;
            const textoActual = etiqueta.innerText.trim();

            // LÓGICA DEL PRO TIP:
            // Si el color del borde ha cambiado respecto a lo que vimos antes...
            // Y hay un texto válido... ¡Es un número nuevo!
            if (colorActual && colorActual !== this.ultimoColorBorde) {
                
                if (textoActual.length > 0) {
                    this.secuenciaMemorizada.push(textoActual);
                    
                    console.log(`Extensión: 📥 Cambio de color (${colorActual}) -> Guardado: "${textoActual}"`);
                    window.ProBot.UI.setAccion('learning');
                }
                
                // Actualizamos el estado para no guardar el mismo hasta que cambie el color otra vez
                this.ultimoColorBorde = colorActual;
            }
        }
    },

    resolver: async function(pantalla) {
        this.enFaseRespuesta = true;
        window.ProBot.UI.setAccion('executing');

        console.log("Extensión: 🛑 Fase de Respuesta. Secuencia:", this.secuenciaMemorizada);
        
        const listaOrigen = document.getElementById('listaPalabrasTodas');
        const listaDestino = document.getElementById('listaPalabrasMostradas');

        if (!listaOrigen || !listaDestino) return;

        await window.ProBot.Utils.esperar(1000);

        for (let numeroMeta of this.secuenciaMemorizada) {
            
            const opciones = listaOrigen.querySelectorAll('.opcionPalabra');
            let elementoEncontrado = null;

            for (let op of opciones) {
                if (op.innerText.trim() === numeroMeta) {
                    elementoEncontrado = op;
                    break; 
                }
            }

            if (elementoEncontrado) {
                listaDestino.appendChild(elementoEncontrado);
                await window.ProBot.Utils.esperar(400);
            } else {
                console.warn(`Extensión: ⚠️ No encontré el número "${numeroMeta}".`);
            }
        }

        await window.ProBot.Utils.esperar(500);
        const btnResponder = document.getElementById('btnResponder');
        if (btnResponder) {
            btnResponder.click();
            console.log("Extensión: 🏆 Enviando respuesta.");
        }

        // Limpieza diferida
        setTimeout(() => {
            this.resetEstado();
            window.ProBot.UI.setAccion('idle');
        }, 2000);
    },

    aprender: function() { }
};