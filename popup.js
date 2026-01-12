// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('toggleBtn');
    const status = document.getElementById('statusText');

    // 1. Leer estado actual
    chrome.storage.local.get(['botEnabled'], (result) => {
        // Por defecto true si no existe
        const isEnabled = result.botEnabled !== false; 
        updateUI(isEnabled);
    });

    // 2. Al hacer clic
    btn.addEventListener('click', () => {
        chrome.storage.local.get(['botEnabled'], (result) => {
            const currentState = result.botEnabled !== false;
            const newState = !currentState;
            
            // Guardar nuevo estado
            chrome.storage.local.set({ botEnabled: newState }, () => {
                updateUI(newState);
            });
        });
    });

    function updateUI(enabled) {
        if (enabled) {
            btn.innerText = "ESTADO: ENCENDIDO";
            btn.className = "btn btn-on";
        } else {
            btn.innerText = "ESTADO: APAGADO";
            btn.className = "btn btn-off";
        }
    }
});