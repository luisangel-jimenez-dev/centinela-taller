import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

// Gráfica de barras acostadas. La usamos para "por estado" y "por magnitud".
//  - datos: lista como [{ estado: 'Oaxaca', total: 6 }, ...]
//  - campo: el nombre de la etiqueta ("estado" o "rango")
export default function GraficaBarras({ datos, campo, color }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={datos} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <XAxis type="number" allowDecimals={false} stroke="#64748b" fontSize={12} />
        <YAxis type="category" dataKey={campo} width={130} stroke="#64748b" fontSize={12} />
        <Tooltip
          formatter={(valor) => [valor, 'Sismos']}
          contentStyle={{ background: '#0f172a', border: '1px solid #334155' }}
          cursor={{ fill: '#1e293b' }}
        />
        <Bar dataKey="total" fill={color} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
