// src/components/portfolio-templates/TemplatePremium.tsx
import React from 'react';

interface Project {
  title: string;
  description?: string | null;
  images: string[];
}

interface TemplatePremiumProps {
  name: string;
  headline?: string | null;
  about?: string | null;
  skills?: string[];
  logoImage?: string | null;
  personalPhoto?: string | null;
  heroImage?: string | null;
  aboutImage?: string | null;
  additionalImages?: string[];
  projects?: Project[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  socials?: { [key: string]: string }; // dowolne social linki
  fontFamily?: string;
  primaryColor: string;    // z kreatora
  secondaryColor: string;  // z kreatora
  buttonColor: string;     // z kreatora
  buttonStyle: 'rounded' | 'square';
}

const TemplatePremium: React.FC<TemplatePremiumProps> = ({
  name,
  headline,
  about,
  skills = [],
  logoImage = null,
  personalPhoto = null,
  heroImage = null,
  aboutImage = null,
  additionalImages = [],
  projects = [],
  contactEmail = null,
  contactPhone = null,
  socials = {},
  fontFamily = 'sans-serif',
  primaryColor,
  secondaryColor,
  buttonColor,
  buttonStyle,
}) => {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: primaryColor,
        fontFamily,
      }}
    >
      {/* HEADER (Hero) */}
      <header
        className="py-16 px-[15px] text-center"
        style={{ backgroundColor: secondaryColor }}
      >
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-white">
            {name}
          </h1>
          {headline && (
            <p className="mt-3 text-2xl text-white opacity-80">
              {headline}
            </p>
          )}
        </div>
      </header>

      {/* LOGO + PERSONAL PHOTO */}
      <section className="py-8 px-[15px] sm:px-[15px]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-8">
          {logoImage && logoImage.length > 0 && (
            <div className="flex-shrink-0 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-md w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
              <img
                src={logoImage}
                alt="Logo"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
          {personalPhoto && personalPhoto.length > 0 && (
            <div className="flex-shrink-0 overflow-hidden rounded-full shadow-lg w-32 h-32 sm:w-40 sm:h-40">
              <img
                src={personalPhoto}
                alt="Zdjęcie"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {/* ABOUT (z dodatkowym obrazem “About”) */}
      {about && (
        <section className="px-[15px] sm:px-[15px] py-10 bg-white/10 backdrop-blur-lg">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold text-white mb-4">
              O mnie
            </h2>
            <p className="mb-6 text-gray-300">{about}</p>
            {aboutImage && aboutImage.length > 0 && (
              <div className="flex justify-center">
                <img
                  src={aboutImage}
                  alt="O mnie"
                  className="mx-auto mb-6 max-w-xs rounded-lg object-cover shadow-md"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* UMIEJĘTNOŚCI */}
      {skills.length > 0 && (
        <section className="px-[15px] sm:px-[15px] py-10 bg-white/10 backdrop-blur-lg">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold text-white mb-4">
              Umiejętności
            </h2>
            <div className="flex flex-wrap gap-3">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-gray-800 px-4 py-1 text-sm font-medium text-white"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HERO IMAGE */}
      {heroImage && heroImage.length > 0 && (
        <section className="px-[15px] sm:px-[15px] py-10 bg-white/10 backdrop-blur-lg">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-white mb-4">
              Hero
            </h2>
            <img
              src={heroImage}
              alt="Hero"
              className="mx-auto mb-6 w-full max-w-full rounded-lg object-cover shadow-md"
              style={{ height: '400px' }}
            />
          </div>
        </section>
      )}

      {/* DODATKOWE ZDJĘCIA */}
      {additionalImages.filter((u) => u && u.length > 0).length > 0 && (
        <section className="px-[15px] sm:px-[15px] py-10 bg-white/10 backdrop-blur-lg">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-white mb-4">
              Galeria
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {additionalImages
                .filter((u) => typeof u === 'string' && u.length > 0)
                .slice(0, 6) /* do 6 zdjęć, ale możesz zmienić */ 
                .map((url, idx) => (
                  <div
                    key={idx}
                    className="overflow-hidden rounded-lg shadow-lg"
                  >
                    <img
                      src={url}
                      alt={`Dodatkowe ${idx + 1}`}
                      className="h-48 w-full object-cover"
                    />
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* PROJEKTY */}
      {projects.length > 0 && (
        <section className="px-[15px] sm:px-[15px] py-10 bg-white/10 backdrop-blur-lg">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-white mb-4">
              Projekty
            </h2>
            <div className="space-y-8">
              {projects.map((proj, pidx) => (
                <div
                  key={pidx}
                  className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-md"
                >
                  <h3 className="mb-2 text-2xl font-semibold text-white">
                    {proj.title}
                  </h3>
                  {proj.description && (
                    <p className="mb-4 text-gray-300">
                      {proj.description}
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {proj.images
                      .filter((u) => typeof u === 'string' && u.length > 0)
                      .map((imgUrl, imgIdx) => (
                        <div
                          key={imgIdx}
                          className="overflow-hidden rounded-lg shadow-lg"
                        >
                          <img
                            src={imgUrl}
                            alt={`Projekt ${pidx + 1} - zdjęcie ${imgIdx + 1}`}
                            className="h-48 w-full object-cover"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* STOPKA */}
      <footer
        className="px-[15px] sm:px-[15px] py-10 bg-white/10 backdrop-blur-lg"
        style={{ backgroundColor: secondaryColor }}
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-3">
            {contactEmail && (
              <p className="text-base text-white">
                <span className="font-semibold">Email: </span>
                <a
                  href={`mailto:${contactEmail}`}
                  className="underline hover:text-gray-200 transition"
                >
                  {contactEmail}
                </a>
              </p>
            )}
            {contactPhone && (
              <p className="text-base text-white">
                <span className="font-semibold">Telefon: </span>
                <a
                  href={`tel:${contactPhone}`}
                  className="underline hover:text-gray-200 transition"
                >
                  {contactPhone}
                </a>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            {Object.entries(socials).map(
              ([platform, url]) =>
                url && (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-medium text-white hover:text-gray-200 transition"
                  >
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </a>
                )
            )}
          </div>
        </div>
        <div className="mt-6 text-center">
          <button
            className={`px-6 py-3 text-base font-semibold text-white shadow transition ${
              buttonStyle === 'rounded' ? 'rounded-lg' : 'rounded-none'
            }`}
            style={{ backgroundColor: buttonColor, fontFamily }}
          >
            Przykładowy przycisk
          </button>
        </div>
        <p className="mt-6 text-center text-sm text-gray-300">
          &copy; {new Date().getFullYear()} {name}. Wszystkie prawa zastrzeżone.
        </p>
      </footer>
    </div>
  );
};

export default TemplatePremium;
