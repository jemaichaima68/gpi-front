// country.service.ts
import { Injectable } from '@angular/core';

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  currency: string;
  phoneCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class CountryService {
  
  private readonly countries: Map<string, CountryInfo> = new Map([
    ['FR', { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', phoneCode: '+33' }],
    ['US', { code: 'US', name: 'États-Unis', flag: '🇺🇸', currency: 'USD', phoneCode: '+1' }],
    ['GB', { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧', currency: 'GBP', phoneCode: '+44' }],
    ['DE', { code: 'DE', name: 'Allemagne', flag: '🇩🇪', currency: 'EUR', phoneCode: '+49' }],
    ['IT', { code: 'IT', name: 'Italie', flag: '🇮🇹', currency: 'EUR', phoneCode: '+39' }],
    ['ES', { code: 'ES', name: 'Espagne', flag: '🇪🇸', currency: 'EUR', phoneCode: '+34' }],
    ['CH', { code: 'CH', name: 'Suisse', flag: '🇨🇭', currency: 'CHF', phoneCode: '+41' }],
    ['BE', { code: 'BE', name: 'Belgique', flag: '🇧🇪', currency: 'EUR', phoneCode: '+32' }],
    ['LU', { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', currency: 'EUR', phoneCode: '+352' }],
    ['NL', { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱', currency: 'EUR', phoneCode: '+31' }],
    ['PT', { code: 'PT', name: 'Portugal', flag: '🇵🇹', currency: 'EUR', phoneCode: '+351' }],
    ['CA', { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', phoneCode: '+1' }],
    ['AE', { code: 'AE', name: 'Émirats Arabes Unis', flag: '🇦🇪', currency: 'AED', phoneCode: '+971' }],
    ['CN', { code: 'CN', name: 'Chine', flag: '🇨🇳', currency: 'CNY', phoneCode: '+86' }],
    ['JP', { code: 'JP', name: 'Japon', flag: '🇯🇵', currency: 'JPY', phoneCode: '+81' }],
    ['SG', { code: 'SG', name: 'Singapour', flag: '🇸🇬', currency: 'SGD', phoneCode: '+65' }],
    ['AU', { code: 'AU', name: 'Australie', flag: '🇦🇺', currency: 'AUD', phoneCode: '+61' }],
    ['MA', { code: 'MA', name: 'Maroc', flag: '🇲🇦', currency: 'MAD', phoneCode: '+212' }],
    ['TN', { code: 'TN', name: 'Tunisie', flag: '🇹🇳', currency: 'TND', phoneCode: '+216' }],
    ['DZ', { code: 'DZ', name: 'Algérie', flag: '🇩🇿', currency: 'DZD', phoneCode: '+213' }],
    ['SN', { code: 'SN', name: 'Sénégal', flag: '🇸🇳', currency: 'XOF', phoneCode: '+221' }],
    ['CI', { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF', phoneCode: '+225' }],
    ['CM', { code: 'CM', name: 'Cameroun', flag: '🇨🇲', currency: 'XAF', phoneCode: '+237' }],
    ['ML', { code: 'ML', name: 'Mali', flag: '🇲🇱', currency: 'XOF', phoneCode: '+223' }],
    ['NE', { code: 'NE', name: 'Niger', flag: '🇳🇪', currency: 'XOF', phoneCode: '+227' }],
    ['BF', { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', currency: 'XOF', phoneCode: '+226' }],
    ['TG', { code: 'TG', name: 'Togo', flag: '🇹🇬', currency: 'XOF', phoneCode: '+228' }],
    ['BJ', { code: 'BJ', name: 'Bénin', flag: '🇧🇯', currency: 'XOF', phoneCode: '+229' }],
    ['IN', { code: 'IN', name: 'Inde', flag: '🇮🇳', currency: 'INR', phoneCode: '+91' }],
    ['BR', { code: 'BR', name: 'Brésil', flag: '🇧🇷', currency: 'BRL', phoneCode: '+55' }],
    ['MX', { code: 'MX', name: 'Mexique', flag: '🇲🇽', currency: 'MXN', phoneCode: '+52' }],
    ['RU', { code: 'RU', name: 'Russie', flag: '🇷🇺', currency: 'RUB', phoneCode: '+7' }],
    ['TR', { code: 'TR', name: 'Turquie', flag: '🇹🇷', currency: 'TRY', phoneCode: '+90' }],
    ['ZA', { code: 'ZA', name: 'Afrique du Sud', flag: '🇿🇦', currency: 'ZAR', phoneCode: '+27' }],
    ['NG', { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', phoneCode: '+234' }],
    ['EG', { code: 'EG', name: 'Égypte', flag: '🇪🇬', currency: 'EGP', phoneCode: '+20' }],
    ['SA', { code: 'SA', name: 'Arabie Saoudite', flag: '🇸🇦', currency: 'SAR', phoneCode: '+966' }]
  ]);

  getCountryInfo(countryCode: string): CountryInfo | null {
    if (!countryCode) return null;
    const upperCode = countryCode.toUpperCase().substring(0, 2);
    return this.countries.get(upperCode) || null;
  }

  getCountryName(countryCode: string): string {
    const info = this.getCountryInfo(countryCode);
    return info?.name || countryCode || 'Inconnu';
  }

  getCountryFlag(countryCode: string): string {
    const info = this.getCountryInfo(countryCode);
    return info?.flag || '🌍';
  }

  getCountryFlagEmoji(countryCode: string): string {
    return this.getCountryFlag(countryCode);
  }

  // Affiche le drapeau suivi du nom du pays
  getCountryWithFlag(countryCode: string): string {
    const info = this.getCountryInfo(countryCode);
    if (!info) return countryCode || 'Inconnu';
    return `${info.flag} ${info.name}`;
  }

  getAllCountries(): CountryInfo[] {
    return Array.from(this.countries.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  getCountriesByContinent(): Map<string, CountryInfo[]> {
    const byContinent = new Map<string, CountryInfo[]>();
    
    // Vous pouvez ajouter un continent à chaque pays
    const continents = new Map<string, string>([
      ['FR', 'Europe'], ['DE', 'Europe'], ['IT', 'Europe'], ['ES', 'Europe'], ['GB', 'Europe'],
      ['CH', 'Europe'], ['BE', 'Europe'], ['LU', 'Europe'], ['NL', 'Europe'], ['PT', 'Europe'],
      ['MA', 'Afrique'], ['TN', 'Afrique'], ['DZ', 'Afrique'], ['SN', 'Afrique'], ['CI', 'Afrique'],
      ['CM', 'Afrique'], ['ML', 'Afrique'], ['NE', 'Afrique'], ['BF', 'Afrique'], ['TG', 'Afrique'],
      ['BJ', 'Afrique'], ['NG', 'Afrique'], ['EG', 'Afrique'], ['ZA', 'Afrique'],
      ['US', 'Amérique'], ['CA', 'Amérique'], ['MX', 'Amérique'], ['BR', 'Amérique'],
      ['CN', 'Asie'], ['JP', 'Asie'], ['IN', 'Asie'], ['SG', 'Asie'], ['AE', 'Asie'],
      ['SA', 'Asie'], ['TR', 'Asie'], ['RU', 'Europe/Asie'], ['AU', 'Océanie']
    ]);

    for (const [code, info] of this.countries) {
      const continent = continents.get(code) || 'Autre';
      if (!byContinent.has(continent)) {
        byContinent.set(continent, []);
      }
      byContinent.get(continent)!.push(info);
    }

    return byContinent;
  }
}