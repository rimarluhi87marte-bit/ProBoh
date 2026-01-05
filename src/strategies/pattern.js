// --- Recordar patron de colores ---

window.ProBot.Estrategias.SIGUE_PATRON = {
    nombre: "Sigue el Patrón",
    huella: '#abajoIzquierda', 
    
    secuencia: [],
    timerFinSecuencia: null,
    observador: null,
    svgReferencia: null, // Guardamos la referencia al objeto HTML para ver si sigue vivo
    ejecutando: false,

    iniciar: function() {
        // 1. LÓGICA DE REINICIO (El arreglo del bug)
        // Si ya tenemos un observador, pero el SVG que mirábamos ha desaparecido del cuerpo de la página...
        // Significa que la plataforma cargó un nivel nuevo.
        if (this.observador && this.svgReferencia && !document.body.contains(this.svgReferencia)) {
            console.log("Extensión: ♻️ Nuevo Nivel detectado (El rombo anterior desapareció). Reiniciando...");
            
            // Matamos el observador viejo
            this.observador.disconnect();
            this.observador = null;
            this.svgReferencia = null;
            this.secuencia = [];
            this.ejecutando = false;
            window.ProBot.UI.setAccion('idle');
        }

        // Si el observador sigue vivo y válido, no hacemos nada
        if (this.observador) return;

        // 2. INICIALIZACIÓN
        window.ProBot.UI.setConocimiento('found');

        // Buscamos el nuevo elemento
        const ledRef = document.querySelector('#abajoIzquierda');
        if (!ledRef) return;
        
        const romboSVG = ledRef.closest('svg'); 
        this.svgReferencia = romboSVG; // Guardamos la referencia para el futuro chequeo

        console.log("Extensión: 🎮 Monitor de Patrón Conectado.");
        this.secuencia = [];
        this.ejecutando = false;

        const leds = romboSVG.querySelectorAll('path.LED');
        
        // Configuramos el observador
        const config = { attributes: true, attributeFilter: ['fill'] };

        this.observador = new MutationObserver((mutations) => {
            if (this.ejecutando) return;

            mutations.forEach(mutation => {
                const target = mutation.target;
                const fill = target.getAttribute('fill');

                // Detectamos encendido (diferente a apagado #343434)
                if (fill && fill !== '#343434' && !fill.includes('343434')) {
                    this.registrarPaso(target.id);
                }
            });
        });

        leds.forEach(led => this.observador.observe(led, config));
    },

    registrarPaso: function(id) {
        if (this.timerFinSecuencia) clearTimeout(this.timerFinSecuencia);

        this.secuencia.push(id);
        console.log(`Extensión: 💡 Luz detectada: ${id}`);
        window.ProBot.UI.setAccion('learning');

        // Esperamos silencio (1.8s) para asumir que es nuestro turno
        this.timerFinSecuencia = setTimeout(() => {
            this.reproducirSecuencia();
        }, 1600);
    },

    reproducirSecuencia: async function() {
        if (this.secuencia.length === 0) return;

        console.log("Extensión: ⚡ Reproduciendo secuencia...");
        this.ejecutando = true; 
        window.ProBot.UI.setAccion('executing');

        await window.ProBot.Utils.esperar(100);

        for (let id of this.secuencia) {
            // Buscamos el elemento ACTUAL en el DOM (importante por si cambió el nivel justo antes)
            const elemento = document.getElementById(id);
            if (elemento) {
                this.simularClick(elemento);
                await window.ProBot.Utils.esperar(250); 
            }
        }

        console.log("Extensión: ✅ Secuencia enviada.");
        
        // Limpiamos SOLO la secuencia, pero mantenemos el observador vivo 
        // por si es el mismo nivel y la máquina añade más pasos.
        this.secuencia = [];
        this.ejecutando = false;
        window.ProBot.UI.setAccion('idle');
    },

    simularClick: function(elemento) {
        const eventos = ['mousedown', 'mouseup', 'click'];
        eventos.forEach(tipo => {
            const evento = new MouseEvent(tipo, {
                view: window,
                bubbles: true,
                cancelable: true
            });
            elemento.dispatchEvent(evento);
        });
    },

    aprender: function() { }
};