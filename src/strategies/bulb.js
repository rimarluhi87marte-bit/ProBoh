// --- Ejercicio de atencion sostenida, timing con la luz ---

window.ProBot.Estrategias.ENCENDER_BOMBILLA = {
    nombre: "Encender Bombilla (Timing)",
    huella: '[container-bombilla-bolita] ellipse', // El contenedor de la bolita
    
    intervaloJuego: null,
    cooldown: false, // Para no spamear clicks en el mismo pase

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloJuego) return;

        console.log("Extensión: 💡 Francotirador de Bombilla Activo...");
        this.cooldown = false;

        // Usamos un intervalo ultra-rápido (15ms ~ 60fps) para no perder el frame exacto
        this.intervaloJuego = setInterval(() => {
            this.ciclo();
        }, 15);
    },

    ciclo: function() {
        const ellipse = document.querySelector('[container-bombilla-bolita] ellipse');
        const boton = document.querySelector('[container-boton] img');

        if (!ellipse || !boton) return;

        // Leemos la posición actual
        const cxRaw = ellipse.getAttribute('cx');
        if (!cxRaw) return;
        
        const cx = parseFloat(cxRaw);

        // LÓGICA DE DISPARO
        // Objetivo: 340.
        // Rango de tolerancia: +/- 15 píxeles (325 a 355) para asegurar el tiro.
        // Verificamos el cooldown para no dar 50 clicks mientras pasa por el centro.
        
        if (cx >= 325 && cx <= 355) {
            if (!this.cooldown) {
                console.log(`Extensión: ⚡ ¡DISPARO! (Posición: ${cx.toFixed(2)})`);
                
                boton.click();
                
                this.cooldown = true;
                window.ProBot.UI.setAccion('executing');

                // Esperamos un poco para desbloquear el siguiente tiro
                // (Asumiendo que la bola tarda un poco en volver)
                setTimeout(() => {
                    this.cooldown = false;
                    window.ProBot.UI.setAccion('idle');
                }, 800);
            }
        }
    },

    aprender: function() {
        // No requiere
    },

    detener: function() {
        if (this.intervaloJuego) clearInterval(this.intervaloJuego);
        this.intervaloJuego = null;
    }
};