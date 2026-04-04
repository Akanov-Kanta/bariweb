/* eslint-disable @typescript-eslint/no-explicit-any */
export const landingTranslations: Record<string, any> = {
  ru: {
    navbar: {
      embed: "Встроить скрипт",
      docs: "Документация",
      payment: "Тарифы",
    },
    hero: {
      title: "Сделайте ваш сайт инклюзивным за 1 день. Избежите штрафов.",
      deadline: "Дедлайн Цифрового кодекса РК",
      timeLeft: "Осталось:",
      days: "дней",
      hours: "часов",
    },
    scroll: {
      problem: "Проблема: перегруженные интерфейсы.",
      problemDesc: "Избыток баннеров, плохой контраст и мелкий шрифт делают современные сайты недоступными для 15% аудитории.",
      scan: "Интеллектуальный скан DOM-дерева.",
      scanDesc: "За доли секунды Bariweb анализирует каждый узел страницы, выявляя и устраняя нарушения доступности.",
      voice: "Голосовой AI-Ассистент.",
      voiceDesc: "Встроенный агент понимает команды, сам находит нужные поля и заполняет формы вместо пользователя.",
      result: "Абсолютная доступность.",
      resultDesc: "Сайт автоматически соответствует стандартам WCAG 2.1 AA. Ваша кодовая база остается нетронутой.",
      demoUI: {
        messyBank: "Банк",
        credits: "КРЕДИТ 0%",
        ad: "ВОЗЬМИ КРЕДИТ СЕЙЧАС!!!",
        adSmall: "Мелкий нечитаемый текст условия акции",
        cleanBank: "TrustBank",
        balance: "Ваш баланс",
        transfers: "Переводы",
        payments: "Платежи",
        payTaxes: "Оплата налогов",
        iinTarget: "ИИН",
        findTarget: "Найти долг",
        voiceMic: "Слушаю команду...",
        voiceTyping: "Заполняю ИИН...",
        voiceSuccess: "Запрос отправлен."
      }
    },
    bento: {
      title1: "Единственное решение",
      title2: "для легальной инклюзивности.",
      scanTitle: "Мгновенная реструктуризация",
      scanDesc: "Алгоритм перестраивает структуру на лету, улучшая читаемость без участия ваших разработчиков.",
      autoTitle: "Авто-навигация",
      autoDesc: "Наш агент решает сложные задачи за людей с моторными и когнитивными нарушениями.",
      codeTitle: "Цифровой Кодекс РК",
      codeDesc: "Юридическая защита от штрафов до 500 МРП. Стопроцентное соответствие закону с 2026 года.",
      perfTitle: "Незаметен для сервера",
      perfDesc: "Асинхронный скрипт кэшируется в CDN и не влияет на метрики Web Core Vitals.",
    },
    integration: {
      title1: "Одна строка кода.",
      title2: "Всё остальное — магия.",
      desc: "Вставьте тег скрипта в <head>. Bariweb всё сделает сам: расставит ARIA-атрибуты, исправит контраст и настроит навигацию.",
    },
    pricing: {
      title1: "Дешевле, чем штраф.",
      title2: "Надежнее редизайна.",
      calcTitle: "Калькулятор ваших рисков по Цифровому кодексу",
      calcEmployees: "Размер компании",
      calcPeople: "сотрудников",
      calcPenalty: "Риск штрафа (МРП-эквивалент):",
      calcSavings: "Чистая экономия с нами:",
      starter: "Выбрать Starter",
      business: "Выбрать Business",
      enterprise: "Запросить Enterprise",
      hit: "ПОПУЛЯРНЫЙ",
      mo: "/мес",
    },
    paymentPage: {
      title: "Оформление подписки",
      desc: "Настройте ваш план для полного соответствия Цифровому кодексу.",
      plan: "Выбранный тариф",
      monthly: "Месячный",
      annual: "Годовой",
      save20: "экономия 20%",
      billingInfo: "Платежные данные",
      name: "Имя на карте",
      cardNum: "Номер карты",
      expiry: "Срок",
      cvc: "CVC",
      payBtn: "Оплатить",
      processing: "Обработка платежа...",
      success: "Оплата успешно прошла!",
      secureMessage: "Платеж защищен AES-256 шифрованием через CloudPayments."
    },
    footer: {
      desc: "Ведущая B2B-платформа цифровой доступности. Делаем интернет инклюзивным по всему Казахстану.",
      product: "Платформа",
      docs: "Для разработчиков",
      company: "О компании",
    },
    docsPage: {
      title: "Документация по интеграции",
      desc: "Внедрите Bariweb в вашу инфраструктуру за 2 минуты. Здесь собраны инструкции по установке и настройке параметров виджета.",
      quickStart: "Примеры кода",
      html: "HTML / Vanilla JS",
      react: "React / Next.js",
      vue: "Vue.js",
      sidebar: {
        category1: "Платформа",
        items1: {
          intro: "О технологии Bariweb",
          architecture: "Архитектура решения",
          security: "Безопасность и GDPR"
        },
        category2: "Интеграция",
        items2: {
          vanilla: "HTML / WordPress",
          react: "React / Next.js",
          vue: "Vue / Nuxt"
        },
        category3: "Справочник",
        items3: {
          config: "JS Конфигурация",
          callbacks: "События (Callbacks)",
          css: "Кастомизация стилей"
        }
      },
      content: {
        intro: {
          title: "О технологии Bariweb",
          body: "Bariweb работает как невидимый слой (overlay) поверх существующей DOM-структуры. Он перехватывает ошибки доступности и динамически внедряет инклюзивные решения."
        },
        architecture: {
          title: "Архитектура решения",
          body: "Виджет загружается асинхронно через глобальную сеть Cloudflare CDN (node: KZ-ALA). Вычисления ML-агента происходят локально в браузере с помощью WebAssembly, обеспечивая нулевую задержку."
        },
        security: {
          title: "Безопасность и GDPR",
          body: "Bariweb не собирает PII (персональные данные). Агент работает исключительно с разметкой. Скрипт прошел аудит безопасности SOC2 Type II."
        },
        vanilla: {
          title: "Установка для HTML / Vanilla",
          body: "Для статических сайтов и CMS (WordPress, Tilda) вставьте скрипт прямо перед закрывающимся тегом </head>:",
          code: "<!-- Bariweb Script -->\n<script src=\"https://cdn.bariweb.kz/v2.js\" client_id=\"YOUR_API_KEY\"></script>"
        },
        react: {
          title: "Установка для React / Next.js",
          body: "В Next.js мы рекомендуем использовать встроенный компонент next/script со стратегией beforeInteractive.",
          code: "import Script from 'next/script';\n\nexport default function RootLayout({ children }) {\n  return (\n    <html>\n      <head>\n        <Script src=\"https://cdn.bariweb.kz/v2.js\" strategy=\"beforeInteractive\" client_id=\"APP_KEY\" />\n      </head>\n      <body>{children}</body>\n    </html>\n  );\n}"
        },
        vue: {
          title: "Установка для Vue / Nuxt",
          body: "Для Vue.js или Nuxt.js добавьте директиву в nuxt.config.ts или напрямую в index.html.",
          code: "export default defineNuxtConfig({\n  app: {\n    head: {\n      script: [{ src: 'https://cdn.bariweb.kz/v2.js', 'client_id': 'YOUR_API_KEY' }]\n    }\n  }\n})"
        },
        config: {
          title: "Объект конфигурации",
          body: "Помимо data-атрибутов, вы можете передать объект window.BariwebConfig для глубокой настройки.",
          code: "window.BariwebConfig = {\n  locale: 'ru',\n  position: 'bottom-right',\n  theme: 'dark',\n  disableVoice: false\n};"
        },
        callbacks: {
          title: "Подписка на события",
          body: "Вы можете слушать события сканирования и работы AI-агента.",
          code: "window.addEventListener('bariweb:ready', () => {\n  console.log('Виджет инициализирован');\n});\nwindow.addEventListener('bariweb:action', (e) => {\n  console.log('Пользователь активировал функцию', e.detail);\n});"
        },
        css: {
          title: "Кастомизация стилей",
          body: "Переопределите стандартные CSS-переменные внутри :root, чтобы стилизовать кнопку открытия виджета под ваш бренд.",
          code: ":root {\n  --al-primary: #c8ff00;\n  --al-background: #000000;\n  --al-radius: 8px;\n}"
        }
      }
    }
  },
  
  kz: {
    navbar: {
      embed: "Скриптті орнату",
      docs: "Құжаттама",
      payment: "Тарифтер",
    },
    hero: {
      title: "Сайтыңызды 1 күнде инклюзивті етіңіз. Айыппұлдардан сақтаныңыз.",
      deadline: "ҚР Цифрлық кодексінің дедлайны",
      timeLeft: "Қалды:",
      days: "күн",
      hours: "сағат",
    },
    scroll: {
      problem: "Мәселе: шамадан тыс жүктелген интерфейстер.",
      problemDesc: "Баннерлердің көптігі, нашар контраст және ұсақ қаріптер заманауи сайттарды аудиторияның 15%-на қолжетімсіз етеді.",
      scan: "DOM-ағашының зияткерлік сканерлеуі.",
      scanDesc: "Bariweb секундтың ішінде беттің әрбір түйінін талдап, қолжетімділік ережелерін бұзушылықты табады және жояды.",
      voice: "Дауыстық AI-Ассистент.",
      voiceDesc: "Кіріктірілген агент пәрмендерді түсінеді, қажетті өрістерді өзі табады және пайдаланушының орнына формаларды толтырады.",
      result: "Толық қолжетімділік.",
      resultDesc: "Сайт автоматты түрде WCAG 2.1 AA стандарттарына сәйкес келеді. Кодтық базаңыз еш өзгеріссіз қалады.",
      demoUI: {
        messyBank: "Банк",
        credits: "НЕСИЕ 0%",
        ad: "ҚАЗІР НЕСИЕ АЛЫҢЫЗ!!!",
        adSmall: "Науқанның түсініксіз шарттары",
        cleanBank: "TrustBank",
        balance: "Сіздің балансыңыз",
        transfers: "Аудармалар",
        payments: "Төлемдер",
        payTaxes: "Салық төлеу",
        iinTarget: "ЖСН",
        findTarget: "Қарызды табу",
        voiceMic: "Пәрменді тыңдаудамын...",
        voiceTyping: "ЖСН толтырудамын...",
        voiceSuccess: "Сұраныс жіберілді."
      }
    },
    bento: {
      title1: "Заңды инклюзивтілік үшін",
      title2: "жалғыз шешім.",
      scanTitle: "Лезде құрылымды өзгерту",
      scanDesc: "Алгоритм әзірлеушілеріңіздің қатысуынсыз оқуға ыңғайлылықты жақсарта отырып, құрылымды қайта құрады.",
      autoTitle: "Авто-навигация",
      autoDesc: "Біздің агент моторикалық және когнитивтік бұзылыстары бар адамдар үшін күрделі мәселелерді шешеді.",
      codeTitle: "ҚР Цифрлық Кодексі",
      codeDesc: "500 АЕК-ке дейінгі айыппұлдардан заңды түрде қорғау. 2026 жылдан бастап заңға 100% сәйкестік.",
      perfTitle: "Серверге әсер етпейді",
      perfDesc: "Асинхронды скрипт CDN кэшінде сақталады және Web Core Vitals көрсеткіштеріне әсер етпейді.",
    },
    integration: {
      title1: "Бір жол код.",
      title2: "Қалғаны — сиқыр.",
      desc: "Скрипт тегін <head> ішіне қойыңыз. Bariweb барлығын өзі жасайды: ARIA-атрибуттарын орнатады, контрастты түзетеді.",
    },
    pricing: {
      title1: "Айыппұлдан арзан.",
      title2: "Редизайннан сенімдірек.",
      calcTitle: "Тәуекелдерді есептеу калькуляторы (Цифрлық кодекс)",
      calcEmployees: "Компания көлемі",
      calcPeople: "қызметкер",
      calcPenalty: "Айыппұл қаупі (АЕК):",
      calcSavings: "Бізбен бірге таза үнемдеу:",
      starter: "Starter таңдау",
      business: "Business таңдау",
      enterprise: "Enterprise сұрау",
      hit: "КӨП ТАҢДАЛАТЫН",
      mo: "/ай",
    },
    paymentPage: {
      title: "Жазылымды рәсімдеу",
      desc: "Цифрлық кодекске толық сәйкес болу үшін жоспарыңызды баптаңыз.",
      plan: "Таңдалған тариф",
      monthly: "Айлық",
      annual: "Жылдық",
      save20: "20% үнемдеу",
      billingInfo: "Төлем деректері",
      name: "Картадағы аты",
      cardNum: "Карта нөмірі",
      expiry: "Мерзімі",
      cvc: "CVC",
      payBtn: "Төлеу",
      processing: "Төлемді өңдеу...",
      success: "Төлем сәтті өтті!",
      secureMessage: "Төлем CloudPayments арқылы AES-256 стандартымен қорғалған."
    },
    footer: {
      desc: "Жетекші B2B цифрлық қолжетімділік платформасы. Бүкіл Қазақстан бойынша интернетті инклюзивті етеміз.",
      product: "Платформа",
      docs: "Әзірлеушілерге",
      company: "Компания туралы",
    },
    docsPage: {
      title: "Интеграциялық құжаттама",
      desc: "Bariweb жүйесін 2 минут ішінде орнатыңыз. Бұл жерде виджетті орнату және баптау нұсқаулары жинақталған.",
      quickStart: "Код мысалдары",
      html: "HTML / Vanilla JS",
      react: "React / Next.js",
      vue: "Vue.js",
      sidebar: {
        category1: "Платформа",
        items1: {
          intro: "Bariweb технологиясы туралы",
          architecture: "Шешім архитектурасы",
          security: "Қауіпсіздік және GDPR"
        },
        category2: "Интеграция",
        items2: {
          vanilla: "HTML / WordPress",
          react: "React / Next.js",
          vue: "Vue / Nuxt"
        },
        category3: "Анықтамалық",
        items3: {
          config: "JS Конфигурация",
          callbacks: "Оқиғалар (Callbacks)",
          css: "Стильдерді өзгерту"
        }
      },
      content: {
        intro: {
          title: "Bariweb технологиясы туралы",
          body: "Bariweb бар DOM-құрылымның үстінен көрінбейтін қабат (overlay) ретінде жұмыс істейді. Ол қолжетімділік қателерін ұстап, инклюзивті шешімдерді динамикалық түрде енгізеді."
        },
        architecture: {
          title: "Шешім архитектурасы",
          body: "Виджет Cloudflare CDN (Node: KZ-ALA) жаһандық желісі арқылы асинхронды түрде жүктеледі. ML агентінің есептеулері WebAssembly көмегімен браузерде жергілікті түрде өтеді."
        },
        security: {
          title: "Қауіпсіздік және GDPR",
          body: "Bariweb PII жинамайды. Агент тек белгілеумен ғана жұмыс істейді. Скрипт SOC2 Type II қауіпсіздік аудитінен сәтті өтті."
        },
        vanilla: {
          title: "HTML / Vanilla үшін орнату",
          body: "Статикалық сайттар мен CMS (WordPress, Tilda) үшін скриптті </head> жабылатын тегінің алдына енгізіңіз:",
          code: "<!-- Bariweb Script -->\n<script src=\"https://cdn.bariweb.kz/v2.js\" client_id=\"Сіздің_КІЛТІҢІЗ\"></script>"
        },
        react: {
          title: "React / Next.js үшін орнату",
          body: "Next.js-те beforeInteractive стратегиясы бар кірістірілген next/script компонентін пайдалануды ұсынамыз.",
          code: "import Script from 'next/script';\n\nexport default function RootLayout({ children }) {\n  return (\n    <html>\n      <head>\n        <Script src=\"https://cdn.bariweb.kz/v2.js\" strategy=\"beforeInteractive\" client_id=\"APP_KEY\" />\n      </head>\n      <body>{children}</body>\n    </html>\n  );\n}"
        },
        vue: {
          title: "Vue / Nuxt үшін орнату",
          body: "Vue.js немесе Nuxt.js үшін nuxt.config.ts файлында немесе тікелей index.html ішіне қосыңыз.",
          code: "export default defineNuxtConfig({\n  app: {\n    head: {\n      script: [{ src: 'https://cdn.bariweb.kz/v2.js', 'client_id': 'YOUR_API_KEY' }]\n    }\n  }\n})"
        },
        config: {
          title: "Конфигурация объектісі",
          body: "Data-атрибуттарынан бөлек, терең баптау үшін window.BariwebConfig объектісін бере аласыз.",
          code: "window.BariwebConfig = {\n  locale: 'kz',\n  position: 'bottom-right',\n  theme: 'dark',\n  disableVoice: false\n};"
        },
        callbacks: {
          title: "Оқиғаларға жазылу",
          body: "Сканерлеу және AI-агенттің жұмыс оқиғаларын тыңдай аласыз.",
          code: "window.addEventListener('bariweb:ready', () => {\n  console.log('Виджет іске қосылды');\n});\nwindow.addEventListener('bariweb:action', (e) => {\n  console.log('Пайдаланушы функцияны іске қосты', e.detail);\n});"
        },
        css: {
          title: "Стильдерді өзгерту",
          body: "Виджет түймесін өз брендіңізге сәйкестендіру үшін стандартты CSS-айнымалыларын қайта анықтаңыз.",
          code: ":root {\n  --al-primary: #c8ff00;\n  --al-background: #000000;\n  --al-radius: 8px;\n}"
        }
      }
    }
  },

  en: {
    navbar: {
      embed: "Embed Script",
      docs: "Documentation",
      payment: "Pricing",
    },
    hero: {
      title: "Make your site inclusive in 1 day. Avoid heavy fines.",
      deadline: "Digital Code Compliance Deadline",
      timeLeft: "Time remaining:",
      days: "days",
      hours: "hours",
    },
    scroll: {
      problem: "Problem: Overloaded interfaces.",
      problemDesc: "An excess of banners, poor contrast, and tiny fonts make modern websites inaccessible to 15% of your audience.",
      scan: "Intelligent DOM Tree Scanning.",
      scanDesc: "In milliseconds, Bariweb analyzes every node on the page, identifying and fixing accessibility violations.",
      voice: "Voice AI Assistant.",
      voiceDesc: "The built-in agent understands commands, automatically locates target fields, and fills forms on behalf of the user.",
      result: "Absolute Accessibility.",
      resultDesc: "Your website automatically complies with WCAG 2.1 AA. Your source code remains entirely untouched.",
      demoUI: {
        messyBank: "Bank",
        credits: "CREDIT 0%",
        ad: "TAKE A LOAN NOW!!!",
        adSmall: "Unreadable tiny terms and conditions text",
        cleanBank: "TrustBank",
        balance: "Your balance",
        transfers: "Transfers",
        payments: "Payments",
        payTaxes: "Pay Taxes",
        iinTarget: "ID Number",
        findTarget: "Find Debt",
        voiceMic: "Listening for commands...",
        voiceTyping: "Filling ID Number...",
        voiceSuccess: "Request successfully sent."
      }
    },
    bento: {
      title1: "The only definitive solution",
      title2: "for legal inclusivity.",
      scanTitle: "Instant Restructuring",
      scanDesc: "The algorithm rebuilds the DOM structure on the fly, dramatically improving readability without demanding dev resources.",
      autoTitle: "Auto-navigation",
      autoDesc: "Our agent performs complex multi-step workflows for users with severe motor and cognitive impairments.",
      codeTitle: "Digital Code Standard",
      codeDesc: "Legal shielding from fines up to 500 MCI. 100% guaranteed compliance with upcoming 2026 regulations.",
      perfTitle: "Invisible to servers",
      perfDesc: "The asynchronous script is securely cached in CDN edge nodes and leaves Web Core Vitals completely unharmed.",
    },
    integration: {
      title1: "One line of code.",
      title2: "Everything else is strictly magic.",
      desc: "Paste the script tag into your <head>. Bariweb handles the rest: configuring ARIA attributes, fixing color ratios, and ensuring keyboard traps are cleared.",
    },
    pricing: {
      title1: "Cheaper than the fine.",
      title2: "More reliable than redesigns.",
      calcTitle: "Calculate your legal risks regarding the Digital Code",
      calcEmployees: "Company Size",
      calcPeople: "employees",
      calcPenalty: "Risk of penalty (MCI equiv):",
      calcSavings: "Net savings with us:",
      starter: "Select Starter",
      business: "Select Business",
      enterprise: "Request Enterprise",
      hit: "MOST POPULAR",
      mo: "/mo",
    },
    paymentPage: {
      title: "Subscription Checkout",
      desc: "Configure your plan to achieve absolute Digital Code compliance.",
      plan: "Selected Plan",
      monthly: "Monthly",
      annual: "Annually",
      save20: "save 20%",
      billingInfo: "Billing Information",
      name: "Name on card",
      cardNum: "Card number",
      expiry: "Exp",
      cvc: "CVC",
      payBtn: "Complete Payment",
      processing: "Processing secure payment...",
      success: "Payment Completed Successfully!",
      secureMessage: "Payment is securely vaulted via AES-256 cloud encryption."
    },
    footer: {
      desc: "The premier B2B digital accessibility platform. Engineering an inclusive internet across Kazakhstan.",
      product: "Platform",
      docs: "Developers",
      company: "Company",
    },
    docsPage: {
      title: "Integration Documentation",
      desc: "Deploy Bariweb onto your infrastructure in 2 minutes flat. Explore installation guides and advanced configuration parameters.",
      quickStart: "Code Examples",
      html: "HTML / Vanilla JS",
      react: "React / Next.js",
      vue: "Vue.js",
      sidebar: {
        category1: "Platform",
        items1: {
          intro: "About Bariweb Tech",
          architecture: "Solution Architecture",
          security: "Security & GDPR"
        },
        category2: "Integration",
        items2: {
          vanilla: "HTML / WordPress",
          react: "React / Next.js",
          vue: "Vue / Nuxt"
        },
        category3: "Reference",
        items3: {
          config: "JS Configuration",
          callbacks: "Event Callbacks",
          css: "Custom CSS Overrides"
        }
      },
      content: {
        intro: {
          title: "About Bariweb Tech",
          body: "Bariweb operates as a fully invisible accessibility overlay acting entirely on the DOM. It intercepts semantic errors and dynamically injects solutions."
        },
        architecture: {
          title: "Solution Architecture",
          body: "The widget loads asynchronously via Cloudflare's global edge network. Our ML evaluation occurs locally inside WebAssembly in the browser layer, ensuring zero latency execution."
        },
        security: {
          title: "Security & GDPR",
          body: "Bariweb explicitly forbids collecting PII (Personally Identifiable Information). Web agents only interface with public markup. Certified SOC2 Type II compliant."
        },
        vanilla: {
          title: "HTML / Vanilla Setup",
          body: "For static websites and CMS platforms (WordPress, Shopify), insert the script immediately preceding your closing </head> tag:",
          code: "<!-- Bariweb Script -->\n<script src=\"https://cdn.bariweb.kz/v2.js\" client_id=\"YOUR_API_KEY\"></script>"
        },
        react: {
          title: "React / Next.js Setup",
          body: "For Next.js implementations, utilize the native next/script component specifying a beforeInteractive loading strategy.",
          code: "import Script from 'next/script';\n\nexport default function RootLayout({ children }) {\n  return (\n    <html>\n      <head>\n        <Script src=\"https://cdn.bariweb.kz/v2.js\" strategy=\"beforeInteractive\" client_id=\"APP_KEY\" />\n      </head>\n      <body>{children}</body>\n    </html>\n  );\n}"
        },
        vue: {
          title: "Vue / Nuxt Setup",
          body: "In Vue / Nuxt architectures, simply configure the directive dynamically inside nuxt.config.ts or globally in your index.html definition.",
          code: "export default defineNuxtConfig({\n  app: {\n    head: {\n      script: [{ src: 'https://cdn.bariweb.kz/v2.js', 'client_id': 'YOUR_API_KEY' }]\n    }\n  }\n})"
        },
        config: {
          title: "Configuration Object",
          body: "Beyond default data-attributes, you can instantiate the global window.BariwebConfig to dictate localized and advanced widget behaviors.",
          code: "window.BariwebConfig = {\n  locale: 'en',\n  position: 'bottom-right',\n  theme: 'dark',\n  disableVoice: false\n};"
        },
        callbacks: {
          title: "Event Subscription",
          body: "Bind specific listeners to intercept crucial scanning events and AI-agent actions.",
          code: "window.addEventListener('bariweb:ready', () => {\n  console.log('Widget successfully booted');\n});\nwindow.addEventListener('bariweb:action', (e) => {\n  console.log('User triggered assistive feature:', e.detail);\n});"
        },
        css: {
          title: "Custom CSS Overrides",
          body: "Redefine standard semantic variables nested within the root document element to mold the widget aesthetics seamlessly into your master branding.",
          code: ":root {\n  --al-primary: #c8ff00;\n  --al-background: #000000;\n  --al-radius: 8px;\n}"
        }
      }
    }
  }
};
