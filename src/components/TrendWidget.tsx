// components/TrendWidget.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'

interface TrendRow {
  name: string
  value: number
}

export default function TrendWidget() {
  const [data, setData] = useState<TrendRow[]>([])

  // Pobranie danych z Supabase (tabela "trends")
  const fetchTrends = async () => {
    const { data: fetched, error } = await supabase
      .from<TrendRow>('trends')
      .select('name,value')
      .order('id', { ascending: true })
    if (error) {
      console.error('Błąd przy pobieraniu trendów:', error.message)
      return
    }
    if (fetched && fetched.length > 0) {
      setData(fetched)
    } else {
      // Fallback, jeśli brak danych w Supabase
      setData([
        { name: 'AI Copywriting', value: 35 },
        { name: '3D Design', value: 25 },
        { name: 'Marketing Autom.', value: 40 },
        { name: 'UX/UI', value: 30 },
        { name: 'Blockchain', value: 20 },
      ])
    }
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

  // Zakres osi Y: od 0 do ~120% maksymalnej wartości
  const yDomain: [number, number] = useMemo(() => {
    if (!data.length) return [0, 50]
    const values = data.map((d) => d.value)
    const max = Math.max(...values) * 1.2
    return [0, max]
  }, [data])

  // Obliczamy procentową zmianę w stosunku do poprzedniego elementu
  const percentChanges = useMemo(() => {
    return data.map((row, idx) => {
      if (idx === 0) return null
      const prev = data[idx - 1].value
      if (prev === 0) return null
      const diff = ((row.value - prev) / prev) * 100
      return diff
    })
  }, [data])

  // Własny Tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: Array<{ name?: string; value?: number }>
    label?: string | number
  }) => {
    if (active && payload && payload.length) {
      const idx = data.findIndex((d) => d.name === label)
      const change = idx > 0 ? percentChanges[idx] : null
      return (
        <div
          className="
            bg-[#0f172acc]
            text-white
            text-sm
            px-3 py-2
            rounded-lg
            shadow-lg
            backdrop-blur-lg
            w-max
          "
        >
          <p className="font-medium mb-1">{label}</p>
          <p className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full" />
            {payload[0].value}%
          </p>
          {change !== null && (
            <p
              className={`mt-1 text-sm font-semibold ${
                change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {change >= 0 ? '+' : ''}
              {change.toFixed(1)}%
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // Niestandardowy kształt słupka z zaokrąglonymi górnymi rogami
  const CustomBar = (props: any) => {
    const { x, y, width, height, fill } = props
    const radius = 6
    return (
      <path
        d={`
          M${x},${y + height}
          L${x},${y + radius}
          Q${x},${y} ${x + radius},${y}
          L${x + width - radius},${y}
          Q${x + width},${y} ${x + width},${y + radius}
          L${x + width},${y + height}
          Z
        `}
        fill={fill}
      />
    )
  }

  return (
    <div className="w-full h-64 relative rounded-2xl overflow-hidden">
      {/* Nagłówek */}
      <div className="absolute top-4 left-6 z-10">
        <h3 className="text-white text-lg font-semibold flex items-center gap-2">
          <span className="block w-1 h-6 bg-gradient-to-b from-purple-400 to-indigo-500 rounded" />
        </h3>
      </div>

      {/* Wykres */}
      <div className="absolute inset-0 pt-10 pb-4 px-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              {/* Gradient wypełnienia słupków */}
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C084FC" stopOpacity={0.9} />
                <stop offset="60%" stopColor="#9333EA" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.3} />
              </linearGradient>
              {/* Wzorzec ukośnych pasków dla co drugiego słupka */}
              <pattern
                id="stripePattern"
                patternUnits="userSpaceOnUse"
                width="6"
                height="6"
                patternTransform="rotate(45)"
              >
                <rect
                  width="3"
                  height="6"
                  transform="translate(0,0)"
                  fill="rgba(255,255,255,0.15)"
                />
              </pattern>
            </defs>

            {/* Neonowa siatka */}
            <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />

            {/* Oś X – nazwy trendów */}
            <XAxis
              dataKey="name"
              tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
              tickLine={false}
            />

            {/* Oś Y – wartości procentowe */}
            <YAxis
              domain={yDomain}
              tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
              tickLine={false}
              unit="%"
            />

            {/* Tooltip */}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />

            {/* Seria słupków */}
            <Bar dataKey="value" fill="url(#barGradient)" shape={<CustomBar />}>
              {data.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={idx % 2 === 0 ? 'url(#barGradient)' : 'url(#stripePattern)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
