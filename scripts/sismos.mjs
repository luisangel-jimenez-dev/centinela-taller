// ============================================================
//  PIPELINE DE DATOS (ETL) de Centinela Sismos
//
//  1. EXTRAER     → descarga los últimos sismos del SSN (UNAM)
//  2. TRANSFORMAR → limpia los datos y calcula estadísticas
//  3. CARGAR      → guarda todo en un archivo sismos.json
//
//  GitHub Actions corre este script cada hora y sube el
//  resultado a S3 + CloudFront. El tablero (React) lo lee.
//
//  Uso:  npm run datos            (escribe public/sismos.json)
// ============================================================

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

// Fuente oficial: Servicio Sismológico Nacional (UNAM).
// El RSS trae los ~15 sismos más recientes. Como lo leemos cada hora
// y lo juntamos con lo que ya teníamos, el historial va creciendo.
export const FUENTE_SSN = 'http://www.ssn.unam.mx/rss/ultimos-sismos.xml'

// Cuántos días de historial guardamos.
export const DIAS_HISTORIAL = 30

// México centro no tiene horario de verano desde 2022: siempre UTC-6.
const ZONA_MEXICO = '-06:00'

// Abreviaturas que usa el SSN → nombre del estado.
const ESTADOS = {
  AGS: 'Aguascalientes', BC: 'Baja California', BCS: 'Baja California Sur',
  CAMP: 'Campeche', CHIS: 'Chiapas', CHIH: 'Chihuahua', CDMX: 'Ciudad de México',
  COAH: 'Coahuila', COL: 'Colima', DGO: 'Durango', GRO: 'Guerrero',
  GTO: 'Guanajuato', HGO: 'Hidalgo', JAL: 'Jalisco', MEX: 'Estado de México',
  MICH: 'Michoacán', MOR: 'Morelos', NAY: 'Nayarit', NL: 'Nuevo León',
  OAX: 'Oaxaca', PUE: 'Puebla', QRO: 'Querétaro', QR: 'Quintana Roo',
  SLP: 'San Luis Potosí', SIN: 'Sinaloa', SON: 'Sonora', TAB: 'Tabasco',
  TAMS: 'Tamaulipas', TLAX: 'Tlaxcala', VER: 'Veracruz', YUC: 'Yucatán',
  ZAC: 'Zacatecas',
}

// ------------------------------------------------------------
// 2. TRANSFORMAR: funciones pequeñas y fáciles de probar
// ------------------------------------------------------------

