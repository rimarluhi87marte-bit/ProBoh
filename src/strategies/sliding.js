// --- Ejercicio de decir la figura que no aparecio ---

window.ProBot.Estrategias.DESLIZAMIENTO_VISUAL = {
    nombre: "Deslizamiento Visual",
    huella: '#contenedorIconosMostrar', 
    
    iconosVistos: new Set(), 
    intervaloScanner: null,
    enFaseRespuesta: false,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 👀 Monitor de Deslizamiento Visual Activo...");
        this.iconosVistos = new Set();
        this.enFaseRespuesta = false;

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 50);
    },

    ciclo: function() {
        // --- 1. CHEQUEO DE CAMBIO DE FASE ---
        const pantallaPausa = document.getElementById('pantallaPausa');
        
        // CORRECCIÓN: Solo pasamos a resolver si la pantalla es visible 
        // Y ADEMÁS existen las opciones cargadas dentro.
        if (pantallaPausa && pantallaPausa.style.display !== 'none') {
            const opciones = pantallaPausa.querySelectorAll('input[type="radio"]');
            
            if (opciones.length > 0) {
                // Solo si hay opciones reales detenemos el aprendizaje
                if (!this.enFaseRespuesta) {
                    this.resolver(pantallaPausa);
                }
                return; // Cortamos aquí para no seguir aprendiendo
            }
        }

        // --- 2. FASE DE OBSERVACIÓN (Aprendizaje) ---
        // Si no estamos respondiendo, seguimos aprendiendo
        const contenedor = document.getElementById('contenedorIconosMostrar');
        if (contenedor) {
            const iconos = contenedor.querySelectorAll('.icon');
            
            iconos.forEach(icon => {
                // Filtramos iconos ocultos o vacíos
                if (icon.style.display === 'none' || icon.style.visibility === 'hidden') return;

                const huella = this.generarHuella(icon);
                
                if (huella && !this.iconosVistos.has(huella)) {
                    this.iconosVistos.add(huella);
                    // console.log(`Extensión: 👁️ Visto nuevo: ${huella}`); // Log opcional para no saturar
                    window.ProBot.UI.setAccion('learning');
                }
            });
        }
    },

    resolver: async function(pantallaPausa) {
        this.enFaseRespuesta = true; // Bloqueo para ejecutar una sola vez
        window.ProBot.UI.setAccion('executing');

        console.log("Extensión: 🛑 Tiempo agotado. Resolviendo...");
        // console.log(`Extensión: 🧠 Memoria final (${this.iconosVistos.size} elementos).`);

        await window.ProBot.Utils.esperar(1000); 

        // 1. Identificar pregunta
        const preguntaEl = document.getElementById('dnn_ctr2613_ConsolaEjerciciosv3_ctl02_lblResponderPregunta');
        const textoPregunta = preguntaEl ? preguntaEl.innerText.toLowerCase() : "";
        const buscarFaltante = textoPregunta.includes("no apareció");

        // 2. Analizar opciones
        const opciones = pantallaPausa.querySelectorAll('#contenedorOpciones li');
        let encontrado = false;

        for (let li of opciones) {
            const iconOption = li.querySelector('.icon');
            const radio = li.querySelector('input[type="radio"]');
            
            if (iconOption && radio) {
                const huellaOpcion = this.generarHuella(iconOption);
                
                // Verificamos en nuestra memoria
                const fueVisto = this.iconosVistos.has(huellaOpcion);

                if (buscarFaltante) {
                    // Queremos el que NO está en el Set
                    if (!fueVisto) {
                        console.log(`Extensión: 🎯 Encontrado (No estaba en memoria): ${huellaOpcion}`);
                        radio.click();
                        encontrado = true;
                        break;
                    }
                } else {
                    // Queremos el que SÍ está
                    if (fueVisto) {
                        console.log(`Extensión: 🎯 Encontrado (Estaba en memoria): ${huellaOpcion}`);
                        radio.click();
                        encontrado = true;
                        break;
                    }
                }
            }
        }

        if (encontrado) {
            await window.ProBot.Utils.esperar(500);
            const btnResponder = document.getElementById('btnResponder');
            if (btnResponder) btnResponder.click();
            
            // Éxito: Limpiamos y salimos
            this.limpiar(); 
        } else {
            console.warn("Extensión: ⚠️ No coincidencia. Reintentando en breve...");
            // IMPORTANTE: Si fallamos (quizás las opciones no cargaron bien), 
            // NO limpiamos la memoria. Soltamos el bloqueo para reintentar en el siguiente ciclo.
            this.enFaseRespuesta = false; 
            window.ProBot.UI.setAccion('idle');
        }
    },

    generarHuella: function(elemento) {
        // 1. Obtener la clase del icono limpia (sin tamaños ni extras)
        // Lista negra de clases que NO definen la forma
        const ignorar = ['icon', 'fa', 'fa-fw', 'fa-4x', 'fa-3x', 'fa-2x', 'fa-stack-1x', 'fa-stack-2x'];
        
        let claseForma = "";
        const clases = elemento.classList; // Usamos classList que es más limpio
        
        for (let c of clases) {
            if (c.startsWith('fa-') && !ignorar.includes(c)) {
                claseForma = c;
                break;
            }
        }

        // 2. Obtener color
        let color = elemento.style.color; 
        if (color) color = color.replace(/\s+/g, '').toLowerCase();

        if (!claseForma || !color) return null;

        return `${claseForma}|${color}`;
    },

    limpiar: function() {
        if (this.intervaloScanner) {
            clearInterval(this.intervaloScanner);
            this.intervaloScanner = null;
        }
        this.iconosVistos = new Set();
        this.enFaseRespuesta = false;
        window.ProBot.UI.setAccion('idle');
    },

    aprender: function() {}
};