// --- src/ui.js ---

console.log("ProBot: Cargando UI...");

window.ProBot.UI = {
    els: { 
        container: null, toggle: null, panel: null, 
        user: null, brain: null, action: null, 
        notification: null // Referencia a la notificación actual
    },
    
    colores: {
        gris: '#95a5a6', verde: '#2ecc71', rojo: '#e74c3c', amarillo: '#f1c40f'  
    },

    init: function(usuarioActivo) {
        const footer = document.querySelector('.copyright_style');
        if (!footer) return;

        if (this.els.container) return;

        this.els.container = document.createElement('span');
        this.els.container.style.cssText = "float: right; display: flex; align-items: center; margin-left: 10px; position: relative;";

        this.els.toggle = document.createElement('span');
        this.els.toggle.innerText = " •"; 
        this.els.toggle.style.cssText = "color: #FFFFFF; cursor: pointer; font-size: 22px; font-weight: bold; line-height: 25px; user-select: none; padding: 0 5px; vertical-align: middle;";
        this.els.toggle.onclick = () => this.togglePanel();

        this.els.panel = document.createElement('span');
        this.els.panel.style.cssText = "display: none; gap: 8px; align-items: center; margin-left: 5px;";

        const crearCirculo = (titulo) => {
            const c = document.createElement('div');
            c.style.cssText = `width: 12px; height: 12px; border-radius: 50%; background-color: ${this.colores.gris}; border: 1px solid #bdc3c7; box-shadow: 0 0 2px rgba(0,0,0,0.5);`;
            c.title = titulo;
            return c;
        };

        this.els.user = crearCirculo("Usuario (Verde: Activo / Gris: Inactivo)");
        this.els.brain = crearCirculo("Conocimiento (Verde: Sabe / Rojo: No sabe)");
        this.els.action = crearCirculo("Estado (Verde: Escribiendo / Amarillo: Aprendiendo)");

        this.setUsuario(usuarioActivo);

        this.els.panel.appendChild(this.els.user);
        this.els.panel.appendChild(this.els.brain);
        this.els.panel.appendChild(this.els.action);
        
        this.els.container.appendChild(this.els.toggle);
        this.els.container.appendChild(this.els.panel);
        footer.appendChild(this.els.container);
    },

    // --- NUEVA FUNCIÓN DE NOTIFICACIÓN ---
    showNotification: function(mensaje, duracion = 8000) {
        // Si ya hay una, la borramos para mostrar la nueva
        if (this.els.notification) {
            this.els.notification.remove();
        }

        const notif = document.createElement('div');
        notif.innerText = mensaje;
        
        // Estilo "Toast" elegante
        notif.style.cssText = `
            position: fixed;
            bottom: 50px;
            right: 20px;
            background-color: rgba(10, 10, 10, 0.95);
            color: #ecf0f1;
            padding: 15px 20px;
            border-radius: 4px;
            border-left: 5px solid #f1c40f; /* Borde amarillo de advertencia */
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 13px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            z-index: 2147483647; /* Encima de todo */
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.5s ease;
            max-width: 300px;
            line-height: 1.4;
            pointer-events: none; /* Para que no moleste al click */
        `;

        document.body.appendChild(notif);
        this.els.notification = notif;

        // Animación de entrada
        setTimeout(() => {
            notif.style.opacity = '1';
            notif.style.transform = 'translateY(0)';
        }, 50);

        // Auto-destrucción
        setTimeout(() => {
            if (this.els.notification === notif) {
                notif.style.opacity = '0';
                notif.style.transform = 'translateY(10px)';
                setTimeout(() => notif.remove(), 500);
            }
        }, duracion);
    },

    togglePanel: function() {
        if (this.els.panel.style.display === 'none') {
            this.els.panel.style.display = 'inline-flex';
            this.els.toggle.innerText = " ×"; 
        } else {
            this.els.panel.style.display = 'none';
            this.els.toggle.innerText = " •"; 
        }
    },

    setUsuario: function(activo) {
        if(this.els.user) this.els.user.style.backgroundColor = activo ? this.colores.verde : this.colores.gris;
    },

    setConocimiento: function(estado) { 
        if(!this.els.brain) return;
        if (estado === 'found') this.els.brain.style.backgroundColor = this.colores.verde;
        else if (estado === 'unknown') this.els.brain.style.backgroundColor = this.colores.rojo;
        else this.els.brain.style.backgroundColor = this.colores.gris;
    },

    setAccion: function(estado) { 
        if(!this.els.action) return;
        if (estado === 'executing') this.els.action.style.backgroundColor = this.colores.verde;
        else if (estado === 'learning') this.els.action.style.backgroundColor = this.colores.amarillo;
        else this.els.action.style.backgroundColor = this.colores.gris;

        if (estado !== 'idle' && estado !== 'learning') { 
            setTimeout(() => { 
                if(this.els.action) this.els.action.style.backgroundColor = this.colores.gris; 
            }, 3000);
        }
    }
};