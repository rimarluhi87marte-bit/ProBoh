// --- src/router.js ---

console.log("ProBot: Cargando Router Inteligente...");

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
            console.log("Extensión: Usuario desconocido.");
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

    const escanear = () => {
        const ListaEstrategias = window.ProBot.Estrategias;
        let estrategiaEncontrada = null;

        for (const key in ListaEstrategias) {
            const est = ListaEstrategias[key];
            const elementoHuella = document.querySelector(est.huella);

            // SI ENCONTRAMOS LA HUELLA...
            if (elementoHuella) {
                // ...VERIFICAMOS SI TIENE VALIDACIÓN EXTRA
                if (est.validar && typeof est.validar === 'function') {
                    // Si la validación falla (devuelve false), saltamos a la siguiente estrategia
                    if (!est.validar(elementoHuella)) continue;
                }
                
                // Si no tiene validación o pasó la validación, es la elegida
                estrategiaEncontrada = est;
                break;
            }
        }

        if (estrategiaEncontrada) {
            if (estrategiaActual !== estrategiaEncontrada) {
                console.log(`Extensión: 🔄 Entrando a -> ${estrategiaEncontrada.nombre}`);
                
                // Limpiar anterior si es necesario
                if (estrategiaActual && typeof estrategiaActual.detener === 'function') {
                    estrategiaActual.detener();
                }

                estrategiaActual = estrategiaEncontrada;
                
                // Reseteos genéricos de estado
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

    console.log("Extensión: 🔎 Ejecutando escaneo inicial...");
    setTimeout(escanear, 1000);
}