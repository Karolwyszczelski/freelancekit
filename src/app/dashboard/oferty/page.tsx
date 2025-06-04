'use client'

import { useEffect, useState, useRef } from 'react'
import { marked } from 'marked'
import OfferAIForm from '@/components/OfferAIForm'
import { Trash2, Pencil, Plus, FileDown, Save } from 'lucide-react'

export default function OfferPage() {
  const [offers, setOffers] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editMode, setEditMode] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchOffers = async () => {
    try {
      const res = await fetch('/api/offers')
      const data = await res.json()
      if (!res.ok) {
        console.error("Błąd pobierania:", data?.error || res.statusText)
        return
      }
      setOffers(data || [])
    } catch (err) {
      console.error("Błąd połączenia:", err)
    }
  }

  useEffect(() => {
    fetchOffers()
  }, [])

  useEffect(() => {
    if (offers.length === 0) setShowModal(true)
  }, [offers])

  const handleDelete = async (id: string) => {
    if (!confirm('Na pewno chcesz usunąć ofertę?')) return
    await fetch(`/api/offers/${id}`, { method: 'DELETE' })
    setOffers((prev) => prev.filter((o) => o.id !== id))
    setSelected(null)
  }

  const handleSaveEdit = async () => {
    if (!selected) return
    await fetch(`/api/offers/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offer_content: editContent }),
    })
    setEditMode(false)
    setSelected({ ...selected, offer_content: editContent })
    fetchOffers()
  }

  const handleDownloadPDF = async () => {
    if (!ref.current) return
    const html2pdf = (await import('html2pdf.js')).default
    await html2pdf()
      .from(ref.current)
      .set({
        margin: 0.5,
        filename: 'oferta.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      })
      .save()
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-[#150b2e] to-[#200835] min-h-screen text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Oferty</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl flex items-center gap-2 shadow"
        >
          <Plus className="w-5 h-5" />
          Nowa oferta
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="relative bg-white/10 rounded-2xl p-5 backdrop-blur-md border border-white/10 transition hover:bg-white/20 shadow-xl cursor-pointer"
            onClick={() => {
              setSelected(offer)
              setEditContent(offer.offer_content)
              setEditMode(false)
            }}
          >
            <div className="text-xl font-semibold text-white mb-1">{offer.service}</div>
            <div className="text-white/80 text-sm mb-2">{offer.client}</div>
            <div className="text-xs text-white/50 mb-3">{new Date(offer.created_at).toLocaleString()}</div>
            {offer.status && (
              <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {offer.status}
              </div>
            )}
            <button className="mt-4 bg-white/10 text-white border border-white/20 px-4 py-1 rounded-lg text-sm hover:bg-white/20 transition">
              Edytuj
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <OfferAIForm
          onOfferSaved={() => {
            setShowModal(false)
            fetchOffers()
          }}
        />
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl text-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto p-6 relative shadow-xl border border-white/10">
            <button
              className="absolute top-3 right-4 text-2xl text-gray-400 hover:text-red-500"
              onClick={() => setSelected(null)}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-3">{selected.client} – {selected.service}</h2>
            <div className="flex gap-2 flex-wrap mb-4">
              <button
                onClick={() => setEditMode(!editMode)}
                className="bg-yellow-400 text-black px-3 py-1 rounded flex items-center gap-1"
              >
                <Pencil className="w-4 h-4" /> {editMode ? 'Anuluj edycję' : 'Edytuj'}
              </button>
              {editMode && (
                <button
                  onClick={handleSaveEdit}
                  className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"
                >
                  <Save className="w-4 h-4" /> Zapisz zmiany
                </button>
              )}
              <button
                onClick={handleDownloadPDF}
                className="bg-purple-600 text-white px-3 py-1 rounded flex items-center gap-1"
              >
                <FileDown className="w-4 h-4" /> PDF
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Usuń
              </button>
            </div>

            {/* Sekcja do PDF z białym tłem i czarnym tekstem */}
            <div
              ref={ref}
              className="prose prose-lg max-w-none bg-white text-black p-8 rounded-xl shadow-xl"
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              {!editMode ? (
                <div dangerouslySetInnerHTML={{ __html: marked.parse(selected.offer_content || '') }} />
              ) : (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[300px] p-3 bg-white text-black border rounded"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
