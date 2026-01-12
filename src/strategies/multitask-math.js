// --- Multitasking recordar texto y hacer matematica ---

window.ProBot.Estrategias.MULTITAREA_MATEMATICA = {
    nombre: "Multitarea (Math + Texto + Quiz)",
    huella: '#contenedor-actividad', 
    
    // Variables Texto
    bufferTexto: "",
    
    // Variables Cálculo
    ultimaEcuacionResuelta: "", 
    
    // Variables Pregunta
    preguntaHashActual: "",
    textoPregunta: "",
    enFaseRespuesta: false,
    procesadoPregunta: false,
    yaAprendido: false, // Nueva bandera para no guardar 50 veces lo mismo
    
    intervaloScanner: null,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 🧠 Monitor Multitarea (Aprendizaje Activo)...");
        this.bufferTexto = "";
        this.ultimaEcuacionResuelta = "";
        this.enFaseRespuesta = false;
        this.procesadoPregunta = false;
        this.yaAprendido = false;

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    ciclo: function() {
        // --- 1. APRENDIZAJE CONSTANTE (Prioridad) ---
        // Buscamos activamente si hay una respuesta marcada en pantalla (Correcta o Chivada)
        const respuestaMarcada = document.querySelector('.alrededor.correcto, .alrededor.resaltar-correcta');
        
        if (respuestaMarcada && !this.yaAprendido && this.preguntaHashActual) {
            // Extraemos el texto
            const span = respuestaMarcada.querySelector('.zelda-texto span');
            if (span) {
                const respuestaTexto = span.innerText.trim().replace(/\.$/, ""); // Limpieza
                
                console.log(`Extensión: 🎓 ¡CAPTURA EXITOSA! Guardando: "${respuestaTexto}"`);
                window.ProBot.UI.setAccion('learning');
                
                window.ProBot.Utils.guardarEnBD(
                    this.preguntaHashActual,
                    this.textoPregunta,
                    respuestaTexto
                );
                
                this.yaAprendido = true; // Bloqueamos para no repetir
            }
        }

        // --- 2. DETECTAR FASE DE PREGUNTA ---
        const seccionPregunta = document.querySelector('.seccion-pregunta');
        const esFasePregunta = seccionPregunta && 
                               window.getComputedStyle(seccionPregunta).display !== 'none' &&
                               seccionPregunta.offsetParent !== null;

        if (esFasePregunta) {
            if (!this.enFaseRespuesta) {
                this.enFaseRespuesta = true;
                this.gestionarPregunta(seccionPregunta);
            }
            // NO hacemos return aquí, para permitir que el código de arriba (Aprendizaje)
            // siga corriendo mientras la pregunta está visible.
        } else {
            // Si la pregunta desapareció, reseteamos para la siguiente
            if (this.enFaseRespuesta) {
                this.enFaseRespuesta = false;
                this.procesadoPregunta = false;
                this.yaAprendido = false; // Importante: Listos para aprender la siguiente
            }
        }

        // --- 3. TAREA TEXTO (Izquierda) ---
        const spansTexto = document.querySelectorAll('.seccion-lectura .mostrar');
        spansTexto.forEach(span => {
            const texto = span.innerText.trim();
            if (texto.length > 0 && !this.bufferTexto.includes(texto)) {
                this.bufferTexto += " " + texto;
                window.ProBot.UI.setAccion('learning');
            }
        });

        // --- 4. TAREA CÁLCULO (Derecha) ---
        const contenedorOp = document.querySelector('.contenedor-operaciones');
        if (contenedorOp && contenedorOp.style.display !== 'none') {
            this.gestionarCalculo(contenedorOp);
        }
    },

    // ... (gestionarCalculo y aplicarOperadores IGUAL QUE ANTES) ...
    gestionarCalculo: async function(contenedor) {
        const spans = contenedor.querySelectorAll('.row-operacion > span');
        if (spans.length < 4) return;

        const A = parseInt(spans[0].innerText);
        const B = parseInt(spans[1].innerText);
        const C = parseInt(spans[2].innerText);
        const ResultadoFinal = parseInt(spans[spans.length-1].innerText);

        const idEcuacion = `${A}-${B}-${C}-${ResultadoFinal}`;
        if (idEcuacion === this.ultimaEcuacionResuelta) return;

        const combinaciones = [
            { ops: ['+', '+'], val: A + B + C },
            { ops: ['-', '-'], val: A - B - C },
            { ops: ['+', '-'], val: A + B - C },
            { ops: ['-', '+'], val: A - B + C }
        ];

        const sol = combinaciones.find(c => c.val === ResultadoFinal);
        if (sol) {
            this.ultimaEcuacionResuelta = idEcuacion;
            await this.aplicarOperadores(contenedor, sol.ops);
        }
    },

    aplicarOperadores: async function(contenedor, operadores) {
        window.ProBot.UI.setAccion('executing');
        const huecos = contenedor.querySelectorAll('.contenedor-operador');
        
        for (let i = 0; i < 2; i++) {
            const signoDeseado = operadores[i];
            const hueco = huecos[i];

            hueco.click();
            await window.ProBot.Utils.esperar(200); 

            const opcionesModal = document.querySelectorAll('.opcion-modal');
            let opcionEncontrada = null;
            for (let op of opcionesModal) {
                if (op.offsetParent !== null && op.innerText.trim() === signoDeseado) {
                    opcionEncontrada = op;
                    break;
                }
            }
            if (opcionEncontrada) {
                opcionEncontrada.click();
                await window.ProBot.Utils.esperar(200); 
            }
        }
        const btnCalcular = contenedor.querySelector('button.rojo');
        if (btnCalcular && !btnCalcular.disabled) btnCalcular.click();
        window.ProBot.UI.setAccion('idle');
    },

    // ==========================================
    //           LÓGICA DE PREGUNTAS
    // ==========================================
    gestionarPregunta: function(seccionPregunta) {
        const tituloEl = seccionPregunta.querySelector('.contenedor-titulo');
        if (!tituloEl) return;

        const texto = tituloEl.innerText.trim();
        
        // Generar hash de la pregunta actual
        window.ProBot.Utils.sha256(texto).then(hash => {
            if (hash !== this.preguntaHashActual) {
                console.log("Extensión: 🧠 Pregunta detectada.");
                this.preguntaHashActual = hash;
                this.textoPregunta = texto;
                this.procesadoPregunta = false;
                this.yaAprendido = false; // Reset para esta nueva pregunta
                
                // Consultar BD
                window.ProBot.Utils.procesarConsulta(hash, (respuesta) => {
                    this.responderPregunta(respuesta);
                });
            }
        });
    },

    responderPregunta: async function(respuestaCorrecta) {
        if (this.procesadoPregunta) return;

        window.ProBot.UI.setAccion('executing');
        await window.ProBot.Utils.esperar(1000); 

        const opciones = document.querySelectorAll('.seccion-pregunta .opcion-respuesta .zelda-texto span');
        let encontrada = false;

        for (let op of opciones) {
            const textoOp = op.innerText.trim().replace(/\.$/, ""); 
            const limpioResp = respuestaCorrecta.replace(/\.$/, "");

            if (textoOp === limpioResp) {
                console.log(`Extensión: 🎯 Respuesta encontrada: "${textoOp}"`);
                op.click();
                const celda = op.closest('td'); if (celda) celda.click();
                encontrada = true;
                this.procesadoPregunta = true;
                break;
            }
        }

        if (encontrada) {
            await window.ProBot.Utils.esperar(500);
            const btn = document.querySelector('.contenedor-botones-pregunta button.rojo');
            if (btn) btn.click();
        }
        
        window.ProBot.UI.setAccion('idle');
    },

    aprender: function() { }
};