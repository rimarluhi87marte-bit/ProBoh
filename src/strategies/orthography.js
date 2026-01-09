// --- Ejercicio de ortografia ---

window.ProBot.Estrategias.ORTOGRAFIA_PALABRA = {
    nombre: "Ortografía (Palabra Correcta)",
    huella: '.actividad__opciones', // El contenedor de los botones
    
    hashActual: "",
    clavePregunta: "", // Guardaremos "opcion1|opcion2" como texto de pregunta
    procesado: false,
    yaAprendido: false,

    iniciar: async function() {
        const contenedorOpciones = document.querySelector('.actividad__opciones');
        if (!contenedorOpciones) return;

        // 1. GENERAR HUELLA ÚNICA BASADA EN LAS OPCIONES
        // Obtenemos el texto de los botones (ej: ["herida", "erida"])
        const botones = Array.from(contenedorOpciones.querySelectorAll('.actividad__opcion--letra'));
        if (botones.length === 0) return;

        const textosOpciones = botones.map(span => span.innerText.trim());
        
        // Ordenamos alfabéticamente para que el orden visual no afecte al hash
        // "erida|herida" siempre será el mismo ID
        const claveUnica = textosOpciones.sort().join('|');

        // Generamos el Hash
        const hash = await window.ProBot.Utils.sha256(claveUnica);

        if (hash !== this.hashActual) {
            this.hashActual = hash;
            this.clavePregunta = claveUnica;
            this.procesado = false;
            this.yaAprendido = false;
            
            window.ProBot.UI.setConocimiento('reset');

            // Consultar BD
            window.ProBot.Utils.procesarConsulta(hash, (respuesta) => {
                this.ejecutar(respuesta);
            });
        }
    },

    ejecutar: async function(respuestaCorrecta) {
        if (this.procesado) return;

        window.ProBot.UI.setAccion('executing');
        await window.ProBot.Utils.esperar(Math.random() * 500 + 500);

        const botones = document.querySelectorAll('.actividad__opcion');
        let encontrada = false;

        for (let btn of botones) {
            const span = btn.querySelector('.actividad__opcion--letra');
            if (span && span.innerText.trim() === respuestaCorrecta.trim()) {
                console.log(`Extensión: ✍️ Seleccionando ortografía: "${respuestaCorrecta}"`);
                btn.click();
                encontrada = true;
                this.procesado = true;
                break;
            }
        }

        if (!encontrada) {
            console.warn("Extensión: ⚠️ No encontré la palabra correcta en las opciones.");
        }
        
        window.ProBot.UI.setAccion('idle');
    },

    aprender: function() {
        // Buscamos el botón que tenga la clase de correcto
        // Clase identificada: .actividad__opcion--correcta
        const botonCorrecto = document.querySelector('.actividad__opcion--correcta');
        
        if (botonCorrecto && !this.yaAprendido) {
            const span = botonCorrecto.querySelector('.actividad__opcion--letra');
            
            if (span && this.hashActual) {
                const palabraCorrecta = span.innerText.trim();
                console.log(`Extensión: 🎓 Aprendiendo ortografía: "${palabraCorrecta}"`);
                
                window.ProBot.UI.setAccion('learning');
                
                // Guardamos:
                // Hash: Generado por las opciones
                // Pregunta: La lista de opciones (para referencia)
                // Respuesta: La palabra correcta
                window.ProBot.Utils.guardarEnBD(
                    this.hashActual, 
                    this.clavePregunta, 
                    palabraCorrecta
                );
                
                this.yaAprendido = true;
            }
        }
    }
};