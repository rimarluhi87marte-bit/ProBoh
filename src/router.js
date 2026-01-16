// --- src/router.js ---

console.log("ProBot: Cargando Router Inteligente + Piloto Automático (Velocidad Variable)...");

let estrategiaActual = null; 
let observadorDOM = null;
let ultimaUnidadReportada = -1;

// --- MÓDULO DE NAVEGACIÓN AUTOMÁTICA ---
const AutoNavegador = {
    botonCandidato: null,
    tiempoDeteccion: 0,
    
    // Separamos las palabras clave por categoría de velocidad
    palabrasRapidas: [ 'iniciar', 'siguiente', 'comenzar', 'finalizar', 'ver opciones'],
    palabrasLentas: ['responder', 'continuar'], // Este requiere más cuidado o intervención humana

    iniciar: function() {
        setInterval(() => {
            this.buscarYClickear();
        }, 200); // Escáner más frecuente para detectar los rápidos
    },

    buscarYClickear: function() {
        // --- FILTRO MAESTRO ---
        if (!window.ProBot.Config.botEnabled || !window.ProBot.Config.isPlus) {
            this.botonCandidato = null; 
            return;
        }

        const posiblesBotones = document.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn, div.btn, .buttton');
        let encontrado = null;
        let tipoVelocidad = 'lento'; // Por defecto lento para seguridad

        for (let btn of posiblesBotones) {
            if (btn.offsetParent === null || btn.disabled || btn.classList.contains('disabled') || window.getComputedStyle(btn).opacity < 0.5) {
                continue;
            }

            const texto = (btn.innerText || btn.value || "").toLowerCase().trim();
            
            // Verificamos si es rápido
            if (this.palabrasRapidas.some(p => texto.includes(p))) {
                encontrado = btn;
                tipoVelocidad = 'rapido';
                break; 
            }
            
            // Verificamos si es lento (Responder)
            if (this.palabrasLentas.some(p => texto.includes(p))) {
                encontrado = btn;
                tipoVelocidad = 'lento';
                break;
            }
        }

        if (encontrado) {
            // Definir el tiempo de espera según el tipo
            // Rápido: 500ms (casi instantáneo pero humano)
            // Lento: 4600ms (tiempo de lectura/seguridad)
            const tiempoEspera = (tipoVelocidad === 'rapido') ? 500 : 4600;

            if (encontrado === this.botonCandidato) {
                const tiempoPasado = Date.now() - this.tiempoDeteccion;
                
                if (tiempoPasado >= tiempoEspera) {
                    console.log(`Extensión: 🤖 AutoClick (${tipoVelocidad}) -> "${encontrado.innerText || encontrado.value}"`);
                    encontrado.click();
                    this.botonCandidato = null; 
                    this.tiempoDeteccion = 0;
                }
            } else {
                // Nuevo botón detectado
                this.botonCandidato = encontrado;
                this.tiempoDeteccion = Date.now();
            }
        } else {
            this.botonCandidato = null;
            this.tiempoDeteccion = 0;
        }
    }
};

// ... (Resto del archivo: iniciarVerificacion, feedbackVisual, detectarYReportarUnidad, iniciarRouterDeEstrategias IGUAL) ...
// Asegúrate de mantener el resto del código que ya tenías funcionando.

// --- 1. INICIO Y AUTENTICACIÓN ---
const intervaloCarga = setInterval(() => {
    const usuarioDetectado = buscarNombreUsuario();
    const footer = document.querySelector('.copyright_style') || document.body; 
    
    if (usuarioDetectado && footer) {
        clearInterval(intervaloCarga);
        iniciarVerificacion(usuarioDetectado);
    }
}, 500);

function buscarNombreUsuario() {
    const el1 = document.getElementById('dnn_dnnUserProgrentis_enhancedRegisterLink');
    if (el1) return el1.innerText.replace(/^Hola\s+/i, '').trim();

    const el2 = document.querySelector('.username.mx-2');
    if (el2) return el2.innerText.trim();

    return null;
}

function iniciarVerificacion(usuarioCode) {
    window.ProBot.Config.usuarioActual = usuarioCode;

    chrome.runtime.sendMessage({ action: "verificarUsuario", usuario: usuarioCode }, (res) => {
        if (res && res.existe) { 
            console.log(`Extensión: Reconocido. Activo: ${res.activo} | Límite: ${res.unidadMaxima}`);
            
            if (window.ProBot.UI && window.ProBot.UI.init) window.ProBot.UI.init(res.activo);
            
            if (res.activo) {
                window.ProBot.Config.usuarioAutorizado = true;
                window.ProBot.Config.isPlus = res.plus;
                window.ProBot.Config.unidadMaxima = res.unidadMaxima;

                iniciarRouterDeEstrategias();
                AutoNavegador.iniciar(); 
                
                feedbackVisual(true);
            } else {
                console.log("Extensión: El bot está desactivado para este usuario.");
                feedbackVisual(false);
            }
        }
    });
}

