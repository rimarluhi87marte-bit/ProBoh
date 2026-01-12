// --- Ejercicio de responder preguntas de un mapa. ---

window.ProBot.Estrategias.MAPA_PREGUNTAS = {
    nombre: "Preguntas de Mapa (Normalizado + Ninguna)",
    huella: '.contenedorPregunta .tituloPregunta',
    
    preguntaHashActual: "",
    textoPregunta: "",
    
    indicePendiente: null,
    observadorExito: null,    
    listenersActivados: false,
    procesado: false,

    iniciar: function() {
        // 1. BUSCAR LA PREGUNTA ACTIVA
        const preguntas = document.querySelectorAll('.contenedorPregunta');
        let contenedorActivo = null;

        for (let p of preguntas) {
            if (p.style.display !== 'none' && p.offsetParent !== null) {
                contenedorActivo = p;
                break;
            }
        }

        if (!contenedorActivo) return;

        // --- REGLA SUPREMA: "NINGUNA DE LAS ANTERIORES" ---
        // Si esta opción existe, la clickeamos siempre e ignoramos la base de datos.
        const opciones = contenedorActivo.querySelectorAll('.opcionPregunta');
        for (let op of opciones) {
            if (op.innerText.includes("Ninguna de las Anteriores")) {
                // Solo clickeamos si no hemos procesado esta pantalla aún
                // (Usamos el texto de la pregunta como 'id' temporal para el bloqueo local si es necesario, 
                // o simplemente confiamos en el ciclo de cambio de pregunta)
                
                const textoTitulo = contenedorActivo.querySelector('.tituloPregunta').innerText;
                
                // Si la pregunta cambió o no hemos procesado
                if (textoTitulo !== this.textoPregunta || !this.procesado) {
                    console.log("Extensión: 🦄 Detectado 'Ninguna de las Anteriores'. Click Forzado.");
                    
                    this.textoPregunta = textoTitulo; // Actualizamos para no repetir en bucle
                    this.procesado = true;
                    
                    op.click();
                    
                    window.ProBot.UI.setAccion('executing');
                    setTimeout(() => window.ProBot.UI.setAccion('idle'), 500);
                }
                return; // ¡Salimos! No hace falta consultar BD ni normalizar.
            }
        }
        // ---------------------------------------------------

        const tituloEl = contenedorActivo.querySelector('.tituloPregunta');
        if (!tituloEl) return;

        const textoRaw = tituloEl.innerText.trim();
        const textoNormalizado = this.normalizarTextoPregunta(textoRaw);

        window.ProBot.Utils.sha256(textoNormalizado).then(hash => {
            if (hash !== this.preguntaHashActual) {
                console.log(`Extensión: 🗺️ Pregunta: "${textoNormalizado}"`);
                
                this.preguntaHashActual = hash;
                this.textoPregunta = textoNormalizado; 
                this.procesado = false;
                this.indicePendiente = null;
                this.listenersActivados = false; 
                
                window.ProBot.UI.setConocimiento('reset');
                
                // A) Consultamos BD
                window.ProBot.Utils.procesarConsulta(hash, (respuestaIndex) => {
                    this.ejecutar(respuestaIndex, contenedorActivo);
                });

                // B) Vigilancia
                this.activarVigilancia(contenedorActivo);
            }
        });
    },

    // --- NORMALIZADOR ---
    normalizarTextoPregunta: function(texto) {
        return texto.replace(/["'“](.*?)["'”]/g, (match, contenido) => {
            const contenidoLimpio = contenido.trim();
            const id = this.buscarIndicePorTexto(contenidoLimpio);
            return id ? `[ID:${id}]` : match;
        });
    },

    // --- MODO EJECUCIÓN ---
    ejecutar: async function(indiceCorrecto, contenedor) {
        if (this.procesado) return;

        window.ProBot.UI.setAccion('executing');
        await window.ProBot.Utils.esperar(1000); 

        // TRADUCIR ÍNDICE -> TEXTO ACTUAL
        const itemLista = document.querySelector(`#listaComercio li[data-index="${indiceCorrecto}"]`);
        
        if (!itemLista) {
            console.warn(`Extensión: ⚠️ Índice "${indiceCorrecto}" no encontrado.`);
            return;
        }

        const textoActual = itemLista.querySelector('.etiquetaLugar').innerText.trim();
        const textoLimpioObjetivo = textoActual.replace(/['"“”]+/g, '').trim();

        console.log(`Extensión: 🧠 Buscando: "${textoLimpioObjetivo}"`);

        // BUSCAR EN OPCIONES
        const opciones = contenedor.querySelectorAll('.opcionPregunta');
        let encontrada = false;

        for (let op of opciones) {
            const textoOp = op.querySelector('.etiquetaLugar').innerText.trim();
            const limpioOp = textoOp.replace(/['"“”]+/g, '').trim();

            if (limpioOp === textoLimpioObjetivo) {
                op.click();
                encontrada = true;
                this.procesado = true;
                break;
            }
        }

        if (!encontrada) console.warn("Extensión: ⚠️ Respuesta no hallada.");
        window.ProBot.UI.setAccion('idle');
    },

    // --- MODO APRENDIZAJE ---
    activarVigilancia: function(contenedor) {
        if (this.listenersActivados) return;

        const opciones = contenedor.querySelectorAll('.opcionPregunta');
        
        opciones.forEach(op => {
            op.addEventListener('mousedown', () => {
                const textoClic = op.querySelector('.etiquetaLugar').innerText.trim();
                
                // Si el usuario clica "Ninguna...", no intentamos buscar ID porque no tiene
                if (textoClic.includes("Ninguna")) return;

                const textoLimpio = textoClic.replace(/['"“”]+/g, '').trim();
                this.indicePendiente = this.buscarIndicePorTexto(textoLimpio);
            });
        });

        this.listenersActivados = true;
        this.iniciarObservadorExito();
    },

    iniciarObservadorExito: function() {
        if (this.observadorExito) return; 

        const mainActivity = document.getElementById('Actividad_Main');
        if (!mainActivity) return;

        this.observadorExito = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'style') {
                    const style = mainActivity.style.backgroundColor;
                    if (style.includes('50, 205, 50') || style.includes('rgb(50, 205, 50)')) {
                        this.guardarAprendizaje();
                    }
                }
            });
        });
        this.observadorExito.observe(mainActivity, { attributes: true, attributeFilter: ['style'] });
    },

    guardarAprendizaje: function() {
        if (this.indicePendiente && this.preguntaHashActual) {
            console.log(`Extensión: ✅ Aprendido ID: "${this.indicePendiente}"`);
            window.ProBot.UI.setAccion('learning');
            
            window.ProBot.Utils.guardarEnBD(
                this.preguntaHashActual,
                this.textoPregunta, 
                this.indicePendiente
            );

            this.indicePendiente = null;
        }
    },

    buscarIndicePorTexto: function(textoBuscado) {
        const listaItems = document.querySelectorAll('#listaComercio li');
        for (let li of listaItems) {
            const spanTexto = li.querySelector('.etiquetaLugar');
            if (spanTexto) {
                const textoItem = spanTexto.innerText.trim().replace(/['"“”]+/g, '').trim();
                if (textoItem.toLowerCase() === textoBuscado.toLowerCase()) {
                    return li.getAttribute('data-index');
                }
            }
        }
        return null;
    },

    aprender: function() { }
};