// Cambia códigos HTML como &eacute; por la letra real (é).
function limpiarTexto(texto) {
  const codigos = {
    '&amp;': '&', '&quot;': '"', '&#39;': "'", '&lt;': '<', '&gt;': '>',
    '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
    '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú',
    '&ntilde;': 'ñ', '&Ntilde;': 'Ñ',
  }
  return texto
    .replace(/&[a-zA-Z#0-9]+;/g, (c) => codigos[c] ?? c)
    .replace(/\s+/g, ' ') // quita espacios dobles
    .trim()
}

// Saca el texto que está entre <etiqueta> y </etiqueta>.
function leerEtiqueta(xml, etiqueta) {
  const encontrado = xml.match(new RegExp(`<${etiqueta}>([\\s\\S]*?)</${etiqueta}>`))
  return encontrado ? encontrado[1] : ''
}

// Convierte "OAX" en "Oaxaca". Si no la conocemos, la dejamos igual.
export function nombreEstado(abreviatura) {
  return ESTADOS[abreviatura.toUpperCase()] ?? abreviatura
}

// Convierte un <item> del RSS en un objeto "sismo" limpio.
// Regresa null si al item le falta algo importante.
export function parsearItem(itemXml) {
  // Título, ej: "4.3, 92 km al SUROESTE de  PINOTEPA NACIONAL, OAX"
  const titulo = limpiarTexto(leerEtiqueta(itemXml, 'title'))
  const coma = titulo.indexOf(',')
  if (coma === -1) return null

  const magnitud = Number.parseFloat(titulo.slice(0, coma))
  const lugar = titulo.slice(coma + 1).trim()
  const abreviatura = lugar.split(',').pop().trim()

  // Fecha y profundidad vienen dentro de la descripción.
  const descripcion = leerEtiqueta(itemXml, 'description')
  const fecha = descripcion.match(/Fecha:\s*(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/)
  const profundidad = descripcion.match(/Profundidad:\s*([\d.]+)\s*km/)

  const lat = Number.parseFloat(leerEtiqueta(itemXml, 'geo:lat'))
  const lon = Number.parseFloat(leerEtiqueta(itemXml, 'geo:long'))

  if (!fecha || Number.isNaN(lat) || Number.isNaN(lon)) return null

  const fechaIso = `${fecha[1]}T${fecha[2]}${ZONA_MEXICO}`
  return {
    id: `${fecha[1]}T${fecha[2]}_${lat}_${lon}`,
    fecha: fechaIso,
    magnitud: Number.isNaN(magnitud) ? null : magnitud, // a veces el SSN aún no la calcula
    lugar,
    estado: nombreEstado(abreviatura),
    lat,
    lon,
    profundidadKm: profundidad ? Number.parseFloat(profundidad[1]) : null,
  }
}

// Lee todo el RSS y regresa la lista de sismos válidos.
export function parsearRss(xml) {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []
  return items.map(parsearItem).filter(Boolean)
}

// Junta los sismos que ya teníamos con los nuevos:
//  - sin repetidos (usamos el id)
//  - solo los últimos N días
//  - del más reciente al más antiguo
export function combinar(anteriores, nuevos, ahora = new Date(), dias = DIAS_HISTORIAL) {
  const limite = ahora.getTime() - dias * 24 * 60 * 60 * 1000
  const porId = new Map()
  for (const sismo of [...anteriores, ...nuevos]) porId.set(sismo.id, sismo)
  return [...porId.values()]
    .filter((s) => new Date(s.fecha).getTime() >= limite)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
}

// Día en hora de México (AAAA-MM-DD) para una fecha cualquiera.
function diaMexico(fecha) {
  const enMexico = new Date(new Date(fecha).getTime() - 6 * 60 * 60 * 1000)
  return enMexico.toISOString().slice(0, 10)
}

// Rango de magnitud para la gráfica de barras.
export function rangoMagnitud(magnitud) {
  if (magnitud === null) return 'Sin calcular'
  if (magnitud < 3) return 'Menor a 3'
  if (magnitud < 4) return '3 a 3.9'
  if (magnitud < 5) return '4 a 4.9'
  return '5 o más'
}

// Calcula los números que muestra el tablero (los "KPIs").
export function calcularEstadisticas(sismos, ahora = new Date(), diasGrafica = 14) {
  const hace24h = ahora.getTime() - 24 * 60 * 60 * 1000
  const conMagnitud = sismos.filter((s) => s.magnitud !== null)
  const conProfundidad = sismos.filter((s) => s.profundidadKm !== null)

  const masFuerte = conMagnitud.reduce(
    (mayor, s) => (mayor === null || s.magnitud > mayor.magnitud ? s : mayor),
    null,
  )

  const profundidadPromedio = conProfundidad.length
    ? conProfundidad.reduce((suma, s) => suma + s.profundidadKm, 0) / conProfundidad.length
    : null

  // Sismos por día (los últimos N días, aunque tengan 0)
  const conteoDias = {}
  for (let i = diasGrafica - 1; i >= 0; i--) {
    conteoDias[diaMexico(ahora.getTime() - i * 24 * 60 * 60 * 1000)] = 0
  }
  for (const s of sismos) {
    const dia = s.fecha.slice(0, 10) // la fecha ya viene en hora de México
    if (dia in conteoDias) conteoDias[dia]++
  }

  // Sismos por estado (los 8 con más)
  const conteoEstados = {}
  for (const s of sismos) conteoEstados[s.estado] = (conteoEstados[s.estado] ?? 0) + 1

  // Sismos por rango de magnitud
  const rangos = ['Menor a 3', '3 a 3.9', '4 a 4.9', '5 o más', 'Sin calcular']
  const conteoRangos = Object.fromEntries(rangos.map((r) => [r, 0]))
  for (const s of sismos) conteoRangos[rangoMagnitud(s.magnitud)]++

  return {
    total: sismos.length,
    ultimas24h: sismos.filter((s) => new Date(s.fecha).getTime() >= hace24h).length,
    masFuerte,
    profundidadPromedioKm: profundidadPromedio === null ? null : Math.round(profundidadPromedio * 10) / 10,
    porDia: Object.entries(conteoDias).map(([dia, total]) => ({ dia, total })),
    porEstado: Object.entries(conteoEstados)
      .map(([estado, total]) => ({ estado, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8),
    porMagnitud: rangos
      .map((rango) => ({ rango, total: conteoRangos[rango] }))
      .filter((r) => r.rango !== 'Sin calcular' || r.total > 0),
  }
}

// ------------------------------------------------------------
// 1. EXTRAER
// ------------------------------------------------------------
async function descargarRss() {
  const respuesta = await fetch(FUENTE_SSN, {
    headers: { 'User-Agent': 'centinela-sismos (proyecto escolar)' },
    signal: AbortSignal.timeout(20_000), // máximo 20 segundos
  })
  if (!respuesta.ok) throw new Error(`El SSN respondió ${respuesta.status}`)
  return respuesta.text()
}

// ------------------------------------------------------------
// Programa principal: Extraer → Transformar → Cargar
// ------------------------------------------------------------
async function main() {
  const salida = process.argv[2] ?? 'public/sismos.json'
  const ahora = new Date()

  // Si ya existe un sismos.json (el de la hora pasada), lo usamos como historial.
  let anteriores = []
  if (existsSync(salida)) {
    anteriores = JSON.parse(await readFile(salida, 'utf8')).sismos ?? []
    console.log(`📂 Historial anterior: ${anteriores.length} sismos`)
  }

  // 1. EXTRAER
  let nuevos = []
  try {
    nuevos = parsearRss(await descargarRss())
    console.log(`📡 Descargados del SSN: ${nuevos.length} sismos`)
  } catch (error) {
    // Si el SSN falla pero ya teníamos datos, seguimos con esos.
    if (anteriores.length === 0) throw error
    console.warn(`⚠️  No se pudo leer el SSN (${error.message}). Usamos el historial.`)
  }

  // 2. TRANSFORMAR
  const sismos = combinar(anteriores, nuevos, ahora)
  const datos = {
    generadoEn: ahora.toISOString(),
    fuente: 'Servicio Sismológico Nacional (SSN), UNAM',
    sismos,
    estadisticas: calcularEstadisticas(sismos, ahora),
  }

  // 3. CARGAR
  await mkdir(dirname(salida), { recursive: true })
  await writeFile(salida, JSON.stringify(datos, null, 2))
  console.log(`✅ Guardado ${salida}: ${sismos.length} sismos en total`)
}

// Solo corre main() si ejecutamos este archivo directamente
// (no cuando las pruebas lo importan).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`❌ ${error.message}`)
    process.exit(1)
  })
}
