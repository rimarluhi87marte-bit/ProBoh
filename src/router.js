// --- src/router.js ---

console.log("ProBot: Cargando Router Inteligente + Piloto Automático (Plus)...");

let estrategiaActual = null; 
let observadorDOM = null;
let ultimaUnidadReportada = -1;

// --- MÓDULO DE NAVEGACIÓN AUTOMÁTICA ---
const AutoNavegador = {
    botonCandidato: null,
    tiempoDeteccion: 0,
    palabrasClave: ['responder', 'continuar', 'iniciar', 'siguiente', 'comenzar', 'finalizar', 'ver opciones' ],

    iniciar: function() {
        setInterval(() => {
            this.buscarYClickear();
        }, 500);
    },

    buscarYClickear: function() {
        // --- FILTRO MAESTRO ---
        // 1. Si el bot está apagado -> No click.
        // 2. Si el usuario NO es Plus -> No click.
        if (!window.ProBot.Config.botEnabled || !window.ProBot.Config.isPlus) {
            this.botonCandidato = null; 
            return;
        }
        // ----------------------

        const posiblesBotones = document.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn, div.btn, .buttton');
        let encontrado = null;

        for (let btn of posiblesBotones) {
            if (btn.offsetParent === null || btn.disabled || btn.classList.contains('disabled') || window.getComputedStyle(btn).opacity < 0.5) {
                continue;
            }

            const texto = (btn.innerText || btn.value || "").toLowerCase().trim();
            
            if (this.palabrasClave.some(palabra => texto.includes(palabra))) {
                encontrado = btn;
                break; 
            }
        }

        if (encontrado) {
            if (encontrado === this.botonCandidato) {
                const tiempoPasado = Date.now() - this.tiempoDeteccion;
                if (tiempoPasado >= 4600) {
                    console.log(`Extensión: 🤖 Piloto Automático (PLUS) -> Click seguro.`);
                    encontrado.click();
                    this.botonCandidato = null; 
                    this.tiempoDeteccion = 0;
                }
            } else {
                this.botonCandidato = encontrado;
                this.tiempoDeteccion = Date.now();
            }
        } else {
            this.botonCandidato = null;
            this.tiempoDeteccion = 0;
        }
    }
};

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
                // --- CASO 1: USUARIO ACTIVO ---
                // Arrancamos todo normal
                window.ProBot.Config.usuarioAutorizado = true;
                window.ProBot.Config.isPlus = res.plus;
                window.ProBot.Config.unidadMaxima = res.unidadMaxima;

                iniciarRouterDeEstrategias();
                AutoNavegador.iniciar(); 
                
                feedbackVisual(true);
            } else {
                // --- CASO 2: USUARIO INACTIVO (O YA BLOQUEADO) ---
                // Simplemente no arrancamos. NO mostramos notificación.
                // El bot se queda en silencio (círculo gris).
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
        // Detalle visual extra: Borde Dorado si es Plus, Verde si es Normal
        const color = window.ProBot.Config.isPlus ? '#f1c40f' : '#00ff00';
        header.style.borderBottom = `4px solid ${color}`;
    }
}

// ... (Resto de funciones: detectarYReportarUnidad, iniciarRouterDeEstrategias, etc. IGUALES) ...
// Asegúrate de copiar las funciones detectarYReportarUnidad y el observadorDOM del router anterior 
// o simplemente edita la parte superior del archivo actual.
function detectarYReportarUnidad() {
    // Si ya no estamos autorizados, no tiene sentido chequear nada
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

        // --- CHEQUEO DE LÍMITE ---
        if (limite !== null && unidadDetectada > limite) {
            console.warn(`Extensión: 🛑 Límite superado en tiempo real (${unidadDetectada} > ${limite}).`);
            
            // 1. Notificación (SOLO sale esta vez, porque luego el usuario ya será inactivo)
            if (window.ProBot.UI.showNotification) {
                window.ProBot.UI.showNotification(`🛑 LÍMITE ALCANZADO\nEl bot se desactivará permanentemente.`);
            }
            
            // 2. Apagado Local Inmediato
            window.ProBot.Config.usuarioAutorizado = false;
            window.ProBot.Config.botEnabled = false;
            feedbackVisual(false);
            
            // 3. Marca para enviar a la BD
            bloquearUsuario = true;
        }

        // Enviamos a la BD (Si bloquearUsuario es true, la BD pondrá activo = false)
        chrome.runtime.sendMessage({ 
            action: "actualizarUnidad", 
            usuario: window.ProBot.Config.usuarioActual,
            unidad: unidadDetectada,
            desactivar: bloquearUsuario // <--- NUEVO PARÁMETRO
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