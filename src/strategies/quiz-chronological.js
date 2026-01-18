// --- Decir si antes, despues o justo ---

window.ProBot.Estrategias.CRONOLOGIA_PREGUNTAS = {
    nombre: "Quiz Cronológico (Escáner Activo)",
    huella: '[data-texto-pregunta]', 
    
    preguntaHashActual: "",
    textoPregunta: "",
    procesado: false,
    yaAprendido: false,
    
    intervaloScanner: null,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: ⏳ Monitor Cronológico Activo...");
        this.procesado = false;
        this.yaAprendido = false;

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    ciclo: function() {
        // 1. BUSCAR COLUMNA ACTIVA
        const columnas = document.querySelectorAll('[data-col-pregunta]');
        let columnaActiva = null;

        for (let col of columnas) {
            if (col.style.display !== 'none' && col.offsetParent !== null) {
                const txt = col.querySelector('[data-texto-pregunta]');
                if (txt && txt.innerText.trim().length > 0) {
                    columnaActiva = col;
                    break;
                }
            }
        }

        if (!columnaActiva) return;

        // 2. GESTIONAR PREGUNTA
        const preguntaDiv = columnaActiva.querySelector('[data-texto-pregunta]');
        const texto = preguntaDiv.innerText.trim();

        // Si cambió la pregunta, actualizamos hash
        window.ProBot.Utils.sha256(texto).then(hash => {
            if (hash !== this.preguntaHashActual) {
                console.log("Extensión: ⏳ Nueva pregunta detectada.");
                this.preguntaHashActual = hash;
                this.textoPregunta = texto;
                this.procesado = false;
                this.yaAprendido = false;
                
                window.ProBot.UI.setConocimiento('reset');
                
                // Intentar responder
                window.ProBot.Utils.procesarConsulta(hash, (respuesta) => {
                    this.ejecutar(respuesta, columnaActiva);
                });
                
                // Añadir espía de clics (para debug visual en consola)
                this.espiarClicks(columnaActiva);
            }
        });

        // 3. APRENDIZAJE ACTIVO (Esto arregla el bug)
        // Revisamos CONSTANTEMENTE si hay una respuesta marcada en la columna activa
        this.buscarRespuestaVisible(columnaActiva);
    },

    buscarRespuestaVisible: function(columna) {
        if (this.yaAprendido) return;

        // Buscamos la clase de éxito en este momento exacto
        const opcionGanadora = columna.querySelector('.opcion-pregunta.respuesta-correcta');

        if (opcionGanadora) {
            const divTexto = opcionGanadora.querySelector('.lado-texto');
            
            if (divTexto && this.preguntaHashActual) {
                const respuestaTexto = divTexto.innerText.trim().replace(/\.$/, "");
                
                console.log(`Extensión: ✅ Aprendido (Escáner): "${respuestaTexto}"`);
                window.ProBot.UI.setAccion('learning');
                
                window.ProBot.Utils.guardarEnBD(
                    this.preguntaHashActual,
                    this.textoPregunta,
                    respuestaTexto
                );

                this.yaAprendido = true; // Bloqueamos para no guardar 100 veces
            }
        }
    },

    ejecutar: async function(respuestaCorrecta, contenedor) {
        if (this.procesado) return;

        window.ProBot.UI.setAccion('executing');
        await window.ProBot.Utils.esperar(1000); 

        const opciones = contenedor.querySelectorAll('.opcion-pregunta');
        let encontrada = false;

        for (let op of opciones) {
            const divTexto = op.querySelector('.lado-texto');
            if (!divTexto) continue;

            const textoOp = divTexto.innerText.trim();
            const limpioOp = textoOp.replace(/\.$/, "").trim().toLowerCase();
            const limpioResp = respuestaCorrecta.replace(/\.$/, "").trim().toLowerCase();

            if (limpioOp === limpioResp) {
                console.log(`Extensión: 🎯 Respuesta encontrada: "${textoOp}"`);
                op.click();
                encontrada = true;
                this.procesado = true;
                break;
            }
        }

        if (encontrada) {
            await window.ProBot.Utils.esperar(500);
            const btn = document.querySelector('button._boton_rojo');
            if (btn) btn.click();
        } else {
            console.warn("Extensión: ⚠️ Respuesta no encontrada en opciones.");
        }
        
        window.ProBot.UI.setAccion('idle');
    },

    espiarClicks: function(contenedor) {
        // Solo para feedback visual en consola, no afecta al guardado
        const opciones = contenedor.querySelectorAll('.opcion-pregunta');
        opciones.forEach(op => {
            op.addEventListener('mousedown', () => {
                const txt = op.querySelector('.lado-texto')?.innerText;
                // console.log(`Extensión: 👤 Usuario clicó: "${txt}"`);
            }, { once: true });
        });
    },

    aprender: function() { }
};