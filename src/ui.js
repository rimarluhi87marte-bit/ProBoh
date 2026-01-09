// --- src/ui.js ---

console.log("ProBot: Cargando UI...");

window.ProBot.UI = {
    els: { 
        container: null, toggle: null, panel: null, 
        user: null, brain: null, action: null 
    },
    
    colores: {
        gris: '#95a5a6', verde: '#2ecc71', rojo: '#e74c3c', amarillo: '#f1c40f'  
    },

    init: function(usuarioActivo) {
        const footer = document.querySelector('.copyright_style');
        if (!footer) return;

        // Evitar duplicados si se llama varias veces
        if (this.els.container) return;

        this.els.container = document.createElement('span');
        this.els.container.style.cssText = "float: right; display: flex; align-items: center; margin-left: 10px;";

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
        if(this.els.user) this.els.user.style.backgroundColor = activo ? this.colores.verde : this.colores.rojo;
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