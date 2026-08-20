// ══ Núcleo compartido — intérprete de intención del Asistente de Voz ══
// Traductor de preguntas en español (por voz o tecleadas) a una intención
// estructurada, SIN IA — solo palabras clave y patrones sobre las 3
// preguntas de campo ya conocidas (deuda de un usuario, agua programada
// hoy en una toma o en "el canal Sur", ubicación de una toma). No
// entiende lenguaje 100% libre; si no reconoce nada, intent:'desconocido'
// y el llamador debe mostrar la pregunta tal cual para que el usuario
// reformule o use el campo de texto.
// No depende de Supabase ni del DOM. Reutiliza ORDEN_FIJO_CANAL_SUR /
// TOMAS_ORDEN_AL_FINAL de assets/core/anexoG2.js (debe cargarse antes que
// este script).

function _avQuitarTildes(s) {
    return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function _avNormalizar(s) {
    return _avQuitarTildes((s || '').toLowerCase())
        .replace(/[¿?¡!.,;:]/g, ' ').replace(/\s+/g, ' ').trim();
}
function _avLimpiarRemanente(s) {
    return (s || '').replace(/^(el|la|los|las|del|de la|de el|de)\s+/i, '').trim();
}

// Busca una toma conocida o "canal sur" en CUALQUIER posición de la
// frase ya normalizada — robusto al orden libre del español hablado
// (a diferencia de un regex anclado a una posición exacta de la frase).
function _avBuscarTomaOCanalEnFrase(norm) {
    const compacto = ' ' + _avQuitarTildes(norm).toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim() + ' ';
    if (compacto.includes(' CANAL SUR ') || compacto.includes(' TODO EL CANAL ') || compacto.includes(' TODAS LAS TOMAS ')) {
        return { tipo: 'canal', valor: 'CANAL_SUR', textoOriginal: norm };
    }
    // Ordenar por longitud del nombre compactado DESCENDENTE antes de comparar: "SD8.1" se
    // compacta a "SD8 1", que contiene "SD8" como subcadena — si se probara "SD8" primero,
    // "ubicación de SD8.1" resolvería mal a la toma "SD8". Probando primero los nombres más
    // largos/específicos, "SD8.1" gana el match antes de que "SD8" tenga oportunidad.
    const candidatas = (typeof ORDEN_FIJO_CANAL_SUR !== 'undefined' ? ORDEN_FIJO_CANAL_SUR : [])
        .concat(typeof TOMAS_ORDEN_AL_FINAL !== 'undefined' ? TOMAS_ORDEN_AL_FINAL : [])
        .slice()
        .sort((a, b) => b.length - a.length);
    for (const nombre of candidatas) {
        const nombreCompacto = ' ' + nombre.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim() + ' ';
        if (compacto.includes(nombreCompacto)) return { tipo: 'toma', valor: nombre, textoOriginal: norm };
    }
    return { tipo: 'desconocido', valor: norm, textoOriginal: norm };
}

// Disparadores de DEUDA (argumento libre: nombre de persona). "pagar" es
// un grupo opcional DENTRO del mismo patrón (no un patrón aparte) para
// que "cuánto debe pagar X" no caiga en un patrón previo que capturaría
// "pagar X" como si fuera el nombre.
const _AV_PATRONES_DEUDA = [
    /^cual es la deuda (?:del usuario |de )(.+)$/,
    /^cuanta deuda tiene (.+)$/,
    /^deuda (?:del usuario |de )(.+)$/,
    /^cuanto debe (?:pagar )?(.+)$/,
];

/**
 * Interpreta una pregunta en español (texto crudo, con o sin tildes/signos)
 * y devuelve la intención estructurada:
 *   - { intent: 'deuda', parametro: '<nombre buscado>' }
 *   - { intent: 'agua_hoy', parametro: { tipo:'canal'|'toma'|'desconocido', valor, textoOriginal } }
 *   - { intent: 'ubicacion', parametro: { tipo:'toma'|'desconocido', valor, textoOriginal } }
 *   - { intent: 'desconocido', parametro: '<texto original>' }
 */
function interpretarPreguntaVoz(textoCrudo) {
    const original = (textoCrudo || '').trim();
    const norm = _avNormalizar(original);
    if (!norm) return { intent: 'desconocido', parametro: original };

    const tieneUbicacion = /\b(donde|ubicacion|ubicad[oa]|llegar|llego|ruta|queda)\b/.test(norm);
    const tieneAgua = /\bagua\b/.test(norm) && /\b(programad[ao]|regar|riego|hay)\b/.test(norm);

    if (tieneUbicacion || tieneAgua) {
        const resuelto = _avBuscarTomaOCanalEnFrase(norm);
        if (tieneUbicacion) {
            // Una ubicación puntual no aplica a "todo el canal" — si resolvió a
            // 'canal', se trata como 'desconocido' para pedir precisar una toma.
            const parametro = resuelto.tipo === 'canal'
                ? { tipo: 'desconocido', valor: resuelto.textoOriginal, textoOriginal: resuelto.textoOriginal }
                : resuelto;
            return { intent: 'ubicacion', parametro };
        }
        return { intent: 'agua_hoy', parametro: resuelto };
    }

    for (const re of _AV_PATRONES_DEUDA) {
        const m = norm.match(re);
        if (m && m[1] && m[1].trim().length >= 2) {
            return { intent: 'deuda', parametro: _avLimpiarRemanente(m[1]) };
        }
    }
    return { intent: 'desconocido', parametro: original };
}
