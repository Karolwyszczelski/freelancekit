import { PortfolioData } from '@/types/portfolio';

export default function MinimalTemplate({ data }: { data: PortfolioData }) {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Nagłówek */}
      <header className="text-center py-16">
        <h1 className="text-5xl font-bold">{data.name}</h1>
        <p className="text-xl text-gray-500 mt-2">{data.tagline}</p>
      </header>

      {/* Sekcja O mnie */}
      <section id="o-mnie" className="max-w-2xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-semibold mb-4">O mnie</h2>
        <div className="prose prose-lg" dangerouslySetInnerHTML={{ __html: data.bio }} />
      </section>

      {/* Inne sekcje dynamicznie */}
      {data.sections.map((sec) => (
        <section
          key={sec.id}
          id={sec.title.toLowerCase().replace(/\s+/g, '-')}
          className="max-w-3xl mx-auto px-6 py-12"
        >
          <h2 className="text-3xl font-semibold mb-4">{sec.title}</h2>
          <div className="prose prose-lg" dangerouslySetInnerHTML={{ __html: sec.content }} />
          {sec.imageUrls && sec.imageUrls.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sec.imageUrls.map((url) => (
                <img key={url} src={url} alt={sec.title} className="rounded-lg shadow-md" />
              ))}
            </div>
          )}
        </section>
      ))}

      {/* Sekcja Kontakt / Socialsy */}
      <footer className="bg-gray-100 py-12">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-4">
          <h3 className="text-2xl font-semibold">Kontakt</h3>
          <div className="flex justify-center space-x-6">
            {data.socials.linkedin && (
              <a href={data.socials.linkedin} target="_blank" rel="noopener noreferrer">
                <span className="sr-only">LinkedIn</span>
                <img src="/icons/linkedin.svg" alt="" className="h-6 w-6" />
              </a>
            )}
            {data.socials.github && (
              <a href={data.socials.github} target="_blank" rel="noopener noreferrer">
                <span className="sr-only">GitHub</span>
                <img src="/icons/github.svg" alt="" className="h-6 w-6" />
              </a>
            )}
            {data.socials.twitter && (
              <a href={data.socials.twitter} target="_blank" rel="noopener noreferrer">
                <span className="sr-only">Twitter</span>
                <img src="/icons/twitter.svg" alt="" className="h-6 w-6" />
              </a>
            )}
            {/* ...inne jeśli zdefiniowane */}
          </div>
          {data.extras?.showDownloadCV && data.extras.cvUrl && (
            <div className="mt-4">
              <a
                href={data.extras.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Pobierz CV
              </a>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
