import coverKondotty from "@/assets/maqam-kondotty.jpg";
import coverMampuram from "@/assets/maqam-mampuram.jpg";
import coverAjmer from "@/assets/maqam-ajmer.jpg";
import coverKerala from "@/assets/kerala-heritage.jpg";
import coverMosque from "@/assets/hero-mosque.jpg";

export type MaqamRegion = "kerala" | "india" | "middle-east" | "worldwide";
export type MaqamCategory = "sahaba" | "sufi" | "scholar" | "shaheed" | "prophet";

export type MaqamImage = {
  src: string;
  caption?: string;
  alt?: string;
};

export type Maqam = {
  id: string;
  name: string;
  malayalamName?: string;
  location: string;
  city: string;
  country: string;
  region: MaqamRegion;
  category: MaqamCategory;
  era?: string;
  description: string;
  significance?: string;
  bestTimeToVisit?: string;
  sourceUrl?: string;
  coverImage?: string;
  images?: MaqamImage[];
  addressDetail?: string;
  visitingHours?: {
    label: string;
    hours: string;
  }[];
  nerchaa?: {
    title: string;
    description: string;
    month?: string;
  }[];
  howToReach?: {
    mode: string;
    details: string;
  }[];
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  facilities?: string[];
  history?: string;
  architecture?: string;
};

