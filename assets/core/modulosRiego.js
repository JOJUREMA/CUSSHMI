// ══ Núcleo compartido — tabla de referencia de módulo de riego por cultivo ══
// Para el Formato E-4.1 (Declaración de Intención de Siembra). El módulo
// (m3/ha), el período vegetativo (meses) y la fecha de siembra NO se le
// piden al agricultor — salen de esta tabla, igual que ya está fijo en el
// Excel real "DIS COMISION MARGEN IZQUIERDA.xlsx": ahí, en las 26 hojas de
// toma, cada cultivo usa siempre el mismo módulo/período/fecha sin importar
// la toma. Estos valores se extrajeron directamente de ese archivo (no son
// una estimación) y se verificaron contra la demanda de agua ya calculada
// en la hoja SD3 (ej. BANANO 40.4ha × 22100 = 0.89284 hm3, exacto).
//
// Claves normalizadas con normalizarCultivoNombre (assets/core/utilidades.js).
// Cultivos que no matcheen ninguna entrada devuelven null — la pantalla
// móvil y el exportador deben avisar "sin referencia", nunca asumir un
// valor por su cuenta.
//
// `moduloM3Ha` es el módulo de UNA campaña (columna "MÓDULO RIEGO" del
// Excel). Para calcular la demanda de agua real, los cultivos de ciclo
// corto (período < 12 meses) se replantan una segunda vez dentro del mismo
// año agrícola (campaña chica + campaña grande) — verificado comparando,
// en las 26 hojas reales, el área y módulo declarados contra la demanda ya
// calculada: los cultivos de 12 meses (BANANO, LIMONERO, PALTO, FRUTALES,
// CAÑA DE AZUCAR) dan demanda = área×módulo exacto (factor 1), mientras que
// ARROZ, SORGO y MAIZ dan exactamente el DOBLE (factor 2) en todos los
// casos verificados — ver `obtenerFactorAnual`.
const REFERENCIA_CULTIVO = {
    'BANANO': { moduloM3Ha: 22100, periodoMeses: 12, siembraDia: 1, siembraMes: 8 },
    // "PLATANO" es, con enorme diferencia, el nombre que el padrón real usa
    // para este mismo cultivo (227 apariciones vs 0 de "BANANO" en una
    // muestra de 12 tomas) — alias verificado en campo, no una suposición.
    'PLATANO': { moduloM3Ha: 22100, periodoMeses: 12, siembraDia: 1, siembraMes: 8 },
    'MANGO': { moduloM3Ha: 22100, periodoMeses: 12, siembraDia: 1, siembraMes: 8 },
    'PAPAYA': { moduloM3Ha: 22100, periodoMeses: 12, siembraDia: 1, siembraMes: 8 },
    'LIMON': { moduloM3Ha: 22100, periodoMeses: 12, siembraDia: 1, siembraMes: 8 },
    'LIMONERO': { moduloM3Ha: 22100, periodoMeses: 12, siembraDia: 1, siembraMes: 8 },
    'FRUTALES': { moduloM3Ha: 22100, periodoMeses: 12, siembraDia: 1, siembraMes: 8 },
    'FRUTALES (MANGO, BANANO)': { moduloM3Ha: 22100, periodoMeses: 12, siembraDia: 1, siembraMes: 8 },
    'PALTO': { moduloM3Ha: 22100, periodoMeses: 12, siembraDia: 1, siembraMes: 8 },
    'FRUTALES TECNIFICADO': { moduloM3Ha: 17000, periodoMeses: 12, siembraDia: 1, siembraMes: 8 },
    'CAÑA DE AZUCAR (GRAVEDAD)': { moduloM3Ha: 22000, periodoMeses: 12, siembraDia: 1, siembraMes: 8 },
    'CAÑA DE AZUCAR (TEC.)': { moduloM3Ha: 10000, periodoMeses: 12, siembraDia: 1, siembraMes: 8 },
    'PASTOS': { moduloM3Ha: 16820, periodoMeses: 12, siembraDia: 1, siembraMes: 8 },
    'ARROZ': { moduloM3Ha: 17000, periodoMeses: 5, siembraDia: 1, siembraMes: 8 },
    'YUCA': { moduloM3Ha: 13700, periodoMeses: 10, siembraDia: 1, siembraMes: 8 },
    'AJI PAPRIKA': { moduloM3Ha: 12000, periodoMeses: 7, siembraDia: 1, siembraMes: 3 },
    'MAIZ': { moduloM3Ha: 7000, periodoMeses: 4, siembraDia: 1, siembraMes: 3 },
    'MELON/SANDIA': { moduloM3Ha: 9200, periodoMeses: 4, siembraDia: 1, siembraMes: 3 },
    'MELON': { moduloM3Ha: 9200, periodoMeses: 4, siembraDia: 1, siembraMes: 3 },
    'SANDIA': { moduloM3Ha: 9200, periodoMeses: 4, siembraDia: 1, siembraMes: 3 },
    'CEBOLLA': { moduloM3Ha: 10000, periodoMeses: 4, siembraDia: 1, siembraMes: 4 },
    'MENESTRAS/HORTALIZAS': { moduloM3Ha: 6000, periodoMeses: 4, siembraDia: 1, siembraMes: 4 },
    'FRIJOL': { moduloM3Ha: 6000, periodoMeses: 4, siembraDia: 1, siembraMes: 4 },
    'SORGO': { moduloM3Ha: 8400, periodoMeses: 4, siembraDia: 1, siembraMes: 8 },
    'SORGO ESCOBERO': { moduloM3Ha: 8400, periodoMeses: 4, siembraDia: 1, siembraMes: 8 },
    'SORGO - MAIZ': { moduloM3Ha: 8400, periodoMeses: 4, siembraDia: 1, siembraMes: 8 },
    'TUBEROSAS/MANÍ': { moduloM3Ha: 6000, periodoMeses: 4, siembraDia: 1, siembraMes: 8 },
};

