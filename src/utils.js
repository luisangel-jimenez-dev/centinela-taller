// Funciones de ayuda que usan varios componentes.

// Color según la magnitud: verde (leve) → rojo (fuerte).
export function colorMagnitud(magnitud) {
  if (magnitud === null || magnitud === undefined) return '#94a3b8'
  if (magnitud < 3) return '#22c55e'
  if (magnitud < 4) return '#eab308'
  if (magnitud < 5) return '#f97316'
  return '#ef4444'
}

// "2026-11-08T22:45:05-06:00" → "8 nov, 22:45"
export function formatoFecha(fechaIso) {
  return new Date(fechaIso).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// "hace 5 min", "hace 2 h", etc.
export function hace(fechaIso) {
  const minutos = Math.round((Date.now() - new Date(fechaIso).getTime()) / 60000)
  if (minutos < 1) return 'hace un momento'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  return `hace ${Math.round(horas / 24)} días`
}

export function textoMagnitud(magnitud) {
  return magnitud === null ? 'N/C' : magnitud.toFixed(1)
}
