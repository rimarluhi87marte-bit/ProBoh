// --- Preguntas y respuestas, pero un poco diferente ---

window.ProBot.Estrategias.QUIZ_OCULTO = {
    nombre: "Comprensión (Botón Oculto)",
    // Usamos el ID del contenedor de opciones como huella única de este ejercicio
    huella: '#caja-opciones-respuesta', 
    
    preguntaHashActual: "",
    textoPregunta: "",
    procesado: false, // Evita doble click
    yaAprendido: false, // Evita doble guardado

    iniciar: function() {
        const preguntaEl = document.getElementById('texto-pregunta');
        if (preguntaEl) {
            const texto = preguntaEl.innerText.trim();
            
            window.ProBot.Utils.sha256(texto).then(hash => {
                if (hash !== this.preguntaHashActual) {
                    // Nueva pregunta detectada
                    this.preguntaHashActual = hash;
                    this.textoPregunta = texto;
                    this.procesado = false;
                    this.yaAprendido = false;
                    
                    window.ProBot.UI.setConocimiento('reset');
                    
                    // Consultamos la BD
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

        // 1. VERIFICAR SI LAS OPCIONES ESTÁN OCULTAS
        const cajaOpciones = document.getElementById('caja-opciones-respuesta');
        const botonVer = document.querySelector('button.rojo');

        // Según tu HTML, la caja tiene la clase "ocultar" inicialmente
        // O simplemente verificamos si el botón está visible
        if (cajaOpciones && cajaOpciones.classList.contains('ocultar')) {
            if (botonVer) {
                console.log("Extensión: 🔓 Pulsando 'Ver Opciones'...");
                botonVer.click();
                // Esperamos a que la animación de despliegue termine (seguridad)
                await window.ProBot.Utils.esperar(800); 
            }
        }

        // 2. BUSCAR Y CLICKEAR LA RESPUESTA
        const opciones = document.querySelectorAll('.opcion-respuesta .zelda-texto span');
        let encontrada = false;

        for (let op of opciones) {
            // Comparamos texto limpio
            if (op.innerText.trim() === respuestaCorrecta.trim()) {
                console.log(`Extensión: 🎯 Clickeando respuesta: "${respuestaCorrecta}"`);
                
                // A veces el span no recibe el evento, clickeamos su padre (td) o abuelo (tr) por si acaso
                op.click(); 
                const celda = op.closest('td');
                if (celda) celda.click();

                encontrada = true;
                this.procesado = true;
                break;
            }
        }

        if (!encontrada) {
            console.warn("Extensión: ⚠️ Respuesta no encontrada en las opciones visibles.");
        }
        
        window.ProBot.UI.setAccion('idle');
    },

    aprender: function() {
        // Misma lógica de aprendizaje que el Quiz normal
        // Buscamos la clase .alrededor + .correcto (o resaltar-correcta según la versión de Progrentis)
        
        // Nota: En tu HTML veo que las opciones están dentro de <div class="alrededor">
        // Asumo que cuando es correcta, esa clase cambia a "alrededor correcto" o similar.
        const respuestaDiv = document.querySelector('.alrededor.correcto, .alrededor.resaltar-correcta');
        
        if (respuestaDiv && !this.yaAprendido) {
            const textoSpan = respuestaDiv.querySelector('.zelda-texto span');
            
            if (textoSpan && this.preguntaHashActual) {
                console.log("Extensión: 🎓 Aprendiendo nueva respuesta...");
                window.ProBot.UI.setAccion('learning');
                
                window.ProBot.Utils.guardarEnBD(
                    this.preguntaHashActual, 
                    this.textoPregunta, 
                    textoSpan.innerText.trim()
                );
                
                this.yaAprendido = true; // Bloqueo para no spamear la BD
            }
        }
    }
};