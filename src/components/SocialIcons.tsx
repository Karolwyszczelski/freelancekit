// components/SocialIcons.tsx
'use client';

import { ChangeEvent } from 'react';
import {
  Github,
  Linkedin,
  Twitter,
} from 'lucide-react';

interface SocialIconsProps {
  socials: { [key: string]: string };
  setSocials: (val: { [key: string]: string }) => void;
}

export default function SocialIcons({ socials, setSocials }: SocialIconsProps) {
  const handleChange = (key: string, value: string) => {
    setSocials({ ...socials, [key]: value });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label className="flex items-center gap-2 text-white font-medium mb-1">
          <Linkedin className="w-5 h-5 text-blue-400" /> LinkedIn
        </label>
        <input
          type="url"
          value={socials.linkedin}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleChange('linkedin', e.target.value)
          }
          className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://linkedin.com/in/twoj_profil"
        />
      </div>
      <div>
        <label className="flex items-center gap-2 text-white font-medium mb-1">
          <Github className="w-5 h-5 text-gray-300" /> GitHub
        </label>
        <input
          type="url"
          value={socials.github}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleChange('github', e.target.value)
          }
          className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://github.com/twoj_login"
        />
      </div>
      <div>
        <label className="flex items-center gap-2 text-white font-medium mb-1">
          <Twitter className="w-5 h-5 text-blue-300" /> Twitter
        </label>
        <input
          type="url"
          value={socials.twitter}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleChange('twitter', e.target.value)
          }
          className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://twitter.com/twoj_login"
        />
      </div>
    </div>
  );
}
