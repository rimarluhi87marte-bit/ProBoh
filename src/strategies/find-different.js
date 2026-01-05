// --- Decir cual figura es diferente ---

window.ProBot.Estrategias.BUSCA_DIFERENTE = {
    nombre: "Busca la Figura Diferente",
    // Huella única: Buscamos imágenes reales dentro de las figuras (el de colores no tiene)
    huella: '.ejercicio__figuras__figura__imagen img', 
    
    intervaloScanner: null,
    ultimaHuellaRonda: "", // Para detectar cambio de nivel
    procesado: false,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 👀 Buscador de Diferencias Activo...");

        // Escáner cada 100ms
        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 800);
    },

    ciclo: async function() {
        // 1. OBTENER IMÁGENES
        const imagenes = document.querySelectorAll('.ejercicio__figuras__figura__imagen img');
        if (imagenes.length === 0) return;

        // 2. GENERAR HUELLA DE LA RONDA
        // Concatenamos las primeras 3 fuentes para saber si cambiaron las imágenes
        // (Suficiente para saber si es un nuevo set)
        let huellaActual = "";
        imagenes.forEach((img, i) => {
            if (i < 3) huellaActual += img.src;
        });

        // Si es la misma ronda que ya resolvimos, no hacemos nada
        if (huellaActual === this.ultimaHuellaRonda && this.procesado) return;

        // --- NUEVA RONDA DETECTADA ---
        this.ultimaHuellaRonda = huellaActual;
        this.procesado = false;
        
        console.log("Extensión: 🆕 Nueva ronda de figuras detectada.");
        await this.resolver(imagenes);
    },

    resolver: async function(listaImagenes) {
        this.procesado = true; // Bloqueamos
        window.ProBot.UI.setAccion('executing');

        // Espera humana
        await window.ProBot.Utils.esperar(100);

        // 1. CONTAR APARICIONES
        const conteoSrc = {};
        const mapaElementos = []; // Guardamos { src, elemento }

        listaImagenes.forEach(img => {
            const src = img.src;
            conteoSrc[src] = (conteoSrc[src] || 0) + 1;
            mapaElementos.push({ src: src, dom: img });
        });

        // 2. BUSCAR EL ÚNICO (Count == 1)
        let srcUnico = null;
        for (const [src, count] of Object.entries(conteoSrc)) {
            if (count === 1) {
                srcUnico = src;
                break;
            }
        }

        // 3. CLICKEAR
        if (srcUnico) {
            const objetivo = mapaElementos.find(item => item.src === srcUnico);
            if (objetivo) {
                // Click en la imagen
                objetivo.dom.click();
                console.log("Extensión: 🎯 Click en la figura diferente.");
            }
        } else {
            console.warn("Extensión: ⚠️ No encontré una figura única. ¿Son todas iguales?");
            this.procesado = false; // Permitir reintento si falló el análisis
        }

        window.ProBot.UI.setAccion('idle');
    },

    aprender: function() {
        // Algorítmico
    }
};