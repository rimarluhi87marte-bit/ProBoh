// Ejercicio de atencion selectiva colores unidad 7 ---

window.ProBot.Estrategias.ATENCION_SELECTIVA = {
    nombre: "Atención Selectiva",
    huella: '.ejercicio__figuras__titulo span', 
    
    // Diccionario de Colores (Texto -> RGB)
    coloresMap: {
        "rosa": "rgb(255,150,201)",
        "celeste": "rgb(91,220,255)",
        "gris": "rgb(174,183,189)",
        "amarillo": "rgb(255,204,13)",
        "naranja": "rgb(255,128,1)",
        "magenta": "rgb(229,0,111)",
        "violeta": "rgb(128,77,215)",
        "café": "rgb(139,69,19)",
        "cafe": "rgb(139,69,19)", 
        "azul": "rgb(22,77,245)"
    },

    intervaloScanner: null,
    ultimaHuella: "", // La "ID" de la ronda actual
    procesado: false, // Flag para no hacer click 2 veces en la misma ronda

    iniciar: function() {
        // Feedback inicial
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return; // Evitar duplicar escáners

        const contenedor = document.querySelector('.ejercicio__figuras');
        if (!contenedor) return;

        console.log("Extensión: 👀 Escáner Selectivo Activo (100ms)...");

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 300);
    },

    ciclo: async function() {
        // 1. OBTENER INFORMACIÓN DE LA RONDA ACTUAL
        const tituloDiv = document.querySelector('.ejercicio__figuras__titulo');
        if (!tituloDiv) return;

        const spanInstruccion = tituloDiv.querySelector('span');
        const strongColor = tituloDiv.querySelector('strong');
        
        if (!spanInstruccion || !strongColor) return;

        // 2. GENERAR HUELLA DIGITAL
        // Combinamos: Texto Instrucción + Texto Color + Color del Estilo
        // Esto hace que cualquier cambio mínimo detecte una "Nueva Ronda"
        const instruccionTxt = spanInstruccion.innerText.trim();
        const colorTxt = strongColor.innerText.trim();
        const styleColor = strongColor.style.color;
        
        const huellaActual = `${instruccionTxt}|${colorTxt}|${styleColor}`;

        // 3. COMPARAR CON LA ANTERIOR
        if (huellaActual !== this.ultimaHuella) {
            // --- CAMBIO DE RONDA DETECTADO ---
            console.log(`Extensión: 🆕 Nueva instrucción: "${instruccionTxt} ${colorTxt}"`);
            this.ultimaHuella = huellaActual;
            this.procesado = false; // ¡Desbloqueamos el click!
            window.ProBot.UI.setAccion('idle');
        }

        // 4. EJECUTAR SI NO HEMOS PROCESADO ESTA HUELLA
        if (!this.procesado) {
            await this.resolver(instruccionTxt, colorTxt, styleColor);
        }
    },

    resolver: async function(instruccion, nombreColor, estiloColor) {
        // Marcamos como procesado INMEDIATAMENTE para evitar spam mientras buscamos/esperamos
        // Si fallamos, luego lo ponemos en false, pero por defecto asumimos éxito para frenar clicks.
        this.procesado = true;
        
        window.ProBot.UI.setAccion('executing');
        
        let colorObjetivoRGB = "";

        // LÓGICA DE DECISIÓN
        if (instruccion.toLowerCase().includes("no")) {
            // Caso "No pulses el...": Usamos el color visual del texto
            // console.log(`Extensión: 🧠 Modo Inverso (Color Visual)`);
            colorObjetivoRGB = this.normalizarColor(estiloColor);
        } else {
            // Caso "Pulsa el...": Usamos el significado de la palabra
            // console.log(`Extensión: 🧠 Modo Directo (Diccionario)`);
            colorObjetivoRGB = this.coloresMap[nombreColor.toLowerCase()];
        }

        if (!colorObjetivoRGB) {
            console.warn(`Extensión: ❌ Color desconocido: ${nombreColor}`);
            return;
        }

        // Pequeño delay humano para que la interfaz cargue bien las opciones
        await window.ProBot.Utils.esperar(300);

        // BUSCAR Y CLICKAR
        const figuras = document.querySelectorAll('.ejercicio__figuras__figura__imagen');
        let encontrado = false;

        for (let figura of figuras) {
            const colorFondo = this.normalizarColor(figura.style.backgroundColor || figura.style.background);
            
            if (colorFondo === colorObjetivoRGB) {
                figura.click();
                encontrado = true;
                console.log("Extensión: ✅ Click.");
                break; // Solo un click por ronda
            }
        }

        if (!encontrado) {
            console.warn(`Extensión: ⚠️ No encontré el color objetivo en las opciones.`);
            // Si no encontramos nada, quizás las opciones no cargaron.
            // Permitimos reintentar en el siguiente ciclo del scanner.
            this.procesado = false; 
        } else {
            // Éxito total
            window.ProBot.UI.setAccion('idle');
        }
    },

    normalizarColor: function(color) {
        if (!color) return "";
        return color.replace(/\s+/g, '').toLowerCase();
    },

    aprender: function() {
        // No necesario
    }
};