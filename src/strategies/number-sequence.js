// --- Ejercicio de atencion selectiva,secuencias de numeros unidad 10 ---

window.ProBot.Estrategias.SECUENCIA_NUMEROS = {
    nombre: "Secuencia Numérica",
    huella: '[container_numeros]', 
    
    intervaloScanner: null,
    modoActual: 'ASC',
    ultimoNumeroClickeado: null, 
    procesando: false,
    
    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 🔢 Monitor de Números (Double Check) Activo...");
        this.procesando = false;
        this.ultimoNumeroClickeado = null;
        this.modoActual = 'ASC';
        
        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 50);
    },

    // Función auxiliar para leer el modo
    detectarModo: function() {
        const contenedorInstruccion = document.querySelector('[container_instruccion]');
        if (contenedorInstruccion) {
            const texto = contenedorInstruccion.innerText.toLowerCase().trim();
            if (texto.includes("descendente") || texto.includes("mayor a menor")) {
                return 'DESC';
            } else {
                return 'ASC'; // Por defecto Ascendente
            }
        }
        return this.modoActual; // Si no encuentra texto, mantiene el anterior
    },

    ciclo: async function() {
        if (this.procesando) return;

        // 1. CHEQUEO RÁPIDO DE MODO
        const nuevoModo = this.detectarModo();
        if (nuevoModo !== this.modoActual) {
            console.log(`Extensión: 🔄 Cambio de Modo (Ciclo): ${this.modoActual} -> ${nuevoModo}`);
            this.modoActual = nuevoModo;
            this.ultimoNumeroClickeado = null; 
            return;
        }

        // 2. DETECTAR TABLAS
        const tablaDistra = document.querySelector('[container-numeroscajadistra], .verdistractor');
        const tablaNormal = document.querySelector('[container-numeroscaja]');

        if (tablaDistra) {
            await this.resolverDistractor(tablaDistra);
        } else if (tablaNormal) {
            await this.resolverNormal();
        }
    },

    // --- MODO NORMAL ---
    resolverNormal: async function() {
        this.procesando = true;
        
        // Espera previa (Tu ajuste a 500ms)
        await window.ProBot.Utils.esperar(500);

        // --- DOBLE VERIFICACIÓN CRUCIAL ---
        // Volvemos a leer el modo AHORA que ya pasó la animación/carga
        const modoPostEspera = this.detectarModo();
        
        if (modoPostEspera !== this.modoActual) {
            console.log(`Extensión: ⚠️ Corrección de Modo tardía: ${this.modoActual} -> ${modoPostEspera}`);
            this.modoActual = modoPostEspera;
            this.ultimoNumeroClickeado = null; // Reiniciamos memoria por si acaso
        }
        // -----------------------------------

        window.ProBot.UI.setAccion('executing');

        const cajas = document.querySelectorAll('[container-numeroscaja] [numeros-texto]');
        
        if (cajas.length === 0) {
            this.procesando = false;
            return;
        }

        let todosLosNumeros = [];
        cajas.forEach(caja => {
            if (caja.offsetParent !== null && caja.innerText.trim() !== "") {
                const valor = parseInt(caja.innerText.trim());
                if (!isNaN(valor)) {
                    todosLosNumeros.push({ valor: valor, dom: caja });
                }
            }
        });

        if (todosLosNumeros.length === 0) {
            this.procesando = false;
            return;
        }

        todosLosNumeros.sort((a, b) => a.valor - b.valor);

        // Lógica de memoria
        let candidatos = [];
        if (this.ultimoNumeroClickeado === null) {
            candidatos = todosLosNumeros;
        } else {
            if (this.modoActual === 'ASC') {
                candidatos = todosLosNumeros.filter(n => n.valor > this.ultimoNumeroClickeado);
            } else {
                candidatos = todosLosNumeros.filter(n => n.valor < this.ultimoNumeroClickeado);
            }

            // Detección de reinicio de nivel (si los números no cuadran con la memoria)
            if (candidatos.length === 0 && todosLosNumeros.length > 0) {
                console.log("Extensión: 🔄 Nuevo nivel detectado (Reinicio memoria).");
                this.ultimoNumeroClickeado = null;
                candidatos = todosLosNumeros;
            }
        }

        if (candidatos.length === 0) {
            this.procesando = false;
            return;
        }

        // Selección basada en el modo VERIFICADO
        let objetivo = (this.modoActual === 'ASC') ? candidatos[0] : candidatos[candidatos.length - 1]; 

        console.log(`Extensión: 🔢 Click en ${objetivo.valor} (${this.modoActual})`);
        const clickTarget = objetivo.dom.closest('[numeros-caja]') || objetivo.dom;
        clickTarget.click();
        
        this.ultimoNumeroClickeado = objetivo.valor;
        
        window.ProBot.UI.setAccion('idle');
        this.procesando = false;
    },

    // --- MODO DISTRACTOR ---
    resolverDistractor: async function() {
        this.procesando = true;

        console.log("Extensión: ⚠️ Distractor detectado. Esperando 1s...");
        await window.ProBot.Utils.esperar(1000);

        window.ProBot.UI.setAccion('executing');

        const cajas = document.querySelectorAll('.numeros-cajadistra [numeros-texto]');
        if (cajas.length === 0) {
            this.procesando = false;
            return;
        }

        const conteo = {};
        const mapa = {}; 

        cajas.forEach(caja => {
            const val = caja.innerText.trim();
            if(!val) return;
            conteo[val] = (conteo[val] || 0) + 1;
            if (!mapa[val]) mapa[val] = [];
            mapa[val].push(caja);
        });

        let valorUnico = null;
        for (const [val, count] of Object.entries(conteo)) {
            if (count === 1) {
                valorUnico = val;
                break;
            }
        }

        if (valorUnico) {
            if (this.ultimoNumeroClickeado === parseInt(valorUnico)) {
                this.procesando = false;
                return;
            }

            const objetivo = mapa[valorUnico][0];
            const clickTarget = objetivo.closest('.numeros-cajadistra') || objetivo;
            
            clickTarget.click();
            console.log(`Extensión: ⚡ Click Distractor: ${valorUnico}`);
            
            this.ultimoNumeroClickeado = parseInt(valorUnico);
        }

        window.ProBot.UI.setAccion('idle');
        this.procesando = false;
    },

    aprender: function() { }
};