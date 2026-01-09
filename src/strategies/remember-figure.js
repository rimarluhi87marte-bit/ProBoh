// --- Ejercicio de rcordar figuras ---

window.ProBot.Estrategias.MEMORIA_FIGURA_SIMPLE = {
    nombre: "Memoria Figura (Selecciona)",
    huella: '.ejercicio__figuras__contenido > .ejercicio__figuras__figura:only-child, .ejercicio__figuras__contenido--nowrap, .ejercicio__figuras__contenido--wrap',

    imagenObjetivo: "",
    ultimoObjetivoVisto: "",
    intervaloScanner: null,

    // Estados
    faseActual: 'NADA',
    rondaResuelta: false,
    enPausaMental: false,

    iniciar: function () {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 🧠 Monitor de Memoria Figura Activo...");
        this.imagenObjetivo = "";
        this.faseActual = 'NADA';
        this.rondaResuelta = false;
        this.enPausaMental = false;

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 50);
    },

    ciclo: function () {
        // --- 1. DETECCIÓN DE ELEMENTOS ---
        const titulo = document.querySelector('.ejercicio__figuras__titulo strong');
        const esTituloSelecciona = titulo && titulo.innerText.trim() === "Selecciona";

        // CAMBIO: Ahora buscamos --nowrap (fila) O --wrap (cuadrícula)
        const contenedorRespuesta = document.querySelector('.ejercicio__figuras__contenido--nowrap, .ejercicio__figuras__contenido--wrap');

        // --- 2. LÓGICA DE ESTADOS ---

        if (esTituloSelecciona) {
            // FASE: MEMORIZAR

            if (this.rondaResuelta) {
                this.rondaResuelta = false;
                this.faseActual = 'MEMORIZANDO';
                window.ProBot.UI.setAccion('idle');
            }

            const img = document.querySelector('.ejercicio__figuras__figura__imagen img');
            if (img) {
                const nombreArchivo = this.getNombreArchivo(img.src);

                if (nombreArchivo !== this.ultimoObjetivoVisto) {
                    this.imagenObjetivo = nombreArchivo;
                    this.ultimoObjetivoVisto = nombreArchivo;

                    console.log(`Extensión: 📥 Memorizado: ${this.imagenObjetivo}`);
                    window.ProBot.UI.setAccion('learning');

                    // Inicio del delay de 2 segundos (Pausa Mental)
                    this.enPausaMental = true;

                    setTimeout(() => {
                        this.enPausaMental = false;
                    }, 2300);
                }
            }
        }
        else if (contenedorRespuesta && this.imagenObjetivo) {
            // FASE: RESPONDER

            // Si estamos en pausa mental, ignoramos las opciones
            if (this.enPausaMental) return;

            if (!this.rondaResuelta && this.faseActual !== 'RESPONDIENDO') {
                this.resolver(contenedorRespuesta);
            }
        }
    },

    resolver: async function (contenedor) {
        this.faseActual = 'RESPONDIENDO';
        window.ProBot.UI.setAccion('executing');

        // Delay mínimo para estabilidad del DOM
        await window.ProBot.Utils.esperar(800);

        const opciones = contenedor.querySelectorAll('.ejercicio__figuras__figura img');
        let encontrada = false;

        for (let img of opciones) {
            if (img.style.display === 'none') continue;

            if (this.getNombreArchivo(img.src) === this.imagenObjetivo) {
                console.log(`Extensión: 🎯 Clic inmediato.`);
                img.click();
                encontrada = true;
                break;
            }
        }

        if (encontrada) {
            this.rondaResuelta = true;
            this.faseActual = 'ESPERANDO_SIGUIENTE';
            window.ProBot.UI.setAccion('idle');
        } else {
            console.warn("Extensión: ⚠️ No encontré la imagen. Reintentando...");
            this.faseActual = 'REINTENTANDO';
        }
    },

    getNombreArchivo: function (url) {
        try {
            return url.split('/').pop().split('?')[0];
        } catch (e) {
            return url;
        }
    },

    aprender: function () { }
};