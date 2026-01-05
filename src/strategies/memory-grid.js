// --- Recordar posiciones de los numeros ---

window.ProBot.Estrategias.MEMORIA_TABLA = {
    nombre: "Memoria en Tabla",
    huella: '.contenedor-grid', // El contenedor de los cuadros
    
    indicesMemorizados: [], // Guardaremos los índices: [0, 6, 7, 8...]
    intervaloEscaner: null,
    ejecutando: false,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloEscaner) return;

        console.log("Extensión: 🧩 Monitor de Memoria Tabla Activo...");
        this.indicesMemorizados = [];
        this.ejecutando = false;

        // Escáner cada 100ms
        this.intervaloEscaner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    ciclo: function() {
        if (this.ejecutando) return;

        const cuadros = document.querySelectorAll('.contenedor-grid .cuadro');
        if (cuadros.length === 0) return;

        // Verificar si estamos en FASE DE MEMORIZACIÓN (hay números visibles)
        // Según tu HTML, los visibles tienen la clase "mostrar"
        const hayNumerosVisibles = Array.from(cuadros).some(c => c.classList.contains('mostrar'));

        if (hayNumerosVisibles) {
            // --- FASE 1: MEMORIZAR ---
            const nuevosIndices = [];
            
            cuadros.forEach((cuadro, index) => {
                // Guardamos si tiene la clase 'mostrar' (o si tiene texto por seguridad)
                if (cuadro.classList.contains('mostrar') || cuadro.innerText.trim().length > 0) {
                    nuevosIndices.push(index);
                }
            });

            // Actualizamos memoria si cambió
            if (JSON.stringify(nuevosIndices) !== JSON.stringify(this.indicesMemorizados)) {
                this.indicesMemorizados = nuevosIndices;
                console.log(`Extensión: 🧠 Memorizadas ${this.indicesMemorizados.length} posiciones.`);
                window.ProBot.UI.setAccion('learning');
            }
        } 
        else {
            // --- FASE 2: EJECUTAR ---
            // Si NO hay números visibles, pero TENEMOS memoria, es hora de actuar
            if (this.indicesMemorizados.length > 0) {
                console.log("Extensión: ⚡ Los números desaparecieron. Ejecutando...");
                this.resolver(cuadros);
            }
        }
    },

    resolver: async function(cuadros) {
        this.ejecutando = true;
        window.ProBot.UI.setAccion('executing');

        // Pequeño delay de seguridad para que la UI termine de ocultar los números
        await window.ProBot.Utils.esperar(600);

        // Volvemos a obtener los cuadros por si el DOM se refrescó (Vue/React)
        const cuadrosActuales = document.querySelectorAll('.contenedor-grid .cuadro');

        for (let index of this.indicesMemorizados) {
            if (cuadrosActuales[index]) {
                cuadrosActuales[index].click();
                // Click rápido pero no instantáneo
                await window.ProBot.Utils.esperar(300); 
            }
        }

        console.log("Extensión: ✅ Secuencia terminada.");
        
        // Limpiamos memoria y desbloqueamos para la siguiente ronda
        this.indicesMemorizados = [];
        this.ejecutando = false;
        window.ProBot.UI.setAccion('idle');
    },

    aprender: function() {
        // No requiere BD
    }
};