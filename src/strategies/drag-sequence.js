// --- Recordar la secuencia de palabras ---

window.ProBot.Estrategias.MEMORIA_SECUENCIA_ARRASTRE = {
    nombre: "Secuencia Palabras (Arrastre)",
    huella: '#contenedorCuadros', // El contenedor de la animación
    
    secuenciaMemorizada: [],
    intervaloScanner: null,
    enFaseRespuesta: false,
    ultimaHuellaPalabras: "", // Para evitar duplicar la misma lectura

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 📦 Monitor de Secuencia Arrastre Activo...");
        this.secuenciaMemorizada = [];
        this.enFaseRespuesta = false;
        this.ultimaHuellaPalabras = "";

        // Escáner rápido
        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    ciclo: function() {
        // 1. DETECTAR FASE DE RESPUESTA
        const contenedorPreguntas = document.getElementById('contenedorPreguntas');
        
        // Verificamos si es visible
        if (contenedorPreguntas && contenedorPreguntas.style.display !== 'none') {
            if (!this.enFaseRespuesta) {
                // Solo ejecutamos si tenemos datos en memoria
                if (this.secuenciaMemorizada.length > 0) {
                    this.resolver(contenedorPreguntas);
                }
            }
            return; // Dejamos de memorizar
        }

        // 2. FASE DE MEMORIZACIÓN
        this.enFaseRespuesta = false; // Reset por si volvemos de una pausa
        const palabrasDOM = document.querySelectorAll('#contenedorCuadros .palabra');
        
        if (palabrasDOM.length > 0) {
            // Creamos una "foto" de las palabras actuales para ver si cambiaron
            const palabrasActuales = Array.from(palabrasDOM)
                                          .map(el => el.innerText.trim())
                                          .filter(txt => txt.length > 0);
            
            const huellaActual = palabrasActuales.join('|');

            // Si hay palabras nuevas o diferentes a la última lectura
            if (huellaActual && huellaActual !== this.ultimaHuellaPalabras) {
                
                // Estrategia de Acumulación:
                // Si la plataforma muestra palabras una por una, las añadimos.
                // Si las muestra todas juntas, reemplazamos o extendemos.
                // Basado en tu HTML, parecen aparecer varias divs.
                
                // Agregamos las que no tengamos ya en el orden actual
                palabrasActuales.forEach(palabra => {
                    // Evitamos duplicados consecutivos inmediatos, pero permitimos si la secuencia lo requiere
                    const ultimaGuardada = this.secuenciaMemorizada[this.secuenciaMemorizada.length - 1];
                    if (palabra !== ultimaGuardada) {
                        this.secuenciaMemorizada.push(palabra);
                        console.log(`Extensión: 📥 Memorizada: "${palabra}"`);
                        window.ProBot.UI.setAccion('learning');
                    }
                });

                this.ultimaHuellaPalabras = huellaActual;
            }
        }
    },

    resolver: async function(contenedor) {
        this.enFaseRespuesta = true;
        window.ProBot.UI.setAccion('executing');

        console.log("Extensión: 🛑 Fase de Respuesta. Moviendo bloques...");
        
        // Contenedores origen y destino
        const listaOrigen = document.getElementById('listaPalabrasTodas');
        const listaDestino = document.getElementById('listaPalabrasMostradas');

        if (!listaOrigen || !listaDestino) return;

        // Espera humana
        await window.ProBot.Utils.esperar(1000);

        // Recorremos la memoria en orden
        for (let palabraMeta of this.secuenciaMemorizada) {
            
            // Buscamos el elemento en la lista de origen
            const opciones = listaOrigen.querySelectorAll('.opcionPalabra');
            let elementoEncontrado = null;

            for (let op of opciones) {
                if (op.innerText.trim() === palabraMeta) {
                    elementoEncontrado = op;
                    break; 
                }
            }

            if (elementoEncontrado) {
                // TRUCO DE MAGIA: "Teletransportar" el elemento DOM
                // Al hacer appendChild a otro contenedor, el navegador lo mueve visualmente.
                // Las librerías como jQuery UI Sortable suelen detectar esto automáticamente.
                listaDestino.appendChild(elementoEncontrado);
                
                // console.log(`Extensión: 📦 Movido: "${palabraMeta}"`);
                
                // Pequeño delay entre movimientos
                await window.ProBot.Utils.esperar(400);
            } else {
                console.warn(`Extensión: ⚠️ No encontré la palabra "${palabraMeta}" en las opciones.`);
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
        this.ultimaHuellaPalabras = "";
        window.ProBot.UI.setAccion('idle');
    },

    aprender: function() { }
};