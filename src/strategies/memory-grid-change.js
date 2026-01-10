// --- Decir cual numero de la tabla ha cambiado ---

window.ProBot.Estrategias.MEMORIA_GRID_CAMBIO = {
    nombre: "Memoria Cambio Letras (Grid)",
    // Huella: La tabla específica de este ejercicio
    huella: '#contenedorElementosMostrar', 
    
    // Mapa: { "1": "z", "10": "n" } (Index -> Letra)
    memoriaEstado: {}, 
    intervaloScanner: null,
    enFaseRespuesta: false,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 🧩 Monitor de Cambio Letras Activo...");
        this.memoriaEstado = {};
        this.enFaseRespuesta = false;

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    ciclo: function() {
        // 1. DETECTAR SI HAY TÍTULO VISIBLE (Fase de Respuesta)
        const tituloCambio = document.getElementById('lblTituloJuegoForma0'); // ¿Cuál cambió?
        const tituloSobra = document.getElementById('lblTituloJuegoForma1');  // ¿Cuál sobra?
        
        const esFaseRespuesta = (tituloCambio && tituloCambio.style.display !== 'none') || 
                                (tituloSobra && tituloSobra.style.display !== 'none');

        if (esFaseRespuesta) {
            if (!this.enFaseRespuesta) {
                // Solo si tenemos memoria intentamos resolver
                if (Object.keys(this.memoriaEstado).length > 0) {
                    this.resolver();
                }
            }
            return;
        }

        // 2. FASE DE MEMORIZACIÓN (Títulos ocultos)
        // Si veníamos de responder, reseteamos
        if (this.enFaseRespuesta) {
            this.enFaseRespuesta = false;
            this.memoriaEstado = {};
            window.ProBot.UI.setAccion('idle');
            console.log("Extensión: 🔄 Nueva ronda letras.");
        }

        this.memorizar();
    },

    memorizar: function() {
        // Buscamos las celdas que tienen algo (clase 'usado')
        const celdasUsadas = document.querySelectorAll('#contenedorElementosMostrar td.usado');
        
        celdasUsadas.forEach(td => {
            const index = td.getAttribute('data-ind');
            const span = td.querySelector('.elementoOpcion');
            
            if (index && span) {
                const letra = span.innerText.trim();
                
                // Guardamos estado: Posición -> Letra
                if (this.memoriaEstado[index] !== letra) {
                    this.memoriaEstado[index] = letra;
                    // console.log(`Extensión: 📥 Memorizado Pos ${index}: ${letra}`);
                    window.ProBot.UI.setAccion('learning');
                }
            }
        });
    },

    resolver: async function() {
        this.enFaseRespuesta = true;
        window.ProBot.UI.setAccion('executing');

        console.log("Extensión: 🛑 Fase Respuesta. Buscando la letra intrusa...");
        
        await window.ProBot.Utils.esperar(1000); 

        const celdasActuales = document.querySelectorAll('#contenedorElementosMostrar td.usado');
        let encontrada = false;

        for (let td of celdasActuales) {
            const index = td.getAttribute('data-ind');
            const span = td.querySelector('.elementoOpcion');

            if (index && span) {
                const letraActual = span.innerText.trim();
                const letraMemorizada = this.memoriaEstado[index];

                // LÓGICA DE CAMBIO:
                // Si en esta posición (index) teníamos una letra guardada,
                // PERO la letra que vemos ahora es distinta...
                if (letraMemorizada && letraActual !== letraMemorizada) {
                    console.log(`Extensión: 🎯 ¡CAMBIO! Pos ${index} (${letraMemorizada} -> ${letraActual})`);
                    
                    td.click(); // Click en la celda
                    if (span) span.click(); // Click en la letra por si acaso

                    encontrada = true;
                    break;
                }
                
                // NOTA: Si quisieras soportar "¿Cuál sobra?", la lógica sería:
                // if (!letraMemorizada) { ... es la nueva ... }
            }
        }

        if (!encontrada) {
            console.warn("Extensión: ⚠️ No encontré cambios.");
            this.enFaseRespuesta = false; // Reintentar
        } else {
            // Limpieza diferida
            window.ProBot.UI.setAccion('idle');
            this.memoriaEstado = {};
        }
    },

    aprender: function() { }
};