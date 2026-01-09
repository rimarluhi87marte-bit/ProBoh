// --- Ejercicio de elegir el texto coincidente a la historia ---

window.ProBot.Estrategias.LINEA_TEXTO = {
    nombre: "Memoria Línea de Texto",
    huella: '#IdDivTextoDVLineaTexto', 
    
    bufferTexto: "", 
    ultimoFragmento: "", 
    intervaloScanner: null,
    
    // Variables de control
    enFaseRespuesta: false,
    yaRespondido: false, // Nuevo bloqueo persistente

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 📝 Grabadora de Texto Activa...");
        this.bufferTexto = "";
        this.ultimoFragmento = "";
        this.enFaseRespuesta = false;
        this.yaRespondido = false;

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    ciclo: function() {
        const divPreguntas = document.getElementById('IdDivPreguntasDVLineaTexto');
        
        // --- 1. MODO RESPUESTA ---
        // Verificamos si la pantalla de preguntas está visible
        if (divPreguntas && divPreguntas.style.display !== 'none') {
            
            // Si ya respondimos en esta ronda, NO HACEMOS NADA.
            // Esperamos a que el usuario o la app cambie de pantalla.
            if (this.yaRespondido) return;

            if (!this.enFaseRespuesta) {
                this.resolver(divPreguntas);
            }
            return; // Cortamos aquí, no grabamos mientras preguntan
        }

        // --- 2. MODO LECTURA ---
        
        // Si veníamos de estar respondidos y la pantalla de preguntas ya se fue...
        // Significa que empezó una nueva ronda. Reseteamos.
        if (this.yaRespondido) {
            this.yaRespondido = false;
            this.limpiar(); // Borramos la memoria vieja
            console.log("Extensión: 🔄 Nueva ronda iniciada. Buffer limpio.");
        }

        // Lógica de grabación normal
        const labelTexto = document.querySelector('#IdDivTextoDVLineaTexto label');
        
        if (labelTexto) {
            const textoActual = labelTexto.innerText.trim();
            
            if (textoActual.length > 0 && textoActual !== this.ultimoFragmento) {
                this.bufferTexto += " " + textoActual;
                this.ultimoFragmento = textoActual;
                window.ProBot.UI.setAccion('learning');
            }
        }
    },

    resolver: async function(divPreguntas) {
        this.enFaseRespuesta = true;
        window.ProBot.UI.setAccion('executing');

        console.log("Extensión: 🛑 Fin de lectura. Analizando...");
        const memoriaLimpia = this.bufferTexto.replace(/\s+/g, ' ').toLowerCase();

        await window.ProBot.Utils.esperar(1000); 

        const opciones = divPreguntas.querySelectorAll('[id^="texto_opcion_"]');
        let encontrada = false;

        for (let op of opciones) {
            const textoOpcion = op.innerText.trim();
            const textoOpcionLimpio = textoOpcion.replace(/\s+/g, ' ').toLowerCase();

            if (memoriaLimpia.includes(textoOpcionLimpio)) {
                console.log(`Extensión: 🎯 Coincidencia: "${textoOpcion.substring(0, 20)}..."`);
                
                op.click();
                encontrada = true;
                break;
            }
        }

        if (encontrada) {
            // BLOQUEO ACTIVADO: No volveremos a entrar a resolver() hasta que desaparezca la pantalla
            this.yaRespondido = true;

            await window.ProBot.Utils.esperar(500);
            const btnResponder = document.getElementById('btnResponder');
            if (btnResponder) {
                btnResponder.click();
                console.log("Extensión: 🏆 Respuesta enviada.");
            }
        } else {
            console.warn("Extensión: ⚠️ No encontré el texto en mi memoria.");
            window.ProBot.UI.setConocimiento('unknown');
            // Si fallamos, NO activamos yaRespondido, para permitir reintentar en el siguiente ciclo
            // por si la memoria o el DOM no estaban listos.
        }

        this.enFaseRespuesta = false; // Liberamos la ejecución interna
        window.ProBot.UI.setAccion('idle');
    },

    limpiar: function() {
        // Solo limpia datos, no detiene el scanner
        this.bufferTexto = "";
        this.ultimoFragmento = "";
    },

    aprender: function() { }
};