// --- src/utils.js ---

console.log("ProBot: Cargando Utils...");

// Inicializamos el Namespace Global
window.ProBot = {
    Estrategias: {},  // Aquí se cargarán las estrategias
    Utils: {},        // Funciones de ayuda
    UI: {},           // Interfaz visual
    Config: {
        usuarioAutorizado: false,
          botEnabled: true
    }
};

// --- GESTIÓN DE ON/OFF ---

// 1. Leer estado al inicio
chrome.storage.local.get(['botEnabled'], (result) => {
    window.ProBot.Config.botEnabled = result.botEnabled !== false;
    console.log(`Extensión: Estado inicial -> ${window.ProBot.Config.botEnabled ? 'ON' : 'OFF'}`);
    actualizarEstadoVisual();
});

// 2. Escuchar cambios en vivo (Si le das al botón sin recargar la página)
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.botEnabled) {
        window.ProBot.Config.botEnabled = changes.botEnabled.newValue;
        console.log(`Extensión: Cambio de estado -> ${window.ProBot.Config.botEnabled ? 'ON' : 'OFF'}`);
        actualizarEstadoVisual();
        
        // Si se apaga, forzamos recarga para limpiar intervalos
        if (!window.ProBot.Config.botEnabled) {
             window.location.reload();
        }
    }
});

function actualizarEstadoVisual() {
    // Si la UI ya cargó, actualizamos el color del toggle
    if (window.ProBot.UI && window.ProBot.UI.els && window.ProBot.UI.els.toggle) {
        window.ProBot.UI.els.toggle.style.color = window.ProBot.Config.botEnabled ? "#FFFFFF" : "#e74c3c"; // Rojo si está apagado
    }
}

// --- Funciones de Ayuda ---

window.ProBot.Utils.sha256 = async function(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

window.ProBot.Utils.esperar = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

window.ProBot.Utils.guardarEnBD = function(hash, pregunta, respuesta) {
    chrome.runtime.sendMessage({ 
        action: "guardarEjercicio", hash: hash, pregunta: pregunta, respuesta: respuesta 
    });
};

window.ProBot.Utils.procesarConsulta = function(hash, callbackExito) {
    if (!window.ProBot.Config.usuarioAutorizado) return;
    
    chrome.runtime.sendMessage({ action: "consultarEjercicio", hash: hash }, (response) => {
        if (response && response.respuesta) {
            window.ProBot.UI.setConocimiento('found');
            callbackExito(response.respuesta);
        } else {
            window.ProBot.UI.setConocimiento('unknown');
        }
    });
};

// En utils.js
window.ProBot.Utils.debug = function() {
    console.group("🤖 REPORTE DE ESTADO DEL BOT");
    console.log("Usuario Autorizado:", window.ProBot.Config.usuarioAutorizado);
    console.log("Estrategia Actual:", estrategiaActual ? estrategiaActual.nombre : "Ninguna");
    console.log("HTML Detectado (Huellas):");
    
    // Lista todas las estrategias y dice cuál detecta
    for (const key in window.ProBot.Estrategias) {
        const est = window.ProBot.Estrategias[key];
        const detectado = document.querySelector(est.huella);
        console.log(`- ${est.nombre}: ${detectado ? "✅ SÍ" : "❌ NO"}`);
    }
    console.groupEnd();
};

