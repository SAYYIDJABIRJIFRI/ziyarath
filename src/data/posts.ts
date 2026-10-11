import blog1 from "@/assets/blog-1.jpg";
import blog2 from "@/assets/blog-2.jpg";
import blog3 from "@/assets/blog-3.jpg";
import placeHaram from "@/assets/place-haram.jpg";
import placeNabawi from "@/assets/place-nabawi.jpg";
import placeMalik from "@/assets/place-malikdinar.jpg";
import kerala from "@/assets/kerala-heritage.jpg";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  isoDate: string;
  tag: string;
  author: string;
  readingTime: string;
  /** Array of HTML-safe paragraphs / headings. Use { h: "..." } for subheading. */
  content: Array<string | { h: string }>;
};

export const POSTS: BlogPost[] = [
  {
    slug: "history-of-malik-dinar-in-kerala",
    title: "History of Malik Dinar in Kerala",
    excerpt:
      "Tracing the journey of Islam's earliest envoy to the Malabar Coast and the mosques he is believed to have founded.",
    image: blog1,
    date: "May 12, 2026",
    isoDate: "2026-05-12",
    tag: "History",
    author: "Ziyarath Editorial",
    readingTime: "7 min read",
    content: [
      "Few names evoke the early history of Islam in India as profoundly as Malik Dinar. A companion of the Prophet Muhammad ﷺ in some traditions, and a tabi'i in others, his arrival on the Malabar Coast marks one of the earliest peaceful encounters between Islam and the Indian subcontinent.",
      { h: "The Journey to Malabar" },
      "According to the chronicles preserved in the Qissat Shakarwati Farmad, Malik Dinar travelled from Arabia to the kingdom of Cheraman Perumal — a Hindu monarch who is said to have witnessed the splitting of the moon and embarked on a journey to Mecca to embrace Islam. Following the king's instructions, Malik Dinar and his companions established the first mosques along the coast.",
      { h: "The Cheraman Juma Masjid" },
      "Built in 629 CE in present-day Methala, Kodungallur, the Cheraman Juma Masjid is widely regarded as the first mosque in the Indian subcontinent — and one of the oldest in the world. Its modest wooden structure, restored over centuries, still echoes the original Kerala vernacular architecture.",
      { h: "A Legacy Across the Coast" },
      "Malik Dinar is believed to have founded mosques in Kollam, Madayi, Barkur, Mangalore, Kasaragod, Srikandapuram and Dharmadam. His tomb in Thalangara, Kasaragod remains a site of ziyarath for thousands of pilgrims every year — a quiet, fragrant courtyard shaded by old trees, where history feels remarkably close.",
      "To walk these spaces is to remember that Islam came to India not by conquest, but through trade, conversation and the patient work of teachers like Malik Dinar.",
    ],
  },
  {
    slug: "islamic-heritage-in-india",
    title: "Islamic Heritage in India: A Thousand-Year Legacy",
    excerpt:
      "From the Deccan Sultanates to coastal mosques — exploring a thousand-year legacy etched into stone and memory.",
    image: blog2,
    date: "April 28, 2026",
    isoDate: "2026-04-28",
    tag: "Heritage",
    author: "Ziyarath Editorial",
    readingTime: "9 min read",
    content: [
      "India's Islamic heritage is not a single story but a tapestry — Persian, Turkic, Arab, Deccani, Bengali, Malabari — each thread woven into the soil of the subcontinent for more than a millennium.",
      { h: "Coastal Beginnings" },
      "Long before the Delhi Sultanate, Arab traders were sailing into Kerala and Gujarat. Mosques in Kodungallur, Kayalpattinam and Bhadreshwar predate Mughal architecture by centuries and reflect a quiet, indigenous Islam shaped by local craftsmen.",
      { h: "The Sultanates and Mughals" },
      "From the Qutb Minar in Delhi to the Charminar in Hyderabad, from Gol Gumbaz in Bijapur to the Taj Mahal in Agra, monumental architecture became a language of faith, governance and beauty. Each region developed its own dialect of design.",
      { h: "Living Heritage" },
      "Heritage is not only stone. It is the qawwali at Nizamuddin Dargah, the moulid recited in a Malabar madrasa, the bidri craft of Bidar, the kitabkhana of a Hyderabadi family. To preserve heritage is to keep these living traditions breathing.",
    ],
  },
  {
    slug: "importance-of-ziyarath-in-islam",
    title: "The Importance of Ziyarath in Islam",
    excerpt:
      "Understanding the meaning, etiquette and spiritual significance of visiting sacred places in the Islamic tradition.",
    image: blog3,
    date: "April 14, 2026",
    isoDate: "2026-04-14",
    tag: "Spirituality",
    author: "Ziyarath Editorial",
    readingTime: "6 min read",
    content: [
      "The word ziyarath comes from the Arabic root z-w-r — 'to visit'. In Islamic practice, it refers to visiting sacred places: the mosques of the Prophet ﷺ and his companions, the resting places of scholars and saints, and historical sites that connect the believer to the wider story of the ummah.",
      { h: "What the Prophet ﷺ Said" },
      "The Prophet Muhammad ﷺ said: 'I had previously forbidden you from visiting the graves, but visit them, for indeed they remind you of the Hereafter.' (Sahih Muslim). Visiting reminds us of mortality, gratitude and the fleeting nature of this life.",
      { h: "Etiquette of Ziyarath" },
      "Approach with humility. Offer salaam to the inhabitants of the place. Make du'a for them and for yourself. Avoid practices that contradict tawhid — ziyarath is remembrance, not intercession outside what Allah has ordained.",
      { h: "A Journey of the Heart" },
      "Done with sincerity, ziyarath becomes more than tourism — it is a pilgrimage of memory, a renewal of intention, and a quiet conversation with those who walked this path before us.",
    ],
  },
  {
    slug: "masjid-al-haram-the-heart-of-islam",
    title: "Masjid al-Haram: The Heart of Islam",
    excerpt:
      "A pilgrim's perspective on the Sacred Mosque of Mecca — its history, its architecture, and the spiritual weight of the Ka'bah.",
    image: placeHaram,
    date: "March 30, 2026",
    isoDate: "2026-03-30",
    tag: "Sacred Places",
    author: "Ziyarath Editorial",
    readingTime: "8 min read",
    content: [
      "Masjid al-Haram, the Sacred Mosque in Mecca, surrounds the Ka'bah — the qiblah toward which over a billion Muslims turn five times each day.",
      { h: "Origins" },
      "The Qur'an describes the Ka'bah as the first house built for the worship of Allah, raised by Ibrahim عليه السلام and his son Isma'il عليه السلام. Every stone of this place carries the memory of prophets.",
      { h: "Expansion Through the Ages" },
      "From a modest courtyard in early Islam to today's vast complex capable of hosting millions during Hajj, the mosque has been continually expanded — by the Umayyads, the Abbasids, the Ottomans and the modern Saudi state.",
      { h: "Inside the Sacred Precinct" },
      "Tawaf around the Ka'bah, sa'i between Safa and Marwa, the cool waters of Zamzam — these are not rituals to be checked off, but invitations to slow down and remember.",
    ],
  },
  {
    slug: "al-masjid-an-nabawi-the-prophets-mosque",
    title: "Al-Masjid an-Nabawi: The Prophet's Mosque",
    excerpt:
      "Walking through the second holiest mosque in Islam — built by the Prophet ﷺ himself in the city of Madinah.",
    image: placeNabawi,
    date: "March 16, 2026",
    isoDate: "2026-03-16",
    tag: "Sacred Places",
    author: "Ziyarath Editorial",
    readingTime: "7 min read",
    content: [
      "When the Prophet Muhammad ﷺ migrated to Madinah, the first community project he undertook was the building of a mosque. That mosque — simple, made of palm trunks and mud — would grow into Al-Masjid an-Nabawi.",
      { h: "The Rawdah" },
      "Between the Prophet's ﷺ pulpit and his blessed chamber lies the Rawdah, described in hadith as 'a garden from the gardens of Paradise.' Pilgrims wait patiently for the chance to pray two rak'ahs in this small, luminous space.",
      { h: "The Green Dome" },
      "The unmistakable green dome marks the resting place of the Prophet ﷺ alongside Abu Bakr and Umar رضي الله عنهما. To stand before it and offer salaam is, for many, the most emotional moment of their lives.",
    ],
  },
  {
    slug: "kerala-mosque-architecture-a-living-tradition",
    title: "Kerala Mosque Architecture: A Living Tradition",
    excerpt:
      "Sloping tiled roofs, carved wooden pillars and quiet courtyards — the unique vernacular of Malabar's mosques.",
    image: kerala,
    date: "March 2, 2026",
    isoDate: "2026-03-02",
    tag: "Heritage",
    author: "Ziyarath Editorial",
    readingTime: "6 min read",
    content: [
      "Unlike the domes and minarets of Mughal North India, Kerala's earliest mosques look almost like temples or traditional naalukettu houses — and that is precisely the point.",
      { h: "An Indigenous Islam" },
      "Built by local craftsmen using local materials — laterite, teak, terracotta tiles — these mosques are an architectural argument that Islam in Kerala grew from within, not imposed from without.",
      { h: "Notable Examples" },
      "The Cheraman Juma Masjid in Kodungallur, the Mishkal Mosque in Kozhikode, the Odathil Palli in Thalassery and the Juma Masjid in Ponnani each carry a distinct character while sharing a common visual language.",
      { h: "Why It Matters" },
      "Preserving these structures is not nostalgia — it is a reminder that Muslim heritage in India is plural, regional and deeply rooted.",
    ],
  },
  {
    slug: "the-dargah-of-mampuram-thangal",
    title: "The Dargah of Mampuram Thangal",
    excerpt:
      "The story of Sayyid Alawi Thangal — scholar, reformer, and a beloved figure of Malabar's spiritual landscape.",
    image: placeMalik,
    date: "February 16, 2026",
    isoDate: "2026-02-16",
    tag: "Scholars",
    author: "Ziyarath Editorial",
    readingTime: "7 min read",
    content: [
      "On the banks of the Kadalundi river in Malappuram stands the dargah of Sayyid Alawi Thangal — known to generations of Malayalis simply as Mampuram Thangal.",
      { h: "A Yemeni Scholar in Malabar" },
      "Born in Tarim, Hadhramaut in 1166 AH, Sayyid Alawi arrived in Malabar as a young man and quickly became one of the most respected scholars of his time, blending deep Islamic learning with an intimate care for the local community.",
      { h: "Spiritual and Social Reform" },
      "He did not separate piety from public life. His writings and sermons inspired the Mappila community to resist colonial oppression while staying anchored in Islamic ethics.",
      { h: "Visiting Today" },
      "The dargah today is a quiet, fragrant complex — a place where students, farmers, scholars and travellers all sit on the same floor, reciting Qur'an, making du'a, and remembering a man whose influence quietly shaped a region.",
    ],
  },
  {
    slug: "etiquette-of-visiting-mosques-as-a-traveller",
    title: "Etiquette of Visiting Mosques as a Traveller",
    excerpt:
      "A practical, respectful guide to entering, praying in, and learning from mosques during your travels.",
    image: blog2,
    date: "February 2, 2026",
    isoDate: "2026-02-02",
    tag: "Guides",
    author: "Ziyarath Editorial",
    readingTime: "5 min read",
    content: [
      "Whether you are a Muslim traveller seeking the local jama'at or a respectful visitor exploring heritage architecture, a mosque is first and foremost a house of worship.",
      { h: "Before You Enter" },
      "Dress modestly — long sleeves, long trousers or skirts, and a head covering for women. Remove your shoes at the entrance. Switch your phone to silent.",
      { h: "Inside" },
      "Walk quietly. Avoid stepping in front of someone praying. Photography is often allowed but always ask first, especially of worshippers.",
      { h: "Leaving With More Than Photos" },
      "Take a moment to sit. Listen. The best souvenir from a mosque is rarely an image — it is a quiet shift inside you.",
    ],
  },
];

export function getAllPosts(): BlogPost[] {
  return POSTS;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
