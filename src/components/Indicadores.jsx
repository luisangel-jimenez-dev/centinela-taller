import { colorMagnitud, formatoFecha, textoMagnitud } from '../utils.js'

// Las 4 tarjetas de arriba con los números principales (KPIs).
export default function Indicadores({ estadisticas }) {
  const { total, ultimas24h, masFuerte, profundidadPromedioKm } = estadisticas

  return (
    <section className="indicadores">
      <Tarjeta titulo="Sismos registrados" valor={total} detalle="en el historial (máx. 30 días)" />
      <Tarjeta titulo="Últimas 24 horas" valor={ultimas24h} detalle="sismos nuevos" />
      <Tarjeta
        titulo="El más fuerte"
        valor={masFuerte ? textoMagnitud(masFuerte.magnitud) : '—'}
        color={masFuerte ? colorMagnitud(masFuerte.magnitud) : undefined}
        detalle={masFuerte ? `${masFuerte.estado} · ${formatoFecha(masFuerte.fecha)}` : 'sin datos'}
      />
      <Tarjeta
        titulo="Profundidad promedio"
        valor={profundidadPromedioKm === null ? '—' : `${profundidadPromedioKm} km`}
        detalle="bajo la superficie"
      />
    </section>
  )
}

function Tarjeta({ titulo, valor, detalle, color }) {
  return (
    <div className="tarjeta">
      <p className="tarjeta-titulo">{titulo}</p>
      <p className="tarjeta-valor" style={{ color }}>
        {valor}
      </p>
      <p className="tenue">{detalle}</p>
    </div>
  )
}
