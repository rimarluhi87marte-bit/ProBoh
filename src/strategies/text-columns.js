// --- Recordar texto de columnas y elegir respuesta correcta ---

window.ProBot.Estrategias.MEMORIA_COLUMNAS = {
    nombre: "Memoria Texto (Columnas)",
    huella: '#columna_a', 
    
    bufferTexto: "", 
    intervaloScanner: null,
    enFaseRespuesta: false,
    yaRespondido: false,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 📜 Grabadora de Columnas (Protegida) Activa...");
        this.bufferTexto = "";
        this.enFaseRespuesta = false;
        this.yaRespondido = false;

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    ciclo: function() {
        // 1. FASE DE GRABACIÓN (Prioridad de lectura)
        const colA = document.getElementById('columna_a');
        const colB = document.getElementById('columna_b');

        let textoActual = "";
        if (colA) textoActual += colA.innerText.trim() + " ";
        if (colB) textoActual += colB.innerText.trim();

        textoActual = textoActual.replace(/\s+/g, ' ');

        // Si hay texto visible y no está en el buffer, lo guardamos
        if (textoActual.length > 5 && !this.bufferTexto.includes(textoActual)) {
            this.bufferTexto += " " + textoActual;
            window.ProBot.UI.setAccion('learning');
            // console.log("Extensión: 📜 Bloque guardado.");
        }

        // 2. DETECTAR FASE DE PREGUNTA
        const pantallaRespuesta = document.getElementById('pantalla3');
        const divPreguntasViejo = document.querySelector('div[id*="IdDivPreguntasDV"]');

        const contenedorActivo = (pantallaRespuesta && pantallaRespuesta.style.display !== 'none') ? pantallaRespuesta :
                                 (divPreguntasViejo && divPreguntasViejo.style.display !== 'none') ? divPreguntasViejo : null;
        
        if (contenedorActivo) {
            // --- PROTECCIÓN DE BUFFER VACÍO ---
            // Si el contenedor de preguntas aparece, pero NO hemos leído nada aún (buffer vacío),
            // significa que es un falso positivo al cargar la página. Ignoramos y seguimos esperando texto.
            if (this.bufferTexto.length < 20) {
                // console.log("Extensión: ⏳ Esperando inicio de lectura...");
                return;
            }
            // ----------------------------------

            if (this.yaRespondido) return;

            if (!this.enFaseRespuesta) {
                this.resolver(contenedorActivo);
            }
            return; 
        }

        // 3. DETECTAR RESET (Solo si ya habíamos respondido y la pantalla de pregunta desapareció)
        if (this.yaRespondido && !contenedorActivo) {
            this.yaRespondido = false;
            this.bufferTexto = "";
            console.log("Extensión: 🔄 Nueva ronda columnas detectada.");
        }
    },

    resolver: async function(contenedor) {
        this.enFaseRespuesta = true;
        window.ProBot.UI.setAccion('executing');

        console.log("Extensión: 🛑 Fin de lectura. Analizando columnas...");
        
        const memoriaLimpia = this.bufferTexto.replace(/\s+/g, ' ').toLowerCase();

        await window.ProBot.Utils.esperar(1000); 

        // 1. BUSCAR OPCIONES
        let opciones = [];
        const filasNueva = contenedor.querySelectorAll('#warpPreguntas tr');
        
        if (filasNueva.length > 0) {
            filasNueva.forEach(tr => {
                const spanTexto = tr.querySelector('.second_click span.texto') || tr.querySelector('.second_click');
                const botonCheck = tr.querySelector('.chkButton');
                if (spanTexto && botonCheck) {
                    opciones.push({ texto: spanTexto.innerText, dom: botonCheck });
                }
            });
        } else {
            const opsViejas = contenedor.querySelectorAll('[id^="texto_opcion_"]');
            opsViejas.forEach(op => {
                opciones.push({ texto: op.innerText, dom: op });
            });
        }

        let encontrada = false;

        for (let op of opciones) {
            const textoOpcion = op.texto.trim();
            const textoOpcionLimpio = textoOpcion.replace(/\s+/g, ' ').toLowerCase();

            if (textoOpcionLimpio.length > 5 && memoriaLimpia.includes(textoOpcionLimpio)) {
                console.log(`Extensión: 🎯 Coincidencia: "${textoOpcion.substring(0, 20)}..."`);
                op.dom.click();
                encontrada = true;
                break;
            }
        }

        if (encontrada) {
            this.yaRespondido = true;
            await window.ProBot.Utils.esperar(500);
            
            const btnResponder = document.getElementById('btnResponder') || 
                                 document.querySelector('.buttton-red');
            if (btnResponder) btnResponder.click();
            
            console.log("Extensión: 🏆 Respuesta enviada.");
        } else {
            console.warn("Extensión: ⚠️ No encontré el texto en mi memoria.");
            window.ProBot.UI.setConocimiento('unknown');
            // Si fallamos, permitimos seguir grabando por si fue un error de sincronización
            this.enFaseRespuesta = false; 
        }

        if (encontrada) {
             window.ProBot.UI.setAccion('idle');
        }
    },

    aprender: function() { }
};