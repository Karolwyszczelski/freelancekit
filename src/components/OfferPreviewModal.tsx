// OfferPreviewModal.tsx
import { useRef } from "react"
import html2pdf from "html2pdf.js"

export default function OfferPreviewModal({ offer, onClose, onEdit }) {
  const ref = useRef(null)
  const downloadPDF = () => {
    html2pdf().from(ref.current).set({ filename: "oferta.pdf" }).save()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-500">✕</button>
        <div ref={ref} className="prose max-w-full">
          {/* Tu np. z Markdowna na HTML */}
          <div dangerouslySetInnerHTML={{ __html: offer.offer_content }} />
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onEdit} className="bg-blue-500 text-white px-4 py-2 rounded-xl">Edytuj</button>
          <button onClick={downloadPDF} className="bg-green-500 text-white px-4 py-2 rounded-xl">Pobierz PDF</button>
        </div>
      </div>
    </div>
  )
}
