// --- Ejercicio de deletreo ---

window.ProBot.Estrategias.DELETREO_PALABRA = {
    nombre: "Deletreo de Palabra",
    // Huella: El contenedor de la palabra objetivo
    huella: '.game__word-label', 
    
    palabraObjetivo: [], // Array de letras ["M", "I", "N"...]
    indiceActual: 0,     // Qué letra toca pulsar
    ultimaPalabraStr: "", // Para detectar cambio de nivel
    procesando: false,
    intervaloScanner: null,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 🔡 Monitor de Deletreo Activo...");
        
        this.resetEstado();

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    resetEstado: function() {
        this.palabraObjetivo = [];
        this.indiceActual = 0;
        this.ultimaPalabraStr = "";
        this.procesando = false;
        // Limpiamos marcas de botones usados
        document.querySelectorAll('.game-board__letter').forEach(b => delete b.dataset.botUsed);
    },

    ciclo: async function() {
        if (this.procesando) return;

        // 1. LEER PALABRA OBJETIVO
        const itemsPalabra = document.querySelectorAll('.game__word-label .game__word-item');
        if (itemsPalabra.length === 0) return;

        const textoPalabra = Array.from(itemsPalabra).map(el => el.innerText.trim()).join('');

        // 2. DETECTAR NUEVA RONDA
        if (textoPalabra !== this.ultimaPalabraStr) {
            console.log(`Extensión: 🆕 Nueva palabra: "${textoPalabra}"`);
            this.ultimaPalabraStr = textoPalabra;
            this.palabraObjetivo = Array.from(itemsPalabra).map(el => el.innerText.trim());
            this.indiceActual = 0;
            
            // Limpiamos marcas de la ronda anterior
            document.querySelectorAll('.game-board__letter').forEach(b => delete b.dataset.botUsed);
            
            window.ProBot.UI.setAccion('idle');
        }

        // 3. EJECUTAR DELETREO
        if (this.indiceActual < this.palabraObjetivo.length) {
            await this.pulsarSiguienteLetra();
        } else {
            // Palabra terminada
            window.ProBot.UI.setAccion('idle');
        }
    },

    pulsarSiguienteLetra: async function() {
        this.procesando = true;
        window.ProBot.UI.setAccion('executing');

        const letraBuscada = this.palabraObjetivo[this.indiceActual];
        
        // Buscamos botones disponibles en el tablero
        const botones = document.querySelectorAll('.game-board__letter');
        let botonEncontrado = null;

        for (let btn of botones) {
            // Verificar si ya lo usamos nosotros en esta secuencia
            if (btn.dataset.botUsed === "true") continue;

            const spanValor = btn.querySelector('.game-board__letter-value');
            if (spanValor && spanValor.innerText.trim() === letraBuscada) {
                botonEncontrado = btn;
                break;
            }
        }

        if (botonEncontrado) {
            // Delay de "tecleo" humano (rápido pero perceptible)
            await window.ProBot.Utils.esperar(250); 
            
            botonEncontrado.click();
            botonEncontrado.dataset.botUsed = "true"; // Marcar como usado
            
            // Avanzamos índice
            this.indiceActual++;
        } else {
            console.warn(`Extensión: ⚠️ No encontré la letra "${letraBuscada}" en el tablero.`);
            // Si fallamos, quizás es porque la ronda cambió muy rápido, soltamos el bloqueo
        }

        this.procesando = false;
    },

    aprender: function() { }
};