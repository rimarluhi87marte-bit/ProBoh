// --- Otra variante de quiz ---

window.ProBot.Estrategias.QUIZ_MODERNO = {
    nombre: "Cuestionario Moderno",
    huella: '#simple-pregunta-titulo', 
    
    preguntaHashActual: "",
    textoPregunta: "",
    procesado: false,
    yaAprendido: false,
    observadorExito: null,

    iniciar: function() {
        // 1. OBTENER PREGUNTA
        const preguntaEl = document.querySelector('#simple-pregunta-titulo p');
        if (!preguntaEl) return;

        const texto = preguntaEl.innerText.trim();
        
        window.ProBot.Utils.sha256(texto).then(hash => {
            if (hash !== this.preguntaHashActual) {
                console.log("Extensión: 📝 Nueva pregunta moderna detectada.");
                
                this.preguntaHashActual = hash;
                this.textoPregunta = texto;
                this.procesado = false;
                this.yaAprendido = false;
                
                window.ProBot.UI.setConocimiento('reset');
                
                // Consultar BD
                window.ProBot.Utils.procesarConsulta(hash, (respuesta) => {
                    this.ejecutar(respuesta);
                });

                // Activar vigilancia
                this.activarVigilancia();
            }
        });
    },

    ejecutar: async function(respuestaCorrecta) {
        if (this.procesado) return;

        window.ProBot.UI.setAccion('executing');
        await window.ProBot.Utils.esperar(1000); 

        // Buscar opción correcta
        const opciones = document.querySelectorAll('.opcion-pregunta');
        let encontrada = false;

        for (let op of opciones) {
            const textoDiv = op.querySelector('.tiene-texto');
            if (!textoDiv) continue;

            const textoOp = textoDiv.innerText.trim();
            const limpioOp = textoOp.replace(/\.$/, "").trim();
            const limpioResp = respuestaCorrecta.replace(/\.$/, "").trim();

            if (limpioOp === limpioResp) {
                console.log(`Extensión: 🎯 Respuesta encontrada: "${textoOp}"`);
                
                // Click en el contenedor principal de la opción
                op.click();
                // Por si acaso, click en el círculo
                const circulo = op.querySelector('.lado-circulo');
                if (circulo) circulo.click();

                encontrada = true;
                this.procesado = true;
                break;
            }
        }

        if (encontrada) {
            await window.ProBot.Utils.esperar(500);
            // Click en Continuar (si aparece)
            const btnContinuar = document.querySelector('button._boton_rojo');
            if (btnContinuar) btnContinuar.click();
        } else {
            console.warn("Extensión: ⚠️ Respuesta no encontrada en opciones.");
        }
        
        window.ProBot.UI.setAccion('idle');
    },

    activarVigilancia: function() {
        if (this.observadorExito) this.observadorExito.disconnect();

        const contenedorOpciones = document.getElementById('caja-opciones-respuesta');
        if (!contenedorOpciones) return;

        this.observadorExito = new MutationObserver(() => {
            // Buscamos si alguna opción adquirió la clase de éxito
            // .lado-circulo.respuesta-correcta
            const opcionCorrecta = contenedorOpciones.querySelector('.lado-circulo.respuesta-correcta');
            
            if (opcionCorrecta && !this.yaAprendido) {
                // Subimos al padre (.opcion-pregunta) para buscar el texto hermano
                const padre = opcionCorrecta.closest('.opcion-pregunta');
                const textoDiv = padre ? padre.querySelector('.tiene-texto') : null;

                if (textoDiv && this.preguntaHashActual) {
                    const respuestaTexto = textoDiv.innerText.trim().replace(/\.$/, "");
                    
                    console.log(`Extensión: ✅ Aprendido: "${respuestaTexto}"`);
                    window.ProBot.UI.setAccion('learning');
                    
                    window.ProBot.Utils.guardarEnBD(
                        this.preguntaHashActual,
                        this.textoPregunta,
                        respuestaTexto
                    );

                    this.yaAprendido = true;
                }
            }
        });

        this.observadorExito.observe(contenedorOpciones, { 
            attributes: true, 
            subtree: true, 
            attributeFilter: ['class'] 
        });
    },

    aprender: function() { 
        // Integrado en activarVigilancia
    }
};