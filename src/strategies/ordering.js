// --- Completar las frases de las columnas ---
// --- src/strategies/ordering.js ---

window.ProBot.Estrategias.ORDENAMIENTO_COLUMNAS = {
    nombre: "Ordenar Frases",
    huella: '.contenedor-columnas',
    procesado: false, 
    yaAprendido: false,

    iniciar: async function() {
        if (this.procesado) return;
        
        // Espera de carga
        let intentos = 0; let cargado = false; let columnasDOM = [];
        while (!cargado && intentos < 20) { 
            columnasDOM = document.querySelectorAll('.columna-frase');
            const cajas = document.querySelectorAll('.boton-caja');
            if (columnasDOM.length > 0 && cajas.length > 10) cargado = true;
            else { await window.ProBot.Utils.esperar(500); intentos++; }
        }
        
        if (!cargado) return;
        this.procesado = true; 
        window.ProBot.UI.setConocimiento('reset');

        let mapaTablero = [];
        for (let i = 0; i < columnasDOM.length; i++) {
            const cajas = columnasDOM[i].querySelectorAll('.boton-caja');
            if (cajas.length < 2) continue; 
            
            // Texto limpio
            const inicio = cajas[0].innerText.trim();
            const fin = cajas[cajas.length - 1].innerText.trim();
            
            mapaTablero.push({ 
                index: i, 
                inicio: inicio, 
                fin: fin, 
                clave: `${inicio}...${fin}`, 
                columnaDOM: columnasDOM[i] 
            });
        }
        await this.resolverSecuencia(mapaTablero, columnasDOM);
    },

    resolverSecuencia: async function(mapaTablero, todasLasColumnas) {
        let algunaEncontrada = false;
        for (let i = 0; i < mapaTablero.length; i++) {
            const colData = mapaTablero[i];
            const hash = await window.ProBot.Utils.sha256(colData.clave);
            
            const data = await new Promise(resolve => {
                chrome.runtime.sendMessage({ action: "consultarEjercicio", hash: hash }, resolve);
            });

            if (data && data.respuesta) {
                algunaEncontrada = true;
                window.ProBot.UI.setConocimiento('found'); 
                window.ProBot.UI.setAccion('executing'); 
                await this.corregirColumna(colData.index, data.respuesta, todasLasColumnas);
            }
        }
        if (!algunaEncontrada) window.ProBot.UI.setConocimiento('unknown'); 
    },

    corregirColumna: async function(colIndexObjetivo, fraseCorrecta, todasLasColumnas) {
        const palabrasObjetivo = fraseCorrecta.split(/\s+/);
        const columnaObjetivo = todasLasColumnas[colIndexObjetivo];
        const cajasObjetivo = columnaObjetivo.querySelectorAll('.boton-caja');

        for (let fila = 1; fila < cajasObjetivo.length - 1; fila++) {
            const palabraNecesaria = palabrasObjetivo[fila];
            if (!palabraNecesaria) break;
            const cajaActual = cajasObjetivo[fila];
            const textoActual = this.obtenerTextoCaja(cajaActual);

            if (textoActual !== palabraNecesaria) {
                const cajaOrigen = this.buscarEnFilaHorizontal(palabraNecesaria, fila, todasLasColumnas);
                if (cajaOrigen) {
                    cajaActual.click();
                    await window.ProBot.Utils.esperar(Math.random() * 300 + 200);
                    cajaOrigen.click();
                    await window.ProBot.Utils.esperar(Math.random() * 800 + 600); 
                }
            }
        }
    },

    buscarEnFilaHorizontal: function(palabraBuscada, numeroFila, todasLasColumnas) {
        for (let i = 0; i < todasLasColumnas.length; i++) {
            const col = todasLasColumnas[i];
            const cajas = col.querySelectorAll('.boton-caja');
            if (cajas.length > numeroFila) {
                const cajaCandidata = cajas[numeroFila];
                const texto = this.obtenerTextoCaja(cajaCandidata);
                if (texto === palabraBuscada) return cajaCandidata;
            }
        }
        return null;
    },

    obtenerTextoCaja: function(caja) {
        const p = caja.querySelector('p');
        return p ? p.innerText.trim() : caja.innerText.trim();
    },

    aprender: function() {
        if (this.yaAprendido) return; 

        // Buscamos el contenedor VISIBLE
        const contenedoresResultado = document.querySelectorAll('.contenedor-caja-resultado');
        let tablaDiv = null;
        
        for (let c of contenedoresResultado) {
            if (c.offsetParent !== null) {
                tablaDiv = c;
                break;
            }
        }

        if (!tablaDiv) return; // Si no hay visible, seguimos intentando en el siguiente ciclo
        
        const tabla = tablaDiv.querySelector('table tbody');
        if (!tabla) return;
        
        const filas = tabla.querySelectorAll('tr');
        let frasesGuardadas = 0;

        filas.forEach(fila => {
            // Buscamos la columna de solución (índice 1)
            const celdas = fila.querySelectorAll('td');
            if (celdas.length < 2) return;
            
            const celdaSolucion = celdas[1];
            const spansPalabra = celdaSolucion.querySelectorAll('.palabra');
            
            if (spansPalabra.length > 0) {
                const palabrasArray = Array.from(spansPalabra).map(s => s.innerText.trim());
                const fraseLimpia = palabrasArray.join(' '); 

                if (palabrasArray.length >= 2) {
                    const primera = palabrasArray[0];
                    const ultima = palabrasArray[palabrasArray.length - 1];
                    const clavePregunta = `${primera}...${ultima}`; 
                    
                    console.log(`Extensión: 🎓 Aprendiendo: [${clavePregunta}]`);
                    
                    window.ProBot.Utils.sha256(clavePregunta).then(hash => { 
                        window.ProBot.Utils.guardarEnBD(hash, clavePregunta, fraseLimpia); 
                    });
                    
                    frasesGuardadas++;
                }
            }
        });

        if (frasesGuardadas > 0) {
            window.ProBot.UI.setAccion('learning'); 
            this.yaAprendido = true; // Solo bloqueamos si tuvimos éxito
        }
    }
};