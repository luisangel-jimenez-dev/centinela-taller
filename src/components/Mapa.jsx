import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { colorMagnitud, formatoFecha, textoMagnitud } from '../utils.js'

// Centro aproximado de México
const CENTRO_MEXICO = [23.6, -102.5]

export default function Mapa({ sismos }) {
  return (
    <MapContainer center={CENTRO_MEXICO} zoom={5} className="mapa" scrollWheelZoom={false}>
      {/* Mapa base gratis de OpenStreetMap (lo oscurecemos con CSS en index.css) */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Un círculo por sismo: más grande y más rojo = más fuerte */}
      {sismos.map((s) => (
        <CircleMarker
          key={s.id}
          center={[s.lat, s.lon]}
          radius={4 + (s.magnitud ?? 1) * 2.5}
          pathOptions={{
            color: colorMagnitud(s.magnitud),
            fillColor: colorMagnitud(s.magnitud),
            fillOpacity: 0.45,
            weight: 1.5,
          }}
        >
          <Popup>
            <strong>Magnitud {textoMagnitud(s.magnitud)}</strong>
            <br />
            {s.lugar}
            <br />
            {formatoFecha(s.fecha)} · {s.profundidadKm ?? '?'} km de profundidad
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
