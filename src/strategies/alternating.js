// --- Ejercicio de atencion alternada unidad 7 ---

window.ProBot.Estrategias.ATENCION_ALTERNADA = {
    nombre: "Atención Alternada",
    huella: '.glass', // Buscamos el contenedor padre
    
    intervaloScanner: null,
    ultimaHuellaResolucion: "", // Para no repetir clicks en el mismo "frame" del ejercicio
    procesando: false,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 👀 Monitor de Atención Alternada Activo...");

        // Escáner rápido (50ms) para reacción inmediata
        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 50);
    },

    ciclo: async function() {
        if (this.procesando) return;

        // 1. BUSCAR EL CONTENEDOR ACTIVO
        // El contenedor activo es aquel div[container] que NO tiene un hijo .glass visible
        const contenedores = document.querySelectorAll('div[container]');
        let contenedorActivo = null;

        for (let cont of contenedores) {
            const glass = cont.querySelector('.glass');
            // Si no hay glass, O si hay glass pero está oculto (display: none)
            if (!glass || glass.offsetParent === null) {
                contenedorActivo = cont;
                break;
            }
        }

        if (!contenedorActivo) return; // Ninguno activo (pausa o carga)

        // 2. IDENTIFICAR TIPO DE EJERCICIO
        // Buscamos la instrucción dentro de la caja
        const spanInstruccion = contenedorActivo.querySelector('[texto-instruccion]');
        if (!spanInstruccion) return;

        const textoInstruccion = spanInstruccion.innerText.toLowerCase();

        // 3. ENRUTAR LÓGICA
        if (textoInstruccion.includes("busca") && !textoInstruccion.includes("diferente")) {
            await this.resolverLetras(contenedorActivo);
        } else if (textoInstruccion.includes("diferente")) {
            await this.resolverFiguraDiferente(contenedorActivo);
        }
    },

    // --- LÓGICA A: BUSCAR LETRA ---
    resolverLetras: async function(contenedor) {
        // 1. Obtener datos clave
        const contenedorLetraTarget = contenedor.querySelector('[container-area_letra]');
        const spanTarget = contenedorLetraTarget ? contenedorLetraTarget.querySelector('[letras]') : null;
        if (!spanTarget) return;
        
        const letraObjetivo = spanTarget.innerText.trim();

        // 2. Generar Huella Digital del estado actual
        // (LetraObjetivo + CantidadOpciones)
        const opciones = contenedor.querySelectorAll('[container-area_opciones] [container-letra]');
        const huellaActual = `LETRA_${letraObjetivo}_${opciones.length}`;

        // Si es la misma pantalla que ya resolvimos, no hacemos nada
        if (huellaActual === this.ultimaHuellaResolucion) return;

        this.procesando = true;
        window.ProBot.UI.setAccion('executing');
        
        // Delay humano (muy breve para este ejercicio rápido)
        await window.ProBot.Utils.esperar(Math.random() * 200 + 200);

        let encontrada = false;
        for (let op of opciones) {
            // Ignoramos espacios vacíos
            if (op.classList.contains('enblanco')) continue;

            const spanLetra = op.querySelector('[letras]');
            if (spanLetra && spanLetra.innerText.trim() === letraObjetivo) {
                
                // Click!
                op.click();
                encontrada = true;
                
                console.log(`Extensión: 🔤 Click letra "${letraObjetivo}"`);
                
                // Guardamos la huella para no volver a clickar hasta que cambie la letra
                this.ultimaHuellaResolucion = huellaActual;
                break;
            }
        }

        if (!encontrada) console.warn(`Extensión: ❌ No encontré la letra ${letraObjetivo}`);
        
        window.ProBot.UI.setAccion('idle');
        this.procesando = false;
    },

    // --- LÓGICA B: FIGURA DIFERENTE ---
    resolverFiguraDiferente: async function(contenedor) {
        // 1. Recolectar imágenes
        const figuras = contenedor.querySelectorAll('[contenedor_figuras] img');
        if (figuras.length === 0) return;

        // Generamos una "huella" basada en la primera imagen visible para detectar cambio de ronda
        let primeraSrcVisible = "";
        const elementosRef = []; // { src, dom }
        const conteoSrc = {};

        for (let img of figuras) {
            // Ignorar ocultas
            if (img.style.display === 'none') continue;

            const src = img.src;
            if (!primeraSrcVisible) primeraSrcVisible = src;

            conteoSrc[src] = (conteoSrc[src] || 0) + 1;
            elementosRef.push({ src: src, dom: img });
        }

        // 2. Generar Huella
        const huellaActual = `FIGURA_${primeraSrcVisible}_${elementosRef.length}`;
        if (huellaActual === this.ultimaHuellaResolucion) return;

        this.procesando = true;
        window.ProBot.UI.setAccion('executing');

        await window.ProBot.Utils.esperar(Math.random() * 200 + 200);

        // 3. Encontrar la única
        let srcUnico = null;
        for (const [src, count] of Object.entries(conteoSrc)) {
            if (count === 1) {
                srcUnico = src;
                break;
            }
        }

        if (srcUnico) {
            const objetivo = elementosRef.find(el => el.src === srcUnico);
            if (objetivo) {
                // Click en la imagen
                objetivo.dom.click();
                console.log("Extensión: 📐 Click figura única.");
                this.ultimaHuellaResolucion = huellaActual;
            }
        } else {
            console.warn("Extensión: ❌ No encontré figura única.");
        }

        window.ProBot.UI.setAccion('idle');
        this.procesando = false;
    },

    aprender: function() {
        // Algorítmico
    }
};