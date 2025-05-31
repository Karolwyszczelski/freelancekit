// components/TrendDoughnut.tsx
'use client'

import { Chart as ChartJS, ArcElement, ChartOptions, ChartData, Plugin } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useMemo } from 'react'

ChartJS.register(ArcElement)

// plugin tworzący glow wokół wykresu
const glowPlugin: Plugin<'doughnut'> = {
  id: 'glow',
  beforeDraw(chart) {
    const { ctx, chartArea: { width, height } } = chart
    const x = width / 2
    const y = height / 2
    const r = Math.min(width, height) / 2 * 0.85

    const grad = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * 1.1)
    grad.addColorStop(0, 'rgba(79,70,229,0.4)')
    grad.addColorStop(1, 'transparent')

    ctx.save()
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, r * 1.1, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

export default function TrendDoughnut() {
  // 1️⃣ przygotowujemy dane z funkcją tworzącą gradient
  const data = useMemo<ChartData<'doughnut'>>(() => ({
    labels: ['AI Copywriting', '3D Design', 'Marketing Automatyzacja'],
    datasets: [{
      data: [35, 25, 40],
      borderWidth: 0,
      hoverOffset: 20,
      // scriptable backgroundColor — generujemy gradient na podstawie chart.ctx
      backgroundColor: (ctx) => {
        const chart = ctx.chart
        const { width } = chart.chartArea
        const grad = chart.ctx.createLinearGradient(0, 0, width, 0)
        if (ctx.dataIndex === 0) {
          grad.addColorStop(0, '#4f46e5')
          grad.addColorStop(1, '#ec4899')
        } else if (ctx.dataIndex === 1) {
          grad.addColorStop(0, '#3b82f6')
          grad.addColorStop(1, '#4f46e5')
        } else {
          grad.addColorStop(0, '#ec4899')
          grad.addColorStop(1, '#3b82f6')
        }
        return grad
      }
    }]
  }), [])

  // 2️⃣ opcje wykresu
  const options = useMemo<ChartOptions<'doughnut'>>(() => ({
    cutout: '70%',
    responsive: true,
    plugins: { legend: { display: false } },
    animation: { duration: 800 }
  }), [])

  return (
    <div className="relative w-full h-64">
      <Doughnut
        data={data}
        options={options}
        plugins={[glowPlugin]}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-white text-3xl font-bold">2025</span>
      </div>
    </div>
  )
}