// Devuelve la referencia de un cultivo, o null si no hay ninguna entrada
// que coincida (nombre exacto tras normalizar) — nunca adivina.
function obtenerReferenciaCultivo(nombreCultivo) {
    const clave = normalizarCultivoNombre(nombreCultivo);
    if (!clave) return null;
    return REFERENCIA_CULTIVO[clave] || null;
}

// Curva de módulo mensual (m3/ha) por cultivo de ciclo corto, extraída tal
// cual de la hoja "MODULOS" del Excel real (DIS COMISION MARGEN IZQUIERDA
// .xlsx) — filas 6-23 (Campaña Chica: Ago-Dic) y columnas N-T (Campaña
// Grande: Ene-Jul) de esa misma tabla, no una estimación. Solo cultivos de
// ciclo corto (periodoMeses < 12) tienen curva — los permanentes (12
// meses) usan la demanda ya calculada dividida entre 12 en partes iguales
// (igual que hace el Excel real: SUM de sus demandas / 12, sin curva por
// cultivo individual).
const MODULOS_MENSUAL = {
    ARROZ: { chica: [5000, 3500, 3500, 3000, 2000], grande: [0, 5000, 3500, 3500, 3000, 2000, 0] }, // Arroz Trasplante
    MAIZ: { chica: [2100, 1900, 1600, 1400, 0], grande: [0, 2100, 1900, 1600, 1400, 0, 0] },
    SORGO: { chica: [0, 2800, 2000, 2000, 1600], grande: [0, 0, 2400, 1600, 1600, 1400, 0] }, // Sorgo Escobero
    'TUBEROSAS/MANÍ': { chica: [0, 2000, 1500, 1500, 1000], grande: [0, 0, 0, 2000, 1500, 1500, 1000] },
    'MELON/SANDIA': { chica: [1500, 1850, 2000, 2000, 1850], grande: [0, 0, 1500, 1850, 2000, 2000, 1850] },
    'AJI PAPRIKA': { chica: [1000, 1000, 1500, 1500, 1000], grande: [0, 2000, 2000, 2000, 2000, 2000, 2000] },
    CEBOLLA: { chica: [0, 2500, 2000, 3000, 2500], grande: [0, 0, 0, 2500, 2000, 3000, 2500] },
    'MENESTRAS/HORTALIZAS': { chica: [0, 1000, 2000, 2000, 1000], grande: [0, 0, 1000, 2000, 2000, 2000, 0] },
    YUCA: { chica: [1300, 1300, 1300, 1300, 1300], grande: [0, 2000, 1300, 1300, 1300, 1300, 1300] },
};
// Alias — mismos cultivos que ya comparten entrada en REFERENCIA_CULTIVO.
MODULOS_MENSUAL['SORGO ESCOBERO'] = MODULOS_MENSUAL.SORGO;
MODULOS_MENSUAL['SORGO - MAIZ'] = MODULOS_MENSUAL.SORGO;
MODULOS_MENSUAL.MELON = MODULOS_MENSUAL['MELON/SANDIA'];
MODULOS_MENSUAL.SANDIA = MODULOS_MENSUAL['MELON/SANDIA'];
MODULOS_MENSUAL.FRIJOL = MODULOS_MENSUAL['MENESTRAS/HORTALIZAS'];

// Curva mensual [Ago..Jul] (12 valores) de m3/ha para un cultivo de ciclo
// corto, o null si es permanente o no tiene curva de referencia. El
// llamador (construirHojaE41, Sistema_Riego_CUSSHMI_14.html) usa solo la
// mitad de esta curva que corresponde a la campaña de su fecha de siembra
// (chica u grande, nunca ambas) como coeficiente normalizado a que sume 1,
// multiplicado por la demanda anual ya duplicada — verificado exacto
// contra la fórmula real de la hoja SD3 (SORGO: coincide con
// MODULOS!D34*F44 mes a mes, sin aportar nada en la otra campaña).
function obtenerCurvaMensual(nombreCultivo) {
    const clave = normalizarCultivoNombre(nombreCultivo);
    const curva = clave && MODULOS_MENSUAL[clave];
    if (!curva) return null;
    return curva.chica.concat(curva.grande);
}

// 2 para cultivos de ciclo corto (se replantan dentro del mismo año
// agrícola), 1 para cultivos permanentes de 12 meses — ver nota arriba.
function obtenerFactorAnual(referencia) {
    return referencia.periodoMeses < 12 ? 2 : 1;
}

// Demanda de agua anual en hm3 para un cultivo+área — área[ha] × módulo ×
// factor anual, convertido de m3 a hm3.
function calcularDemandaHm3(referencia, areaHa) {
    return (areaHa * referencia.moduloM3Ha * obtenerFactorAnual(referencia)) / 1e6;
}

// Fecha de cosecha = fecha de siembra + período vegetativo (meses), pura.
// Devuelve {dia, mes, anio}.
function calcularFechaCosecha(siembraDia, siembraMes, siembraAnio, periodoMeses) {
    const fecha = new Date(siembraAnio, (siembraMes - 1) + periodoMeses, siembraDia);
    return { dia: fecha.getDate(), mes: fecha.getMonth() + 1, anio: fecha.getFullYear() };
}
