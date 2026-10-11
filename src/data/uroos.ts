export type UroosEntry = {
  text: string;
  url: string | null;
  pageId?: string;
};

export type UroosDay = {
  day: number;
  entries: UroosEntry[];
};

export type UroosMonth = {
  num: number;
  name: string;
  days: UroosDay[];
};

export const UROOS_MONTHS: UroosMonth[] = [
  {
    num: 1,
    name: "മുഹറം",
    days: [
      {
        day: 27,
        entries: [
          {
            text: "അഹ്മദ് കോയശാലിയാതി (റ), ചാലിയം",
            url: "https://ziyarathinfo.wordpress.com/2015/03/05/%e0%b4%85%e0%b4%b9%e0%b5%8d%e0%b4%ae%e0%b4%a6%e0%b5%8d-%e0%b4%95%e0%b5%8b%e0%b4%af%e0%b4%b6%e0%b4%be%e0%b4%b2%e0%b4%bf%e0%b4%af%e0%b4%be%e0%b4%a4%e0%b4%bf-%e0%b4%b1-%e0%b4%9a%e0%b4%be%e0%b4%b2/",
            pageId: "chaliyam-ahmad-koya-uroos",
          },
        ],
      },
      {
        day: 28,
        entries: [
          {
            text: "ശൈഖ് കുഞ്ഞി അഹ്മദ് (റ) (നൂഞ്ഞേരി ശൈഖ്)",
            url: "https://ziyarathinfo.wordpress.com/2015/03/05/%e0%b4%b6%e0%b5%88%e0%b4%96%e0%b5%8d-%e0%b4%95%e0%b5%81%e0%b4%9e%e0%b5%8d%e0%b4%9e%e0%b4%bf-%e0%b4%85%e0%b4%b9%e0%b5%8d%e0%b4%ae%e0%b4%a6%e0%b5%8d-%e0%b4%b1-%e0%b4%a8%e0%b5%82%e0%b4%9e%e0%b5%8d/",
            pageId: "noonjeri-shaikh-uroos",
          },
        ],
      },
    ],
  },
  {
    num: 2,
    name: "സ്വഫര്‍",
    days: [
      {
        day: 24,
        entries: [
          {
            text: "കുഞ്ഞഹമ്മദ് മുസ്‌ലിയാര്‍, പെരുമ്പടപ്പ് (പുത്തന്‍പള്ളി)",
            url: "https://ziyarathinfo.wordpress.com/2015/03/05/%e0%b4%95%e0%b5%81%e0%b4%9e%e0%b5%8d%e0%b4%9e%e0%b4%b9%e0%b4%ae%e0%b5%8d%e0%b4%ae%e0%b4%a6%e0%b5%8d-%e0%b4%ae%e0%b5%81%e0%b4%b8%e0%b5%8d%e2%80%8c%e0%b4%b2%e0%b4%bf%e0%b4%af%e0%b4%be%e0%b4%b0%e0%b5%8d/",
            pageId: "perumpadappu-puthanpalli-uroos",
          },
        ],
      },
    ],
  },
  {
    num: 3,
    name: "റബീഉല്‍ അവ്വല്‍",
    days: [
      {
        day: 7,
        entries: [
          {
            text: "മമ്പുറം ആണ്ട് നേർച്ച — സയ്യിദ് അലവി തങ്ങൾ & സയ്യിദ് ഫസൽ തങ്ങൾ",
            url: "https://en.wikipedia.org/wiki/Mamburam_Thangal",
            pageId: "mampuram-uroos",
          },
        ],
      },
    ],
  },
  {
    num: 4,
    name: "റബീഉല്‍ ആഖര്‍",
    days: [
      {
        day: 2,
        entries: [
          {
            text: "കണ്ണിയത്ത് അഹ്മദ് മുസ്‌ലിയാര്‍",
            url: "https://ziyarathinfo.wordpress.com/2015/03/05/%e0%b4%95%e0%b4%a3%e0%b5%8d%e0%b4%a3%e0%b4%bf%e0%b4%af%e0%b4%a4%e0%b5%8d%e0%b4%a4%e0%b5%8d-%e0%b4%85%e0%b4%b9%e0%b5%8d%e0%b4%ae%e0%b4%a6%e0%b5%8d-%e0%b4%ae%e0%b5%81%e0%b4%b8%e0%b5%8d%e2%80%8c%e0%b4%b2/",
            pageId: "kanniyath-ahmad-musliyar-uroos",
          },
        ],
      },
      {
        day: 4,
        entries: [
          {
            text: "സി.എം. വലിയുള്ളാഹി മടവൂർ ആണ്ട് നേർച്ച",
            url: null,
            pageId: "madavoor-uroos",
          },
        ],
      },
      {
        day: 12,
        entries: [
          {
            text: "ബീരാന്‍ ഔലിയ (റ), അമ്പങ്കുന്ന്",
            url: "https://ziyarathinfo.wordpress.com/2015/03/05/%e0%b4%ac%e0%b5%80%e0%b4%b0%e0%b4%be%e0%b4%a8%e0%b5%8d%e2%80%8d-%e0%b4%94%e0%b4%b2%e0%b4%bf%e0%b4%af-%e0%b4%b1-%e0%b4%85%e0%b4%ae%e0%b5%8d%e0%b4%aa%e0%b4%99%e0%b5%8d%e0%b4%95%e0%b5%81%e0%b4%a8/",
            pageId: "ambakkunnu-beeran-auliya-uroos",
          },
        ],
      },
      {
        day: 22,
        entries: [
          {
            text: "ബാനി ഹസ്രത് ശൈഖ് അബ്ദുല്‍ വഹാബ് (റ), വെല്ലൂര്‍",
            url: "https://ziyarathinfo.wordpress.com/2015/03/05/%e0%b4%ac%e0%b4%be%e0%b4%a8%e0%b4%bf-%e0%b4%b9%e0%b4%b8%e0%b5%8d%e0%b4%b0%e0%b4%a4%e0%b5%8d-%e0%b4%b6%e0%b5%88%e0%b4%96%e0%b5%8d-%e0%b4%85%e0%b4%ac%e0%b5%8d%e0%b4%a6%e0%b5%81%e0%b4%b2%e0%b5%8d/",
            pageId: "vellore-abdul-wahab-uroos",
          },
        ],
      },
      {
        day: 25,
        entries: [
          {
            text: "ഇമാമുല്‍ ഹറമൈനി അൽ ജുവൈനി",
            url: "https://ziyarathinfo.wordpress.com/2015/03/02/%e0%b4%87%e0%b4%ae%e0%b4%be%e0%b4%ae%e0%b5%81%e0%b4%b2%e0%b5%8d%e2%80%8d-%e0%b4%b9%e0%b4%b1%e0%b4%ae%e0%b5%88%e0%b4%a8%e0%b4%bf/",
            pageId: "imam-al-haramayn-uroos",
          },
        ],
      },
      {
        day: 29,
        entries: [
          {
            text: "വടകര മുഹമ്മദ് ഹാജി(റ), ചെറുവണ്ണൂര്‍",
            url: "https://ziyarathinfo.wordpress.com/2015/03/05/%e0%b4%9a%e0%b5%86%e0%b4%b1%e0%b5%81%e0%b4%b5%e0%b4%a3%e0%b5%8d%e0%b4%a3%e0%b5%82%e0%b4%b0%e0%b5%8d%e2%80%8d-%e0%b4%ae%e0%b5%81%e0%b4%b9%e0%b4%ae%e0%b5%8d%e0%b4%ae%e0%b4%a6%e0%b5%8d-%e0%b4%b9%e0%b4%be/",
            pageId: "cheruvannur-vadakara-muhammad-haji-uroos",
          },
        ],
      },
    ],
  },
  {
    num: 5,
    name: "ജമാദുല്‍ അവ്വല്‍",
    days: [
      {
        day: 1,
        entries: [
          {
            text: "ബീമാപള്ളി ഉറൂസ് മുബാറക് (ചന്ദനക്കുടം മഹോത്സവം)",
            url: null,
            pageId: "beemapally-uroos",
          },
        ],
      },
      {
        day: 14,
        entries: [
          {
            text: "പെരിങ്ങത്തൂർ വലിയ ഉറൂസ് — സയ്യിദ് സൈനുൽ ആബിദീൻ തങ്ങൾ",
            url: null,
            pageId: "peringathur-uroos",
          },
        ],
      },
      {
        day: 19,
        entries: [
          {
            text: "ഇമാം സുയൂഥ്വി(റ) മഖാം – ഈജിപ്ത്‌",
            url: "https://ziyarathinfo.wordpress.com/2015/02/26/%e0%b4%87%e0%b4%ae%e0%b4%be%e0%b4%82-%e0%b4%b8%e0%b5%81%e0%b4%af%e0%b5%82%e0%b4%a5%e0%b5%8d%e0%b4%b5%e0%b4%bf%e0%b4%b1-%e0%b4%88%e0%b4%9c%e0%b4%bf%e0%b4%aa%e0%b5%8d%e0%b4%a4%e0%b5%8d%e2%80%8c/",
            pageId: "imam-suyuti-uroos",
          },
        ],
      },
    ],
  },
  {
    num: 6,
    name: "ജമാദുല്‍ ആഖര്‍",
    days: [
      {
        day: 20,
        entries: [
          {
            text: "കോയാമുട്ടി വലി(റ), വാളക്കുളം",
            url: "https://ziyarathinfo.wordpress.com/2015/03/05/%e0%b4%95%e0%b5%8b%e0%b4%af%e0%b4%be%e0%b4%ae%e0%b5%81%e0%b4%9f%e0%b5%8d%e0%b4%9f%e0%b4%bf-%e0%b4%b5%e0%b4%b2%e0%b4%bf%e0%b4%b1-%e0%b4%b5%e0%b4%be%e0%b4%b3%e0%b4%95%e0%b5%8d%e0%b4%95%e0%b5%81/",
            pageId: "valakkulam-koyamutti-wali-uroos",
          },
        ],
      },
    ],
  },
  {
    num: 7,
    name: "റജബ്",
    days: [
      {
        day: 6,
        entries: [
          {
            text: "അജ്മീര്‍ ഖാജാ മുഈനുദ്ദീന്‍ ഹസന്‍ ചിശ്തി (റ)",
            url: "https://ziyarathinfo.wordpress.com/2015/02/23/%e0%b4%85%e0%b4%9c%e0%b5%8d%e0%b4%ae%e0%b5%80%e0%b4%b0%e0%b5%8d%e2%80%8d-%e0%b4%96%e0%b4%be%e0%b4%9c%e0%b4%be-%e0%b4%ae%e0%b5%81%e0%b4%88%e0%b4%a8%e0%b5%81%e0%b4%a6%e0%b5%8d%e0%b4%a6%e0%b5%80%e0%b4%a8/",
            pageId: "ajmer-khwaja-muinuddin-uroos",
          },
        ],
      },
      {
        day: 10,
        entries: [
          {
            text: "കുട്ട്യാമു മുസ്‌ലിയാര്‍ (ഖ.സി), തട്ടാങ്ങര",
            url: "https://ziyarathinfo.wordpress.com/2015/03/05/%e0%b4%95%e0%b5%81%e0%b4%9f%e0%b5%8d%e0%b4%9f%e0%b5%8d%e0%b4%af%e0%b4%be%e0%b4%ae%e0%b5%81-%e0%b4%ae%e0%b5%81%e0%b4%b8%e0%b5%8d%e2%80%8c%e0%b4%b2%e0%b4%bf%e0%b4%af%e0%b4%be%e0%b4%b0%e0%b5%8d%e2%80%8d/",
            pageId: "thattangara-kuttiyamu-musliyar-uroos",
          },
        ],
      },
      {
        day: 13,
        entries: [
          {
            text: "ഇമാം തിർമിദി, ഉസ്‌ബെക്കിസ്ഥാന്‍",
            url: "https://ziyarathinfo.wordpress.com/2015/03/02/%e0%b4%87%e0%b4%ae%e0%b4%be%e0%b4%82-%e0%b4%a4%e0%b5%81%e0%b4%b0%e0%b5%8d%e2%80%8d%e0%b4%ae%e0%b5%81%e0%b4%a6%e0%b4%bf/",
            pageId: "imam-tirmidhi-uroos",
          },
        ],
      },
      {
        day: 14,
        entries: [
          {
            text: "കൊണ്ടോട്ടി നേർച്ച — മുഹമ്മദ് ഷാഹ് തങ്ങൾ",
            url: null,
            pageId: "kondotty-nercha",
          },
        ],
      },
      {
        day: 23,
        entries: [
          {
            text: "ഇമാം ഇബ്‌നു ഹജര്‍ ഹൈതമി(റ)",
            url: "https://ziyarathinfo.wordpress.com/2015/03/04/%e0%b4%87%e0%b4%ae%e0%b4%be%e0%b4%82-%e0%b4%87%e0%b4%ac%e0%b5%8d%e2%80%8c%e0%b4%a8%e0%b5%81-%e0%b4%b9%e0%b4%9c%e0%b4%b0%e0%b5%8d%e2%80%8d-%e0%b4%b9%e0%b5%88%e0%b4%a4%e0%b4%ae%e0%b4%bf%e0%b4%b1/",
            pageId: "imam-ibn-hajar-al-haytami-uroos",
          },
        ],
      },
      {
        day: 25,
        entries: [
          {
            text: "ഇമാം മുസ്‌ലിം (റ)",
            url: "https://ziyarathinfo.wordpress.com/2015/03/02/%e0%b4%87%e0%b4%ae%e0%b4%be%e0%b4%82-%e0%b4%ae%e0%b5%81%e0%b4%b8%e0%b5%8d%e2%80%8c%e0%b4%b2%e0%b4%bf%e0%b4%82-%e0%b4%b1/",
            pageId: "imam-muslim-uroos",
          },
        ],
      },
    ],
  },
  {
    num: 8,
    name: "ശഅബാന്‍",
    days: [
      {
        day: 19,
        entries: [
          {
            text: "അറക്കല്‍ മൂപ്പര്‍ (കുഞ്ഞി മരക്കാര്‍) (ഖ.സി), പടിഞ്ഞാറങ്ങാടി",
            url: "https://ziyarathinfo.wordpress.com/2015/03/05/%e0%b4%85%e0%b4%b1%e0%b4%95%e0%b5%8d%e0%b4%95%e0%b4%b2%e0%b5%8d%e2%80%8d-%e0%b4%ae%e0%b5%82%e0%b4%aa%e0%b5%8d%e0%b4%aa%e0%b4%b0%e0%b5%8d%e2%80%8d-%e0%b4%95%e0%b5%81%e0%b4%9e%e0%b5%8d%e0%b4%9e/",
            pageId: "padinjarangadi-arakkal-mooppar-uroos",
          },
        ],
      },
    ],
  },
  {
    num: 9,
    name: "റമളാന്‍",
    days: [
      {
        day: 14,
        entries: [
          {
            text: "ഹസ്‌റത്ത്‌ നഥ്ഹര്‍ ബാദ്ശാഹ് തിരുച്ചിറപ്പള്ളി",
            url: "https://ziyarathinfo.wordpress.com/2015/03/02/%e0%b4%b9%e0%b4%b8%e0%b5%8d%e2%80%8c%e0%b4%b1%e0%b4%a4%e0%b5%8d%e0%b4%a4%e0%b5%8d%e2%80%8c-%e0%b4%a8%e0%b4%a5%e0%b5%8d%e0%b4%b9%e0%b4%b0%e0%b5%8d%e2%80%8d-%e0%b4%ac%e0%b4%be%e0%b4%a6%e0%b5%8d%e0%b4%b6/",
            pageId: "tiruchirappalli-nathahar-badshah-uroos",
          },
        ],
      },
    ],
  },
  {
    num: 10,
    name: "ശവ്വാല്‍",
    days: [
      {
        day: 1,
        entries: [
          {
            text: "ഇമാം ബുഖാരി(റ) മഖാം",
            url: "https://ziyarathinfo.wordpress.com/2015/02/23/%e0%b4%87%e0%b4%ae%e0%b4%be%e0%b4%82-%e0%b4%ac%e0%b5%81%e0%b4%96%e0%b4%be%e0%b4%b0%e0%b4%bf%e0%b4%b1/",
            pageId: "imam-bukhari-uroos",
          },
        ],
      },
      {
        day: 16,
        entries: [
          {
            text: "ഇമാം അബൂദാവൂദ് മഖാം, ബസ്വറ, ഇറാഖ്‌",
            url: "https://ziyarathinfo.wordpress.com/2015/03/02/%e0%b4%87%e0%b4%ae%e0%b4%be%e0%b4%82-%e0%b4%85%e0%b4%ac%e0%b5%82%e0%b4%a6%e0%b4%be%e0%b4%b5%e0%b5%82%e0%b4%a6%e0%b5%8d-%e0%b4%ae%e0%b4%96%e0%b4%be%e0%b4%82-%e0%b4%ac%e0%b4%b8%e0%b5%8d%e0%b4%b5/",
            pageId: "imam-abu-dawud-uroos",
          },
        ],
      },
      {
        day: 22,
        entries: [
          {
            text: "അബദുര്‍റഹ്മാന്‍ ശൈഖ് (റ) മഖാം, താനൂര്‍",
            url: "https://ziyarathinfo.wordpress.com/2015/03/05/%e0%b4%85%e0%b4%ac%e0%b4%a6%e0%b5%81%e0%b4%b0%e0%b5%8d%e2%80%8d%e0%b4%b1%e0%b4%b9%e0%b5%8d%e0%b4%ae%e0%b4%be%e0%b4%a8%e0%b5%8d%e2%80%8d-%e0%b4%b6%e0%b5%88%e0%b4%96%e0%b5%8d-%e0%b4%b1-%e0%b4%ae/",
            pageId: "tanur-abdurahman-shaikh-uroos",
          },
        ],
      },
    ],
  },
  {
    num: 11,
    name: "ദുല്‍ഖഅ്ദ്",
    days: [
      {
        day: 8,
        entries: [
          {
            text: "സയ്യിദ് ശൈഖ് ജിഫ്‌രി (റ) കോഴിക്കോട്",
            url: "https://ziyarathinfo.wordpress.com/2015/03/05/%e0%b4%b8%e0%b4%af%e0%b5%8d%e0%b4%af%e0%b4%bf%e0%b4%a6%e0%b5%8d-%e0%b4%b6%e0%b5%88%e0%b4%96%e0%b5%8d-%e0%b4%9c%e0%b4%bf%e0%b4%ab%e0%b5%8d%e2%80%8c%e0%b4%b0%e0%b4%bf-%e0%b4%b1-%e0%b4%95%e0%b5%8b/",
            pageId: "sayyid-jifri-kozhikode-uroos",
          },
        ],
      },
    ],
  },
  {
    num: 12,
    name: "ദുല്‍ഹിജ്ജ",
    days: [
      {
        day: 12,
        entries: [
          {
            text: "ശൈഖ്‌ സിറാജുദ്ദീന്‍(റ), ഐലക്കാട് (എടപ്പാള്‍)",
            url: "https://ziyarathinfo.wordpress.com/2015/03/05/%e0%b4%b6%e0%b5%88%e0%b4%96%e0%b5%8d%e2%80%8c-%e0%b4%b8%e0%b4%bf%e0%b4%b1%e0%b4%be%e0%b4%9c%e0%b5%81%e0%b4%a6%e0%b5%8d%e0%b4%a6%e0%b5%80%e0%b4%a8%e0%b5%8d%e2%80%8d%e0%b4%b1-%e0%b4%90%e0%b4%b2/",
            pageId: "edappal-shaikh-sirajuddin-uroos",
          },
        ],
      },
    ],
  },
];

export const SOURCE_URL = "https://ziyarathinfo.wordpress.com/%e0%b4%89%e0%b4%b1%e0%b5%82%e0%b4%b8%e0%b5%8d%e2%80%8c/";
