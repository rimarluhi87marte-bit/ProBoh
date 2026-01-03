// --- Recordar palabras en orden ---

window.ProBot.Estrategias.SECUENCIA_MEMORIA = {
    nombre: "Memoria Secuencial",
    huella: '.caja-palabra', 
    memoriaTemporal: [], 
    ultimaPalabraVista: "", 
    ejecutando: false,

    iniciar: function() {

        window.ProBot.UI.setConocimiento('found');

        const cajaOpciones = document.querySelector('.caja-opciones');
        if (cajaOpciones && !this.ejecutando && this.memoriaTemporal.length > 0) {
            this.ejecutando = true; 
            this.resolver(); 
            return;
        }
        const cajaPalabra = document.querySelector('.caja-palabra .palabra');
        if (cajaPalabra && !cajaOpciones) {
            const texto = cajaPalabra.innerText.trim();
            if (texto && texto !== this.ultimaPalabraVista) {
                this.ultimaPalabraVista = texto;
                this.memoriaTemporal.push(texto);
                window.ProBot.UI.setAccion('learning'); 
            }
        }
    },

    resolver: async function() {
        window.ProBot.UI.setAccion('executing'); 
        await window.ProBot.Utils.esperar(1000);
        
        const contenedorOpciones = document.querySelector('.caja-opciones .opciones');
        if (!contenedorOpciones) return;
        
        const opcionesDOM = contenedorOpciones.querySelectorAll('span');
        
        for (let palabraMemorizada of this.memoriaTemporal) {
            for (let op of opcionesDOM) {
                if (op.innerText.trim() === palabraMemorizada && op.style.visibility !== 'hidden') {
                    op.click();
                    await window.ProBot.Utils.esperar(Math.random() * 300 + 300);
                    break; 
                }
            }
        }
        this.memoriaTemporal = [];
        this.ultimaPalabraVista = "";
        this.ejecutando = false;
        window.ProBot.UI.setAccion('idle');
    },

    aprender: function() {} 
};