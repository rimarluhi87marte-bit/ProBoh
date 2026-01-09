// --- Recordar el texto y elegir la respuesta correta ---

window.ProBot.Estrategias.BLOQUE_TEXTO = {
    nombre: "Memoria Bloque Texto",
    // Huella: El contenedor principal del bloque
    huella: '#IdDivTextoDVBloqueTextoDescendente', 
    
    bufferTexto: "", 
    intervaloScanner: null,
    enFaseRespuesta: false,
    yaRespondido: false,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 📜 Grabadora de Bloque Activa...");
        this.bufferTexto = "";
        this.enFaseRespuesta = false;
        this.yaRespondido = false;

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    ciclo: function() {
        // 1. DETECTAR FASE DE PREGUNTA
        // Buscamos cualquier contenedor que tenga "Preguntas" en el ID y sea visible
        // (El nombre suele seguir el patrón IdDivPreguntasDV...)
        const divPreguntas = document.querySelector('div[id*="IdDivPreguntasDV"]');
        
        if (divPreguntas && divPreguntas.style.display !== 'none') {
            if (this.yaRespondido) return;

            if (!this.enFaseRespuesta) {
                this.resolver(divPreguntas);
            }
            return; 
        }

        // 2. DETECTAR RESET (Nueva Ronda)
        if (this.yaRespondido) {
            this.yaRespondido = false;
            this.limpiarDatos();
            console.log("Extensión: 🔄 Nueva ronda bloque. Buffer limpio.");
        }

        // 3. FASE DE GRABACIÓN
        // Buscamos todas las líneas visibles
        const lineas = document.querySelectorAll('.lineas-con-texto');
        
        if (lineas.length > 0) {
            lineas.forEach(linea => {
                const textoLinea = linea.innerText.trim();
                
                // Si la línea tiene texto y NO está ya en nuestro buffer
                // (Usamos un chequeo simple para evitar duplicar la misma frase 50 veces mientras está en pantalla)
                if (textoLinea.length > 0 && !this.bufferTexto.includes(textoLinea)) {
                    this.bufferTexto += " " + textoLinea;
                    window.ProBot.UI.setAccion('learning');
                    // console.log(`Extensión: 📜 Línea guardada: "${textoLinea.substring(0, 15)}..."`);
                }
            });
        }
    },

    resolver: async function(divPreguntas) {
        this.enFaseRespuesta = true;
        window.ProBot.UI.setAccion('executing');

        console.log("Extensión: 🛑 Fin de bloque. Analizando...");
        const memoriaLimpia = this.bufferTexto.replace(/\s+/g, ' ').toLowerCase();

        await window.ProBot.Utils.esperar(1000); 

        // Usamos el selector estándar de opciones de Progrentis
        const opciones = divPreguntas.querySelectorAll('[id^="texto_opcion_"]');
        let encontrada = false;

        for (let op of opciones) {
            const textoOpcion = op.innerText.trim();
            const textoOpcionLimpio = textoOpcion.replace(/\s+/g, ' ').toLowerCase();

            // Verificamos si este fragmento está en lo que leímos
            if (memoriaLimpia.includes(textoOpcionLimpio)) {
                console.log(`Extensión: 🎯 Coincidencia: "${textoOpcion.substring(0, 20)}..."`);
                
                op.click();
                encontrada = true;
                break;
            }
        }

        if (encontrada) {
            this.yaRespondido = true;
            await window.ProBot.Utils.esperar(500);
            
            // Buscamos el botón de responder (puede variar ID, buscamos por clase o texto)
            const btnResponder = document.getElementById('btnResponder') || 
                                 document.querySelector('.buttton-red');
                                 
            if (btnResponder) {
                btnResponder.click();
                console.log("Extensión: 🏆 Respuesta enviada.");
            }
        } else {
            console.warn("Extensión: ⚠️ No encontré el texto en mi memoria.");
            window.ProBot.UI.setConocimiento('unknown');
        }

        this.enFaseRespuesta = false;
        window.ProBot.UI.setAccion('idle');
    },

    limpiarDatos: function() {
        this.bufferTexto = "";
    },

    aprender: function() { }
};