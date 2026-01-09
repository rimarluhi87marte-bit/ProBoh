// --- Ejercicio de atencion dividida unidad 8 ---

window.ProBot.Estrategias.ATENCION_DIVIDIDA = {
    nombre: "Atención Dividida",
    huella: '#vaso-con-liquido', 
    
    // Variables Figuras
    ultimaFiguraDOM: null, 
    ultimoClickFigura: 0,
    
    // Variables Líquido
    intervaloMonitor: null,
    procesandoLiquido: false, 

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloMonitor) return;

        console.log("Extensión: 🤹 Atención Dividida (Sensor de Estilo) Activo...");
        
        this.ultimaFiguraDOM = null;
        this.ultimoClickFigura = 0;
        this.procesandoLiquido = false;

        // Intervalo rápido (50ms)
        this.intervaloMonitor = setInterval(() => {
            this.cicloGeneral();
        }, 50);
    },

    cicloGeneral: function() {
        this.gestionarFiguras();
        this.gestionarLiquido();
    },

    // --- TAREA A: CLASIFICACIÓN DE FIGURAS ---
    gestionarFiguras: async function() {
        const centroDiv = document.querySelector('.centro img');
        
        if (!centroDiv || centroDiv.style.opacity === '0' || centroDiv.style.display === 'none') {
            this.ultimaFiguraDOM = null; 
            return;
        }

        // Lógica de instancia (para detectar la misma imagen repetida si es un nuevo objeto)
        const esMismoElemento = (centroDiv === this.ultimaFiguraDOM);
        const cooldown = (Date.now() - this.ultimoClickFigura) < 1000;

        if (esMismoElemento && cooldown) return;

        this.ultimaFiguraDOM = centroDiv;
        this.ultimoClickFigura = Date.now();

        const miniboxes = document.querySelectorAll('.minibox img');
        const nombreCentro = this.getNombreArchivo(centroDiv.src);

        for (let mini of miniboxes) {
            if (this.getNombreArchivo(mini.src) === nombreCentro) {
                await window.ProBot.Utils.esperar(100);
                mini.click();
                
                window.ProBot.UI.setAccion('executing');
                setTimeout(() => window.ProBot.UI.setAccion('idle'));
                break;
            }
        }
    },

    // --- TAREA B: CONTROL DEL LÍQUIDO (POR HEIGHT) ---
    gestionarLiquido: function() {
        if (this.procesandoLiquido) return; 

        const liquido = document.getElementById('contenido-liquido');
        if (!liquido) return;

        // Leemos el estilo inline: style="height: 40.6052%;"
        const estiloHeight = liquido.style.height;
        
        if (estiloHeight) {
            // Extraemos el número (parseFloat ignora el %)
            const alturaNumerica = parseFloat(estiloHeight);

            // Condición estricta: >= 60%
            if (alturaNumerica >= 55) {
                console.log(`Extensión: 🌊 Altura detectada: ${alturaNumerica}%`);
                this.procesandoLiquido = true; // Bloqueamos

                // Espera solicitada de 0.2s
                setTimeout(() => {
                    this.pulsarBotonLiquido();
                }, 200); 
            }
        }
    },

    pulsarBotonLiquido: function() {
        const boton = document.querySelector('[container-boton] img');
        
        if (boton) {
            boton.click();
            console.log("Extensión: 💧 Botón presionado.");
            window.ProBot.UI.setAccion('learning'); 
        }

        // Damos tiempo a que baje el líquido para no volver a detectar >60 inmediatamente
        setTimeout(() => {
            this.procesandoLiquido = false;
            window.ProBot.UI.setAccion('idle');
        }, 1500);
    },

    getNombreArchivo: function(url) {
        try {
            return url.split('/').pop().split('?')[0];
        } catch (e) {
            return url;
        }
    },

    aprender: function() { },

    detener: function() {
        if (this.intervaloMonitor) clearInterval(this.intervaloMonitor);
        this.intervaloMonitor = null;
    }
};