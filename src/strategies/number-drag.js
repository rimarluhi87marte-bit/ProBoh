// Recordar la secuencia de numeros ---

window.ProBot.Estrategias.MEMORIA_NUMEROS_ARRASTRE = {
    nombre: "Secuencia Números (Arrastre)",
    huella: '#etiquetaNumeros', // El span con los números
    
    secuenciaMemorizada: [], // Array de caracteres ['8', '9', '7'...]
    intervaloScanner: null,
    enFaseRespuesta: false,
    ultimaSecuenciaVista: "",

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 🔢 Monitor de Arrastre Numérico Activo...");
        this.secuenciaMemorizada = [];
        this.enFaseRespuesta = false;
        this.ultimaSecuenciaVista = "";

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    ciclo: function() {
        // 1. DETECTAR FASE DE RESPUESTA
        const pantallaPausa = document.getElementById('pantallaPausa');
        
        // Si la pantalla de pausa (respuesta) es visible
        if (pantallaPausa && pantallaPausa.style.display !== 'none') {
            if (!this.enFaseRespuesta) {
                // Solo ejecutamos si tenemos datos
                if (this.secuenciaMemorizada.length > 0) {
                    this.resolver();
                }
            }
            return; // Dejamos de memorizar
        }

        // 2. FASE DE MEMORIZACIÓN
        this.enFaseRespuesta = false; 
        const etiqueta = document.getElementById('etiquetaNumeros');
        
        if (etiqueta) {
            const textoCompleto = etiqueta.innerText.trim();
            
            // Si hay texto y es diferente al último procesado (o es una nueva ronda)
            if (textoCompleto.length > 0 && textoCompleto !== this.ultimaSecuenciaVista) {
                
                // Convertimos el string "89786" en array ["8", "9", "7", "8", "6"]
                this.secuenciaMemorizada = textoCompleto.split('');
                this.ultimaSecuenciaVista = textoCompleto;
                
                console.log(`Extensión: 📥 Memorizada secuencia: ${textoCompleto}`);
                window.ProBot.UI.setAccion('learning');
            }
        }
    },

    resolver: async function() {
        this.enFaseRespuesta = true;
        window.ProBot.UI.setAccion('executing');

        console.log("Extensión: 🛑 Fase de Respuesta. Moviendo números...");
        
        // Contenedores (Reutilizan los IDs del ejercicio de palabras)
        const listaOrigen = document.getElementById('listaPalabrasTodas');
        const listaDestino = document.getElementById('listaPalabrasMostradas');

        if (!listaOrigen || !listaDestino) return;

        // Espera humana
        await window.ProBot.Utils.esperar(1000);

        // Recorremos la secuencia memorizada
        for (let numeroMeta of this.secuenciaMemorizada) {
            
            // Buscamos un bloque disponible con ese número
            // Nota: Al moverlo con appendChild, desaparece de listaOrigen,
            // así que querySelector siempre encontrará el siguiente disponible.
            const opciones = listaOrigen.querySelectorAll('.opcionPalabra');
            let elementoEncontrado = null;

            for (let op of opciones) {
                if (op.innerText.trim() === numeroMeta) {
                    elementoEncontrado = op;
                    break; 
                }
            }

            if (elementoEncontrado) {
                // Movemos el bloque
                listaDestino.appendChild(elementoEncontrado);
                
                // Delay entre movimientos
                await window.ProBot.Utils.esperar(400);
            } else {
                console.warn(`Extensión: ⚠️ No encontré el número "${numeroMeta}" en las opciones.`);
            }
        }

        // Click en Responder
        await window.ProBot.Utils.esperar(500);
        const btnResponder = document.getElementById('btnResponder');
        if (btnResponder) {
            btnResponder.click();
            console.log("Extensión: 🏆 Enviando respuesta.");
        }

        // Limpieza
        this.secuenciaMemorizada = [];
        this.ultimaSecuenciaVista = "";
        window.ProBot.UI.setAccion('idle');
    },

    aprender: function() { }
};