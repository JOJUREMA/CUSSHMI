// Dibujos esquemáticos de infraestructura (SVG, funciones puras) — solo
// para los tipos donde un esquema simple aporta valor real (sección de
// canal/dren, compuerta, toma, planta de puente). El resto de tipos no
// tiene función acá a propósito — no se dibujan.

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
// trapezoidal (Base Mayor B / Base Menor b / Altura H / Tirante y).
function dibujarSeccionTrapezoidal(baseMayor, baseMenor, altura, tirante) {
    var B = _svgNum(baseMayor), b = _svgNum(baseMenor), H = _svgNum(altura);
    var y = _svgNum(tirante); // el tirante es opcional — se dibuja si viene
    if (!B || !b || !H) return null;

    var escala = 240 / Math.max(B, b);
    var Bpx = B * escala, bpx = b * escala, Hpx = H * escala;
    var margenX = (280 - Bpx) / 2;
    var baseY = 170;
    var topY = baseY - Hpx;
    var offsetTalud = (Bpx - bpx) / 2;

    var puntos = [
        [margenX, baseY],
        [margenX + Bpx, baseY],
        [margenX + Bpx - offsetTalud, topY],
        [margenX + offsetTalud, topY],
    ].map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');

    var contenido = '<polygon points="' + puntos + '" fill="rgba(0,188,212,0.18)" stroke="#00bcd4" stroke-width="2"/>';

    if (y && y < H) {
        var ypx = y * escala;
        var anchoEnY = bpx + (Bpx - bpx) * (ypx / Hpx);
        var margenEnY = (280 - anchoEnY) / 2;
        var lineaY = baseY - ypx;
        contenido += '<line x1="' + margenEnY + '" y1="' + lineaY + '" x2="' + (margenEnY + anchoEnY) + '" y2="' + lineaY + '" ' +
            'stroke="#7ec8e3" stroke-width="1.5" stroke-dasharray="4,3"/>';
        contenido += _svgEtiqueta(20, lineaY + 4, 'y=' + y + 'm', 'start');
    }

    contenido += _svgEtiqueta(140, baseY + 16, 'b=' + b + 'm');
    contenido += _svgEtiqueta(140, topY - 8, 'B=' + B + 'm');
    contenido += _svgEtiqueta(margenX - 14, (baseY + topY) / 2, 'H=' + H + 'm', 'end');

    return _svgEnvoltura(contenido, 280, 190);
}

// Compuerta: marco (fijo) + hoja (móvil), ambos rectángulos concéntricos.
function dibujarCompuerta(hojaA, hojaH, marcoA, marcoH) {
    var hA = _svgNum(hojaA), hH = _svgNum(hojaH), mA = _svgNum(marcoA), mH = _svgNum(marcoH);
    if (!mA || !mH) return null;

    var escala = 220 / mA;
    var mApx = mA * escala, mHpx = mH * escala;
    var x0 = (280 - mApx) / 2, y0 = 170 - mHpx;

    var contenido = '<rect x="' + x0 + '" y="' + y0 + '" width="' + mApx + '" height="' + mHpx + '" ' +
        'fill="none" stroke="#c8a84b" stroke-width="3"/>';
    contenido += _svgEtiqueta(140, y0 - 10, 'Marco ' + mA + '×' + mH + 'm');

    if (hA && hH) {
        var hApx = hA * escala, hHpx = hH * escala;
        var hx0 = x0 + (mApx - hApx) / 2, hy0 = y0 + mHpx - hHpx;
        contenido += '<rect x="' + hx0 + '" y="' + hy0 + '" width="' + hApx + '" height="' + hHpx + '" ' +
            'fill="rgba(0,188,212,0.25)" stroke="#00bcd4" stroke-width="2"/>';
        contenido += _svgEtiqueta(140, 170 + 16, 'Hoja ' + hA + '×' + hH + 'm');
    }

    return _svgEnvoltura(contenido, 280, 200);
}

// Toma: rectángulo A×H; si trae diámetro (tomas entubadas), se agrega un
// círculo aparte con su propia medida — no se mezclan en una sola figura
// porque son dos formas de construcción distintas, no una combinada.
function dibujarToma(dimensionA, dimensionH, dimensionD) {
    var A = _svgNum(dimensionA), H = _svgNum(dimensionH), D = _svgNum(dimensionD);
    if (!A && !H && !D) return null;

    var contenido = '';
    if (A && H) {
        var escala = 160 / Math.max(A, H);
        var Apx = A * escala, Hpx = H * escala;
        var x0 = 40, y0 = 170 - Hpx;
        contenido += '<rect x="' + x0 + '" y="' + y0 + '" width="' + Apx + '" height="' + Hpx + '" ' +
            'fill="rgba(0,188,212,0.18)" stroke="#00bcd4" stroke-width="2"/>';
        contenido += _svgEtiqueta(x0 + Apx / 2, 170 + 16, A + '×' + H + 'm');
    }
    if (D) {
        var escalaD = 90 / D;
        var r = (D * escalaD) / 2;
        var cx = A && H ? 210 : 140, cy = 170 - r;
        contenido += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' +
            'fill="rgba(200,168,75,0.2)" stroke="#c8a84b" stroke-width="2"/>';
        contenido += _svgEtiqueta(cx, 170 + 16, 'Ø' + D + 'm');
    }
    return _svgEnvoltura(contenido, 280, 200);
}

// Puente (vehicular o peatonal): planta simple, rectángulo Longitud×Ancho
// visto desde arriba (no una sección — es lo que pidió el usuario).
function dibujarPlantaPuente(longitud, ancho) {
    var L = _svgNum(longitud), A = _svgNum(ancho);
    if (!L || !A) return null;

    var escala = 240 / L;
    var Lpx = L * escala, Apx = Math.max(A * escala, 14); // ancho mínimo visible
    var x0 = (280 - Lpx) / 2, y0 = (140 - Apx) / 2;

    var contenido = '<rect x="' + x0 + '" y="' + y0 + '" width="' + Lpx + '" height="' + Apx + '" ' +
        'fill="rgba(200,168,75,0.2)" stroke="#c8a84b" stroke-width="2"/>';
    contenido += _svgEtiqueta(140, y0 - 10, 'Longitud ' + L + 'm');
    contenido += _svgEtiqueta(x0 - 8, y0 + Apx / 2 + 4, A + 'm', 'end');

    return _svgEnvoltura(contenido, 280, 160);
}
