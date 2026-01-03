// --- Relacionar definiciones y palbras por colores ---

window.ProBot.Estrategias.ASOCIACION_COLORES = {
    nombre: "Asociar Colores",
    huella: '.grid-cuadros',
    mapaDefiniciones: [], 
    procesado: false,

    iniciar: async function() {
        if (this.procesado) return;
        
        const cuadros = document.querySelectorAll('.grid-cuadros .cuadro-texto');
        if (cuadros.length === 0) return;

        console.log(`Extensión: 🎨 Escaneando ${cuadros.length} definiciones...`);
        
        // REGLA DE SEGURIDAD: Solo reseteamos si está vacío o si es un nuevo ejercicio real
        // Esto evita borrar lo que ya sabemos si el router parpadea
        if (this.mapaDefiniciones.length === 0) {
            this.mapaDefiniciones = [];
            for (let cuadro of cuadros) {
                const parrafo = cuadro.querySelector('.texto-parrafo');
                if (!parrafo) continue;

                const texto = parrafo.innerText.trim();
                const colorRaw = cuadro.style.backgroundColor; 
                const hash = await window.ProBot.Utils.sha256(texto);
                
                this.mapaDefiniciones.push({
                    texto: texto,
                    color: this.normalizarColor(colorRaw),
                    hash: hash,
                    resuelto: false
                });
            }
        }
        
        this.procesado = true;
        this.resolver(); 
    },

    resolver: async function() {
        let algunoSabido = false;
        
        // Protección extra: Si el mapa está vacío, intentamos llenarlo de nuevo
        if (this.mapaDefiniciones.length === 0) await this.iniciar();

        for (let def of this.mapaDefiniciones) {
            if (def.resuelto) continue;
            
            // Consultamos DB
            const data = await new Promise(resolve => {
                chrome.runtime.sendMessage({ action: "consultarEjercicio", hash: def.hash }, resolve);
            });

            if (data && data.respuesta) {
                algunoSabido = true;
                console.log(`Extensión: 💡 Respuesta conocida: "${data.respuesta}"`); // LOG RECUPERADO
                await this.conectarPalabraConColor(data.respuesta, def.color);
                def.resuelto = true; 
            }
        }

        if (algunoSabido) window.ProBot.UI.setConocimiento('found');
        else window.ProBot.UI.setConocimiento('unknown');
    },

    conectarPalabraConColor: async function(palabraTexto, colorObjetivo) {
        const botones = document.querySelectorAll('.dropdownc-toggle');
        let botonObjetivo = null;

        for (let btn of botones) {
            if (btn.innerText.trim() === palabraTexto.trim()) {
                botonObjetivo = btn;
                break;
            }
        }

        if (!botonObjetivo) return;
        window.ProBot.UI.setAccion('executing');

        botonObjetivo.click();
        await window.ProBot.Utils.esperar(500); 

        const paleta = document.querySelector('.dropdownc-content.show');
        if (paleta) {
            const opcionesColor = paleta.querySelectorAll('.color-option');
            for (let opcion of opcionesColor) {
                const colorOpcion = this.normalizarColor(opcion.style.backgroundColor);
                if (colorOpcion === colorObjetivo) {
                    opcion.click();
                    console.log(`Extensión: 🖌️ Coloreando "${palabraTexto}"`); // LOG RECUPERADO
                    await window.ProBot.Utils.esperar(10);
                    break;
                }
            }
        }
        window.ProBot.UI.setAccion('idle');
    },

    aprender: function() {
        // Protección: Si no hemos escaneado definiciones, no podemos aprender
        if (!this.mapaDefiniciones || this.mapaDefiniciones.length === 0) return;

        const botones = document.querySelectorAll('.dropdownc-toggle.correcto');
        
        botones.forEach(btn => {
            if (btn.dataset.aprendido === "true") return;

            const palabra = btn.innerText.trim();
            const colorGanador = this.normalizarColor(btn.style.backgroundColor);
            
            const definicionMatch = this.mapaDefiniciones.find(def => def.color === colorGanador);

            if (definicionMatch) {
                console.log(`Extensión: 🎓 APRENDIDO: "${palabra}"`); // LOG CRÍTICO RECUPERADO
                
                window.ProBot.UI.setAccion('learning');
                window.ProBot.Utils.guardarEnBD(definicionMatch.hash, definicionMatch.texto, palabra);
                
                btn.dataset.aprendido = "true";
            }
        });
    },

    normalizarColor: function(colorStr) {
        if (!colorStr) return "";
        return colorStr.replace(/\s+/g, '').toLowerCase();
    }
};