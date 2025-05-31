// components/TrendWidget.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface TrendRow {
  name: string
  value: number
}

export default function TrendWidget() {
  const [trends, setTrends] = useState<TrendRow[]>([])

  // Pobranie danych z Supabase i subskrypcja w czasie rzeczywistym
  const fetchTrends = async () => {
    const { data } = await supabase.from<TrendRow>('trends').select('name,value')
    if (data) setTrends(data)
  }

  useEffect(() => {
    fetchTrends()
    const channel = supabase
      .channel('realtime-trends')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trends' },
        fetchTrends
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Jeśli brak danych, używamy wartości fallbackowych
  const data = useMemo<TrendRow[]>(() => {
    if (trends.length > 0) return trends
    return [
      { name: 'AI Copywriting', value: 35 },
      { name: '3D Design', value: 25 },
      { name: 'Marketing Autom.', value: 40 },
      { name: 'UX/UI', value: 30 },
      { name: 'Blockchain', value: 20 },
    ]
  }, [trends])

  // Ustalamy «skali» Y, żeby wykres nie zaczynał od zera, lecz od niewielkiej wartości minimalnej
  const yDomain: [number, number] = useMemo(() => {
    const values = data.map((d) => d.value)
    const min = Math.max(Math.min(...values) - 5, 0)
    const max = Math.max(...values) + 5
    return [min, max]
  }, [data])

  return (
    <div className="w-full h-60 relative rounded-2xl overflow-hidden">

      {/* Nagłówek */}
      <div className="absolute top-4 left-6 z-10">
        <h3 className="text-white text-lg font-semibold flex items-center gap-2">
          <span className="block w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 rounded"></span>
          Trendy 2025
        </h3>
      </div>

      {/* Właściwy wykres */}
      <div className="absolute inset-0 pt-10 pb-4 px-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            {/* Siatka w stylu neonowym, lekko przezroczysta */}
            <CartesianGrid
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray="3 3"
            />

            {/* Oś X – nazwy trendów */}
            <XAxis
              dataKey="name"
              tick={{ fill: 'rgba(255,255,255,0.9)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
              tickLine={false}
            />

            {/* Oś Y – wartości procentowe */}
            <YAxis
              domain={yDomain}
              tick={{ fill: 'rgba(255,255,255,0.9)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
              tickLine={false}
            />

            {/* Tooltip – półprzezroczyste tło */}
            <Tooltip
              wrapperStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                border: 'none',
                fontSize: '12px',
                borderRadius: '6px',
              }}
              contentStyle={{ backgroundColor: 'transparent', border: 'none' }}
              labelStyle={{ color: '#fff', fontSize: '12px' }}
              itemStyle={{ color: '#fff', fontSize: '12px' }}
            />

            {/* Linia – neonowy gradient */}
            <defs>
              <linearGradient id="neonLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>

            <Line
              type="monotone"
              dataKey="value"
              stroke="url(#neonLineGradient)"
              strokeWidth={3}
              dot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: '#0000' }}
              activeDot={{
                r: 6,
                stroke: '#22c55e',
                strokeWidth: 3,
                fill: '#0000',
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
