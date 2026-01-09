// --- Atencion sotenida, unidad 11,Parar las chispa en el momento indicado ---

window.ProBot.Estrategias.ATRAPAR_CHISPA = {
    nombre: "Capturar Chispa (Coordenadas)",
    huella: '#corto', 
    
    intervaloJuego: null,
    cooldown: false, 

    // Coordenadas exactas proporcionadas
    objetivos: [
        { x: 310, y: 290 }, // Abajo
        { x: 82,  y: 195 }, // Izquierda (Corregido)
        { x: 545, y: 195 }, // Derecha (Corregido)
        { x: 310, y: 80  }  // Arriba
    ],

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloJuego) return;

        console.log("Extensión: ⚡ Monitor de Chispa (Exacto) Activo...");
        this.cooldown = false;

        this.intervaloJuego = setInterval(() => {
            this.ciclo();
        }, 15);
    },

    ciclo: function() {
        const chispa = document.getElementById('corto');
        // Buscamos el botón (puede ser .animarpress o estar en container-boton)
        const boton = document.querySelector('[container-boton] img') || document.querySelector('.animarpress');

        if (!chispa || !boton) return;

        const xRaw = chispa.getAttribute('x');
        const yRaw = chispa.getAttribute('y');
        
        if (!xRaw || !yRaw) return;

        const currentX = parseFloat(xRaw);
        const currentY = parseFloat(yRaw);

        // MARGEN DE ERROR:
        // Aunque sean coordenadas exactas, la animación web se mueve en decimales (ej: 82.45).
        // Usamos un margen pequeño (10px) para asegurar que el click entre justo cuando pasa por ahí.
        const margen = 10; 

        let enPosicion = false;

        for (let target of this.objetivos) {
            // Verificamos si X e Y están "casi" en el punto objetivo al mismo tiempo
            const coincideX = Math.abs(currentX - target.x) < margen;
            const coincideY = Math.abs(currentY - target.y) < margen;

            if (coincideX && coincideY) {
                enPosicion = true;
                break;
            }
        }

        if (enPosicion) {
            if (!this.cooldown) {
                console.log(`Extensión: 💥 DISPARO en (${currentX.toFixed(0)}, ${currentY.toFixed(0)})`);
                
                boton.click();
                
                this.cooldown = true;
                window.ProBot.UI.setAccion('executing');

                // Cooldown para no dar doble click en el mismo paso
                setTimeout(() => {
                    this.cooldown = false;
                    window.ProBot.UI.setAccion('idle');
                }, 500);
            }
        }
    },

    aprender: function() { },

    detener: function() {
        if (this.intervaloJuego) clearInterval(this.intervaloJuego);
        this.intervaloJuego = null;
    }
};