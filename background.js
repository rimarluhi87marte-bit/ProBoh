// --- background.js ---

const SUPABASE_URL = 'https://dzlrvsfrqfxuezuqfokk.supabase.co'; 
// TU CLAVE ANON (La larga que empieza por eyJ...)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bHJ2c2ZycWZ4dWV6dXFmb2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTU5OTIsImV4cCI6MjA4Mjc5MTk5Mn0.Drv1yp47d_liI7itWicwwnhzGYMeW2HU4_TgDc-d6xE'; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // --- A. VERIFICAR USUARIO ---
  if (request.action === "verificarUsuario") {
    // CAMBIO: Añadimos unidad y unidad_maxima al select
    const url = `${SUPABASE_URL}/rest/v1/usuarios?usuario_code=eq.${encodeURIComponent(request.usuario)}&select=activo,plus,unidad,unidad_maxima`;
    
    hacerPeticion(url, 'GET').then(data => {
        const existe = Array.isArray(data) && data.length > 0;
        let activo = existe ? data[0].activo : false;
        const plus = existe ? data[0].plus : false;
        const unidadActual = existe ? (data[0].unidad || 0) : 0;
        const unidadMaxima = existe ? data[0].unidad_maxima : null;

        // --- LÓGICA DE BLOQUEO POR UNIDAD ---
        // Si hay límite y la unidad actual es MAYOR que el límite, desactivamos.
        if (unidadMaxima !== null && unidadActual > unidadMaxima) {
            console.log(`Usuario ha superado el límite: Actual ${unidadActual} > Max ${unidadMaxima}`);
            activo = false; // Bloqueo forzoso
        }
        
        sendResponse({ 
            existe: existe, 
            activo: activo, 
            plus: plus,
            unidadMaxima: unidadMaxima // Enviamos el límite al content script
        });
    });
    return true; 
  }

  // B. CONSULTAR EJERCICIO
  if (request.action === "consultarEjercicio") {
    const hash = request.hash;
    const url = `${SUPABASE_URL}/rest/v1/ejercicios?ejercicio_hash=eq.${hash}&select=opcion_correcta`;
    
    hacerPeticion(url, 'GET').then(data => {
        if (Array.isArray(data) && data.length > 0) {
            sendResponse({ respuesta: data[0].opcion_correcta });
        } else {
            sendResponse({ respuesta: null });
        }
    });
    return true;
  }

  // C. GUARDAR EJERCICIO
  if (request.action === "guardarEjercicio") {
    const { hash, pregunta, respuesta } = request;
    const url = `${SUPABASE_URL}/rest/v1/ejercicios`;
    
    hacerPeticion(url, 'POST', {
        ejercicio_hash: hash,
        pregunta_texto: pregunta,
        opcion_correcta: respuesta,
        created_at: new Date().toISOString()
    }, { "Prefer": "resolution=merge-duplicates" })
    .then(() => sendResponse({ success: true }))
    .catch(err => {
        // Si el error es 409 (Duplicate Key), lo ignoramos, es buena señal.
        if (err.message && err.message.includes('409')) {
             // console.log("Info: Pregunta ya existente en BD.");
             sendResponse({ success: true, info: "existente" });
        } else {
             console.error("Fallo real al guardar:", err);
             sendResponse({ error: err.message });
        }
    });
    
    return true;
  }

 // --- D. ACTUALIZAR UNIDAD Y ESTADO ---
  if (request.action === "actualizarUnidad") {
    const { usuario, unidad, desactivar } = request;
    
    // Preparamos los datos a actualizar
    const updateData = { unidad: unidad };
    
    // Si nos piden desactivar (porque superó el límite), actualizamos esa columna también
    if (desactivar) {
        console.log(`Background: BLOQUEANDO usuario ${usuario} por límite superado.`);
        updateData.activo = false;
    }

    const url = `${SUPABASE_URL}/rest/v1/usuarios?usuario_code=eq.${encodeURIComponent(usuario)}`;
    
    hacerPeticion(url, 'PATCH', updateData)
    .then(() => {
        console.log("Background: ✅ Datos actualizados en BD.");
    })
    .catch(err => {
        console.error("Background: ❌ Error actualizando:", err);
    });
    
    return true; 
  }
});

async function hacerPeticion(url, method, body = null, extraHeaders = {}) {
    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...extraHeaders
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorData = await response.text(); 
            throw new Error(`Supabase Error (${response.status}): ${errorData}`);
        }

        const text = await response.text();
        return text ? JSON.parse(text) : {};
        
    } catch (error) {
        // No logueamos errores en GET para no ensuciar, solo en POST si es grave
        if (method === 'GET') return [];
        throw error; 
    }
}