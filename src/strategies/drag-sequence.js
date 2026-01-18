// --- Recordar la secuencia de palabras ---
// --- src/strategies/drag-sequence.js ---

window.ProBot.Estrategias.MEMORIA_SECUENCIA_ARRASTRE = {
    nombre: "Secuencia Arrastre (Híbrido)",
    huella: '#contenedorCuadros', 
    
    secuenciaMemorizada: [],
    intervaloScanner: null,
    enFaseRespuesta: false,
    
    // Variable para controlar elementos que aparecen uno por uno
    ultimoTextoStream: null, 

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 📦 Monitor de Arrastre (Palabras/Números) Activo...");
        this.resetEstado();

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 50);
    },

    resetEstado: function() {
        this.secuenciaMemorizada = [];
        this.enFaseRespuesta = false;
        this.ultimoTextoStream = null;
    },

    ciclo: function() {
        // 1. DETECTAR FASE DE RESPUESTA
        const contenedorPreguntas = document.getElementById('contenedorPreguntas');
        
        if (contenedorPreguntas && contenedorPreguntas.style.display !== 'none') {
            if (!this.enFaseRespuesta) {
                if (this.secuenciaMemorizada.length > 0) {
                    this.resolver(contenedorPreguntas);
                }
            }
            return; 
        }

        // 2. FASE DE MEMORIZACIÓN
        this.enFaseRespuesta = false; 
        
        // Buscamos cualquier span dentro de los cuadros (cubre palabras y números)
        const elementos = document.querySelectorAll('#contenedorCuadros span');
        
        // Obtenemos textos limpios
        const textosVisibles = Array.from(elementos)
            .map(el => el.innerText.trim())
            .filter(t => t.length > 0);

        if (textosVisibles.length === 0) {
            // Si la pantalla se vacía, reseteamos el rastreador de stream
            // para permitir que el mismo valor se repita (ej: "sol" -> vacío -> "sol")
            this.ultimoTextoStream = null;
            return;
        }

        // --- LÓGICA HÍBRIDA ---

        // CASO A: Aparecen muchos elementos a la vez (Tu HTML actual)
        if (textosVisibles.length > 1) {
            // Asumimos que el orden del DOM es el orden correcto
            // Solo actualizamos si la lista es diferente para no spamear
            if (JSON.stringify(textosVisibles) !== JSON.stringify(this.secuenciaMemorizada)) {
                this.secuenciaMemorizada = textosVisibles;
                // console.log(`Extensión: 📦 Grupo memorizado: ${textosVisibles.join(', ')}`);
                window.ProBot.UI.setAccion('learning');
            }
        } 
        // CASO B: Aparecen de 1 en 1 (Secuencia rápida)
        else if (textosVisibles.length === 1) {
            const textoActual = textosVisibles[0];
            
            // Si es diferente al último que procesamos en este stream
            if (textoActual !== this.ultimoTextoStream) {
                this.secuenciaMemorizada.push(textoActual);
                this.ultimoTextoStream = textoActual;
                
                console.log(`Extensión: 📥 Stream: "${textoActual}" (Total: ${this.secuenciaMemorizada.length})`);
                window.ProBot.UI.setAccion('learning');
            }
        }
    },

    resolver: async function(contenedor) {
        this.enFaseRespuesta = true;
        window.ProBot.UI.setAccion('executing');

        console.log("Extensión: 🛑 Fase de Respuesta. Ordenando:", this.secuenciaMemorizada);
        
        const listaOrigen = document.getElementById('listaPalabrasTodas');
        const listaDestino = document.getElementById('listaPalabrasMostradas');

        if (!listaOrigen || !listaDestino) return;

        await window.ProBot.Utils.esperar(1000);

        for (let itemMeta of this.secuenciaMemorizada) {
            
            // Buscamos en los spans de la lista origen
            const opciones = listaOrigen.querySelectorAll('span');
            let elementoEncontrado = null;

            for (let op of opciones) {
                if (op.innerText.trim() === itemMeta) {
                    elementoEncontrado = op;
                    break; 
                }
            }

            if (elementoEncontrado) {
                // Movemos el elemento
                listaDestino.appendChild(elementoEncontrado);
                await window.ProBot.Utils.esperar(400);
            } else {
                console.warn(`Extensión: ⚠️ No encontré "${itemMeta}" en las opciones.`);
            }
        }

        // Click en Responder
        await window.ProBot.Utils.esperar(500);
        const btnResponder = document.getElementById('btnResponder');
        if (btnResponder) {
            btnResponder.click();
            console.log("Extensión: 🏆 Respuesta enviada.");
        }

        // Limpieza diferida
        setTimeout(() => {
            this.resetEstado();
            window.ProBot.UI.setAccion('idle');
        }, 2000);
    },

    aprender: function() { }
};