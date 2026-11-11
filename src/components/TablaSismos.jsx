import { colorMagnitud, formatoFecha, textoMagnitud } from '../utils.js'

// Tabla con los 20 sismos más recientes.
export default function TablaSismos({ sismos }) {
  if (sismos.length === 0) return <p className="tenue">No hay sismos con ese filtro.</p>

  return (
    <div className="tabla-contenedor">
      <table className="tabla">
        <thead>
          <tr>
            <th>Magnitud</th>
            <th>Lugar</th>
            <th>Fecha (hora del centro)</th>
            <th>Profundidad</th>
          </tr>
        </thead>
        <tbody>
          {sismos.slice(0, 20).map((s) => (
            <tr key={s.id}>
              <td>
                <span className="insignia" style={{ background: colorMagnitud(s.magnitud) }}>
                  {textoMagnitud(s.magnitud)}
                </span>
              </td>
              <td>{s.lugar}</td>
              <td>{formatoFecha(s.fecha)}</td>
              <td>{s.profundidadKm ?? '?'} km</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
