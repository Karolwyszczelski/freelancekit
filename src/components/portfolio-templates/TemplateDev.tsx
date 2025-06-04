// src/components/portfolio-templates/TemplateDev.tsx
import React from 'react';

interface TemplateDevProps {
  name: string;
  headline?: string | null;
  about?: string | null;
  skills?: string[];
  logoImage?: string | null;
  personalPhoto?: string | null;
  additionalImage?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  fontFamily?: string;
  basicColorChoice: 'light' | 'dark';
}

const TemplateDev: React.FC<TemplateDevProps> = ({
  name,
  headline,
  about,
  skills = [],
  logoImage = null,
  personalPhoto = null,
  additionalImage = null,
  contactEmail = null,
  contactPhone = null,
  facebook = null,
  instagram = null,
  linkedin = null,
  fontFamily = 'sans-serif',
  basicColorChoice,
}) => {
  // Klasy tła/tekstu w zależności od wyboru light/dark
  const bgColorClass =
    basicColorChoice === 'light'
      ? 'bg-[#FAFAFA] text-gray-900'
      : 'bg-[#1F1F1F] text-gray-100';
  const headerBgClass =
    basicColorChoice === 'light'
      ? 'bg-[#E5E5E5]'
      : 'bg-gradient-to-r from-indigo-600 to-purple-600';
  const textColorClass =
    basicColorChoice === 'light'
      ? 'text-gray-800'
      : 'text-gray-300';
  const sectionBgClass =
    basicColorChoice === 'light'
      ? 'bg-white'
      : 'bg-[#2A2A2A]';

  return (
    <div
      className={`min-h-screen ${bgColorClass}`}
      style={{ fontFamily }}
    >
      {/* HEADER */}
      <header className={`${headerBgClass} py-12 px-[15px] text-center`}>
        <h1 className="text-4xl sm:text-5xl font-bold">{name}</h1>
        {headline && (
          <p className="mt-2 text-xl opacity-80">{headline}</p>
        )}
      </header>

      {/* ABOUT */}
      {about && (
        <section
          className={`px-[15px] sm:px-[15px] py-10 ${
            sectionBgClass
          }`}
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold mb-4">O mnie</h2>
            <p className={`leading-relaxed ${textColorClass}`}>
              {about}
            </p>
            {personalPhoto && personalPhoto.length > 0 && (
              <div className="mt-6 flex justify-center">
                <img
                  src={personalPhoto}
                  alt="Zdjęcie"
                  className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-full shadow-lg"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* UMIEJĘTNOŚCI */}
      {skills.length > 0 && (
        <section
          className={`py-10 px-[15px] ${
            basicColorChoice === 'light'
              ? 'bg-[#E5E5E5]'
              : 'bg-gradient-to-r from-indigo-700 to-indigo-900'
          }`}
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold text-white mb-4">
              Umiejętności
            </h2>
            <div className="flex flex-wrap gap-3">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GALERIA */}
      <section className="py-10 px-[15px] sm:px-[15px]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-semibold mb-6">Galeria</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Logo */}
            {logoImage && logoImage.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-md">
                <img
                  src={logoImage}
                  alt="Logo"
                  className="w-full h-40 object-contain p-4"
                />
              </div>
            )}

            {/* Zdjęcie własne */}
            {personalPhoto && personalPhoto.length > 0 && (
              <div className="overflow-hidden rounded-lg shadow-md">
                <img
                  src={personalPhoto}
                  alt="Zdjęcie"
                  className="w-full h-40 object-cover"
                />
              </div>
            )}

            {/* Dodatkowe w podstawowym szablonie tylko jedno */}
            {additionalImage && additionalImage.length > 0 && (
              <div className="overflow-hidden rounded-lg shadow-md">
                <img
                  src={additionalImage}
                  alt="Dodatkowe"
                  className="w-full h-40 object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* STOPKA */}
      <footer
        className={`py-8 px-[15px] sm:px-[15px] ${
          basicColorChoice === 'light'
            ? 'bg-[#E5E5E5]'
            : 'bg-[#1A1A1A]'
        }`}
      >
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            {contactEmail && (
              <p className="text-base">
                <span className="font-semibold">Email: </span>
                <a
                  href={`mailto:${contactEmail}`}
                  className={`underline hover:text-indigo-500 transition ${
                    basicColorChoice === 'light'
                      ? 'text-gray-900'
                      : 'text-white'
                  }`}
                >
                  {contactEmail}
                </a>
              </p>
            )}
            {contactPhone && (
              <p className="mt-2 text-base">
                <span className="font-semibold">Telefon: </span>
                <a
                  href={`tel:${contactPhone}`}
                  className={`underline hover:text-indigo-500 transition ${
                    basicColorChoice === 'light'
                      ? 'text-gray-900'
                      : 'text-white'
                  }`}
                >
                  {contactPhone}
                </a>
              </p>
            )}
          </div>
          <div className="flex gap-4">
            {facebook && (
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-medium ${
                  basicColorChoice === 'light'
                    ? 'text-gray-700'
                    : 'text-white'
                } hover:text-indigo-500 transition`}
              >
                Facebook
              </a>
            )}
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-medium ${
                  basicColorChoice === 'light'
                    ? 'text-gray-700'
                    : 'text-white'
                } hover:text-indigo-500 transition`}
              >
                Instagram
              </a>
            )}
            {linkedin && (
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-medium ${
                  basicColorChoice === 'light'
                    ? 'text-gray-700'
                    : 'text-white'
                } hover:text-indigo-500 transition`}
              >
                LinkedIn
              </a>
            )}
          </div>
        </div>
        <p
          className={`mt-6 text-center text-sm ${
            basicColorChoice === 'light'
              ? 'text-gray-700'
              : 'text-gray-400'
          }`}
        >
          &copy; {new Date().getFullYear()} {name}. Wszystkie prawa zastrzeżone.
        </p>
      </footer>
    </div>
  );
};

export default TemplateDev;
