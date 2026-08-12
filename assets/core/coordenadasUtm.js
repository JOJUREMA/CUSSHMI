// ══ Núcleo compartido — conversión de coordenadas GPS a UTM WGS84 ══
// Para "Sinceramiento de Áreas": el GPS del celular entrega lat/lon
// (WGS84, EPSG:4326); el usuario pidió que las coordenadas se guarden en
// UTM WGS84. Fórmula propia (Transversa de Mercator, Snyder 1987) en vez
// de una librería por CDN (ej. proj4js) — si el celular nunca cargó esa
// librería con señal, la conversión (y por lo tanto toda la captura)
// se rompería justo al entrar a una zona sin cobertura, que es
// exactamente cuando más se necesita que funcione. Esta función es
// matemática pura, sin red, cacheada por el service worker igual que el
// resto del núcleo compartido (clasificacion.js, utilidades.js...).
//
// Fija a la Zona UTM 17S (meridiano central -81°), la que cubre todo el
// ámbito de la Junta de Usuarios Chira (Piura, Perú).

const UTM17S_A = 6378137.0; // semieje mayor WGS84 (m)
const UTM17S_F = 1 / 298.257223563; // achatamiento WGS84
const UTM17S_K0 = 0.9996; // factor de escala UTM
const UTM17S_LON0_GRADOS = -81; // meridiano central de la Zona 17
const UTM17S_FALSO_ESTE = 500000;
const UTM17S_FALSO_NORTE = 10000000; // hemisferio sur

// Convierte una coordenada GPS (lat/lon WGS84, grados decimales) a UTM
// Zona 17S. Devuelve { easting, northing } en metros.
function latLonAUtm17S(latGrados, lonGrados) {
    const e2 = UTM17S_F * (2 - UTM17S_F); // excentricidad al cuadrado
    const ePrima2 = e2 / (1 - e2);

    const lat = latGrados * Math.PI / 180;
    const lon = lonGrados * Math.PI / 180;
    const lon0 = UTM17S_LON0_GRADOS * Math.PI / 180;

    const senLat = Math.sin(lat);
    const cosLat = Math.cos(lat);
    const tanLat = Math.tan(lat);

    const N = UTM17S_A / Math.sqrt(1 - e2 * senLat * senLat);
    const T = tanLat * tanLat;
    const C = ePrima2 * cosLat * cosLat;
    const A = cosLat * (lon - lon0);

    const M = UTM17S_A * (
        (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * lat
        - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * lat)
        + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * lat)
        - (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * lat)
    );

    const easting = UTM17S_FALSO_ESTE + UTM17S_K0 * N * (
        A + (1 - T + C) * Math.pow(A, 3) / 6
        + (5 - 18 * T + T * T + 72 * C - 58 * ePrima2) * Math.pow(A, 5) / 120
    );

    const northing = UTM17S_FALSO_NORTE + UTM17S_K0 * (
        M + N * tanLat * (
            A * A / 2
            + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24
            + (61 - 58 * T + T * T + 600 * C - 330 * ePrima2) * Math.pow(A, 6) / 720
        )
    );

    return { easting: easting, northing: northing };
}

// Fórmula inversa (UTM Zona 17S → lat/lon WGS84) — usada solo para
// verificación (round-trip contra latLonAUtm17S), no por la app en uso
// normal.
function utm17SALatLon(easting, northing) {
    const e2 = UTM17S_F * (2 - UTM17S_F);
    const ePrima2 = e2 / (1 - e2);
    const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));

    const x = easting - UTM17S_FALSO_ESTE;
    const y = northing - UTM17S_FALSO_NORTE;

    const M = y / UTM17S_K0;
    const mu = M / (UTM17S_A * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256));

    const latRad1 = mu
        + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu)
        + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu)
        + (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu)
        + (1097 * Math.pow(e1, 4) / 512) * Math.sin(8 * mu);

    const senLat1 = Math.sin(latRad1);
    const cosLat1 = Math.cos(latRad1);
    const tanLat1 = Math.tan(latRad1);

    const N1 = UTM17S_A / Math.sqrt(1 - e2 * senLat1 * senLat1);
    const T1 = tanLat1 * tanLat1;
    const C1 = ePrima2 * cosLat1 * cosLat1;
    const R1 = UTM17S_A * (1 - e2) / Math.pow(1 - e2 * senLat1 * senLat1, 1.5);
    const D = x / (N1 * UTM17S_K0);

    const lat = latRad1 - (N1 * tanLat1 / R1) * (
        D * D / 2
        - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ePrima2) * Math.pow(D, 4) / 24
        + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ePrima2 - 3 * C1 * C1) * Math.pow(D, 6) / 720
    );

    const lon0 = UTM17S_LON0_GRADOS * Math.PI / 180;
    const lon = lon0 + (
        D - (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6
        + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ePrima2 + 24 * T1 * T1) * Math.pow(D, 5) / 120
    ) / cosLat1;

    return { lat: lat * 180 / Math.PI, lon: lon * 180 / Math.PI };
}

// Área de un polígono por la fórmula de Shoelace, sobre coordenadas UTM
// (planas, en metros) — mucho más simple y exacta que calcular sobre
// lat/lon directo (que exigiría geometría esférica). Devuelve hectáreas.
// `vertices`: [{easting, northing}, ...], en el orden en que se
// caminó el perímetro (no importa sentido horario/antihorario, el
// valor absoluto del área es el mismo).
function calcularAreaPoligonoHa(vertices) {
    if (!Array.isArray(vertices) || vertices.length < 3) return 0;
    let sumaCruzada = 0;
    for (let i = 0; i < vertices.length; i++) {
        const actual = vertices[i];
        const siguiente = vertices[(i + 1) % vertices.length];
        sumaCruzada += actual.easting * siguiente.northing - siguiente.easting * actual.northing;
    }
    const areaM2 = Math.abs(sumaCruzada) / 2;
    return areaM2 / 10000;
}
