// --- Preguntas y respuestas ---

window.ProBot.Estrategias.SELECCION_SIMPLE = {
    nombre: "Quiz Simple",
    huella: '#texto-pregunta', 
    preguntaHashActual: "",
    
    iniciar: function() {
        const preguntaEl = document.getElementById('texto-pregunta');
        if (preguntaEl) {
            const texto = preguntaEl.innerText.trim();
            window.ProBot.Utils.sha256(texto).then(hash => {
                if (hash !== this.preguntaHashActual) {
                    this.preguntaHashActual = hash;
                    this.textoPregunta = texto;
                    window.ProBot.UI.setConocimiento('reset');
                    window.ProBot.Utils.procesarConsulta(hash, (respuesta) => this.ejecutar(respuesta));
                }
            });
        }
    },

    aprender: function() {
        const respuestaDiv = document.querySelector('.alrededor.correcto, .alrededor.resaltar-correcta');
        if (respuestaDiv) {
            const textoSpan = respuestaDiv.querySelector('.zelda-texto span');
            if (textoSpan && this.preguntaHashActual) {
                window.ProBot.UI.setAccion('learning'); 
                window.ProBot.Utils.guardarEnBD(this.preguntaHashActual, this.textoPregunta, textoSpan.innerText.trim());
            }
        }
    },

    ejecutar: function(respuestaCorrecta) {
        window.ProBot.UI.setAccion('executing'); 
        const delay = Math.floor(1000);
        setTimeout(() => {
            const opciones = document.querySelectorAll('.opcion-respuesta .zelda-texto span');
            for (let op of opciones) {
                if (op.innerText.trim() === respuestaCorrecta.trim()) {
                    op.click();
                    break;
                }
            }
        }, delay);
    }
};