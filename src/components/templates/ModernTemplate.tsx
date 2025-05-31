import { PortfolioData } from '@/types/portfolio';

export default function ModernTemplate({ data }: { data: PortfolioData }) {
  return (
    <div className={`${data.extras?.darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}>
      {/* Hero z tłem gradientowym */}
      <header
        className={`h-screen flex flex-col justify-center items-center ${
          data.extras?.darkMode
            ? 'bg-gradient-to-br from-gray-800 to-gray-900'
            : 'bg-gradient-to-br from-blue-400 to-pink-500'
        }`}
      >
        <h1 className="text-6xl font-bold">{data.name}</h1>
        <p className="text-2xl mt-4">{data.tagline}</p>
      </header>

      {/* Dynamiczne sekcje w pionowym układzie klocków */}
      <main className="space-y-20 py-20">
        {data.sections.map((sec) => (
          <section
            key={sec.id}
            className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center md:space-x-6"
          >
            {sec.imageUrls && sec.imageUrls.length > 0 && (
              <div className="md:w-1/2 mb-6 md:mb-0">
                <img src={sec.imageUrls[0]} alt={sec.title} className="w-full rounded-lg shadow-lg" />
              </div>
            )}
            <div className="md:w-1/2">
              <h2 className="text-4xl font-semibold mb-4">{sec.title}</h2>
              <div className="prose prose-lg" dangerouslySetInnerHTML={{ __html: sec.content }} />
            </div>
          </section>
        ))}
      </main>

      {/* Footer z kontaktami */}
      <footer className="py-12 border-t border-gray-300">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <div className="flex justify-center space-x-6">
            {data.socials.linkedin && (
              <a href={data.socials.linkedin} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
                <img
                  src={`/icons/linkedin-${data.extras?.darkMode ? 'light' : 'dark'}.svg`}
                  alt="LinkedIn"
                  className="h-8 w-8"
                />
              </a>
            )}
            {data.socials.github && (
              <a href={data.socials.github} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
                <img
                  src={`/icons/github-${data.extras?.darkMode ? 'light' : 'dark'}.svg`}
                  alt="GitHub"
                  className="h-8 w-8"
                />
              </a>
            )}
            {/* ... */}
          </div>
          {data.extras?.showDownloadCV && data.extras.cvUrl && (
            <a
              href={data.extras.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Pobierz CV
            </a>
          )}
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} {data.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
