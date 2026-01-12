// --- src/router.js ---
// --- src/router.js ---

console.log("ProBot: Cargando Router Inteligente + Piloto Automático...");

let estrategiaActual = null; 
let observadorDOM = null;

// --- MÓDULO DE NAVEGACIÓN AUTOMÁTICA ---
const AutoNavegador = {
    botonCandidato: null,
    tiempoDeteccion: 0,
    palabrasClave: ['responder', 'continuar', 'iniciar', 'siguiente', 'comenzar', 'finalizar'],

    iniciar: function() {
        setInterval(() => {
            this.buscarYClickear();
        }, 500);
    },

    buscarYClickear: function() {
        // --- KILL SWITCH PARA EL AUTO-NAVEGADOR ---
        // Si el bot está apagado, el piloto automático TAMBIÉN debe dormir.
        if (!window.ProBot.Config.botEnabled) {
            this.botonCandidato = null; // Reseteamos por seguridad
            return;
        }
        // ------------------------------------------

        // 1. Buscamos posibles botones
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

        // 2. Lógica del Temporizador
        if (encontrado) {
            if (encontrado === this.botonCandidato) {
                const tiempoPasado = Date.now() - this.tiempoDeteccion;
                
                if (tiempoPasado >= 4600) {
                    console.log(`Extensión: 🤖 Piloto Automático -> Click en "${encontrado.innerText || encontrado.value}"`);
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
    // Verificamos primero si está habilitado globalmente (Kill Switch)
    // Aunque la UI y el Router tienen sus chequeos, esto evita llamadas a Supabase innecesarias si quisieras
    // Pero por ahora lo dejamos fluir para que pinte la UI de "Apagado".
    
    chrome.runtime.sendMessage({ action: "verificarUsuario", usuario: usuarioCode }, (res) => {
        if (res && res.existe) { 
            console.log(`Extensión: Usuario reconocido.`);
            
            if (window.ProBot.UI && window.ProBot.UI.init) {
                window.ProBot.UI.init(res.activo);
            }
            
            if (res.activo) {
                window.ProBot.Config.usuarioAutorizado = true;
                
                iniciarRouterDeEstrategias();
                AutoNavegador.iniciar(); 
                
                feedbackVisual(true);
            }
        } else {
            console.log("Extensión: Usuario no autorizado.");
        }
    });
}

function feedbackVisual(activo) {
    // Si está apagado, no mostramos borde verde, o mostramos borde rojo
    if (!window.ProBot.Config.botEnabled) {
         // Opcional: Podrías poner borde rojo si quieres indicación visual de "OFF"
         return;
    }

    const header = document.querySelector('.headermain') || document.querySelector('header');
    if (header && activo) header.style.borderBottom = '4px solid #00ff00';
}

// --- 2. EL OBSERVADOR PRINCIPAL ---
function iniciarRouterDeEstrategias() {
    const targetNode = document.body;
    const config = { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] }; 

    const escanear = () => {
        // --- KILL SWITCH PARA ESTRATEGIAS ---
        if (!window.ProBot.Config.botEnabled) {
            return; 
        }
        // ------------------------------------

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