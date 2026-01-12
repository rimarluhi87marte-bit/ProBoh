// --- Dar click al mismo numero que te dicen ---

window.ProBot.Estrategias.EMPAREJAR_NUMEROS = {
    nombre: "Emparejar Números (Filas)",
    // Huella: La clase de la fila contenedora
    huella: '.row-pregunta', 
    
    ultimaFirma: "", // Para detectar si cambiaron los números
    intervaloScanner: null,
    procesado: false,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 🔢 Monitor de Emparejamiento Activo...");
        this.procesado = false;
        this.ultimaFirma = "";

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 200);
    },

    ciclo: async function() {
        // Obtenemos todas las filas del ejercicio
        const filas = document.querySelectorAll('.row-pregunta');
        if (filas.length === 0) return;

        // Generamos una firma única sumando todo el texto para ver si cambió el nivel
        // Ej: "419419941...|247742..."
        const firmaActual = Array.from(filas).map(f => f.innerText.trim()).join('|');

        if (firmaActual !== this.ultimaFirma) {
            console.log("Extensión: 🔄 Nuevas filas detectadas.");
            this.ultimaFirma = firmaActual;
            this.procesado = false;
            window.ProBot.UI.setAccion('idle');
        }

        if (!this.procesado) {
            await this.resolver(filas);
        }
    },

    resolver: async function(filas) {
        this.procesado = true;
        window.ProBot.UI.setAccion('executing');

        console.log(`Extensión: 🚀 Resolviendo ${filas.length} filas...`);
        
        // Espera humana inicial
        await window.ProBot.Utils.esperar(800);

        // Recorremos cada fila una por una
        for (let fila of filas) {
            // Obtenemos los bloques dentro de la fila (hijos directos)
            // Filtramos para asegurar que sean elementos HTML (divs)
            const bloques = Array.from(fila.children).filter(el => el.tagName === 'DIV');

            if (bloques.length < 2) continue; // Necesitamos al menos objetivo + 1 opción

            // 1. EL OBJETIVO ES EL PRIMERO (Índice 0)
            const objetivoDiv = bloques[0];
            const textoObjetivo = objetivoDiv.innerText.trim();

            // 2. LAS OPCIONES SON EL RESTO (Índices 1 en adelante)
            const opciones = bloques.slice(1);

            let clickRealizado = false;

            for (let op of opciones) {
                const textoOpcion = op.innerText.trim();

                // Comparación directa
                if (textoOpcion === textoObjetivo) {
                    // Click en el contenedor y en el span interno por seguridad
                    op.click();
                    const span = op.querySelector('span');
                    if (span) span.click();
                    
                    clickRealizado = true;
                    // console.log(`Extensión: 🎯 Match: ${textoObjetivo}`);
                    break; // Solo hay 1 correcto por fila, pasamos a la siguiente fila
                }
            }
            
            // Pequeña pausa entre fila y fila para que parezca humano
            if (clickRealizado) {
                await window.ProBot.Utils.esperar(300);
            }
        }

        window.ProBot.UI.setAccion('idle');
    },

    aprender: function() { }
};