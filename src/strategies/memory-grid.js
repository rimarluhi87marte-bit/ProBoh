// --- Recordar posiciones de los numeros ---

window.ProBot.Estrategias.MEMORIA_TABLA = {
    nombre: "Memoria en Tabla (Ascendente)",
    huella: '.contenedor-grid', 
    
    // Ahora guardamos objetos: { index: 0, valor: 5 }
    memoriaDatos: [], 
    intervaloEscaner: null,
    ejecutando: false,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloEscaner) return;

        console.log("Extensión: 🧩 Monitor de Memoria Tabla (Numérico) Activo...");
        this.memoriaDatos = [];
        this.ejecutando = false;

        this.intervaloEscaner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    ciclo: function() {
        if (this.ejecutando) return;

        const cuadros = document.querySelectorAll('.contenedor-grid .cuadro');
        if (cuadros.length === 0) return;

        // FASE DE MEMORIZACIÓN (Números visibles)
        const hayNumerosVisibles = Array.from(cuadros).some(c => c.classList.contains('mostrar'));

        if (hayNumerosVisibles) {
            const nuevosDatos = [];
            
            cuadros.forEach((cuadro, index) => {
                // Si la celda muestra algo, lo leemos
                if (cuadro.classList.contains('mostrar')) {
                    const texto = cuadro.innerText.trim();
                    const valor = parseInt(texto);

                    // Guardamos índice Y valor si es un número válido
                    if (!isNaN(valor)) {
                        nuevosDatos.push({ index: index, valor: valor });
                    }
                }
            });

            // Actualizamos memoria si hay cambios (usamos JSON para comparar arrays de objetos)
            if (JSON.stringify(nuevosDatos) !== JSON.stringify(this.memoriaDatos)) {
                this.memoriaDatos = nuevosDatos;
                
                // Ordenamos visualmente solo para el log (la ordenación real se hace al ejecutar)
                const listaNumeros = this.memoriaDatos.map(d => d.valor).sort((a,b) => a-b);
                console.log(`Extensión: 🧠 Memorizados: [${listaNumeros.join(', ')}]`);
                
                window.ProBot.UI.setAccion('learning');
            }
        } 
        else {
            // FASE DE EJECUCIÓN (Números ocultos)
            if (this.memoriaDatos.length > 0) {
                console.log("Extensión: ⚡ Ejecutando secuencia ascendente...");
                this.resolver(cuadros);
            }
        }
    },

    resolver: async function(cuadros) {
        this.ejecutando = true;
        window.ProBot.UI.setAccion('executing');

        // 1. ORDENAR ASCENDENTE
        // Esto es lo vital: ordenamos el array de memoria según el valor del número
        this.memoriaDatos.sort((a, b) => a.valor - b.valor);

        await window.ProBot.Utils.esperar(600);

        const cuadrosActuales = document.querySelectorAll('.contenedor-grid .cuadro');

        // 2. CLICAR EN ORDEN
        for (let item of this.memoriaDatos) {
            // item.index es la posición original en la tabla
            if (cuadrosActuales[item.index]) {
                console.log(`Extensión: 👉 Click en posición ${item.index} (Valor ${item.valor})`);
                cuadrosActuales[item.index].click();
                await window.ProBot.Utils.esperar(300); 
            }
        }

        console.log("Extensión: ✅ Secuencia terminada.");
        
        this.memoriaDatos = [];
        this.ejecutando = false;
        window.ProBot.UI.setAccion('idle');
    },

    aprender: function() { }
};