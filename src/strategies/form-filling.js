// --- Completar formulario ---

window.ProBot.Estrategias.FORMULARIO_LOGICO = {
    nombre: "Formulario Lógico",
    huella: '.TituloSeccion',
    procesado: false,

    valores: {
        B_numero3: "123",
        D_numero2: "10",
        F_numero1: "5"
    },

    listaColores: [
        "Rojo", "Azul", "Verde", "Amarillo", "Negro", "Blanco", 
        "Naranja", "Morado", "Rosa", "Gris", "Violeta", "Celeste", 
        "Magenta", "Café", "Lila", "Turquesa"
    ],

    iniciar: async function() {
        if (this.procesado) return;

        window.ProBot.UI.setConocimiento('found');
        console.log("Extensión: 📝 Detectado Formulario Lógico. Iniciando llenado...");
        
        this.procesado = true;
        window.ProBot.UI.setAccion('executing');

        await window.ProBot.Utils.esperar(1000);

        try {
            await this.rellenarCampoA();
            await this.rellenarCampoB();
            await this.rellenarCampoC(); 
            await this.rellenarCampoD();
            await this.rellenarCampoE(); 
            await this.rellenarCampoF();
            await this.rellenarCampoG();
            await this.rellenarCampoH(); 
            
            console.log("Extensión: ✅ Formulario completo. Enviando...");
            await window.ProBot.Utils.esperar(1000);
            
            const btnResponder = document.querySelector('button.rojo');
            if (btnResponder) btnResponder.click();

        } catch (e) {
            console.error("Extensión: Error llenando formulario", e);
            this.procesado = false; 
        }
        
        window.ProBot.UI.setAccion('idle');
    },

    // --- FUNCIONES POR CAMPO ---

    rellenarCampoA: async function() {
        // A. Indica tu fecha favorita (FECHA ANTIGUA)
        const contenedor = this.buscarContenedorPorTexto("A.");
        if (!contenedor) return;
        const selects = contenedor.querySelectorAll('select');
        
        if (selects.length >= 3) {
            this.setSelectIndex(selects[0], 1); // Día cualquiera
            this.setSelectIndex(selects[1], 1); // Mes cualquiera
            
            // Año: Buscamos el año MENOR (más antiguo)
            const indiceMenor = this.encontrarIndiceAnio(selects[2], 'min');
            this.setSelectIndex(selects[2], indiceMenor);
        }
    },

    rellenarCampoG: async function() {
        // G. Selecciona una fecha más reciente (FECHA RECIENTE)
        const contenedor = this.buscarContenedorPorTexto("G.");
        if (!contenedor) return;
        const selects = contenedor.querySelectorAll('select');
        
        if (selects.length >= 3) {
            this.setSelectIndex(selects[0], 1); // Día cualquiera
            this.setSelectIndex(selects[1], 1); // Mes cualquiera
            
            // Año: Buscamos el año MAYOR (más reciente)
            const indiceMayor = this.encontrarIndiceAnio(selects[2], 'max');
            this.setSelectIndex(selects[2], indiceMayor);
        }
    },

    rellenarCampoB: async function() {
        const contenedor = this.buscarContenedorPorTexto("B.");
        if (!contenedor) return;
        const input = contenedor.querySelector('input');
        if (input) this.escribirInput(input, this.valores.B_numero3);
    },

    rellenarCampoC: async function() {
        const contenedor = this.buscarContenedorPorTexto("C.");
        if (!contenedor) return;
        const select = contenedor.querySelector('select');
        
        if (select) {
            for (let i = 0; i < select.options.length; i++) {
                const textoOpcion = select.options[i].text.trim();
                const esColor = this.listaColores.some(color => 
                    textoOpcion.toLowerCase().includes(color.toLowerCase())
                );

                if (esColor) {
                    console.log(`Extensión: 🎨 Color detectado: ${textoOpcion}`);
                    this.setSelectIndex(select, i);
                    break;
                }
            }
        }
    },

    rellenarCampoD: async function() {
        const contenedor = this.buscarContenedorPorTexto("D.");
        if (!contenedor) return;
        const input = contenedor.querySelector('input');
        if (input) this.escribirInput(input, this.valores.D_numero2);
    },

    rellenarCampoE: async function() {
        const titulos = document.querySelectorAll('.TituloCampo');
        let letraObjetivo = null;
        let contenedor = null;

        for (let t of titulos) {
            if (t.innerText.includes("E.") && t.innerText.includes("letra")) {
                contenedor = t.parentElement; 
                const match = t.innerText.match(/letra\s+[“"']([A-Z])[”"']/i);
                if (match) {
                    letraObjetivo = match[1].toUpperCase();
                }
                break;
            }
        }

        if (contenedor && letraObjetivo) {
            console.log(`Extensión: 🔤 Buscando nombre con letra: "${letraObjetivo}"`);
            const select = contenedor.querySelector('select');
            if (select) {
                for (let i = 0; i < select.options.length; i++) {
                    const nombre = select.options[i].text.trim().toUpperCase();
                    if (nombre.startsWith(letraObjetivo)) {
                        this.setSelectIndex(select, i);
                        break;
                    }
                }
            }
        }
    },

    rellenarCampoF: async function() {
        const contenedor = this.buscarContenedorPorTexto("F.");
        if (!contenedor) return;
        const input = contenedor.querySelector('input');
        if (input) this.escribirInput(input, this.valores.F_numero1);
    },

    rellenarCampoH: async function() {
        const contenedor = this.buscarContenedorPorTexto("H.");
        if (!contenedor) return;
        
        const suma = parseInt(this.valores.B_numero3) + parseInt(this.valores.F_numero1);
        
        const input = contenedor.querySelector('input');
        if (input) {
            console.log(`Extensión: ➕ Calculando suma: ${suma}`);
            this.escribirInput(input, suma.toString());
        }
    },

    // --- UTILIDADES INTERNAS ---

    encontrarIndiceAnio: function(select, tipo) {
        // Recorre todas las opciones, las convierte a número y busca el min/max
        let mejorIndice = 0;
        let mejorValor = tipo === 'min' ? 9999 : 0;

        for (let i = 0; i < select.options.length; i++) {
            const texto = select.options[i].text.trim();
            const valor = parseInt(texto);

            // Ignoramos opciones que no sean números (ej: "Selecciona")
            if (!isNaN(valor)) {
                if (tipo === 'min' && valor < mejorValor) {
                    mejorValor = valor;
                    mejorIndice = i;
                }
                if (tipo === 'max' && valor > mejorValor) {
                    mejorValor = valor;
                    mejorIndice = i;
                }
            }
        }
        return mejorIndice;
    },

    buscarContenedorPorTexto: function(textoClave) {
        const titulos = document.querySelectorAll('.TituloCampo');
        for (let t of titulos) {
            if (t.innerText.includes(textoClave)) {
                return t.parentElement;
            }
        }
        return null;
    },

    escribirInput: function(input, valor) {
        input.value = valor;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    },

    setSelectIndex: function(select, index) {
        if (index < select.options.length) {
            select.selectedIndex = index;
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }
    },

    aprender: function() { }
};