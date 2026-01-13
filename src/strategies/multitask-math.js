// --- Multitasking recordar texto y hacer matematica ---
// --- src/strategies/multitask-math.js ---
// --- src/strategies/multitask-math.js ---

window.ProBot.Estrategias.MULTITAREA_MATEMATICA = {
    nombre: "Multitarea (Math + Visual + Texto)",
    huella: '#contenedor-actividad', 
    
    // Variables Texto
    bufferTexto: "",
    
    // Variables Cálculo
    ultimaEcuacionResuelta: "", 
    
    // Variables Visual (Puntos/Números/Letras)
    ultimaHuellaVisual: "", // Antes solo guardaba el objetivo, ahora guarda TODO
    procesandoVisual: false,

    // Variables Pregunta
    preguntaHashActual: "",
    textoPregunta: "",
    enFaseRespuesta: false,
    procesadoPregunta: false,
    yaAprendido: false,
    
    intervaloScanner: null,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 🧠 Monitor Multitarea (Visual Dinámico) Activo...");
        this.bufferTexto = "";
        this.ultimaEcuacionResuelta = "";
        this.ultimaHuellaVisual = "";
        this.enFaseRespuesta = false;
        this.procesadoPregunta = false;
        this.yaAprendido = false;
        this.procesandoVisual = false;

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    ciclo: function() {
        // 1. APRENDIZAJE CONSTANTE
        const respuestaMarcada = document.querySelector('.alrededor.correcto, .alrededor.resaltar-correcta');
        if (respuestaMarcada && !this.yaAprendido && this.preguntaHashActual) {
            const span = respuestaMarcada.querySelector('.zelda-texto span');
            if (span) {
                const respuestaTexto = span.innerText.trim().replace(/\.$/, "");
                window.ProBot.UI.setAccion('learning');
                window.ProBot.Utils.guardarEnBD(this.preguntaHashActual, this.textoPregunta, respuestaTexto);
                this.yaAprendido = true;
            }
        }

        // 2. DETECTAR FASE DE PREGUNTA
        const seccionPregunta = document.querySelector('.seccion-pregunta');
        const esFasePregunta = seccionPregunta && 
                               window.getComputedStyle(seccionPregunta).display !== 'none' &&
                               seccionPregunta.offsetParent !== null;

        if (esFasePregunta) {
            if (!this.enFaseRespuesta) {
                this.enFaseRespuesta = true;
                this.gestionarPregunta(seccionPregunta);
            }
        } else {
            if (this.enFaseRespuesta) {
                this.enFaseRespuesta = false;
                this.procesadoPregunta = false;
                this.yaAprendido = false;
            }
        }

        // 3. TAREA TEXTO
        const spansTexto = document.querySelectorAll('.seccion-lectura .mostrar');
        spansTexto.forEach(span => {
            const texto = span.innerText.trim();
            if (texto.length > 0 && !this.bufferTexto.includes(texto)) {
                this.bufferTexto += " " + texto;
                window.ProBot.UI.setAccion('learning');
            }
        });

        // 4. TAREA DERECHA
        // A. Cálculo
        const contenedorOp = document.querySelector('.contenedor-operaciones');
        if (contenedorOp && contenedorOp.style.display !== 'none') {
            this.gestionarCalculo(contenedorOp);
        }

        // B. Visual
        const contenedoresVisuales = [
            document.querySelector('.contenedor-puntos'),
            document.querySelector('.contenedor-numeros'),
            document.querySelector('.contenedor-letras')
        ];

        const visualActivo = contenedoresVisuales.find(c => c && c.style.display !== 'none');
        if (visualActivo) {
            this.gestionarVisual(visualActivo);
        } else {
            // Si no hay visual activo, reseteamos la huella para estar listos
            this.ultimaHuellaVisual = "";
            this.procesandoVisual = false;
        }
    },

    // ==========================================
    //           LÓGICA VISUAL MEJORADA
    // ==========================================
    gestionarVisual: async function(contenedor) {
        if (this.procesandoVisual) return;

        // 1. Identificar Objetivo
        const objetivoSpan = contenedor.querySelector('h2 span');
        if (!objetivoSpan) return;

        let objetivoStr = "";
        let tipoBusqueda = "";

        if (objetivoSpan.className.includes('circuloo-buscar')) {
            objetivoStr = objetivoSpan.className; // Ej: "circuloo-buscar azul"
            tipoBusqueda = 'clase';
        } else {
            objetivoStr = objetivoSpan.innerText.trim(); // Ej: "5"
            tipoBusqueda = 'texto';
        }

        // 2. GENERAR HUELLA DEL TABLERO (Para detectar cambios de ronda con mismo objetivo)
        // Leemos los primeros 5 elementos del grid para ver si cambiaron de posición
        const cuadrosMuestra = Array.from(contenedor.querySelectorAll('.grid-puntos .cuadro span')).slice(0, 5);
        const firmaTablero = cuadrosMuestra.map(el => el.className + el.innerText).join('|');

        // Huella Única = Objetivo + Estado del Tablero
        const huellaTotal = `${objetivoStr}__${firmaTablero}`;

        // Si es exactamente la misma situación que ya resolvimos, salimos
        if (huellaTotal === this.ultimaHuellaVisual) return;

        // --- NUEVA RONDA DETECTADA ---
        this.procesandoVisual = true;
        this.ultimaHuellaVisual = huellaTotal;
        window.ProBot.UI.setAccion('executing');

        console.log(`Extensión: 👁️ Nueva ronda visual: ${objetivoStr}`);
        
        await window.ProBot.Utils.esperar(500); 

        const cuadros = contenedor.querySelectorAll('.grid-puntos .cuadro');
        let clicks = 0;

        for (let cuadro of cuadros) {
            const spanItem = cuadro.querySelector('span');
            if (!spanItem) continue;

            let esObjetivo = false;

            if (tipoBusqueda === 'clase') {
                const colorObjetivo = objetivoStr.split(' ').pop(); 
                if (spanItem.classList.contains(colorObjetivo)) {
                    esObjetivo = true;
                }
            } else {
                if (spanItem.innerText.trim() === objetivoStr) {
                    esObjetivo = true;
                }
            }

            if (esObjetivo) {
                cuadro.click();
                clicks++;
                await window.ProBot.Utils.esperar(100); 
            }
        }

        console.log(`Extensión: ✅ Visual completado (${clicks} aciertos).`);
        window.ProBot.UI.setAccion('idle');
        this.procesandoVisual = false;
    },

    // ==========================================
    //           LÓGICA MATEMÁTICAS
    // ==========================================
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
    //           LÓGICA PREGUNTAS
    // ==========================================
    gestionarPregunta: function(seccionPregunta) {
        const tituloEl = seccionPregunta.querySelector('.contenedor-titulo');
        if (!tituloEl) return;

        const texto = tituloEl.innerText.trim();
        
        window.ProBot.Utils.sha256(texto).then(hash => {
            if (hash !== this.preguntaHashActual) {
                console.log("Extensión: 🧠 Pregunta detectada.");
                this.preguntaHashActual = hash;
                this.textoPregunta = texto;
                this.procesadoPregunta = false;
                this.yaAprendido = false; 
                
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