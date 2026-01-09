// --- Decir cual figura es diferente ---

window.ProBot.Estrategias.BUSCA_DIFERENTE = {
    nombre: "Busca la Figura Diferente",
    huella: '.ejercicio__figuras__titulo strong', 
    
    intervaloScanner: null,
    ultimaHuellaRonda: "", 
    procesado: false,

    // --- NUEVO: FUNCIÓN DE VALIDACIÓN PARA EL ROUTER ---
    validar: function(elementoHuella) {
        // elementoHuella es el <strong> encontrado por el router
        const texto = elementoHuella.innerText.toLowerCase();
        // Solo aceptamos si dice "diferente". Si dice "cambió", rechazamos.
        return texto.includes('diferente');
    },
    // ---------------------------------------------------

    iniciar: function() {
        // Ya no necesitamos el filtro aquí dentro porque el Router ya filtró
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 👀 Buscador de Diferencias (Validado) Activo...");

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    ciclo: async function() {
        const imagenes = document.querySelectorAll('.ejercicio__figuras__figura__imagen img');
        if (imagenes.length === 0) return;

        let huellaActual = "";
        imagenes.forEach((img, i) => {
            if (i < 3) huellaActual += img.src;
        });

        if (huellaActual !== this.ultimaHuellaRonda) {
            this.ultimaHuellaRonda = huellaActual;
            this.procesado = false;
        }

        if (!this.procesado) {
            await this.resolver(imagenes);
        }
    },

    resolver: async function(listaImagenes) {
        this.procesado = true;
        window.ProBot.UI.setAccion('executing');

        await window.ProBot.Utils.esperar(Math.random() * 400 + 400);

        const conteoSrc = {};
        const mapaElementos = []; 

        listaImagenes.forEach(img => {
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
                objetivo.dom.click();
                console.log("Extensión: 🎯 Click en la figura diferente.");
            }
        } else {
            console.warn("Extensión: ⚠️ No encontré una figura única.");
            this.procesado = false; 
        }

        window.ProBot.UI.setAccion('idle');
    },

    aprender: function() { },
    
    detener: function() {
        if (this.intervaloScanner) clearInterval(this.intervaloScanner);
        this.intervaloScanner = null;
    }
};