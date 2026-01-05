// --- src/router.js ---

console.log("ProBot: Cargando Router...");

// VARIABLES GLOBALES DEL ROUTER
let estrategiaActual = null; 
let observadorDOM = null;

// --- 1. INICIO Y AUTENTICACIÓN ---
const intervaloCarga = setInterval(() => {
    const el = document.getElementById('dnn_dnnUserProgrentis_enhancedRegisterLink');
    const footer = document.querySelector('.copyright_style');
    
    if (el && footer) {
        clearInterval(intervaloCarga);
        iniciarVerificacion();
    }
}, 500);

function iniciarVerificacion() {
    const usuarioCode = document.getElementById('dnn_dnnUserProgrentis_enhancedRegisterLink').innerText.replace(/^Hola\s+/i, '').trim();
    
    chrome.runtime.sendMessage({ action: "verificarUsuario", usuario: usuarioCode }, (res) => {
        if (res && res.existe) { 
            console.log(`Extensión: Usuario reconocido.`);
            window.ProBot.UI.init(res.activo); 
            
            if (res.activo) {
                window.ProBot.Config.usuarioAutorizado = true;
                iniciarRouterDeEstrategias();
                feedbackVisual(true);
            }
        } else {
            console.log("Extensión: Usuario desconocido. Apagando sistemas.");
        }
    });
}

function feedbackVisual(activo) {
    const header = document.querySelector('.headermain');
    if (header && activo) header.style.borderBottom = '4px solid #00ff00';
}

// --- 2. EL OBSERVADOR PRINCIPAL ---
function iniciarRouterDeEstrategias() {
    const targetNode = document.body;
    const config = { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] }; 

    const callback = (mutationsList) => {
        // Accedemos a las estrategias cargadas en el Namespace
        const ListaEstrategias = window.ProBot.Estrategias;
        let estrategiaEncontrada = null;

        for (const key in ListaEstrategias) {
            if (document.querySelector(ListaEstrategias[key].huella)) {
                estrategiaEncontrada = ListaEstrategias[key];
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
                
                // Reseteos genéricos
                if(estrategiaActual.procesado !== undefined) estrategiaActual.procesado = false;
                if(estrategiaActual.yaAprendido !== undefined) estrategiaActual.yaAprendido = false;
                if(estrategiaActual.memoriaTemporal !== undefined) estrategiaActual.memoriaTemporal = [];
                if(estrategiaActual.ejecutando !== undefined) estrategiaActual.ejecutando = false;
                if(estrategiaActual.mapaDefiniciones !== undefined) estrategiaActual.mapaDefiniciones = [];

                window.ProBot.UI.setConocimiento('reset');
                window.ProBot.UI.setAccion('idle');
            }
            estrategiaActual.iniciar(); 
            estrategiaActual.aprender(); 
        }
    };
    observadorDOM = new MutationObserver(callback);
    observadorDOM.observe(targetNode, config);
}