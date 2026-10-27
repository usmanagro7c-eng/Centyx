// Worldwide locations dataset. Structured so it can later be swapped for
// a dynamic API/database — all access goes through the helper functions.

export type StateData = {
  name: string;
  cities: string[];
};

export type CountryData = {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  states: StateData[];
};

// Detailed data for major markets — states + major cities.
// Countries without a `states` entry are still selectable; users can then
// type a city directly (free-form input).
const DETAILED: CountryData[] = [
  {
    code: "PK", name: "Pakistan", states: [
      { name: "Punjab", cities: ["Lahore", "Faisalabad", "Rawalpindi", "Multan", "Gujranwala", "Sialkot", "Bahawalpur", "Sargodha"] },
      { name: "Sindh", cities: ["Karachi", "Hyderabad", "Sukkur", "Larkana", "Nawabshah"] },
      { name: "Khyber Pakhtunkhwa", cities: ["Peshawar", "Mardan", "Abbottabad", "Swat"] },
      { name: "Balochistan", cities: ["Quetta", "Gwadar", "Turbat"] },
      { name: "Islamabad Capital Territory", cities: ["Islamabad"] },
      { name: "Gilgit-Baltistan", cities: ["Gilgit", "Skardu"] },
      { name: "Azad Kashmir", cities: ["Muzaffarabad", "Mirpur"] },
    ],
  },
  {
    code: "AE", name: "United Arab Emirates", states: [
      { name: "Abu Dhabi", cities: ["Abu Dhabi", "Al Ain"] },
      { name: "Dubai", cities: ["Dubai"] },
      { name: "Sharjah", cities: ["Sharjah"] },
      { name: "Ajman", cities: ["Ajman"] },
      { name: "Fujairah", cities: ["Fujairah"] },
      { name: "Ras Al Khaimah", cities: ["Ras Al Khaimah"] },
      { name: "Umm Al Quwain", cities: ["Umm Al Quwain"] },
    ],
  },
  {
    code: "US", name: "United States", states: [
      { name: "California", cities: ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Fresno"] },
      { name: "Texas", cities: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso"] },
      { name: "New York", cities: ["New York City", "Buffalo", "Rochester", "Albany", "Syracuse"] },
      { name: "Florida", cities: ["Miami", "Orlando", "Tampa", "Jacksonville", "Tallahassee"] },
      { name: "Illinois", cities: ["Chicago", "Aurora", "Springfield", "Naperville"] },
      { name: "Washington", cities: ["Seattle", "Spokane", "Tacoma", "Bellevue"] },
      { name: "Massachusetts", cities: ["Boston", "Cambridge", "Worcester"] },
      { name: "Georgia", cities: ["Atlanta", "Savannah", "Augusta"] },
      { name: "Pennsylvania", cities: ["Philadelphia", "Pittsburgh", "Harrisburg"] },
      { name: "Arizona", cities: ["Phoenix", "Tucson", "Mesa", "Scottsdale"] },
      { name: "Colorado", cities: ["Denver", "Colorado Springs", "Boulder"] },
      { name: "Nevada", cities: ["Las Vegas", "Reno", "Henderson"] },
    ],
  },
  {
    code: "IN", name: "India", states: [
      { name: "Maharashtra", cities: ["Mumbai", "Pune", "Nagpur", "Nashik"] },
      { name: "Delhi", cities: ["New Delhi", "Delhi"] },
      { name: "Karnataka", cities: ["Bengaluru", "Mysuru", "Mangaluru"] },
      { name: "Tamil Nadu", cities: ["Chennai", "Coimbatore", "Madurai"] },
      { name: "Telangana", cities: ["Hyderabad", "Warangal"] },
      { name: "West Bengal", cities: ["Kolkata", "Howrah", "Durgapur"] },
      { name: "Gujarat", cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"] },
      { name: "Rajasthan", cities: ["Jaipur", "Jodhpur", "Udaipur"] },
      { name: "Uttar Pradesh", cities: ["Lucknow", "Kanpur", "Agra", "Varanasi", "Noida"] },
      { name: "Punjab", cities: ["Ludhiana", "Amritsar", "Chandigarh"] },
      { name: "Kerala", cities: ["Kochi", "Thiruvananthapuram", "Kozhikode"] },
    ],
  },
  {
    code: "GB", name: "United Kingdom", states: [
      { name: "England", cities: ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Bristol", "Newcastle"] },
      { name: "Scotland", cities: ["Edinburgh", "Glasgow", "Aberdeen", "Dundee"] },
      { name: "Wales", cities: ["Cardiff", "Swansea", "Newport"] },
      { name: "Northern Ireland", cities: ["Belfast", "Derry"] },
    ],
  },
  {
    code: "CA", name: "Canada", states: [
      { name: "Ontario", cities: ["Toronto", "Ottawa", "Mississauga", "Hamilton"] },
      { name: "Quebec", cities: ["Montreal", "Quebec City", "Laval"] },
      { name: "British Columbia", cities: ["Vancouver", "Victoria", "Surrey"] },
      { name: "Alberta", cities: ["Calgary", "Edmonton"] },
      { name: "Manitoba", cities: ["Winnipeg"] },
      { name: "Nova Scotia", cities: ["Halifax"] },
    ],
  },
  {
    code: "AU", name: "Australia", states: [
      { name: "New South Wales", cities: ["Sydney", "Newcastle", "Wollongong"] },
      { name: "Victoria", cities: ["Melbourne", "Geelong"] },
      { name: "Queensland", cities: ["Brisbane", "Gold Coast", "Cairns"] },
      { name: "Western Australia", cities: ["Perth", "Fremantle"] },
      { name: "South Australia", cities: ["Adelaide"] },
      { name: "Tasmania", cities: ["Hobart", "Launceston"] },
      { name: "Australian Capital Territory", cities: ["Canberra"] },
    ],
  },
  {
    code: "DE", name: "Germany", states: [
      { name: "Bavaria", cities: ["Munich", "Nuremberg", "Augsburg"] },
      { name: "Berlin", cities: ["Berlin"] },
      { name: "Hamburg", cities: ["Hamburg"] },
      { name: "North Rhine-Westphalia", cities: ["Cologne", "Düsseldorf", "Dortmund", "Essen"] },
      { name: "Hesse", cities: ["Frankfurt", "Wiesbaden"] },
      { name: "Baden-Württemberg", cities: ["Stuttgart", "Karlsruhe", "Mannheim"] },
      { name: "Saxony", cities: ["Dresden", "Leipzig"] },
    ],
  },
  {
    code: "FR", name: "France", states: [
      { name: "Île-de-France", cities: ["Paris", "Versailles"] },
      { name: "Provence-Alpes-Côte d'Azur", cities: ["Marseille", "Nice", "Cannes"] },
      { name: "Auvergne-Rhône-Alpes", cities: ["Lyon", "Grenoble"] },
      { name: "Occitanie", cities: ["Toulouse", "Montpellier"] },
      { name: "Nouvelle-Aquitaine", cities: ["Bordeaux"] },
      { name: "Hauts-de-France", cities: ["Lille"] },
    ],
  },
  {
    code: "SA", name: "Saudi Arabia", states: [
      { name: "Riyadh Region", cities: ["Riyadh", "Diriyah"] },
      { name: "Makkah Region", cities: ["Mecca", "Jeddah", "Ta'if"] },
      { name: "Eastern Province", cities: ["Dammam", "Khobar", "Dhahran"] },
      { name: "Medina Region", cities: ["Medina", "Yanbu"] },
      { name: "Asir Region", cities: ["Abha", "Khamis Mushait"] },
    ],
  },
  {
    code: "EG", name: "Egypt", states: [
      { name: "Cairo", cities: ["Cairo"] },
      { name: "Alexandria", cities: ["Alexandria"] },
      { name: "Giza", cities: ["Giza", "6th of October City"] },
      { name: "Sharqia", cities: ["Zagazig"] },
      { name: "Dakahlia", cities: ["Mansoura"] },
    ],
  },
  {
    code: "TR", name: "Turkey", states: [
      { name: "Istanbul", cities: ["Istanbul"] },
      { name: "Ankara", cities: ["Ankara"] },
      { name: "İzmir", cities: ["İzmir"] },
      { name: "Antalya", cities: ["Antalya"] },
      { name: "Bursa", cities: ["Bursa"] },
    ],
  },
  {
    code: "BR", name: "Brazil", states: [
      { name: "São Paulo", cities: ["São Paulo", "Campinas", "Santos"] },
      { name: "Rio de Janeiro", cities: ["Rio de Janeiro", "Niterói"] },
      { name: "Minas Gerais", cities: ["Belo Horizonte"] },
      { name: "Bahia", cities: ["Salvador"] },
      { name: "Paraná", cities: ["Curitiba"] },
    ],
  },
  {
    code: "MX", name: "Mexico", states: [
      { name: "Mexico City", cities: ["Mexico City"] },
      { name: "Jalisco", cities: ["Guadalajara"] },
      { name: "Nuevo León", cities: ["Monterrey"] },
      { name: "Puebla", cities: ["Puebla"] },
    ],
  },
  {
    code: "CN", name: "China", states: [
      { name: "Beijing", cities: ["Beijing"] },
      { name: "Shanghai", cities: ["Shanghai"] },
      { name: "Guangdong", cities: ["Guangzhou", "Shenzhen", "Dongguan"] },
      { name: "Zhejiang", cities: ["Hangzhou", "Ningbo"] },
      { name: "Sichuan", cities: ["Chengdu"] },
    ],
  },
  {
    code: "JP", name: "Japan", states: [
      { name: "Tokyo", cities: ["Tokyo"] },
      { name: "Osaka", cities: ["Osaka", "Sakai"] },
      { name: "Kyoto", cities: ["Kyoto"] },
      { name: "Hokkaido", cities: ["Sapporo"] },
      { name: "Aichi", cities: ["Nagoya"] },
    ],
  },
  {
    code: "ID", name: "Indonesia", states: [
      { name: "Jakarta", cities: ["Jakarta"] },
      { name: "West Java", cities: ["Bandung", "Bekasi"] },
      { name: "East Java", cities: ["Surabaya", "Malang"] },
      { name: "Bali", cities: ["Denpasar"] },
    ],
  },
  {
    code: "MY", name: "Malaysia", states: [
      { name: "Kuala Lumpur", cities: ["Kuala Lumpur"] },
      { name: "Selangor", cities: ["Shah Alam", "Petaling Jaya"] },
      { name: "Penang", cities: ["George Town"] },
      { name: "Johor", cities: ["Johor Bahru"] },
    ],
  },
  {
    code: "SG", name: "Singapore", states: [{ name: "Singapore", cities: ["Singapore"] }],
  },
  {
    code: "ZA", name: "South Africa", states: [
      { name: "Gauteng", cities: ["Johannesburg", "Pretoria"] },
      { name: "Western Cape", cities: ["Cape Town"] },
      { name: "KwaZulu-Natal", cities: ["Durban"] },
    ],
  },
  {
    code: "NG", name: "Nigeria", states: [
      { name: "Lagos", cities: ["Lagos", "Ikeja"] },
      { name: "Abuja", cities: ["Abuja"] },
      { name: "Kano", cities: ["Kano"] },
    ],
  },
  {
    code: "ES", name: "Spain", states: [
      { name: "Madrid", cities: ["Madrid"] },
      { name: "Catalonia", cities: ["Barcelona"] },
      { name: "Andalusia", cities: ["Seville", "Málaga"] },
      { name: "Valencia", cities: ["Valencia"] },
    ],
  },
  {
    code: "IT", name: "Italy", states: [
      { name: "Lazio", cities: ["Rome"] },
      { name: "Lombardy", cities: ["Milan"] },
      { name: "Campania", cities: ["Naples"] },
      { name: "Veneto", cities: ["Venice", "Verona"] },
      { name: "Tuscany", cities: ["Florence"] },
    ],
  },
  {
    code: "NL", name: "Netherlands", states: [
      { name: "North Holland", cities: ["Amsterdam", "Haarlem"] },
      { name: "South Holland", cities: ["Rotterdam", "The Hague"] },
      { name: "Utrecht", cities: ["Utrecht"] },
    ],
  },
  {
    code: "QA", name: "Qatar", states: [{ name: "Doha", cities: ["Doha", "Al Wakrah"] }],
  },
  {
    code: "KW", name: "Kuwait", states: [{ name: "Kuwait City", cities: ["Kuwait City", "Salmiya"] }],
  },
  {
    code: "BH", name: "Bahrain", states: [{ name: "Manama", cities: ["Manama", "Riffa"] }],
  },
  {
    code: "OM", name: "Oman", states: [{ name: "Muscat", cities: ["Muscat", "Salalah"] }],
  },
  {
    code: "JO", name: "Jordan", states: [{ name: "Amman", cities: ["Amman", "Zarqa"] }],
  },
  {
    code: "BD", name: "Bangladesh", states: [
      { name: "Dhaka", cities: ["Dhaka"] },
      { name: "Chittagong", cities: ["Chittagong"] },
      { name: "Khulna", cities: ["Khulna"] },
    ],
  },
];

// Countries without detailed state data (still selectable, city becomes free-form).
const OTHER_COUNTRIES: { code: string; name: string }[] = [
  { code: "AF", name: "Afghanistan" }, { code: "AL", name: "Albania" }, { code: "DZ", name: "Algeria" },
  { code: "AR", name: "Argentina" }, { code: "AM", name: "Armenia" }, { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" }, { code: "BE", name: "Belgium" }, { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" }, { code: "BG", name: "Bulgaria" }, { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" }, { code: "CL", name: "Chile" }, { code: "CO", name: "Colombia" },
  { code: "CR", name: "Costa Rica" }, { code: "HR", name: "Croatia" }, { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" }, { code: "CZ", name: "Czechia" }, { code: "DK", name: "Denmark" },
  { code: "DO", name: "Dominican Republic" }, { code: "EC", name: "Ecuador" }, { code: "EE", name: "Estonia" },
  { code: "ET", name: "Ethiopia" }, { code: "FI", name: "Finland" }, { code: "GE", name: "Georgia" },
  { code: "GH", name: "Ghana" }, { code: "GR", name: "Greece" }, { code: "GT", name: "Guatemala" },
  { code: "HN", name: "Honduras" }, { code: "HK", name: "Hong Kong" }, { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" }, { code: "IR", name: "Iran" }, { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" }, { code: "IL", name: "Israel" }, { code: "CI", name: "Ivory Coast" },
  { code: "JM", name: "Jamaica" }, { code: "KZ", name: "Kazakhstan" }, { code: "KE", name: "Kenya" },
  { code: "KR", name: "South Korea" }, { code: "KG", name: "Kyrgyzstan" }, { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" }, { code: "LB", name: "Lebanon" }, { code: "LY", name: "Libya" },
  { code: "LT", name: "Lithuania" }, { code: "LU", name: "Luxembourg" }, { code: "MG", name: "Madagascar" },
  { code: "MV", name: "Maldives" }, { code: "MT", name: "Malta" }, { code: "MU", name: "Mauritius" },
  { code: "MD", name: "Moldova" }, { code: "MC", name: "Monaco" }, { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" }, { code: "MA", name: "Morocco" }, { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" }, { code: "NP", name: "Nepal" }, { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" }, { code: "NO", name: "Norway" }, { code: "PS", name: "Palestine" },
  { code: "PA", name: "Panama" }, { code: "PY", name: "Paraguay" }, { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" }, { code: "PL", name: "Poland" }, { code: "PT", name: "Portugal" },
  { code: "PR", name: "Puerto Rico" }, { code: "RO", name: "Romania" }, { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" }, { code: "SN", name: "Senegal" }, { code: "RS", name: "Serbia" },
  { code: "SK", name: "Slovakia" }, { code: "SI", name: "Slovenia" }, { code: "SO", name: "Somalia" },
  { code: "LK", name: "Sri Lanka" }, { code: "SD", name: "Sudan" }, { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" }, { code: "SY", name: "Syria" }, { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" }, { code: "TZ", name: "Tanzania" }, { code: "TH", name: "Thailand" },
  { code: "TN", name: "Tunisia" }, { code: "TM", name: "Turkmenistan" }, { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" }, { code: "UY", name: "Uruguay" }, { code: "UZ", name: "Uzbekistan" },
  { code: "VE", name: "Venezuela" }, { code: "VN", name: "Vietnam" }, { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" }, { code: "ZW", name: "Zimbabwe" },
];

const ALL: CountryData[] = [
  ...DETAILED,
  ...OTHER_COUNTRIES.map((c) => ({ ...c, states: [] as StateData[] })),
].sort((a, b) => a.name.localeCompare(b.name));

// ---- Public API ---------------------------------------------------------
export function getCountries(): { code: string; name: string }[] {
  return ALL.map(({ code, name }) => ({ code, name }));
}

export function getStates(countryCode: string): string[] {
  const c = ALL.find((x) => x.code === countryCode);
  return c ? c.states.map((s) => s.name) : [];
}

export function getCities(countryCode: string, stateName: string): string[] {
  const c = ALL.find((x) => x.code === countryCode);
  if (!c) return [];
  const s = c.states.find((x) => x.name === stateName);
  return s ? s.cities : [];
}

export function countryHasStates(countryCode: string): boolean {
  return getStates(countryCode).length > 0;
}

export function getCountryName(code: string): string {
  return ALL.find((x) => x.code === code)?.name ?? code;
}
