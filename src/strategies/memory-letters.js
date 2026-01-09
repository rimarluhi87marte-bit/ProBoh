// --- Ejercicio de recordar que carta falta ---

window.ProBot.Estrategias.MEMORIA_CARTAS = {
    nombre: "Memoria de Cartas (Faltante)",
    huella: '.cartas-container', 
    
    letrasMemorizadas: new Set(),
    intervaloScanner: null,
    enFaseRespuesta: false,
    ultimaHuellaOpciones: "", // Para recordar qué ronda acabamos de resolver

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 🃏 Monitor de Cartas Activo...");
        this.letrasMemorizadas = new Set();
        this.enFaseRespuesta = false;
        this.ultimaHuellaOpciones = "";

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    ciclo: function() {
        // 1. DETECTAR FASE DE RESPUESTA
        const opciones = document.querySelectorAll('.listado-opciones');
        
        if (opciones.length > 0) {
            // Generamos una huella digital de las opciones actuales (Ej: "J|Q|R|W")
            const textos = Array.from(opciones).map(el => el.innerText.trim());
            const huellaActual = textos.join('|');

            // SI YA RESOLVIMOS ESTA PANTALLA, NO HACEMOS NADA
            if (huellaActual === this.ultimaHuellaOpciones) {
                return; 
            }

            if (!this.enFaseRespuesta) {
                this.resolver(opciones, huellaActual);
            }
            return; // Bloqueamos la memorización mientras hay opciones
        }

        // 2. FASE DE MEMORIZACIÓN
        const cartas = document.querySelectorAll('.cartas-container .contorno-carta span');
        
        if (cartas.length > 0) {
            // Si hay cartas visibles, nos aseguramos de que no sea una ronda vieja
            // Si la memoria estaba vacía, es una nueva ronda seguro.
            
            cartas.forEach(span => {
                const letra = span.innerText.trim();
                // Solo añadimos si es válida
                if (letra && !this.letrasMemorizadas.has(letra)) {
                    this.letrasMemorizadas.add(letra);
                    window.ProBot.UI.setAccion('learning');
                }
            });
        }
    },

    resolver: async function(nodelistOpciones, huellaActual) {
        this.enFaseRespuesta = true;
        window.ProBot.UI.setAccion('executing');

        console.log("Extensión: 🛑 Fase de Respuesta Detectada.");
        
        // AUMENTADO A 1200ms para respetar la animación
        await window.ProBot.Utils.esperar(1200); 

        let encontrada = false;

        for (let spanOpcion of nodelistOpciones) {
            const letraOpcion = spanOpcion.innerText.trim();
            
            if (this.letrasMemorizadas.has(letraOpcion)) {
                console.log(`Extensión: 🎯 Encontrada coincidencia: "${letraOpcion}"`);
                
                const cartaClick = spanOpcion.closest('.carta-opciones');
                if (cartaClick) {
                    cartaClick.click();
                    encontrada = true;
                    
                    // MARCADO COMO RESUELTO:
                    // Guardamos la huella para no volver a entrar aquí hasta que cambien las letras
                    this.ultimaHuellaOpciones = huellaActual;
                }
                break;
            }
        }

        if (!encontrada) {
            console.warn("Extensión: ⚠️ Ninguna coincidencia. Reintentando...");
            // Si fallamos, permitimos reintentar en el siguiente ciclo (no guardamos huella)
            this.enFaseRespuesta = false; 
        } else {
            // Éxito: Limpiamos la memoria para la siguiente ronda, 
            // pero mantenemos 'ultimaHuellaOpciones' para el bloqueo.
            this.limpiarMemoria();
        }
        
        window.ProBot.UI.setAccion('idle');
    },

    limpiarMemoria: function() {
        this.letrasMemorizadas = new Set();
        this.enFaseRespuesta = false;
        // Ya no necesitamos el setTimeout, la huella nos protege.
    },

    aprender: function() { }
};