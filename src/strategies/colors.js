// --- Relacionar definiciones y palbras por colores ---
// --- src/strategies/colors.js ---

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
        const palabrasUsadas = new Set(); // Guardaremos las palabras que ya conectamos
        
        if (this.mapaDefiniciones.length === 0) await this.iniciar();

        // 1. RESOLVER LO QUE SABEMOS POR BD
        for (let def of this.mapaDefiniciones) {
            if (def.resuelto) {
                // Si ya estaba resuelto de antes, intentamos recuperar qué palabra fue 
                // (esto es difícil sin guardar estado, pero asumimos flujo normal)
                continue;
            }
            
            const data = await new Promise(resolve => {
                chrome.runtime.sendMessage({ action: "consultarEjercicio", hash: def.hash }, resolve);
            });

            if (data && data.respuesta) {
                algunoSabido = true;
                console.log(`Extensión: 💡 Respuesta conocida: "${data.respuesta}"`);
                
                await this.conectarPalabraConColor(data.respuesta, def.color);
                
                def.resuelto = true; 
                palabrasUsadas.add(data.respuesta.trim()); // Marcamos palabra como usada
            }
        }

        // 2. LÓGICA DE DESCARTE (La última pieza del puzzle)
        // Filtramos cuántas definiciones faltan por resolver
        const definicionesFaltantes = this.mapaDefiniciones.filter(d => !d.resuelto);

        if (definicionesFaltantes.length === 1) {
            console.log("Extensión: 🕵️ Intentando deducción por descarte...");
            
            // Obtenemos todos los botones de palabras disponibles
            const botones = document.querySelectorAll('.dropdownc-toggle');
            let palabraSobrante = null;
            let conteoSobrantes = 0;

            for (let btn of botones) {
                const textoBtn = btn.innerText.trim();
                
                // Si esta palabra NO está en la lista de las que acabamos de usar
                if (!palabrasUsadas.has(textoBtn)) {
                    palabraSobrante = textoBtn;
                    conteoSobrantes++;
                }
            }

            // Si solo sobra exactamente UNA palabra y falta UNA definición
            if (conteoSobrantes === 1 && palabraSobrante) {
                const defFinal = definicionesFaltantes[0];
                console.log(`Extensión: 🧠 Deducción: "${palabraSobrante}" va con el color restante.`);
                
                await this.conectarPalabraConColor(palabraSobrante, defFinal.color);
                
                // No marcamos como 'resuelto' ni guardamos en BD aquí.
                // Dejamos que la función 'aprender' lo capture cuando se ponga verde,
                // así nos aseguramos de que la deducción fue correcta antes de ensuciar la BD.
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
                    console.log(`Extensión: 🖌️ Coloreando "${palabraTexto}"`);
                    await window.ProBot.Utils.esperar(10);
                    break;
                }
            }
        }
        window.ProBot.UI.setAccion('idle');
    },

    aprender: function() {
        if (!this.mapaDefiniciones || this.mapaDefiniciones.length === 0) return;

        const botones = document.querySelectorAll('.dropdownc-toggle.correcto');
        
        botones.forEach(btn => {
            if (btn.dataset.aprendido === "true") return;

            const palabra = btn.innerText.trim();
            const colorGanador = this.normalizarColor(btn.style.backgroundColor);
            
            const definicionMatch = this.mapaDefiniciones.find(def => def.color === colorGanador);

            if (definicionMatch) {
                console.log(`Extensión: 🎓 APRENDIDO: "${palabra}"`);
                
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