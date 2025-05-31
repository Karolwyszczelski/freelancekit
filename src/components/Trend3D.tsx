// components/Trend3D.tsx
'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Torus, GradientTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

interface TrendRow { name: string; value: number }
interface Slice     { name: string; value: number; colorFrom: string; colorTo: string }

export default function Trend3D() {
  console.log('🔷 Trend3D render')

  const [trends, setTrends] = useState<TrendRow[]>([])

  // ——— 1️⃣ fetchTrends: pobiera i loguje wynik ———
  const fetchTrends = async () => {
    console.log('🔹 fetchTrends start')
    const { data, error } = await supabase
      .from<TrendRow>('trends')
      .select('name, value')
    console.log('🔸 fetchTrends result', { data, error })
    if (error) return
    if (data) setTrends(data)
  }  // <-- to jest brakujący nawias!

  // ——— 2️⃣ useEffect: pierwszy fetch + realtime + cleanup ———
  useEffect(() => {
    console.log('🔹 Trend3D useEffect mount')
    fetchTrends()

    const channel = supabase
      .channel('realtime-trends')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trends' },
        () => {
          console.log('🔄 realtime update event')
          fetchTrends()
        }
      )
      .subscribe()

    return () => {
      console.log('🔹 Trend3D useEffect unmount – removing channel')
      supabase.removeChannel(channel)
    }
  }, [])

  // ——— 3️⃣ fallback na dane statyczne, jeśli tabela pusta ———
  const staticData: TrendRow[] = [
    { name: 'AI Copywriting',   value: 35 },
    { name: '3D Design',        value: 25 },
    { name: 'Marketing Autom.', value: 40 },
  ]
  const raw = trends.length > 0 ? trends : staticData

  // ——— 4️⃣ przygotowujemy slices z kolorami ———
  const slices: Slice[] = useMemo(() => {
    const palette = [
      ['#4f46e5', '#ec4899'],
      ['#3b82f6', '#9333ea'],
      ['#ec4899', '#3b82f6'],
    ]
    return raw.map((t, i) => ({
      name: t.name,
      value: t.value,
      colorFrom: palette[i % palette.length][0],
      colorTo:   palette[i % palette.length][1],
    }))
  }, [raw])

  // ——— 5️⃣ sumujemy wartości, w razie 0 nic nie renderujemy ———
  const total = useMemo(() => slices.reduce((sum, s) => sum + s.value, 0), [slices])
  if (total === 0) return null

  // ——— 6️⃣ liczymy segmenty (start + angle) ———
  const segments = useMemo(() => {
    let curr = 0
    return slices.map(s => {
      const angle = (s.value / total) * Math.PI * 2
      const seg   = { ...s, start: curr, angle }
      curr += angle
      return seg
    })
  }, [slices, total])

  // ——— 7️⃣ final render ———
  return (
    <div className="relative w-full h-full">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 10], zoom: 35, near: 0.1, far: 100 }}
        className="absolute inset-0"
      >
        {/* trochę silniejszego oświetlenia */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        <group rotation={[-Math.PI / 6, 0, 0]}>
          {segments.map((seg, i) => (
            <Torus
              key={i}
              args={[2.5, 0.9, 32, 200, seg.angle]}
              rotation={[0, 0, -seg.start - seg.angle / 2]}
            >
              <meshStandardMaterial
                transparent
                side={THREE.DoubleSide}
                roughness={0.1}
                metalness={0.5}
              >
                <GradientTexture
                  attach="map"
                  stops={[0, 1]}
                  colors={[seg.colorFrom, seg.colorTo]}
                  size={1024}
                />
              </meshStandardMaterial>
            </Torus>
          ))}
        </group>

        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>

      {/* zawsze widoczny overlay z napisem */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <span className="text-white text-4xl font-bold">2025</span>
        <span className="mt-1 text-white/70 text-sm">Trendy</span>
      </div>
    </div>
  )
}
