import { useEffect, useState } from 'react'
import Encabezado from './components/Encabezado.jsx'
import Indicadores from './components/Indicadores.jsx'
import Mapa from './components/Mapa.jsx'
import GraficaPorDia from './components/GraficaPorDia.jsx'
import GraficaBarras from './components/GraficaBarras.jsx'
import TablaSismos from './components/TablaSismos.jsx'

// ¿De dónde leemos los datos?
//  - En AWS: de CloudFront. GitHub Actions pone la URL en VITE_DATA_URL al compilar.
//  - En tu computadora: del archivo public/sismos.json (lo crea "npm run datos").
const URL_DATOS = import.meta.env.VITE_DATA_URL || '/sismos.json'

// Cada cuánto volvemos a pedir los datos (5 minutos).
const CINCO_MINUTOS = 5 * 60 * 1000

export default function App() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [magnitudMinima, setMagnitudMinima] = useState(0)

  useEffect(() => {
    async function cargar() {
      try {
        // "?t=" evita que el navegador nos dé una copia vieja
        const respuesta = await fetch(`${URL_DATOS}?t=${Date.now()}`)
        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`)
        setDatos(await respuesta.json())
        setError(null)
      } catch (e) {
        setError(e.message)
      }
    }
    cargar()
    const intervalo = setInterval(cargar, CINCO_MINUTOS)
    return () => clearInterval(intervalo) // limpieza al cerrar
  }, [])

  if (error && !datos) {
    return (
      <div className="mensaje">
        <h2>No pudimos cargar los datos 😕</h2>
        <p>{error}</p>
        <p className="tenue">
          Si estás en tu computadora, corre <code>npm run datos</code> primero.
        </p>
      </div>
    )
  }

  if (!datos) return <div className="mensaje">Cargando sismos…</div>

  const { sismos, estadisticas, generadoEn, fuente } = datos
  const filtrados = sismos.filter((s) => (s.magnitud ?? 0) >= magnitudMinima)

  return (
    <div className="app">
      <Encabezado generadoEn={generadoEn} />

      <Indicadores estadisticas={estadisticas} />

      <section className="panel panel-mapa">
        <div className="panel-titulo">
          <h2>Mapa de sismos</h2>
          <label className="filtro">
            Magnitud mínima
            <select
              value={magnitudMinima}
              onChange={(e) => setMagnitudMinima(Number(e.target.value))}
            >
              <option value={0}>Todas</option>
              <option value={3}>3 o más</option>
              <option value={4}>4 o más</option>
              <option value={5}>5 o más</option>
            </select>
          </label>
        </div>
        <Mapa sismos={filtrados} />
      </section>

      <div className="rejilla">
        <section className="panel">
          <h2>Sismos por día</h2>
          <GraficaPorDia datos={estadisticas.porDia} />
        </section>
        <section className="panel">
          <h2>Estados con más sismos</h2>
          <GraficaBarras datos={estadisticas.porEstado} campo="estado" color="#38bdf8" />
        </section>
        <section className="panel">
          <h2>Por magnitud</h2>
          <GraficaBarras datos={estadisticas.porMagnitud} campo="rango" color="#f97316" />
        </section>
      </div>

      <section className="panel">
        <h2>Últimos sismos ({filtrados.length})</h2>
        <TablaSismos sismos={filtrados} />
      </section>

      <footer className="pie">
        Datos: {fuente}. Proyecto educativo, <strong>no es un sistema de alerta oficial</strong>.
      </footer>
    </div>
  )
}
