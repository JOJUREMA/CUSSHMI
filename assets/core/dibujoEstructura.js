// Dibujo esquemático de la sección de un canal/dren (SVG, función pura) —
// único tipo que conserva un esquema (Toma/Compuerta/Puentes lo perdieron
// a pedido explícito del usuario, ese formato no les corresponde).

function _svgNum(v) {
    var n = parseFloat(v);
    return Number.isFinite(n) && n > 0 ? n : null;
}

function _svgEnvoltura(contenidoSvg, anchoViewBox, altoViewBox) {
    return '<svg viewBox="0 0 ' + anchoViewBox + ' ' + altoViewBox + '" xmlns="http://www.w3.org/2000/svg" ' +
        'style="width:100%; max-width:360px; height:auto; display:block; margin:8px auto;">' + contenidoSvg + '</svg>';
}

function _svgEtiqueta(x, y, texto, anchor) {
    return '<text x="' + x + '" y="' + y + '" font-size="11" fill="#ffffff" text-anchor="' + (anchor || 'middle') + '" ' +
        'font-family="sans-serif">' + texto + '</text>';
}

// Canal Lateral y Drenes comparten la misma geometría de sección
// trapezoidal — un canal abierto es más ancho arriba (espejo de agua) que
// en la solera: Base Mayor B (más larga) va ABAJO, en la solera; Base
// Menor b (más corta) va ARRIBA, en el borde libre. H es la altura total
// de la sección; el tirante y es el nivel de agua, medido desde la
// solera hacia arriba.
function dibujarSeccionTrapezoidal(baseMayor, baseMenor, altura, tirante) {
    var B = _svgNum(baseMayor), b = _svgNum(baseMenor), H = _svgNum(altura);
    var y = _svgNum(tirante); // el tirante es opcional — se dibuja si viene
    if (!B || !b || !H) return null;

    var escala = 240 / Math.max(B, b);
    var Bpx = B * escala, bpx = b * escala, Hpx = H * escala;
    var margenXBase = (280 - Bpx) / 2; // ancho mayor B, en la solera (abajo)
    var margenXTope = (280 - bpx) / 2; // ancho menor b, en el borde libre (arriba)
    var baseY = 170; // solera
    var topY = baseY - Hpx; // borde libre

    var puntos = [
        [margenXBase, baseY],
        [margenXBase + Bpx, baseY],
        [margenXTope + bpx, topY],
        [margenXTope, topY],
    ].map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');

    var contenido = '<polygon points="' + puntos + '" fill="rgba(0,188,212,0.18)" stroke="#00bcd4" stroke-width="2"/>';

    if (y && y < H) {
        var ypx = y * escala;
        var anchoEnY = Bpx - (Bpx - bpx) * (ypx / Hpx); // se angosta hacia arriba
        var margenEnY = (280 - anchoEnY) / 2;
        var lineaY = baseY - ypx;
        contenido += '<line x1="' + margenEnY + '" y1="' + lineaY + '" x2="' + (margenEnY + anchoEnY) + '" y2="' + lineaY + '" ' +
            'stroke="#7ec8e3" stroke-width="1.5" stroke-dasharray="4,3"/>';
        contenido += _svgEtiqueta(20, lineaY + 4, 'y=' + y + 'm', 'start');
    }

    contenido += _svgEtiqueta(140, baseY + 16, 'B=' + B + 'm (solera)');
    contenido += _svgEtiqueta(140, topY - 8, 'b=' + b + 'm');
    contenido += _svgEtiqueta(margenXBase - 14, (baseY + topY) / 2, 'H=' + H + 'm', 'end');

    return _svgEnvoltura(contenido, 280, 190);
}
