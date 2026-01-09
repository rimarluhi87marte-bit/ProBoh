// --- Ejercicio de atencion alternada, unidad 11, timing con peltotas y diferenciar ---

window.ProBot.Estrategias.PELOTAS_ALTERNADA = {
    nombre: "Pelotas Alternada (Diferente/Timing)",
    // Huella Blindada: Elementos únicos de este ejercicio (Bordes de bolas o Fondos SVG)
    huella: 'div[contain-borde], image[id="porteria"], image[id="bateador"]', 
    
    intervaloScanner: null,
    
    // Variables Diferente
    ultimaHuellaDiferente: "",
    procesadoDiferente: false,

    // Variables Timing
    cooldownTiming: false,

    // Variable de Control
    ultimoModoDetectado: "NADA", 

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: ⚾ Monitor Pelotas (Huella Única) Activo...");
        
        this.ultimoModoDetectado = "NADA";
        this.procesadoDiferente = false;
        this.cooldownTiming = false;
        this.ultimaHuellaDiferente = "";

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 30);
    },

    ciclo: async function() {
        // 1. DETECTAR MODO ACTUAL
        // Buscamos si existen los contenedores de las bolas para elegir (Modo Diferente)
        const opciones = document.querySelectorAll('div[contain-borde] img');
        const esModoDiferente = opciones.length > 0;
        
        // Buscamos si existe la caja objetivo del timing (Modo Timing)
        const cajaObjetivo = document.querySelector('image[id="objetivo"][width="100"]');
        const esModoTiming = cajaObjetivo && cajaObjetivo.getBoundingClientRect().height > 0;

        let modoActual = "NADA";
        if (esModoDiferente) modoActual = "DIFERENTE";
        else if (esModoTiming) modoActual = "TIMING";

        // 2. GESTIÓN DE CAMBIO DE MODO (RESET)
        if (modoActual !== "NADA" && modoActual !== this.ultimoModoDetectado) {
            console.log(`Extensión: 🔄 Cambio de dinámica: ${this.ultimoModoDetectado} -> ${modoActual}`);
            
            // Reset total al cambiar de juego
            this.procesadoDiferente = false;
            this.cooldownTiming = false;
            this.ultimaHuellaDiferente = ""; 
            
            window.ProBot.UI.setAccion('idle');
            this.ultimoModoDetectado = modoActual;
        }

        // 3. EJECUCIÓN Y DETECCIÓN DE CAMBIO INTERNO
        if (modoActual === "DIFERENTE") {
            // --- FIX RONDAS CONSECUTIVAS ---
            // Generamos la huella de las imágenes actuales AQUI, en el ciclo principal
            let huellaActual = "";
            opciones.forEach((img, i) => { if(i<3) huellaActual += img.src; });

            // Si las imágenes cambiaron respecto a la última vez, reseteamos AUNQUE sea el mismo modo
            if (huellaActual !== "" && huellaActual !== this.ultimaHuellaDiferente) {
                console.log("Extensión: 🆕 Nuevas pelotas detectadas.");
                this.ultimaHuellaDiferente = huellaActual;
                this.procesadoDiferente = false; // ¡Desbloqueo forzoso!
                window.ProBot.UI.setAccion('idle');
            }

            await this.resolverDiferente(opciones);
        } 
        else if (modoActual === "TIMING") {
            this.resolverTiming();
        }
    },

    // --- MODO A: MARCAR EL DIFERENTE ---
    resolverDiferente: async function(opciones) {
        if (this.procesadoDiferente) return;

        // Bloqueo inmediato
        this.procesadoDiferente = true; 
        window.ProBot.UI.setAccion('executing');

        await window.ProBot.Utils.esperar(Math.random() * 400 + 400);

        // Lógica de Frecuencia
        const conteoSrc = {};
        const mapaElementos = [];

        opciones.forEach(img => {
            const src = img.src;
            conteoSrc[src] = (conteoSrc[src] || 0) + 1;
            mapaElementos.push({ src: src, dom: img });
        });

        let srcUnico = null;
        for (const [src, count] of Object.entries(conteoSrc)) {
            if (count === 1) {
                srcUnico = src;
                break;
            }
        }

        if (srcUnico) {
            const objetivo = mapaElementos.find(item => item.src === srcUnico);
            if (objetivo) {
                const clickTarget = objetivo.dom.closest('[contain-borde]') || objetivo.dom;
                clickTarget.click();
                console.log("Extensión: 🎯 Click en pelota diferente.");
            }
        } else {
            // Si no encontramos único, soltamos para reintentar (quizás cargaban las imágenes)
            this.procesadoDiferente = false; 
        }
        
        window.ProBot.UI.setAccion('idle');
    },

    // --- MODO B: TIMING (BOLA EN CAJA) ---
    resolverTiming: function() {
        const cajaObjetivo = document.querySelector('image[id="objetivo"][width="100"]');
        const bola = document.querySelector('image[id="objetivo"][width="60"]');
        const boton = document.querySelector('img[alt="Botonaccion"]');

        if (!cajaObjetivo || !bola || !boton) return;
        if (this.cooldownTiming) return;

        const rectCaja = cajaObjetivo.getBoundingClientRect();
        const rectBola = bola.getBoundingClientRect();

        const centroBolaX = rectBola.left + (rectBola.width / 2);
        
        // MARGEN DE SEGURIDAD 25 (Tu configuración)
        const margenSeguridad = 25;

        const dentroHorizontalmente = (centroBolaX > (rectCaja.left + margenSeguridad)) && 
                                      (centroBolaX < (rectCaja.right - margenSeguridad));

        const solapamientoVertical = (rectBola.bottom > rectCaja.top) && (rectBola.top < rectCaja.bottom);

        if (dentroHorizontalmente && solapamientoVertical) {
            console.log("Extensión: ⚡ ¡GOL! Bola en objetivo.");
            
            boton.click();
            
            this.cooldownTiming = true;
            window.ProBot.UI.setAccion('executing');

            setTimeout(() => {
                this.cooldownTiming = false;
                window.ProBot.UI.setAccion('idle');
            }, 800);
        }
    },

    aprender: function() { },

    detener: function() {
        if (this.intervaloScanner) clearInterval(this.intervaloScanner);
        this.intervaloScanner = null;
    }
};