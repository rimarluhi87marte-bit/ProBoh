// --- Quiz con un pdf ---

window.ProBot.Estrategias.QUIZ_GENERICO = {
    nombre: "Cuestionario (Panel)",
    huella: '.panel-ejercicio .contenedor-titulo', 
    
    preguntaHashActual: "",
    textoPregunta: "",
    procesado: false,
    yaAprendido: false,

    iniciar: function() {
        const tituloEl = document.querySelector('.panel-ejercicio .contenedor-titulo h6');
        if (tituloEl) {
            const texto = tituloEl.innerText.trim();
            
            window.ProBot.Utils.sha256(texto).then(hash => {
                if (hash !== this.preguntaHashActual) {
                    this.preguntaHashActual = hash;
                    this.textoPregunta = texto;
                    this.procesado = false;
                    this.yaAprendido = false;
                    
                    window.ProBot.UI.setConocimiento('reset');
                    
                    window.ProBot.Utils.procesarConsulta(hash, (respuesta) => {
                        this.ejecutar(respuesta);
                    });
                }
            });
        }
    },

    ejecutar: async function(respuestaCorrecta) {
        if (this.procesado) return;

        window.ProBot.UI.setAccion('executing');

        const opciones = document.querySelectorAll('.contenedor-opciones .zelda-texto span');
        let encontrada = false;

        for (let op of opciones) {
            if (op.innerText.trim() === respuestaCorrecta.trim()) {
                console.log(`Extensión: 🎯 Respuesta: "${respuestaCorrecta}"`);
                
                op.click();
                const celda = op.closest('td'); 
                if (celda) celda.click();

                encontrada = true;
                break;
            }
        }

        if (encontrada) {
            this.procesado = true;
            await this.confirmarRespuesta();
        } else {
            console.warn("Extensión: ⚠️ Respuesta no encontrada en pantalla.");
        }
        
        window.ProBot.UI.setAccion('idle');
    },

    confirmarRespuesta: async function() {
        await window.ProBot.Utils.esperar(500);
        
        const boton = document.querySelector('.contenedor-botones button.rojo');
        if (boton && boton.innerText.includes("Responder")) {
            boton.click();
        }
    },

    aprender: function() {
        const respuestaDiv = document.querySelector('.alrededor.correcto, .alrededor.resaltar-correcta');
        
        if (respuestaDiv && !this.yaAprendido) {
            const textoSpan = respuestaDiv.querySelector('.zelda-texto span');
            
            if (textoSpan && this.preguntaHashActual) {
                console.log("Extensión: 🎓 Aprendido.");
                window.ProBot.UI.setAccion('learning');
                
                window.ProBot.Utils.guardarEnBD(
                    this.preguntaHashActual, 
                    this.textoPregunta, 
                    textoSpan.innerText.trim()
                );
                
                this.yaAprendido = true;
            }
        }
    }
};