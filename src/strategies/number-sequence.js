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

        console.log("Extensión: 🔢 Monitor de Números (Wait -> Click) Activo...");
        this.procesando = false;
        this.ultimoNumeroClickeado = null;
        this.modoActual = 'ASC';
        
        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 50);
    },

    ciclo: async function() {
        if (this.procesando) return;

        // 1. DETECTAR MODO
        const instruccionSpan = document.querySelector('[container_instruccion] span');
        if (instruccionSpan) {
            const texto = instruccionSpan.innerText.toLowerCase();
            const nuevoModo = texto.includes("descendente") ? 'DESC' : 'ASC';

            if (nuevoModo !== this.modoActual) {
                console.log(`Extensión: 🔄 Cambio de Modo: ${this.modoActual} -> ${nuevoModo}`);
                this.modoActual = nuevoModo;
                this.ultimoNumeroClickeado = null; 
                return;
            }
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
        // BLOQUEO INMEDIATO
        this.procesando = true;
        
        // 1. ESPERA PREVIA (El bot "piensa" 400ms)
        await window.ProBot.Utils.esperar(500);

        window.ProBot.UI.setAccion('executing');

        // 2. ESCANEO (Después de esperar, por si la pantalla cambió)
        const cajas = document.querySelectorAll('[container-numeroscaja] [numeros-texto]');
        
        // Si durante la espera desaparecieron las cajas, abortamos
        if (cajas.length === 0) {
            this.procesando = false;
            return;
        }

        let todosLosNumeros = [];
        cajas.forEach(caja => {
            if (caja.offsetParent !== null && !caja.innerText.trim() == "") {
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

        // 3. LÓGICA DE MEMORIA
        let candidatos = [];
        if (this.ultimoNumeroClickeado === null) {
            candidatos = todosLosNumeros;
        } else {
            if (this.modoActual === 'ASC') {
                candidatos = todosLosNumeros.filter(n => n.valor > this.ultimoNumeroClickeado);
            } else {
                candidatos = todosLosNumeros.filter(n => n.valor < this.ultimoNumeroClickeado);
            }

            // Detección de reinicio de nivel
            if (candidatos.length === 0 && todosLosNumeros.length > 0) {
                console.log("Extensión: 🔄 Nuevo nivel detectado.");
                this.ultimoNumeroClickeado = null;
                candidatos = todosLosNumeros;
            }
        }

        if (candidatos.length === 0) {
            this.procesando = false;
            return;
        }

        let objetivo = (this.modoActual === 'ASC') ? candidatos[0] : candidatos[candidatos.length - 1]; 

        // 4. CLICK FINAL
        console.log(`Extensión: 🔢 Click en ${objetivo.valor}`);
        const clickTarget = objetivo.dom.closest('[numeros-caja]') || objetivo.dom;
        clickTarget.click();
        
        this.ultimoNumeroClickeado = objetivo.valor;
        
        window.ProBot.UI.setAccion('idle');
        this.procesando = false;
    },

    // --- MODO DISTRACTOR ---
    resolverDistractor: async function() {
        this.procesando = true;

        // 1. ESPERA PREVIA LARGA (El bot detectó la trampa y se toma su tiempo)
        console.log("Extensión: ⚠️ Distractor detectado. Esperando 1s...");
        await window.ProBot.Utils.esperar(1000);

        window.ProBot.UI.setAccion('executing');

        // 2. ESCANEO POST-ESPERA
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
            // Evitar doble click en el mismo evento
            if (this.ultimoNumeroClickeado === parseInt(valorUnico)) {
                this.procesando = false;
                return;
            }

            const objetivo = mapa[valorUnico][0];
            const clickTarget = objetivo.closest('.numeros-cajadistra') || objetivo;
            
            // 3. CLICK FINAL
            clickTarget.click();
            console.log(`Extensión: ⚡ Click Distractor: ${valorUnico}`);
            
            this.ultimoNumeroClickeado = parseInt(valorUnico);
        }

        window.ProBot.UI.setAccion('idle');
        this.procesando = false;
    },

    aprender: function() { }
};