function feedbackVisual(activo) {
    if (!window.ProBot.Config.botEnabled) return;
    const header = document.querySelector('.headermain') || document.querySelector('header');
    
    if (header && activo) {
        const color = window.ProBot.Config.isPlus ? '#f1c40f' : '#00ff00';
        header.style.borderBottom = `4px solid ${color}`;
    }
}

function detectarYReportarUnidad() {
    if (!window.ProBot.Config.usuarioAutorizado) return;

    let unidadDetectada = null;

    const tituloUnidad = document.querySelector('.title-unit');
    if (tituloUnidad) {
        const texto = tituloUnidad.innerText.trim(); 
        const match = texto.match(/\d+/); 
        if (match) unidadDetectada = parseInt(match[0]);
    }
    const tarjetaEntrenamiento = document.querySelector('#Entrenamiento .title');
    if (tarjetaEntrenamiento && tarjetaEntrenamiento.innerText.includes("Plan de Mejora")) {
        unidadDetectada = 20;
    }

    if (unidadDetectada !== null && unidadDetectada !== ultimaUnidadReportada) {
        ultimaUnidadReportada = unidadDetectada;
        
        const limite = window.ProBot.Config.unidadMaxima;
        let bloquearUsuario = false;

        if (limite !== null && unidadDetectada > limite) {
            console.warn(`Extensión: 🛑 Límite superado (${unidadDetectada} > ${limite}).`);
            
            if (window.ProBot.UI.showNotification) {
                window.ProBot.UI.showNotification(`🛑 LÍMITE ALCANZADO\nEl bot se desactivará permanentemente.`);
            }
            
            window.ProBot.Config.usuarioAutorizado = false;
            window.ProBot.Config.botEnabled = false;
            feedbackVisual(false);
            bloquearUsuario = true;
        }

        chrome.runtime.sendMessage({ 
            action: "actualizarUnidad", 
            usuario: window.ProBot.Config.usuarioActual,
            unidad: unidadDetectada,
            desactivar: bloquearUsuario 
        });
    }
}

function iniciarRouterDeEstrategias() {
    const targetNode = document.body;
    const config = { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] }; 

    const escanear = () => {
        if (!window.ProBot.Config.botEnabled) return;
        detectarYReportarUnidad();

        const ListaEstrategias = window.ProBot.Estrategias;
        let estrategiaEncontrada = null;

        for (const key in ListaEstrategias) {
            const est = ListaEstrategias[key];
            const elementoHuella = document.querySelector(est.huella);

            if (elementoHuella) {
                if (est.validar && typeof est.validar === 'function') {
                    if (!est.validar(elementoHuella)) continue;
                }
                estrategiaEncontrada = est;
                break;
            }
        }

        if (estrategiaEncontrada) {
            if (estrategiaActual !== estrategiaEncontrada) {
                console.log(`Extensión: 🔄 Entrando a -> ${estrategiaEncontrada.nombre}`);
                
                if (estrategiaActual && typeof estrategiaActual.detener === 'function') {
                    estrategiaActual.detener();
                }

                estrategiaActual = estrategiaEncontrada;
                
                if(estrategiaActual.procesado !== undefined) estrategiaActual.procesado = false;
                if(estrategiaActual.yaAprendido !== undefined) estrategiaActual.yaAprendido = false;
                if(estrategiaActual.memoriaTemporal !== undefined) estrategiaActual.memoriaTemporal = [];
                if(estrategiaActual.ejecutando !== undefined) estrategiaActual.ejecutando = false;
                if(estrategiaActual.mapaDefiniciones !== undefined) estrategiaActual.mapaDefiniciones = [];
                if(estrategiaActual.memoriaEstado !== undefined) estrategiaActual.memoriaEstado = {};

                window.ProBot.UI.setConocimiento('reset');
                window.ProBot.UI.setAccion('idle');
            }
            
            estrategiaActual.iniciar(); 
            if (estrategiaActual.aprender) estrategiaActual.aprender(); 
        }
    };

    observadorDOM = new MutationObserver((mutations) => {
        escanear();
    });
    observadorDOM.observe(targetNode, config);

    setTimeout(escanear, 1000);
}