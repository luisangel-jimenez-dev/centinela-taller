import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

// "2026-11-08" → "8/11"
const diaCorto = (dia) => `${Number(dia.slice(8, 10))}/${Number(dia.slice(5, 7))}`

export default function GraficaPorDia({ datos }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={datos} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#1e293b" vertical={false} />
        <XAxis dataKey="dia" tickFormatter={diaCorto} stroke="#64748b" fontSize={12} />
        <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
        <Tooltip
          labelFormatter={diaCorto}
          formatter={(valor) => [valor, 'Sismos']}
          contentStyle={{ background: '#0f172a', border: '1px solid #334155' }}
          cursor={{ fill: '#1e293b' }}
        />
        <Bar dataKey="total" fill="#a78bfa" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
