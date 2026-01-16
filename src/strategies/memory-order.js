// --- Hacer clic a la figura que te pidan ---

window.ProBot.Estrategias.MEMORIA_ORDEN = {
    nombre: "Memoria Orden (Posiciones)",
    huella: '.contenedor-cuadricula', 
    
    registroApariciones: {}, 
    intervaloScanner: null,
    enFaseRespuesta: false,
    
    mapaOrdinales: {
        "primera": 0,
        "segunda": 1,
        "tercera": 2,
        "cuarta": 3,
        "quinta": 4,
        "sexta": 5,
        "séptima": 6, "septima": 6,
        "octava": 7
    },

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 🔢 Monitor de Orden de Aparición Activo...");
        this.registroApariciones = {};
        this.enFaseRespuesta = false;

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 50);
    },

    ciclo: function() {
        // 1. DETECTAR FASE RESPUESTA
        const cajaTexto = document.querySelector('.contenedor-izquierda .caja-texto');
        
        if (cajaTexto && cajaTexto.offsetParent !== null && cajaTexto.style.display !== 'none') {
            if (!this.enFaseRespuesta) {
                this.resolver(cajaTexto);
            }
            return;
        }

        // 2. FASE MEMORIZACIÓN
        if (this.enFaseRespuesta) {
            this.enFaseRespuesta = false;
            this.registroApariciones = {};
            window.ProBot.UI.setAccion('idle');
            console.log("Extensión: 🔄 Nueva ronda de orden.");
        }

        const cuadros = document.querySelectorAll('.contenedor-cuadricula .cuadro');
        
        cuadros.forEach((cuadro, index) => {
            const icono = cuadro.querySelector('i.fa');
            
            if (icono && icono.style.display !== 'none') {
                const huella = this.generarHuella(icono);
                
                if (!this.registroApariciones[huella]) {
                    this.registroApariciones[huella] = [];
                }

                const aparicionesPrevias = this.registroApariciones[huella];
                const ultimaPosicion = aparicionesPrevias[aparicionesPrevias.length - 1];

                if (ultimaPosicion !== index) {
                    this.registroApariciones[huella].push(index);
                    window.ProBot.UI.setAccion('learning');
                }
            }
        });
    },

    resolver: async function(cajaTexto) {
        this.enFaseRespuesta = true;
        window.ProBot.UI.setAccion('executing');

        console.log("Extensión: 🛑 Fase Respuesta. Esperando 1.2s...");
        
        // --- DELAY DE SEGURIDAD (1200ms para asegurar >800ms) ---
        await window.ProBot.Utils.esperar(1200);

        // 1. ¿QUÉ ICONO PIDEN?
        const iconoObjetivo = cajaTexto.querySelector('i.fa');
        if (!iconoObjetivo) return;
        const huellaObjetivo = this.generarHuella(iconoObjetivo);

        // 2. ¿QUÉ ORDEN PIDEN?
        const titulo = cajaTexto.querySelector('h3').innerText.toLowerCase();
        let indiceArray = -1; 

        // Chequeo especial para "Última"
        if (titulo.includes("última") || titulo.includes("ultima")) {
            indiceArray = "LAST";
        } else {
            // Chequeo estándar ordinal
            for (const [palabra, numero] of Object.entries(this.mapaOrdinales)) {
                if (titulo.includes(palabra)) {
                    indiceArray = numero;
                    break;
                }
            }
        }

        // 3. BUSCAR EN MEMORIA
        const historial = this.registroApariciones[huellaObjetivo];

        if (historial && historial.length > 0) {
            
            // Calculamos la posición real a buscar
            let posicionEnGrid = -1;

            if (indiceArray === "LAST") {
                // Sacamos el último elemento del array
                posicionEnGrid = historial[historial.length - 1];
                console.log(`Extensión: 🧠 Buscando la ÚLTIMA aparición (Total: ${historial.length}).`);
            } else if (indiceArray !== -1 && historial.length > indiceArray) {
                // Sacamos el índice específico
                posicionEnGrid = historial[indiceArray];
                console.log(`Extensión: 🧠 Buscando la aparición #${indiceArray + 1}.`);
            }

            // Ejecutar Click
            if (posicionEnGrid !== -1) {
                const cuadros = document.querySelectorAll('.contenedor-cuadricula .cuadro');
                if (cuadros[posicionEnGrid]) {
                    console.log(`Extensión: 🎯 Click en celda ${posicionEnGrid}.`);
                    cuadros[posicionEnGrid].click();
                    
                    const i = cuadros[posicionEnGrid].querySelector('i');
                    if (i) i.click();
                }
            } else {
                console.warn(`Extensión: ⚠️ Índice fuera de rango en memoria.`);
            }

        } else {
            console.warn(`Extensión: ⚠️ No tengo registro de este icono.`);
            this.enFaseRespuesta = false; // Reintentar
        }

        window.ProBot.UI.setAccion('idle');
    },

    generarHuella: function(elemento) {
        let claseIcono = "";
        const clases = elemento.classList;
        for (let c of clases) {
            if (c.startsWith('fa-') && c !== 'fa') {
                claseIcono = c;
            }
        }
        
        let color = elemento.style.color; 
        if (color) color = color.replace(/\s+/g, '').toLowerCase();

        return `${claseIcono}|${color}`;
    },

    aprender: function() { }
};