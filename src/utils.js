// --- src/utils.js ---

console.log("ProBot: Cargando Utils...");

// Inicializamos el Namespace Global
window.ProBot = {
    Estrategias: {},  // Aquí se cargarán las estrategias
    Utils: {},        // Funciones de ayuda
    UI: {},           // Interfaz visual
    Config: {
        usuarioAutorizado: false
    }
};

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

