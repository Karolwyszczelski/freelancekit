// src/types/portfolio.ts

export interface PortfolioBase {
  id?: string;            // Supabase nadaje automatycznie
  user_id: string;
  slug: string;
  template_id: 1 | 2 | 3 | 4; // dodajemy 4 dla “Na zamówienie”
  name: string;
  headline?: string | null;
  about?: string | null;
  skills: string[];
  contact_email?: string | null;
  contact_phone?: string | null;
  socials?: { [k: string]: string } | null;
  settings?: {
    basicColorChoice?: 'light' | 'dark';
    fontFamily?: string;
    buttonStyle?: 'rounded' | 'square';
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface PortfolioImage {
  id?: string;
  portfolio_id: string;
  image_url: string;
  sort_order: number;
  created_at?: string;
}

export interface PortfolioTheme {
  id?: string;
  portfolio_id: string;
  primary_color: string;
  secondary_color: string;
  button_color: string;
  created_at?: string;
}
