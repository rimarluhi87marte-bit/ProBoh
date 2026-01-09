// -Ejercicio de atencion sostenida unidad 7 ---

window.ProBot.Estrategias.ATENCION_TRIANGULO = {
    nombre: "Atención Triángulo",
    huella: '[elementocambiante]', 
    
    // Variables de Estado
    conteoCambios: 0,
    ultimoColorSrc: "", // Guardaremos la URL entera aquí
    ultimaSrcVista: "", 
    intervaloEscaner: null,
    esperandoPregunta: true,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloEscaner) return;

        const contenedor = document.querySelector('[elementocambiante]');
        if (!contenedor) return;

        console.log("Extensión: 👀 Escáner de SRC activo...");
        this.esperandoPregunta = true;

        // Escáner cada 50ms
        this.intervaloEscaner = setInterval(() => {
            this.cicloDeEscaneo(contenedor);
        }, 50);
    },

    cicloDeEscaneo: function(contenedor) {
        // 1. ¿Salió la pregunta? (Prioridad Máxima)
        const preguntaDiv = document.querySelector('[preguntacontain]');
        if (preguntaDiv && preguntaDiv.offsetParent !== null) {
            this.detectarYResponder(preguntaDiv);
            return;
        }

        // 2. Analizar Imagen
        const img = contenedor.querySelector('img');
        if (!img) return;

        const srcActual = img.src;

        // Si es la misma imagen que acabamos de procesar, la ignoramos
        if (srcActual === this.ultimaSrcVista) return;

        // --- CAMBIO DETECTADO ---
        this.ultimaSrcVista = srcActual;

        // 3. Lógica de Colores vs Blanco
        // Verificamos si la URL contiene "Blanco" (según tu HTML anterior: Blanco.xxxx.svg)
        // O si es la primera imagen y asumimos que empieza en blanco/neutro.
        
        if (srcActual.includes("Blanco")) {
            // ES BLANCO -> REINICIO
            // No sumamos al contador. Ponemos todo a cero.
            this.conteoCambios = 0;
            this.ultimoColorSrc = ""; // Limpiamos memoria
            console.log("Extensión: ⚪ Triángulo Blanco (Neutro) - Contador a 0");
        } else {
            // ES UN COLOR -> SUMAMOS
            this.conteoCambios++;
            this.ultimoColorSrc = srcActual; // Guardamos la URL para compararla luego
            
            console.log(`Extensión: 📊 Cambio detectado #${this.conteoCambios} (Color guardado en memoria)`);
            window.ProBot.UI.setAccion('learning');
        }
    },

    detectarYResponder: function(preguntaDiv) {
        if (this.intervaloEscaner) {
            clearInterval(this.intervaloEscaner);
            this.intervaloEscaner = null;
        }

        if (!this.esperandoPregunta) return; 
        this.esperandoPregunta = false; 
        
        window.ProBot.UI.setAccion('executing');

        const textoPregunta = preguntaDiv.innerText.toLowerCase();
        console.log(`Extensión: 🛑 PREGUNTA: "${preguntaDiv.innerText}"`);
        console.log(`Extensión: 🧠 MEMORIA -> Conteo: ${this.conteoCambios}`);

        if (textoPregunta.includes("último")) {
            this.resolverUltimoColor();
        } else if (textoPregunta.includes("cuántas")) {
            this.resolverConteo();
        } else {
            console.warn("Extensión: Pregunta desconocida.");
            window.ProBot.UI.setConocimiento('unknown');
        }
    },

    resolverUltimoColor: async function() {
        // Espera de seguridad
        await window.ProBot.Utils.esperar(800); 

        const opciones = document.querySelectorAll('[opcion] img');
        let encontrado = false;

        // Recorremos las opciones y comparamos el SRC exacto
        for (let img of opciones) {
            if (img.src === this.ultimoColorSrc) {
                const clickTarget = img.closest('[id]'); 
                if (clickTarget) {
                    clickTarget.click();
                    encontrado = true;
                }
                break;
            }
        }

        if (encontrado) console.log("Extensión: ✅ Click en imagen coincidente.");
        else console.warn("Extensión: ❌ No encontré ninguna imagen con el mismo SRC.");
        
        this.limpiezaFinal();
    },

    resolverConteo: async function() {
        await window.ProBot.Utils.esperar(800);

        const labels = document.querySelectorAll('[opcion] label');
        let encontrado = false;

        for (let label of labels) {
            const numeroOpcion = parseInt(label.innerText.trim());
            
            if (numeroOpcion === this.conteoCambios) {
                const clickTarget = label.closest('[id]'); 
                if (clickTarget) {
                    clickTarget.click();
                    encontrado = true;
                }
                break;
            }
        }

        if (encontrado) console.log("Extensión: ✅ Click en número correcto.");
        else console.warn(`Extensión: ❌ No encontré el número ${this.conteoCambios}`);

        this.limpiezaFinal();
    },

    limpiezaFinal: function() {
        window.ProBot.UI.setAccion('idle');
        this.conteoCambios = 0;
        this.ultimoColorSrc = "";
        this.ultimaSrcVista = "";
        this.esperandoPregunta = true;
    },

    aprender: function() {
        // Fallback constante
        if (this.esperandoPregunta) {
            const preguntaDiv = document.querySelector('[preguntacontain]');
            if (preguntaDiv && preguntaDiv.offsetParent !== null) {
                this.detectarYResponder(preguntaDiv);
            }
        }
    }
};