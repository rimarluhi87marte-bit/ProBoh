// --- Ejercicio de zig zag horizontal y vertical ---

window.ProBot.Estrategias.DESLIZAMIENTO_PRG = {
    nombre: "Deslizamiento Visual (Iconos PRG)",
    // Huella: El contenedor donde pasan los iconos
    huella: '#contenedor-lineas', 
    
    memoriaIconos: new Set(), 
    intervaloScanner: null,
    enFaseRespuesta: false,

    iniciar: function() {
        window.ProBot.UI.setConocimiento('found');

        if (this.intervaloScanner) return;

        console.log("Extensión: 👀 Monitor Deslizamiento (PRG) Activo...");
        this.memoriaIconos = new Set();
        this.enFaseRespuesta = false;

        this.intervaloScanner = setInterval(() => {
            this.ciclo();
        }, 50);
    },

    ciclo: function() {
        // 1. DETECTAR FASE RESPUESTA (La caja B es visible)
        const frappeB = document.querySelector('.frappeB');
        
        // Verificamos si existe y si es visible
        if (frappeB && frappeB.offsetParent !== null) {
            
            // Verificamos si las opciones ya cargaron
            const opciones = frappeB.querySelectorAll('div[data-opcion-respuesta]');
            
            if (opciones.length > 0) {
                if (!this.enFaseRespuesta) {
                    this.resolver(opciones);
                }
                return; // Dejamos de memorizar
            }
        }

        // 2. FASE DE MEMORIZACIÓN (La caja A es visible)
        // Si ya estamos respondiendo, no miramos
        if (this.enFaseRespuesta) return;

        const contenedorLineas = document.getElementById('contenedor-lineas');
        if (contenedorLineas) {
            // Buscamos los spans que tengan iconos
            const iconos = contenedorLineas.querySelectorAll('span[class*="icon-prg-"]');
            
            iconos.forEach(icon => {
                const huella = this.generarHuella(icon);
                
                if (huella && !this.memoriaIconos.has(huella)) {
                    this.memoriaIconos.add(huella);
                    // console.log(`Extensión: 👁️ Visto: ${huella}`);
                    window.ProBot.UI.setAccion('learning');
                }
            });
        }
    },

    resolver: async function(nodelistOpciones) {
        this.enFaseRespuesta = true;
        window.ProBot.UI.setAccion('executing');

        console.log("Extensión: 🛑 Fase de Respuesta Detectada.");
        
        await window.ProBot.Utils.esperar(1000); 

        let encontrada = false;

        // Recorremos las opciones para ver cuál NO está en memoria
        for (let divOpcion of nodelistOpciones) {
            const iconSpan = divOpcion.querySelector('span[class*="icon-prg-"]');
            
            if (iconSpan) {
                const huellaOp = this.generarHuella(iconSpan);
                
                // LA LÓGICA: Si NO está en el Set -> Es la que falta
                if (!this.memoriaIconos.has(huellaOp)) {
                    console.log(`Extensión: 🎯 Encontrado (No visto): ${huellaOp}`);
                    
                    // Click en el div contenedor de la opción
                    divOpcion.click();
                    // Click en el span por si acaso
                    iconSpan.click();
                    
                    encontrada = true;
                    break;
                }
            }
        }

        if (encontrada) {
            // Intentar buscar botón invisible o continuar si existe
            await window.ProBot.Utils.esperar(500);
            const btn = document.querySelector('.frappeB button.rojo');
            if (btn) btn.click();
            
            this.limpiar();
        } else {
            console.warn("Extensión: ⚠️ No encontré la respuesta correcta (¿Todas fueron vistas?).");
            this.enFaseRespuesta = false; // Reintentar
        }
        
        window.ProBot.UI.setAccion('idle');
    },

    generarHuella: function(elemento) {
        // 1. Obtener la clase del icono (ej: icon-prg-pin)
        let claseIcono = "";
        const clases = elemento.classList;
        
        for (let c of clases) {
            if (c.startsWith('icon-prg-')) {
                claseIcono = c;
                break;
            }
        }

        // 2. Obtener color
        let color = elemento.style.color; 
        if (color) color = color.replace(/\s+/g, '').toLowerCase();

        if (!claseIcono || !color) return null;

        return `${claseIcono}|${color}`;
    },

    limpiar: function() {
        if (this.intervaloScanner) {
            clearInterval(this.intervaloScanner);
            this.intervaloScanner = null;
        }
        this.memoriaIconos = new Set();
        this.enFaseRespuesta = false;
    },

    aprender: function() { }
};