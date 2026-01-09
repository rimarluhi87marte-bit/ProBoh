// --- Ejercicio de atencion selectiva, unidad 11, cual gira mas rapido ---

window.ProBot.Estrategias.VELOCIDAD_GIRO = {
    nombre: "Velocidad de Giro",
    huella: '[preguntacontain]', 
    
    intervaloScanner: null,
    ultimaHuellaRonda: "", 
    procesado: false,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 🌪️ Monitor de Giro (Con Calentamiento) Activo...");
        this.procesado = false;
        this.ultimaHuellaRonda = "";

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    ciclo: async function() {
        const preguntaDiv = document.querySelector('[preguntacontain]');
        
        if (preguntaDiv && preguntaDiv.offsetParent !== null) {
            const texto = preguntaDiv.innerText.toLowerCase();
            const esRapido = texto.includes("rápido");
            const esLento = texto.includes("lento");
            
            if ((esRapido || esLento) && texto.includes("gira")) {
                
                const imagenes = document.querySelectorAll('div[id^="rec"] img');
                if (imagenes.length === 0) return;

                const tipoPregunta = esRapido ? "FAST" : "SLOW";
                const fuentes = Array.from(imagenes).map(img => img.src).join('|') + "|" + tipoPregunta;
                
                const algunReset = Array.from(document.querySelectorAll('div[id^="rec"]')).some(el => {
                    return Math.abs(this.getGrados(el)) < 50;
                });

                if (fuentes !== this.ultimaHuellaRonda || (algunReset && this.procesado)) {
                    console.log(`Extensión: 🔄 Nueva ronda (${tipoPregunta}). Esperando arranque...`);
                    this.ultimaHuellaRonda = fuentes;
                    this.procesado = false; 
                    window.ProBot.UI.setAccion('idle');
                }

                if (!this.procesado) {
                    await this.resolver(esRapido);
                }
            }
        }
    },

    resolver: async function(buscarMasRapido) {
        this.procesado = true; // Bloqueo inmediato
        window.ProBot.UI.setAccion('executing');

        // --- FASE 1: CALENTAMIENTO (2 Segundos) ---
        // Esperamos a que la animación vieja termine y la nueva tome velocidad constante.
        // Esto evita medir el momento en que están parados en 0.
        console.log("Extensión: ⏳ Calentando motores (2s)...");
        await window.ProBot.Utils.esperar(2000);

        // --- FASE 2: MEDICIÓN ---
        console.log("Extensión: 📏 Tomando medida inicial...");
        
        const elementos = document.querySelectorAll('div[id^="rec"]');
        if (elementos.length === 0) return;

        // FOTO 1
        const estadoInicial = new Map();
        elementos.forEach(el => {
            estadoInicial.set(el.id, this.getGrados(el));
        });

        // Esperamos 1s para medir el desplazamiento (Delta)
        await window.ProBot.Utils.esperar(1000);

        console.log("Extensión: 📏 Tomando medida final...");

        // FOTO 2 & CÁLCULO
        let mejorVelocidad = buscarMasRapido ? -1 : 9999999; 
        let elementoGanador = null;
        let conteoValidos = 0;

        elementos.forEach(el => {
            const gradosAntes = estadoInicial.get(el.id) || 0;
            const gradosAhora = this.getGrados(el);
            
            const delta = Math.abs(gradosAhora - gradosAntes);

            // FILTRO DE SEGURIDAD:
            // Si el delta es 0 (o casi 0), significa que el objeto NO se está moviendo.
            // Lo ignoramos para evitar clicks en objetos bugueados o estáticos.
            if (delta > 1) { 
                conteoValidos++;
                if (buscarMasRapido) {
                    if (delta > mejorVelocidad) {
                        mejorVelocidad = delta;
                        elementoGanador = el;
                    }
                } else {
                    if (delta < mejorVelocidad) {
                        mejorVelocidad = delta;
                        elementoGanador = el;
                    }
                }
            }
        });

        if (elementoGanador && conteoValidos > 0) {
            console.log(`Extensión: 🌪️ Ganador (${mejorVelocidad.toFixed(0)} deg/s). Click.`);
            const objetivoClick = elementoGanador.querySelector('img') || elementoGanador;
            objetivoClick.click();
        } else {
            console.warn("Extensión: ⚠️ Lectura inestable (Objetos parados). Reintentando...");
            this.procesado = false; // Soltamos para que vuelva a intentar medir en el siguiente ciclo
        }

        window.ProBot.UI.setAccion('idle');
    },

    getGrados: function(elemento) {
        const style = elemento.style.transform;
        const match = style.match(/rotate\(\s*([\d\.-]+)\s*deg\s*\)/);
        return match ? parseFloat(match[1]) : 0;
    },

    aprender: function() { }
};