// --- Ejercicio de atencion, elegir dirección y tamaño ---

window.ProBot.Estrategias.ATENCION_DIRECCION_TAMANO = {
    nombre: "Dirección y Tamaño",
    // Huella blindada: Buscamos el contenedor específico de este layout partido
    huella: '#btn_arriba, .ejercicio__figuras__derecha__container', 
    
    intervaloScanner: null,
    ultimaHuellaTurno: "", 
    procesando: false,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 🧭 Monitor de Dirección/Tamaño Activo...");

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 100);
    },

    ciclo: async function() {
        if (this.procesando) return;

        // 1. DETECTAR QUÉ LADO ESTÁ ACTIVO
        const contenedorIzq = document.querySelector('.ejercicio__figuras__izquierda__contenido');
        const imgDireccion = contenedorIzq ? contenedorIzq.querySelector('img') : null;

        const contenedorDer = document.querySelector('.ejercicio__figuras__derecha__contenido');
        const imgsTamano = contenedorDer ? contenedorDer.querySelectorAll('img') : [];

        // 2. ENRUTAR LÓGICA
        if (imgDireccion) {
            await this.resolverDireccion(imgDireccion);
        } 
        else if (imgsTamano.length > 0) {
            await this.resolverTamano(imgsTamano);
        }
    },

    // --- LÓGICA A: DIRECCIÓN ---
    resolverDireccion: async function(img) {
        const transform = img.style.transform || "none";
        const src = img.src;
        const huellaActual = `DIR_${src}_${transform}`;

        if (huellaActual === this.ultimaHuellaTurno) return;

        this.procesando = true;
        window.ProBot.UI.setAccion('executing');
        
        await window.ProBot.Utils.esperar(Math.random() * 300 + 300);

        let btnId = 'btn_derecha'; // Default

        if (transform.includes('scaleX(-1)')) {
            btnId = 'btn_izquierda';
        } else if (transform.includes('rotate(90deg)')) {
            btnId = 'btn_abajo';
        } else if (transform.includes('rotate(270deg)') || transform.includes('rotate(-90deg)')) {
            btnId = 'btn_arriba';
        } else if (transform.includes('rotate(180deg)')) {
            btnId = 'btn_izquierda'; 
        }

        const boton = document.getElementById(btnId);
        if (boton) {
            boton.click();
            console.log(`Extensión: 🧭 Dirección (${transform}) -> ${btnId}`);
            this.ultimaHuellaTurno = huellaActual;
        } else {
            console.warn(`Extensión: Botón ${btnId} no encontrado.`);
        }

        window.ProBot.UI.setAccion('idle');
        this.procesando = false;
    },

    // --- LÓGICA B: TAMAÑO (GRANDE / PEQUEÑO) ---
    resolverTamano: async function(imagenesNodeList) {
        const imagenes = Array.from(imagenesNodeList);
        
        // Huella para cambio de ronda
        const huellaActual = `SIZE_${imagenes.map(i => i.style.height).join('_')}`;
        if (huellaActual === this.ultimaHuellaTurno) return;

        this.procesando = true;
        window.ProBot.UI.setAccion('executing');

        // 1. LEER INSTRUCCIÓN (¿Grande o Pequeño?)
        // Buscamos el título dentro del contenedor derecho
        const tituloDiv = document.querySelector('.ejercicio__figuras__derecha__container .ejercicio__figuras__titulo');
        const textoInstruccion = tituloDiv ? tituloDiv.innerText.toLowerCase() : "";
        
        const buscarPeque = textoInstruccion.includes("pequeño"); // Si dice pequeño, true. Si no, asumimos grande.

        console.log(`Extensión: 📏 Instrucción detectada: Buscar el más ${buscarPeque ? "PEQUEÑO" : "GRANDE"}`);

        await window.ProBot.Utils.esperar(Math.random() * 300 + 300);

        // 2. BUSCAR EL OBJETIVO
        let mejorAltura = buscarPeque ? 999999 : -1; // Inicializamos valores extremos opuestos
        let imgGanadora = null;

        imagenes.forEach(img => {
            const altura = parseFloat(img.style.height) || 0;
            
            if (buscarPeque) {
                // Buscamos el menor
                if (altura < mejorAltura) {
                    mejorAltura = altura;
                    imgGanadora = img;
                }
            } else {
                // Buscamos el mayor
                if (altura > mejorAltura) {
                    mejorAltura = altura;
                    imgGanadora = img;
                }
            }
        });

        // 3. CLICK
        if (imgGanadora) {
            imgGanadora.click();
            console.log(`Extensión: 🎯 Seleccionada figura de ${mejorAltura}px`);
            this.ultimaHuellaTurno = huellaActual;
        } else {
            console.warn("Extensión: No pude determinar tamaños.");
        }

        window.ProBot.UI.setAccion('idle');
        this.procesando = false;
    },

    aprender: function() { }
};