// --- src/strategies/text-message.js ---

window.ProBot.Estrategias.MENSAJE_TEXTO = {
    nombre: "Memoria Mensaje (Máquina de Escribir)",
    huella: '.contenedor_mensaje', 
    
    bufferFinal: "",    // Memoria permanente (frases completadas)
    textoEnCurso: "",   // Lo que se está escribiendo ahora mismo
    intervaloScanner: null,
    enFaseRespuesta: false,
    yaRespondido: false,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 📜 Monitor de Mensaje (Incremental) Activo...");
        this.resetEstado();

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    resetEstado: function() {
        this.bufferFinal = "";
        this.textoEnCurso = "";
        this.enFaseRespuesta = false;
        this.yaRespondido = false;
    },

    ciclo: function() {
        // 1. DETECTAR FASE DE PREGUNTA
        const contenedorRespuestas = document.querySelector('.contenedor-respuestas-oracion');
        
        if (contenedorRespuestas && contenedorRespuestas.offsetParent !== null) {
            if (this.yaRespondido) return;

            if (!this.enFaseRespuesta) {
                // Antes de resolver, guardamos lo último que se estaba escribiendo
                this.archivarFraseActual(); 
                this.resolver(contenedorRespuestas);
            }
            return; 
        }

        // 2. DETECTAR RESET
        if (this.yaRespondido && !contenedorRespuestas) {
            this.yaRespondido = false;
            this.resetEstado();
            console.log("Extensión: 🔄 Nueva ronda mensaje.");
        }

        // 3. FASE DE GRABACIÓN INCREMENTAL
        const cajaMensaje = document.querySelector('.contenedor_mensaje');
        
        if (cajaMensaje) {
            // Limpiamos saltos de línea y espacios dobles
            const lecturaActual = cajaMensaje.innerText.replace(/\s+/g, ' ').trim();
            
            if (lecturaActual.length > 0) {
                // --- LÓGICA DE MÁQUINA DE ESCRIBIR ---
                
                // CASO A: El texto está creciendo (ej: "Hol" -> "Hola")
                // Verificamos si lo nuevo empieza con lo que ya teníamos
                if (lecturaActual.startsWith(this.textoEnCurso)) {
                    this.textoEnCurso = lecturaActual; // Solo actualizamos el borrador
                }
                // CASO B: El texto cambió totalmente (Nueva frase)
                else {
                    // Guardamos la frase anterior en la memoria permanente
                    this.archivarFraseActual();
                    
                    // Empezamos la nueva frase
                    this.textoEnCurso = lecturaActual;
                }
                
                window.ProBot.UI.setAccion('learning');
            }
        }
    },

    archivarFraseActual: function() {
        if (this.textoEnCurso.length > 0) {
            this.bufferFinal += " " + this.textoEnCurso;
            // console.log(`Extensión: 📝 Frase archivada: "${this.textoEnCurso}"`);
            this.textoEnCurso = ""; // Limpiamos el borrador
        }
    },

    resolver: async function(contenedor) {
        this.enFaseRespuesta = true;
        window.ProBot.UI.setAccion('executing');

        console.log("Extensión: 🛑 Fin de mensaje. Analizando...");
        
        // Unimos todo: Lo archivado + lo que haya quedado en curso
        const memoriaCompleta = (this.bufferFinal + " " + this.textoEnCurso).replace(/\s+/g, ' ').toLowerCase();

        await window.ProBot.Utils.esperar(1000); 

        const opciones = contenedor.querySelectorAll('.opcion-respuesta');
        let encontrada = false;

        for (let btn of opciones) {
            const spanTexto = btn.querySelector('.span-opt-text');
            if (!spanTexto) continue;

            const textoOpcion = spanTexto.innerText.trim();
            const textoOpcionLimpio = textoOpcion.replace(/\s+/g, ' ').toLowerCase();

            // Comparación: ¿La opción es parte de lo que leímos?
            if (memoriaCompleta.includes(textoOpcionLimpio)) {
                console.log(`Extensión: 🎯 Coincidencia: "${textoOpcion.substring(0, 30)}..."`);
                btn.click();
                encontrada = true;
                break;
            }
        }

        if (encontrada) {
            this.yaRespondido = true;
            await window.ProBot.Utils.esperar(500);
        } else {
            console.warn("Extensión: ⚠️ No encontré el texto en mi memoria.");
            // console.log("Memoria Dump:", memoriaCompleta); // Descomentar para depurar
            window.ProBot.UI.setConocimiento('unknown');
            this.enFaseRespuesta = false; 
        }

        if (encontrada) window.ProBot.UI.setAccion('idle');
    },

    aprender: function() { }
};