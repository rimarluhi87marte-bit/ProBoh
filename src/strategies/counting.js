// --- Ejercicio de atencion dividida ---

window.ProBot.Estrategias.CLASIFICACION_FRUTAS = {
    nombre: "Clasificar y Contar",
    huella: '[clasifica-juego]', 
    
    memoriaConteos: {}, 
    ultimaImgDOM: null, 
    ultimoClickTime: 0,
    intervaloJuego: null,
    enFaseRespuesta: false,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloJuego) return;

        console.log("Extensión: 🍎 Clasificador Multifruta Activo...");
        this.memoriaConteos = {};
        this.enFaseRespuesta = false;
        this.ultimaImgDOM = null;
        this.ultimoClickTime = 0;

        this.intervaloJuego = setInterval(() => {
            this.cicloJuego();
        }, 50);
    },

    cicloJuego: async function() {
        // 1. ¿Pregunta visible?
        const contenedorPregunta = document.querySelector('[containeroopciones]');
        const preguntaDiv = document.querySelector('[preguntacontain]');
        
        if (contenedorPregunta && preguntaDiv && preguntaDiv.offsetParent !== null) {
            if (!this.enFaseRespuesta) this.resolverPregunta(preguntaDiv);
            return; 
        }

        // 2. Leer Contadores (Ahora soporta múltiples frutas por caja)
        this.actualizarMemoria();

        // 3. Clasificar
        const frutaVoladoraDiv = document.querySelector('[clasifica-juego_fruta]');
        if (!frutaVoladoraDiv) return;

        const imgVoladora = frutaVoladoraDiv.querySelector('img');
        
        if (!imgVoladora || imgVoladora.style.opacity === '0' || imgVoladora.style.display === 'none') {
            this.ultimaImgDOM = null; 
            return;
        }

        // Lógica Anti-Repetición
        const esMismaInstancia = (imgVoladora === this.ultimaImgDOM);
        const tiempoDesdeClick = Date.now() - this.ultimoClickTime;
        const cooldownActivo = tiempoDesdeClick < 500;

        if (esMismaInstancia && cooldownActivo) return;

        this.ultimaImgDOM = imgVoladora; 
        this.ultimoClickTime = Date.now();
        
        window.ProBot.UI.setAccion('executing');
        await this.clasificarFruta(imgVoladora.src);
    },

    actualizarMemoria: function() {
        // Buscamos directamente TODOS los contenedores de fruta individuales en la página
        // No importa si están agrupados en una caja o solos
        const wrappersFruta = document.querySelectorAll('[contenedor-fruta]');

        wrappersFruta.forEach(wrapper => {
            const imgRef = wrapper.querySelector('[containre-fruta_cajaimg]'); // (sic) containre
            const spanContador = wrapper.querySelector('[containre-fruta_cajacantidad] span');

            if (imgRef && spanContador) {
                // Guardamos cada fruta individualmente en la memoria
                this.memoriaConteos[imgRef.src] = parseInt(spanContador.innerText.trim()) || 0;
            }
        });
    },

    clasificarFruta: async function(srcBuscada) {
        const contenedoresCaja = document.querySelectorAll('[container-caja]');
        let encontrada = false;

        // Recorremos cada caja grande (que puede tener 1 o 2 frutas)
        for (let container of contenedoresCaja) {
            
            // CAMBIO CLAVE: Buscamos TODAS las imágenes de referencia en esta caja
            const imagenesRef = container.querySelectorAll('[containre-fruta_cajaimg]');
            
            // Revisamos si ALGUNA coincide con la fruta que cae
            for (let imgRef of imagenesRef) {
                if (imgRef.src === srcBuscada) {
                    
                    // ¡Coincidencia! Hacemos click en ESTA caja
                    const cajaClick = container.querySelector('[caja-sombra]');
                    if (cajaClick) {
                        cajaClick.click();
                        encontrada = true;
                    }
                    break; // Salimos del bucle de imágenes de esta caja
                }
            }

            if (encontrada) break; // Salimos del bucle de cajas
        }

        if (!encontrada) console.warn("Extensión: ⚠️ No encontré caja para esta fruta.");
        
        await window.ProBot.Utils.esperar(20);
        window.ProBot.UI.setAccion('idle');
    },

    resolverPregunta: async function(preguntaDiv) {
        this.enFaseRespuesta = true; 
        window.ProBot.UI.setAccion('executing');

        console.log("Extensión: 🛑 Fase de Pregunta.");
        
        const imgPregunta = preguntaDiv.querySelector('img');
        if (!imgPregunta) return;

        let respuestaCorrecta = this.memoriaConteos[imgPregunta.src];
        if (respuestaCorrecta === undefined) {
            this.actualizarMemoria();
            respuestaCorrecta = this.memoriaConteos[imgPregunta.src];
        }

        if (respuestaCorrecta === undefined) {
             window.ProBot.UI.setConocimiento('unknown');
             return;
        }

        console.log(`Extensión: 🔢 Respuesta calculada: ${respuestaCorrecta}`);
        
        await window.ProBot.Utils.esperar(1000); 

        const opciones = document.querySelectorAll('[opcioncontain2] [opcion]');
        for (let op of opciones) {
            const label = op.querySelector('label');
            if (label) {
                const numeroOpcion = parseInt(label.innerText.trim());
                if (numeroOpcion === respuestaCorrecta) {
                    const target = op.querySelector('[been]') || label;
                    target.click();
                    console.log("Extensión: 🏆 Click en respuesta.");
                    break;
                }
            }
        }
        
        window.ProBot.UI.setAccion('idle');
        this.limpiar();
    },

    limpiar: function() {
        if (this.intervaloJuego) {
            clearInterval(this.intervaloJuego);
            this.intervaloJuego = null;
        }
        this.memoriaConteos = {};
        this.ultimaImgDOM = null;
    },

    aprender: function() { }
};