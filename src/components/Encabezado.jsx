import { hace, formatoFecha } from '../utils.js'

export default function Encabezado({ generadoEn }) {
  return (
    <header className="encabezado">
      <div>
        <p className="marca">
          <span className="punto-vivo" /> CENTINELA
        </p>
        <h1>Monitoreo sísmico de México</h1>
      </div>
      <p className="actualizado">
        Datos actualizados {hace(generadoEn)}
        <span className="tenue"> · {formatoFecha(generadoEn)}</span>
      </p>
    </header>
  )
}
