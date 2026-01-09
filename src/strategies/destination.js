// --- Decir cual fue el destino de cada palabra ---

window.ProBot.Estrategias.DESTINOS_PALABRAS = {
    nombre: "Destinos y Palabras (Texto)",
    huella: '.contenedor-destino', 
    
    memoriaRutas: {}, 
    intervaloScanner: null,
    enFaseRespuesta: false,
    
    // Nueva variable para bloquear la pregunta actual
    ultimaPreguntaRespondida: null, 

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: ✈️ Monitor de Vuelos (Un solo clic) Activo...");
        this.memoriaRutas = {};
        this.enFaseRespuesta = false;
        this.ultimaPreguntaRespondida = null;

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    ciclo: function() {
        // 1. DETECTAR PREGUNTA (Fase Respuesta)
        const tspansNegrita = document.querySelectorAll('text tspan[font-weight="700"]');
        
        let palabraObjetivo = null;
        for (let tspan of tspansNegrita) {
            if (tspan.closest('svg') && tspan.textContent.trim().length > 0) {
                palabraObjetivo = tspan.textContent.trim();
                break;
            }
        }

        if (palabraObjetivo) {
            // BLOQUEO: Si ya respondimos a esta palabra exacta, no hacemos nada.
            if (palabraObjetivo === this.ultimaPreguntaRespondida) return;

            if (!this.enFaseRespuesta) {
                this.resolver(palabraObjetivo);
            }
            return;
        } else {
            // Si NO hay pregunta (hemos vuelto a los aviones o pantalla de carga)
            // Reseteamos el bloqueo para estar listos para la siguiente ronda
            if (this.ultimaPreguntaRespondida !== null) {
                this.ultimaPreguntaRespondida = null;
                this.enFaseRespuesta = false;
                this.memoriaRutas = {}; // Limpiamos memoria vieja por seguridad
                console.log("Extensión: 🔄 Nueva ronda de vuelos detectada.");
            }
        }

        // 2. FASE DE RASTREO (Memorizar Rutas)
        const contenedores = document.querySelectorAll('.contenedor-destino');
        
        contenedores.forEach(cont => {
            const nodoTextoAvion = cont.querySelector('.transporte text');
            const nodoNombreDestino = cont.querySelector('.lugar-destino .titulo-destino');

            if (nodoTextoAvion && nodoNombreDestino) {
                const palabra = nodoTextoAvion.textContent.trim();
                const pais = nodoNombreDestino.innerText.trim();
                
                if (palabra && pais && this.memoriaRutas[palabra] !== pais) {
                    this.memoriaRutas[palabra] = pais;
                    window.ProBot.UI.setAccion('learning');
                }
            }
        });
    },

    resolver: async function(palabraBuscada) {
        this.enFaseRespuesta = true;
        window.ProBot.UI.setAccion('executing');

        console.log(`Extensión: 🛑 Pregunta: "${palabraBuscada}"`);
        
        await window.ProBot.Utils.esperar(1000); 

        const nombrePaisObjetivo = this.memoriaRutas[palabraBuscada];
        let clickRealizado = false;

        if (nombrePaisObjetivo) {
            const destinosActuales = document.querySelectorAll('.contenedor-destino .lugar-destino');

            for (let destino of destinosActuales) {
                const titulo = destino.querySelector('.titulo-destino');
                if (titulo && titulo.innerText.trim() === nombrePaisObjetivo) {
                    
                    console.log("Extensión: 🎯 Destino encontrado. Click.");
                    destino.click();
                    const img = destino.querySelector('img');
                    if (img) img.click();

                    clickRealizado = true;
                    break;
                }
            }
        } else {
            // Intento fuzzy
            const keys = Object.keys(this.memoriaRutas);
            const match = keys.find(k => k.includes(palabraBuscada) || palabraBuscada.includes(k));
            if (match) {
                this.memoriaRutas[palabraBuscada] = this.memoriaRutas[match]; 
                this.resolver(palabraBuscada); 
                return;
            }
        }

        if (clickRealizado) {
            // MARCAMOS COMO COMPLETADO
            this.ultimaPreguntaRespondida = palabraBuscada;
            window.ProBot.UI.setAccion('idle');
            // Nota: No reseteamos enFaseRespuesta a false aquí.
            // Se reseteará automáticamente en el ciclo() cuando la pregunta desaparezca.
        } else {
            console.warn(`Extensión: ⚠️ No pude resolver "${palabraBuscada}". Reintentando...`);
            // Si falló, permitimos que el ciclo lo intente de nuevo
            this.enFaseRespuesta = false; 
        }
    },

    aprender: function() { }
};