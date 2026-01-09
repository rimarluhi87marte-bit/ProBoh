// ---  Hacer click en el icono duplicado ---

window.ProBot.Estrategias.MEMORIA_DUPLICADO = {
    nombre: "Memoria Duplicado (Cheat Simple)",
    huella: '#contenedorIcono', 
    
    huellaGanadora: "", 
    intervaloScanner: null,
    enFaseRespuesta: false,
    avisoMostrado: false, // Para no spamear la notificación si se reinicia

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 👯 Monitor de Duplicados Activo...");
        
        // --- NOTIFICACIÓN AL USUARIO ---
        if (!this.avisoMostrado) {
            window.ProBot.UI.showNotification(
                "⚠️ Nota del Bot:\nAquí solo puedo conseguir un 90%.\nNo responderé la 1ra ronda, inténtalo tú para el 100%.",
                8000 // Se queda 8 segundos para que dé tiempo a leer
            );
            this.avisoMostrado = true;
        }
        // -------------------------------

        this.resetEstado();

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 50);
    },

    resetEstado: function() {
        this.huellaGanadora = "";
        this.enFaseRespuesta = false;
    },

    ciclo: function() {
        const pantallaRespuesta = document.getElementById('pantalla3');
        if (pantallaRespuesta && pantallaRespuesta.style.display !== 'none') {
            if (!this.enFaseRespuesta && this.huellaGanadora) {
                this.resolver(pantallaRespuesta);
            }
            return;
        }

        if (this.enFaseRespuesta) return;

        const candidatos = document.querySelectorAll('#contenedorIcono span[duplicar="1"]');
        
        for (let cand of candidatos) {
            if (cand.offsetParent === null) continue;

            const huella = this.generarHuella(cand);
            
            if (huella && huella !== this.huellaGanadora) {
                this.huellaGanadora = huella;
                console.log(`Extensión: 🕵️ Cheat detectado: ${huella}`);
                window.ProBot.UI.setAccion('learning');
            }
        }
    },

    resolver: async function(pantalla) {
        this.enFaseRespuesta = true;
        window.ProBot.UI.setAccion('executing');

        console.log(`Extensión: 🛑 Fase de Respuesta.`);
        await window.ProBot.Utils.esperar(1000); 

        const opciones = pantalla.querySelectorAll('.iconRespuesta');
        let encontrada = false;

        for (let op of opciones) {
            const huellaOp = this.generarHuella(op);
            
            if (huellaOp === this.huellaGanadora) {
                console.log(`Extensión: 🎯 Clic en el duplicado.`);
                op.click();
                encontrada = true;
                break;
            }
        }

        if (!encontrada) {
            console.warn("Extensión: ⚠️ No encontré la imagen.");
            this.enFaseRespuesta = false; 
        } else {
            setTimeout(() => this.resetEstado(), 2000);
        }
        
        window.ProBot.UI.setAccion('idle');
    },

    generarHuella: function(elemento) {
        let claseIcono = "";
        const clases = elemento.classList;
        
        const ignorar = ['iconItemOriginal', 'iconItem', 'iconRespuesta', 'fa', 'fa-4x', 'fa-fw', 'fa-stack-1x'];
        
        for (let c of clases) {
            if (c.startsWith('fa-') && !ignorar.includes(c)) {
                claseIcono = c;
                break;
            }
        }

        let color = elemento.style.color; 
        if (color) color = color.replace(/\s+/g, '').toLowerCase();

        if (!claseIcono) return null;

        return `${claseIcono}|${color}`; 
    },

    detener: function() {
        if (this.intervaloScanner) clearInterval(this.intervaloScanner);
        this.intervaloScanner = null;
    },

    aprender: function() { }
};