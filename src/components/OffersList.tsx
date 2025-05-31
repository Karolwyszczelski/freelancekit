// OffersList.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function OffersList({ onSelect }) {
  const [offers, setOffers] = useState([])
  useEffect(() => {
    getOffers().then(setOffers)
  }, [])

  return (
    <div className="space-y-2">
      {offers.map(offer => (
        <div key={offer.id} className="bg-white/10 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="font-bold">{offer.client}</div>
            <div className="text-xs text-gray-300">{offer.service} • {offer.pricing}</div>
            <div className="text-xs text-gray-400">{new Date(offer.created_at).toLocaleString()}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onSelect(offer)} className="text-blue-500 font-semibold">Podgląd</button>
            {/* Dodaj też Edycja/Usuń jeśli chcesz */}
          </div>
        </div>
      ))}
    </div>
  )
}
