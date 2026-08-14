// ══ Núcleo compartido — Inventario de Infraestructura (Fase 1: Tomas y
// Compuertas) ══
// Basado en el Formato oficial de ANA "Inventario de Obras de Arte"
// (archivo real "1.Formatos de Inventario CUSSHMI.xlsx", hojas "Formato de
// TOMAS" y "Formato de COMPUERTAS "). Lo usan tanto el sincronizador de
// escritorio (lee el Excel) como, en fases futuras, cualquier otro tipo de
// estructura que se agregue con el mismo patrón.

// Diccionarios de abreviaturas — extraídos literalmente de las filas de
// leyenda al pie de cada hoja del Excel real, no inventados. Se usan para
// mostrar la etiqueta completa junto al código ("B — Bueno") tanto en el
// formulario móvil (como opciones de <select>, restringidas a estos
// valores) como al exportar.
const ESTADO_INVENTARIO = { B: 'Bueno', R: 'Regular', M: 'Malo' };
const MARGEN_INVENTARIO = { D: 'Derecha', C: 'Centro', I: 'Izquierda' };
const MATERIAL_TOMA = { FE: 'Fierro', PVC: 'PVC', RU: 'Rústico', C: 'Concreto', O: 'Otros' };
const TIPO_CAPTACION_TOMA = { RT: 'Retención', TD: 'Toma Directa', TP: 'Toma Predial', O: 'Otros' };
const OPERACION_COMPUERTA = { MA: 'Manual', ME: 'Mecánico', MI: 'Mixto', O: 'Otros' };
const MATERIAL_COMPUERTA = { FE: 'Fierro', MD: 'Madera', O: 'Otros' };

// "Nombre del Canal Fuente"/"Nombre del Canal" del Excel forman una cadena
// canal→canal (ej. fila con canalFuente="Canal Sur", nombreCanal="Principal
// SD3"; más abajo, otra fila con canalFuente="Canal Manuel Emilio",
// nombreCanal="Canal Marcos" — un lateral de un lateral). Solo el 36-44% de
// las filas están directamente sobre un canal "Principal SDx/SIx" — el
// resto hay que resolverlo subiendo la cadena. Verificado contra el archivo
// real: resolviendo de forma iterativa (sembrar con las que matchean
// directo, repetir buscando el canalFuente de las que quedan en el mapa ya
// construido, hasta que no haya más cambios) la cobertura sube a 99.6% en
// Tomas y 97.0% en Compuertas — el resto (canales sin raíz Principal SDx
// conocida, ej. "Canal Norte", "Dren Nomara") queda con toma null a
// propósito, nunca se descarta la fila por no poder resolverla.
const RE_CANAL_PRINCIPAL = /^PRINCIPAL\s*(S[DI]\d+(\.\d+)?)$/i;

function _normCanal(valor) {
    return (valor || '').toString().trim().replace(/\s+/g, ' ').toUpperCase();
}

// Recibe las filas crudas de una hoja (canalFuente/nombreCanal tal cual el
// Excel) y devuelve una función que, dado un nombreCanal, contesta con la
// toma (SD3, SI4...) a la que pertenece, o null si no se pudo resolver.
function resolverTomaPorCanal(filas) {
    const canalATomaMap = {};

    (filas || []).forEach((f) => {
        const canal = _normCanal(f.nombreCanal);
        const m = canal.match(RE_CANAL_PRINCIPAL);
        if (m) canalATomaMap[canal] = m[1].toUpperCase();
    });

    let cambiosHechos = true;
    let iteraciones = 0;
    while (cambiosHechos && iteraciones < 20) {
        cambiosHechos = false;
        iteraciones += 1;
        (filas || []).forEach((f) => {
            const canal = _normCanal(f.nombreCanal);
            const fuente = _normCanal(f.canalFuente);
            if (canalATomaMap[canal]) return;
            if (canalATomaMap[fuente]) {
                canalATomaMap[canal] = canalATomaMap[fuente];
                cambiosHechos = true;
            }
        });
    }

    return function obtenerTomaDeCanal(nombreCanal) {
        return canalATomaMap[_normCanal(nombreCanal)] || null;
    };
}

// ══ Fase 2 — los 12 tipos de obra restantes (Acueductos, Sifón Invertido,
// Caídas, Rápidas, Repartidor, Pase Vehicular, Pase Peatonal, Alcantarilla,
// Medidores, Canales Laterales, Dren Principal, Drenes Secundarios) ══
//
// A diferencia de Tomas/Compuertas (una tabla por tipo), estos 12 comparten
// una sola tabla genérica `inventario_estructuras` (columna `campos` jsonb
// con lo propio de cada tipo) — sus columnas cambian demasiado entre sí
// (17 a 40, con distintos sub-grupos de dimensiones) para justificar 12
// tablas/formularios casi idénticos. `TIPOS_ESTRUCTURA_GENERICOS` describe,
// por tipo: dónde está cada columna en el Excel (para el parser de
// escritorio) y cómo mostrarla en el móvil (etiqueta + diccionario, si
// tiene) — de solo lectura salvo Estado/Observación, que sí edita el
// sectorista en campo.

const MATERIAL_PASE = { C: 'Concreto', M: 'Mampostería', Ma: 'Madera', O: 'Otros' };
const TIPO_PASE = { Pe: 'Permanente', Sr: 'Semi-Rústico', R: 'Rústico' };

const TIPOS_ESTRUCTURA_GENERICOS = {
    pase_vehicular: {
        etiqueta: 'Pase Vehicular', etiquetaPlural: 'Pases Vehiculares',
        hojaExcel: 'Formato B.2.10-PASE VEHICULAR',
        filaInicioDatos: 13,
        colIndice: {
            numeroOrden: 1, nombreObra: 2, canalFuente: 3, nombreCanal: 4, progresivaKm: 5,
            zonaUtm: 6, este: 7, norte: 8, bloqueRiego: 16, observacion: 17,
        },
        colEstado: 12,
        camposReferencia: [
            { indice: 9, clave: 'elevacion', etiqueta: 'Elevación (m)' },
            { indice: 10, clave: 'tipo', etiqueta: 'Tipo', diccionario: TIPO_PASE },
            { indice: 11, clave: 'material', etiqueta: 'Material', diccionario: MATERIAL_PASE },
            { indice: 13, clave: 'longitud', etiqueta: 'Longitud (m)' },
            { indice: 14, clave: 'ancho', etiqueta: 'Ancho (m)' },
            { indice: 15, clave: 'altura', etiqueta: 'Altura (m)' },
        ],
    },
};