export const MAQAMS: Maqam[] = [
  {
    id: "mampuram",
    name: "Mampuram Maqam",
    coverImage: coverMampuram,
    malayalamName: "മമ്പുറം മഖാം",
    location: "Mampuram Juma Masjid",
    city: "Tirurangadi, Malappuram",
    country: "India",
    region: "kerala",
    category: "scholar",
    era: "19th century",
    description:
      "Resting place of Sayyid Alavi Thangal and Sayyid Fazal Pookoya Thangal, revered scholars and reformers of Malabar.",
    significance:
      "Center of spiritual learning and historic resistance during colonial Malabar.",
    bestTimeToVisit: "Rabi al-Awwal Uroos",
    sourceUrl: "https://en.wikipedia.org/wiki/Mamburam_Thangal",
    addressDetail:
      "Mampuram Juma Masjid, Tirurangadi, Malappuram District, Kerala 676102",
    visitingHours: [
      { label: "Daily Dars", hours: "Fajr to Isha" },
      { label: "Ziyarath access", hours: "Open 24 hours" },
      { label: "Office hours", hours: "9:00 AM – 5:00 PM" },
    ],
    nerchaa: [
      {
        title: "Rabi al-Awwal Uroos",
        description:
          "Grand annual gathering commemorating Sayyid Alavi Thangal. Devotees offer rice, flowers, and sweets. Special prayers and Mawlid recitations continue through the night.",
        month: "Rabi al-Awwal",
      },
      {
        title: "Monthly Nercha",
        description:
          "Regular monthly offerings of rice and coconut distributed to visitors and the needy.",
      },
    ],
    howToReach: [
      {
        mode: "By Air",
        details: "Calicut International Airport (CCJ) — 22 km away. Taxis available.",
      },
      {
        mode: "By Train",
        details: "Tirurangadi Railway Station — 2 km from the maqam. Auto-rickshaws frequent.",
      },
      {
        mode: "By Road",
        details: "NH 66 passes through Tirurangadi. Local buses from Malappuram and Calicut.",
      },
    ],
    contactInfo: {
      phone: "+91-494-xxx-xxxx",
    },
    facilities: ["Ablution area", "Restroom", "Parking", "Guest house", "Free drinking water"],
    history:
      "Sayyid Alavi Thangal arrived in Malabar from Yemen in 1798 and established the Mampuram Juma Masjid as a center of Islamic learning and spiritual guidance. The maqam became a symbol of resistance during British colonial rule.",
    architecture:
      "Traditional Kerala-Islamic architecture with laterite stone walls, teak wood ceilings, and ornate mihrab. The tomb chamber is adorned with green velvet and brass railings.",
  },
  {
    id: "kondotty",
    name: "Kondotty Khubba",
    coverImage: coverKondotty,
    malayalamName: "കൊണ്ടോട്ടി ഖുബ്ബ",
    location: "Kondotty Thakkiya",
    city: "Kondotty, Malappuram",
    country: "India",
    region: "kerala",
    category: "sufi",
    era: "18th century",
    description:
      "Shrine of Muhammad Shah Tangal, founder of the Kondotty Sufi tradition in Kerala.",
    significance: "Annual Nercha draws devotees from across South India.",
    bestTimeToVisit: "Rajab Nercha",
    addressDetail: "Kondotty Thakkiya, Kondotty, Malappuram District, Kerala 673638",
    visitingHours: [
      { label: "Dargah open", hours: "5:00 AM – 10:00 PM" },
      { label: "Special Qawwali", hours: "Every Thursday 7:00 PM" },
    ],
    nerchaa: [
      {
        title: "Rajab Nercha",
        description:
          "The grand annual Nercha in Rajab month. Devotees offer sandalwood paste, flowers, and special dishes. The Urs procession is a major cultural event in Malabar.",
        month: "Rajab",
      },
      {
        title: "Sandanakoodam",
        description:
          "Flag-raising ceremony marking the beginning of the Nercha season. Colorful processions with traditional percussion.",
      },
    ],
    howToReach: [
      {
        mode: "By Air",
        details: "Calicut International Airport (CCJ) — 18 km away.",
      },
      {
        mode: "By Train",
        details: "Feroke Railway Station — 12 km. Kondotty has local bus connectivity.",
      },
      {
        mode: "By Road",
        details: "Well connected via NH 966. Buses from Malappuram and Calicut every 30 minutes.",
      },
    ],
    facilities: ["Parking", "Restroom", "Ablution area", "Shops for offerings"],
    history:
      "Muhammad Shah Tangal, a Qadiri mystic from Yemen, established the Kondotty Thakkiya in the early 18th century. The shrine became the spiritual center of the Kondotty Sufi order, spreading across northern Kerala.",
    architecture:
      "Distinctive two-storied structure with a large prayer hall and the tomb chamber on the ground floor. The exterior features intricate wood carvings typical of Malabar mosque architecture.",
  },
  {
    id: "ponnani",
    name: "Ponnani Valiya Juma Masjid Maqbara",
    malayalamName: "പൊന്നാനി മഖ്ബറ",
    location: "Ponnani Valiya Juma Masjid",
    city: "Ponnani, Malappuram",
    country: "India",
    region: "kerala",
    category: "scholar",
    era: "16th century",
    description:
      "Burial site of Makhdoom scholars including Zainuddin Makhdoom I & II, the spiritual axis of Malabar.",
    significance: "Known as the Mecca of Malabar for centuries of Islamic scholarship.",
    addressDetail: "Ponnani Valiya Juma Masjid, Ponnani, Malappuram District, Kerala 679586",
    visitingHours: [
      { label: "Masjid open", hours: "Fajr to Isha prayers" },
      { label: "Maqbara access", hours: "After Fajr to before Maghrib" },
    ],
    howToReach: [
      {
        mode: "By Train",
        details: "Ponnani Railway Station — 3 km. Or Tirur Jn — 20 km.",
      },
      {
        mode: "By Road",
        details: "Buses from Malappuram, Thrissur, and Kochi. NH 66 connects to Ponnani road.",
      },
    ],
    facilities: ["Ablution area", "Library", "Restroom", "Parking"],
    history:
      "Ponnani has been a center of Islamic learning since the 7th century AH. Zainuddin Makhdoom I authored the famous Tuhfat al-Mujahidin here, chronicling the struggle against Portuguese colonialism.",
    architecture:
      "One of the oldest mosques in Kerala with massive laterite walls, teak pillars, and a traditional Kerala-style roof. The maqbara is located in a serene courtyard behind the main prayer hall.",
  },
  {
    id: "beemapally",
    name: "Beemapally Dargah",
    malayalamName: "ബീമാപള്ളി ദർഗ",
    location: "Beemapally Mosque",
    city: "Thiruvananthapuram",
    country: "India",
    region: "kerala",
    category: "sufi",
    era: "Medieval",
    description:
      "Dargah of Beema Beevi, a revered woman saint from Arabia who settled in Kerala.",
    bestTimeToVisit: "Annual Uroos in Jumada al-Akhir",
    addressDetail: "Beemapally Dargah, Thiruvananthapuram, Kerala 695008",
    visitingHours: [
      { label: "Dargah open", hours: "5:30 AM – 9:00 PM" },
    ],
    nerchaa: [
      {
        title: "Beemapally Uroos",
        description:
          "The major annual festival drawing devotees of all faiths. Offerings include pongala (sweet rice) prepared by thousands of women devotees.",
        month: "Jumada al-Akhir",
      },
    ],
    howToReach: [
      {
        mode: "By Air",
        details: "Thiruvananthapuram International Airport (TRV) — 5 km away.",
      },
      {
        mode: "By Train",
        details: "Thiruvananthapuram Central — 7 km. Local buses and auto-rickshaws available.",
      },
    ],
    facilities: ["Ablution area", "Restroom", "Parking", "Shops for offerings"],
    history:
      "Beema Beevi is believed to have arrived from Arabia with her son Sayyid Hasan. The dargah is one of the few major shrines in Kerala dedicated to a woman saint, attracting devotees across religious boundaries.",
    architecture:
      "The tomb is covered with green silk and housed in a small but beautifully maintained chamber. The compound includes a mosque and a large open area for festival gatherings.",
  },
  {
    id: "ajmer",
    name: "Ajmer Sharif Dargah",
    location: "Khwaja Moinuddin Chishti Dargah",
    city: "Ajmer, Rajasthan",
    country: "India",
    region: "india",
    category: "sufi",
    era: "12th–13th century",
    description:
      "Shrine of Khwaja Moinuddin Chishti, founder of the Chishti order in the subcontinent.",
    significance: "One of the most visited Sufi shrines in the world.",
    bestTimeToVisit: "Annual Urs in Rajab",
    sourceUrl: "https://en.wikipedia.org/wiki/Ajmer_Sharif_Dargah",
    addressDetail: "Dargah Sharif, Ajmer, Rajasthan 305001, India",
    visitingHours: [
      { label: "Dargah open", hours: "4:00 AM – 10:00 PM" },
      { label: "Khidmat", hours: "Continuous" },
      { label: "Qawwali", hours: "After Maghrib daily" },
    ],
    nerchaa: [
      {
        title: "Urs Sharif",
        description:
          "The grand Urs commemorating the wafaat of Khwaja Sahib. Devotees offer chadars, flowers, and nazrana. The six-day festival culminates in the Qul ceremony.",
        month: "Rajab",
      },
      {
        title: "Daily Langar",
        description:
          "Free community meals served to all visitors regardless of faith, a tradition maintained for over 800 years.",
      },
    ],
    howToReach: [
      {
        mode: "By Air",
        details: "Jaipur International Airport (JAI) — 135 km. Kishangarh Airport (KQH) — 30 km.",
      },
      {
        mode: "By Train",
        details: "Ajmer Junction (AII) — 2 km from Dargah. Well connected to Delhi, Mumbai, Jaipur.",
      },
      {
        mode: "By Road",
        details: "NH 48 connects Ajmer to Jaipur and Delhi. State and private buses available.",
      },
    ],
    contactInfo: {
      website: "https://www.ajmer sharif.com",
    },
    facilities: ["Langar (free meals)", "Restroom", "Ablution area", "Guest houses", "Shops for offerings", "Parking"],
    history:
      "Khwaja Moinuddin Chishti arrived in Ajmer in 1192 and spent his life spreading the message of love and tolerance. The Chishti order became the most influential Sufi order in the Indian subcontinent.",
    architecture:
      "The white marble dome and the massive Buland Darwaza (great gate) built by various rulers including Humayun and the Nizam of Hyderabad. The sanctum sanctorum houses the silver railing around the tomb.",
  },
  {
    id: "nizamuddin",
    name: "Nizamuddin Dargah",
    location: "Hazrat Nizamuddin Auliya Dargah",
    city: "New Delhi",
    country: "India",
    region: "india",
    category: "sufi",
    era: "14th century",
    description:
      "Resting place of Hazrat Nizamuddin Auliya, the celebrated Chishti master of Delhi.",
    bestTimeToVisit: "Thursday Qawwali evenings",
    addressDetail: "Nizamuddin West, New Delhi, Delhi 110013, India",
    visitingHours: [
      { label: "Dargah open", hours: "5:00 AM – 10:00 PM" },
      { label: "Qawwali", hours: "Every Thursday, 6:00 PM – 9:00 PM" },
    ],
    nerchaa: [
      {
        title: "Thursday Qawwali",
        description:
          "Famous Qawwali sessions every Thursday evening. Devotees offer flowers, chadars, and sweets. The atmosphere is charged with spiritual devotion and music.",
      },
      {
        title: "Urs",
        description:
          "Annual commemoration of Hazrat Nizamuddin Auliya with special prayers, Sufi music, and distribution of langar.",
      },
    ],
    howToReach: [
      {
        mode: "By Metro",
        details: "JLN Stadium Metro Station (Violet Line) — 1 km. Nizamuddin Railway Station — 500 m.",
      },
      {
        mode: "By Road",
        details: "Located in central Delhi. Auto-rickshaws and cabs available from all parts of the city.",
      },
    ],
    facilities: ["Langar", "Restroom", "Ablution area", "Shops for offerings", "Parking (nearby)"],
    history:
      "Hazrat Nizamuddin Auliya was a disciple of Baba Farid and became one of the most revered Sufi saints of Delhi. His shrine has been a center of spiritual life in Delhi for over 700 years.",
    architecture:
      "The complex includes the tomb of Nizamuddin Auliya, the Jamaat Khana mosque, and the tombs of Amir Khusrow and Jahanara Begum. The white marble tomb is set amid a marble courtyard.",
  },
  {
    id: "baghdad",
    name: "Shaykh Abdul Qadir Jilani Shrine",
    location: "Al-Gilani Mosque",
    city: "Baghdad",
    country: "Iraq",
    region: "middle-east",
    category: "sufi",
    era: "12th century",
    description:
      "Shrine of Muhiyuddin Abdul Qadir Jilani, the Ghaus al-Azam and founder of the Qadiri order.",
    bestTimeToVisit: "11th of Rabi al-Thani (Giyarvi Sharif)",
    addressDetail: "Bab al-Sheikh, Baghdad, Iraq",
    visitingHours: [
      { label: "Shrine open", hours: "Open 24 hours" },
      { label: "Prayer times", hours: "Five daily congregational prayers" },
    ],
    nerchaa: [
      {
        title: "Giyarvi Sharif",
        description:
          "The annual Urs on the 11th of Rabi al-Thani, commemorating the passing of Ghawth al-Azam. Millions of devotees visit from across the world.",
        month: "Rabi al-Thani",
      },
      {
        title: "Daily Zikr",
        description:
          "Continuous zikr and recitation of the Qadiri litanies around the tomb.",
      },
    ],
    howToReach: [
      {
        mode: "By Air",
        details: "Baghdad International Airport (BGW) — 20 km from the shrine.",
      },
      {
        mode: "By Road",
        details: "Located in Bab al-Sheikh district, central Baghdad. Taxis are the main mode of transport.",
      },
    ],
    facilities: ["Ablution area", "Restroom", "Guest house", "Shops for offerings"],
    history:
      "Shaykh Abdul Qadir Jilani was born in Gilan, Persia, and settled in Baghdad where he became the most influential Sufi master of his era. The Qadiri order spread across the Islamic world and into India, Africa, and Southeast Asia.",
    architecture:
      "The shrine features a large green dome and a vast courtyard. The tomb chamber is adorned with gold-plated railings, chandeliers, and rich carpets. The surrounding complex includes a library and several madrasas.",
  },
  {
    id: "rumi",
    name: "Mevlana Rumi Shrine",
    location: "Mevlana Museum",
    city: "Konya",
    country: "Turkey",
    region: "middle-east",
    category: "sufi",
    era: "13th century",
    description:
      "Tomb of Mawlana Jalaluddin Rumi, the renowned Persian poet and Sufi master.",
    bestTimeToVisit: "Şeb-i Arus (17 December)",
    addressDetail: "Mevlana Museum, Aziziye Mahallesi, Konya, Turkey",
    visitingHours: [
      { label: "Museum open", hours: "9:00 AM – 5:30 PM (Tue–Sun)" },
      { label: "Whirling Dervish", hours: "Saturdays 7:00 PM (seasonal)" },
    ],
    nerchaa: [
      {
        title: "Şeb-i Arus",
        description:
          "The 'Night of Union' on 17 December, commemorating Rumi's reunion with the Divine. The ceremony features the famous Sema (whirling dervish) ritual.",
        month: "December",
      },
    ],
    howToReach: [
      {
        mode: "By Air",
        details: "Konya Airport (KYA) — 18 km from city center. Direct flights from Istanbul.",
      },
      {
        mode: "By Train",
        details: "High-speed rail from Istanbul (4.5 hours) and Ankara (1.5 hours).",
      },
      {
        mode: "By Road",
        details: "Well connected by highway from Ankara, Istanbul, and Antalya.",
      },
    ],
    facilities: ["Museum shop", "Cafe", "Restroom", "Parking", "Guided tours"],
    history:
      "Mawlana Jalaluddin Rumi came to Konya as a child and later became the leader of the Mevlevi order. His poetry, especially the Mathnawi, is considered one of the greatest spiritual works in any language.",
    architecture:
      "The fluted turquoise dome is iconic. The interior features the tomb under a massive canopy, the dervish cells, and a priceless collection of medieval manuscripts and musical instruments.",
  },
  {
    id: "uwais",
    name: "Uwais al-Qarani Shrine",
    location: "Raqqa governorate",
    city: "Raqqa",
    country: "Syria",
    region: "middle-east",
    category: "sahaba",
    era: "1st century AH",
    description:
      "Maqam of Uwais al-Qarani, the Yemeni follower beloved by the Prophet ﷺ.",
    addressDetail: "Uwais al-Qarani Mosque, Raqqa Governorate, Syria",
    visitingHours: [
      { label: "Mosque open", hours: "Open 24 hours" },
    ],
    howToReach: [
      {
        mode: "By Road",
        details: "Located near Raqqa city. Access depends on current conditions.",
      },
    ],
    facilities: ["Mosque", "Ablution area"],
    history:
      "Uwais al-Qarani was a Yemeni follower of the Prophet ﷺ who never met him in person but was praised by the Prophet for his devotion. He is considered a symbol of sincere love for the Prophet.",
    architecture:
      "The shrine mosque has been rebuilt several times. The simple tomb is set within a prayer hall with white marble floors.",
  },
  {
    id: "madina-baqi",
    name: "Jannat al-Baqi",
    location: "Adjacent to Masjid an-Nabawi",
    city: "Madina",
    country: "Saudi Arabia",
    region: "middle-east",
    category: "sahaba",
    era: "1st century AH",
    description:
      "Sacred cemetery containing many companions, family of the Prophet ﷺ, and early scholars.",
    significance: "One of the holiest burial grounds in Islam.",
    addressDetail: "Jannat al-Baqi, Al Haram, Madina 42311, Saudi Arabia",
    visitingHours: [
      { label: "Open for Ziyarath", hours: "After Fajr to before Maghrib" },
      { label: "Best times", hours: "Early morning and late afternoon" },
    ],
    howToReach: [
      {
        mode: "By Air",
        details: "Prince Mohammad bin Abdulaziz Airport (MED) — 15 km from city center.",
      },
      {
        mode: "By Road",
        details: "Walking distance from Masjid an-Nabawi. Located directly to the east of the mosque.",
      },
    ],
    facilities: ["Ablution area", "Restroom", "Guided information"],
    history:
      "Jannat al-Baqi was the first cemetery in Madina. The Prophet ﷺ used to visit it frequently and pray for its inhabitants. It contains the graves of many of the Prophet's family members and closest companions.",
    architecture:
      "The cemetery has been rebuilt and expanded over centuries. The simple stone markers follow the Islamic tradition of modest graves without elaborate structures.",
  },
];

export const REGION_LABELS: Record<MaqamRegion, string> = {
  kerala: "Kerala",
  india: "India",
  "middle-east": "Middle East",
  worldwide: "Worldwide",
};

export const CATEGORY_LABELS: Record<MaqamCategory, string> = {
  sahaba: "Sahaba",
  sufi: "Sufi Masters",
  scholar: "Scholars",
  shaheed: "Shuhada",
  prophet: "Anbiya",
};
