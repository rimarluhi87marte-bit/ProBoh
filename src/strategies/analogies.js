// --- Ejercio de asociacion y similes ---

window.ProBot.Estrategias.ANALOGIAS = {
    nombre: "Analogías Verbales (Híbrido)",
    huella: '.texto-preguntar, .pregunta-contenedor', 
    
    preguntaHashActual: "",
    textoPregunta: "",
    procesado: false,
    yaAprendido: false,
    
    puedeAprender: false, 
    timerBloqueo: null,

    iniciar: function() {
        const preguntaEl = document.querySelector('.texto-preguntar') || 
                           document.querySelector('.pregunta-contenedor h2');
        
        if (preguntaEl) {
            const texto = preguntaEl.innerText.trim();
            if (texto === "..." || texto.length < 5) return;

            window.ProBot.Utils.sha256(texto).then(hash => {
                if (hash !== this.preguntaHashActual) {
                    // Nueva pregunta
                    this.preguntaHashActual = hash;
                    this.textoPregunta = texto;
                    this.procesado = false;
                    this.yaAprendido = false;
                    
                    // Escudo temporal
                    this.puedeAprender = false;
                    if (this.timerBloqueo) clearTimeout(this.timerBloqueo);
                    this.timerBloqueo = setTimeout(() => {
                        this.puedeAprender = true;
                    }, 2500);

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
        console.log(`Extensión: 🔎 Buscando respuesta: "${respuestaCorrecta}"...`);

        const respuestaLimpia = respuestaCorrecta.trim().toLowerCase().replace(/\.$/, "");
        let encontrada = false;
        let intentos = 0;

        while (intentos < 10) {
            // OBTENER OPCIONES (Dual)
            let opciones = [];
            const opcionesViejas = document.querySelectorAll('#caja-opciones-respuesta .zelda-texto span');
            if (opcionesViejas.length > 0) opciones = opcionesViejas;
            
            const opcionesNuevas = document.querySelectorAll('.pregunta-respuestas button.respuestas span');
            if (opcionesNuevas.length > 0) opciones = opcionesNuevas;

            // BUSCAR COINCIDENCIA
            for (let op of opciones) {
                const textoOpcion = op.innerText.trim().toLowerCase().replace(/\.$/, ""); 

                if (textoOpcion === respuestaLimpia) {
                    console.log(`Extensión: 🎯 Encontrada: "${textoOpcion}"`);
                    
                    op.click(); 
                    const padre = op.closest('td') || op.closest('button');
                    if (padre) padre.click();

                    encontrada = true;
                    break; 
                }
            }

            if (encontrada) break;
            await window.ProBot.Utils.esperar(1000);
            intentos++;
        }

        if (encontrada) {
            this.procesado = true;
            await this.confirmar();
        } else {
            console.warn(`Extensión: ❌ No encontré la respuesta "${respuestaCorrecta}".`);
        }
        
        window.ProBot.UI.setAccion('idle');
    },

    confirmar: async function() {
        await window.ProBot.Utils.esperar(500);
        const btn = document.querySelector('button.rojo');
        if (btn && btn.innerText.includes("Responder")) {
            btn.click();
        }
    },

    aprender: function() {
        if (!this.puedeAprender) return;

        let textoSpan = null;

        // 1. Diseño Viejo: .alrededor.correcto
        const divViejo = document.querySelector('.alrededor.correcto, .alrededor.resaltar-correcta');
        if (divViejo) textoSpan = divViejo.querySelector('.zelda-texto span');

        // 2. Diseño Nuevo: Botones coloreados
        if (!textoSpan) {
            // Buscamos DOS posibles indicadores de éxito:
            // A. .seleccionado-correcto -> Acertamos
            // B. .seleccionado-debio   -> Fallamos, pero la plataforma nos chiva la correcta
            const btnNuevo = document.querySelector('button.seleccionado-correcto span, button.seleccionado-debio span');
            
            if (btnNuevo) {
                textoSpan = btnNuevo;
            }
        }
        
        // 3. Guardar si encontramos algo
        if (textoSpan && !this.yaAprendido) {
            if (this.preguntaHashActual) {
                const respuestaLimpia = textoSpan.innerText.trim().replace(/\.$/, "");
                
                console.log(`Extensión: 🎓 Aprendido: "${respuestaLimpia}"`);
                window.ProBot.UI.setAccion('learning');

                window.ProBot.Utils.guardarEnBD(
                    this.preguntaHashActual, 
                    this.textoPregunta, 
                    respuestaLimpia
                );
                
                this.yaAprendido = true;
            }
        }
    }
};