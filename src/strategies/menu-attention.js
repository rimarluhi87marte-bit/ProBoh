// --- NO ES UN EJERCICIO, es para que el menu de ejercicio de atencion sea automatizado ---

window.ProBot.Estrategias.MENU_ATENCION = {
    nombre: "Menú Selección Atención",
    huella: '.selector-layout', 
    
    intervaloScanner: null,
    procesando: false,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 📋 Monitor de Menú de Atención Activo...");
        this.procesando = false;

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 1000);
    },

    ciclo: async function() {
        if (this.procesando) return;

        // 1. OBTENER TODOS LOS ÍTEMS DEL MENÚ
        const items = document.querySelectorAll('.selector-layout .selector-item');
        
        let botonCandidato = null;

        for (let item of items) {
            // --- FILTROS DE EXCLUSIÓN ---
            
            // A. Si el ítem tiene la clase "realizado", lo saltamos
            if (item.classList.contains('realizado')) continue;

            // B. Si el input interno está disabled, lo saltamos
            const input = item.querySelector('input');
            if (input && (input.disabled || input.hasAttribute('disabled'))) continue;

            // --- SELECCIÓN ---
            
            // Si pasamos los filtros, buscamos el botón rojo dentro de este ítem
            const btn = item.querySelector('label.btn-rojo');
            
            if (btn && btn.innerText.toLowerCase().includes('iniciar')) {
                botonCandidato = btn;
                break; // ¡Encontramos el primero disponible! Salimos del bucle.
            }
        }

        if (botonCandidato) {
            this.procesando = true;
            window.ProBot.UI.setAccion('executing');

            console.log("Extensión: 🚀 Iniciando siguiente ejercicio disponible...");
            
            await window.ProBot.Utils.esperar(1000);
            
            botonCandidato.click();
            
            setTimeout(() => {
                this.procesando = false;
                window.ProBot.UI.setAccion('idle');
            }, 3000);
        }
    },

    aprender: function() { },
    
    detener: function() {
        if (this.intervaloScanner) clearInterval(this.intervaloScanner);
        this.intervaloScanner = null;
    }
};