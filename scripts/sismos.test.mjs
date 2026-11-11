// Pruebas del pipeline de datos. Se corren con:  npm test
// GitHub Actions las corre en cada push y en cada Pull Request (eso es CI).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parsearRss,
  combinar,
  calcularEstadisticas,
  rangoMagnitud,
  nombreEstado,
} from './sismos.mjs'

// Un pedacito de RSS igual al que manda el SSN.
const RSS_EJEMPLO = `<?xml version="1.0"?>
<rss version="2.0" xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"><channel>
  <item>
    <title>4.3, 92 km al SUROESTE de  PINOTEPA NACIONAL, OAX</title>
    <description><![CDATA[ <p>Fecha:2026-11-08 22:45:05 (Hora de M&eacute;xico)<br/>Lat/Lon: 15.832/-98.728<br/>Profundidad: 3.3 km </p> ]]></description>
    <geo:lat>15.832</geo:lat>
    <geo:long>-98.728</geo:long>
  </item>
  <item>
    <title>3.0, 40 km al OESTE de  CIHUATLAN, JAL</title>
    <description><![CDATA[ <p>Fecha:2026-11-08 16:57:26 (Hora de M&eacute;xico)<br/>Lat/Lon: 19.248/-104.942<br/>Profundidad: 10.0 km </p> ]]></description>
    <geo:lat>19.248</geo:lat>
    <geo:long>-104.942</geo:long>
  </item>
  <item>
    <title>item roto sin datos</title>
  </item>
</channel></rss>`

test('lee los sismos del RSS y descarta los que vienen rotos', () => {
  const sismos = parsearRss(RSS_EJEMPLO)
  assert.equal(sismos.length, 2)

  const [primero] = sismos
  assert.equal(primero.magnitud, 4.3)
  assert.equal(primero.lugar, '92 km al SUROESTE de PINOTEPA NACIONAL, OAX')
  assert.equal(primero.estado, 'Oaxaca')
  assert.equal(primero.fecha, '2026-11-08T22:45:05-06:00')
  assert.equal(primero.profundidadKm, 3.3)
  assert.equal(primero.lat, 15.832)
  assert.equal(primero.lon, -98.728)
})

test('cuando el SSN aún no calcula la magnitud, queda en null', () => {
  const rss = RSS_EJEMPLO.replace('4.3, 92 km', 'NC, 92 km')
  assert.equal(parsearRss(rss)[0].magnitud, null)
})

test('combinar quita repetidos, borra lo viejo y ordena del más nuevo al más viejo', () => {
  const ahora = new Date('2026-11-09T12:00:00-06:00')
  const nuevos = parsearRss(RSS_EJEMPLO)
  const viejo = { ...nuevos[1], id: 'viejo', fecha: '2026-09-01T10:00:00-06:00' }

  // Le pasamos el mismo sismo dos veces y uno de hace más de 30 días.
  const resultado = combinar([nuevos[0], viejo], nuevos, ahora)

  assert.equal(resultado.length, 2)
  assert.equal(resultado[0].magnitud, 4.3) // el más reciente primero
  assert.ok(!resultado.some((s) => s.id === 'viejo'))
})

test('las estadísticas cuentan bien', () => {
  const ahora = new Date('2026-11-09T12:00:00-06:00')
  const sismos = parsearRss(RSS_EJEMPLO)
  const est = calcularEstadisticas(sismos, ahora)

  assert.equal(est.total, 2)
  assert.equal(est.ultimas24h, 2)
  assert.equal(est.masFuerte.magnitud, 4.3)
  assert.equal(est.profundidadPromedioKm, 6.7) // (3.3 + 10) / 2 = 6.65 → 6.7
  assert.equal(est.porDia.length, 14)
  assert.deepEqual(est.porDia.at(-2), { dia: '2026-11-08', total: 2 })
  assert.deepEqual(est.porEstado.map((e) => e.estado).sort(), ['Jalisco', 'Oaxaca'])
})

test('rangos de magnitud', () => {
  assert.equal(rangoMagnitud(2.1), 'Menor a 3')
  assert.equal(rangoMagnitud(3), '3 a 3.9')
  assert.equal(rangoMagnitud(4.9), '4 a 4.9')
  assert.equal(rangoMagnitud(7.1), '5 o más')
  assert.equal(rangoMagnitud(null), 'Sin calcular')
})

test('nombres de estados', () => {
  assert.equal(nombreEstado('GRO'), 'Guerrero')
  assert.equal(nombreEstado('chis'), 'Chiapas')
  assert.equal(nombreEstado('XYZ'), 'XYZ') // si no lo conoce, lo deja igual
})
