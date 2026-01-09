// --- Atencion dividia unidad 11, presionar sombrero y recordar objetos ---

window.ProBot.Estrategias.ATENCION_DIVIDIDA_2 = {
    nombre: "Sombreros y Memoria",
    huella: '.container_sombrero, .circulo', 
    
    intervaloScanner: null,
    figurasVistas: new Set(),
    enFaseRespuesta: false,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 🎩 Monitor Dividido (Selector Universal) Activo...");
        
        this.resetEstado();

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 50);
    },

    resetEstado: function() {
        this.figurasVistas = new Set();
        this.enFaseRespuesta = false;
    },

    ciclo: function() {
        const tituloPregunta = document.querySelector('.ejercicio__figuras__titulo_dos strong');
        
        if (tituloPregunta && tituloPregunta.innerText.includes("no apareció")) {
            if (!this.enFaseRespuesta) {
                this.resolverMemoria();
            }
            return; 
        }

        this.gestionarSombreros();
        this.memorizarFiguras();
    },

    gestionarSombreros: function() {
        const figuraObjetivoDiv = document.querySelector('.figura img');
        if (!figuraObjetivoDiv) return;
        
        const nombreObjetivo = this.getNombreArchivo(figuraObjetivoDiv.src);
        const sombrerosVisibles = document.querySelectorAll('.sombrero:not(.oculto)');

        sombrerosVisibles.forEach(sombrero => {
            if (sombrero.style.display === 'none' || sombrero.dataset.procesado === "true") return;

            const img = sombrero.querySelector('img');
            if (!img) return;

            if (this.getNombreArchivo(img.src) === nombreObjetivo) {
                sombrero.dataset.procesado = "true";
                
                setTimeout(() => {
                    this.simularClick(sombrero); 
                    this.simularClick(img);
                    window.ProBot.UI.setAccion('executing');
                    setTimeout(() => window.ProBot.UI.setAccion('idle'), 200);
                }, 200);
            }
        });
    },

    memorizarFiguras: function() {
        const circuloImg = document.querySelector('.circulo img');
        
        if (circuloImg && circuloImg.offsetParent !== null) {
            const nombre = this.getNombreArchivo(circuloImg.src);
            
            if (nombre && !this.figurasVistas.has(nombre)) {
                this.figurasVistas.add(nombre);
                console.log(`Extensión: 👁️ Figura memorizada: ${nombre}`);
                window.ProBot.UI.setAccion('learning');
            }
        }
    },

    resolverMemoria: async function() {
        this.enFaseRespuesta = true;
        window.ProBot.UI.setAccion('executing');

        console.log("Extensión: 🛑 Fase de Respuesta (Universal).");
        await window.ProBot.Utils.esperar(1500); 

        // CAMBIO AQUÍ: Selector simplificado
        // Buscamos directamente las imágenes dentro del contenedor padre,
        // saltándonos el div intermedio que cambia de nombre (_figura / _figura_seis).
        const opciones = document.querySelectorAll('.ejercicio__figuras__contenido__figuras img');
        
        let encontrada = false;

        for (let img of opciones) {
            const nombre = this.getNombreArchivo(img.src);
            
            if (!this.figurasVistas.has(nombre)) {
                console.log(`Extensión: 🎯 Respuesta (No vista): ${nombre}`);
                this.simularClick(img); 
                encontrada = true;
                break;
            }
        }

        if (!encontrada) {
            console.warn("Extensión: ⚠️ No encontré la respuesta correcta.");
            this.enFaseRespuesta = false; 
        } else {
            this.limpiar();
        }
        
        window.ProBot.UI.setAccion('idle');
    },

    simularClick: function(elemento) {
        const eventos = ['mousedown', 'mouseup', 'click'];
        eventos.forEach(tipo => {
            const evento = new MouseEvent(tipo, {
                view: window,
                bubbles: true,
                cancelable: true,
                buttons: 1
            });
            elemento.dispatchEvent(evento);
        });
    },

    getNombreArchivo: function(url) {
        try {
            return url.split('/').pop().split('?')[0];
        } catch (e) {
            return "";
        }
    },

    limpiar: function() {
        this.figurasVistas = new Set();
        this.enFaseRespuesta = false;
        document.querySelectorAll('.sombrero').forEach(el => el.removeAttribute('data-procesado'));
    },

    detener: function() {
        if (this.intervaloScanner) clearInterval(this.intervaloScanner);
        this.intervaloScanner = null;
    },

    aprender: function() { }
};