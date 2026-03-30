export type Lang = "ru" | "kz" | "en";

export const translations = {
  ru: {
    nav: {
      problem: "Проблема",
      solution: "Решение",
      pricing: "Тарифы",
      docs: "Документация",
      login: "Войти",
      audit: "Бесплатный аудит"
    },
    hero: {
      glitchText: "Доступный",
      title: "Интернет не для избранных.",
      title2: "Интернет для ",
      title2Glitch: "Всех",
      desc: "Первый в Казахстане автономный ИИ-агент, который за 10 минут адаптирует любой сайт под требования Цифрового кодекса РК. Без редизайна и участия программистов.",
      btnPrimary: "Встроить скрипт",
      btnSecondary: "Как это работает"
    },
    countdown: {
      deadline: "ДЕДЛАЙН:",
      title: "Цифровой Кодекс РК",
      days: "дней",
      hours: "ч",
      dev: "без редизайна",
      wcag: "WCAG 2.1 AA",
      ready: "Подготовьте свой сайт прямо сейчас"
    },
    industries: {
      label: "Индустрии",
      title: "Доверяют лидеры рынка",
      desc: "Любая публичная платформа обязана соответствовать Цифровому кодексу РК 2026.",
      cards: [
        { name: "Банки и финтех", desc: "Kaspi, Halyk, Freedom" },
        { name: "E-commerce", desc: "Wildberries, Mechta, OLX" },
        { name: "Госсервисы", desc: "eGov, ЦОНы, акиматы" },
        { name: "Образование", desc: "Университеты, EdTech" },
        { name: "Страхование", desc: "Nomad, Jusan, Eurasia" },
        { name: "Телеком", desc: "Kcell, Beeline, Tele2" }
      ]
    },
    problem: {
      label: "Высокий Риск",
      title1: "Цифровая ",
      titleGlitch: "изоляция",
      desc: "Отсутствие инклюзивности скоро станет не просто этической проблемой, но и серьезным юридическим риском для вашего бизнеса.",
      cards: [
        { title: "Дедлайн: 11 июля 2026", desc: "Вступление в силу новых норм Цифрового кодекса РК. Все публичные платформы обязаны стать инклюзивными." },
        { title: "700 000+", desc: "Пользователей с особыми потребностями в РК, отрезанных от цифровых услуг." },
        { title: "Миллионные Штрафы", desc: "Блокировка ресурсов и административная ответственность для бизнеса за несоблюдение норм доступности." },
        { title: "Риск Репутационных Потерь", desc: "Судебные иски и публичное осуждение за дискриминацию в цифровой среде." }
      ]
    },
    scrollTransform: {
      label: "SCROLL TRANSFORM",
      title1: "Один скрипт.",
      title2: "Другой",
      title3: "сайт.",
      desc: "Прокрути, чтобы увидеть как AccessLayer трансформирует любой сайт в реальном времени — без редизайна.",
      stages: [
        "STEP_0 · стандартный интерфейс",
        "STEP_1 · ARIA-навигация инициализирована",
        "STEP_2 · контраст адаптирован",
        "STEP_3 · визуальный шум удалён",
        "STEP_4 · CTA оптимизированы",
        "STEP_5 · COMPLIANCE ДОСТИГНУТ ✓",
      ],
      mockup: {
        headerName: "Банк Услуги",
        phoneLabel: "Позвонить в поддержку",
        phoneText: "Связь",
        userLabel: "Профиль пользователя",
        userText: "Мой Банк",
        serviceTitle: "Оплата налогов и штрафов",
        serviceDesc: "Введите данные для автоматического поиска задолженностей",
        inputIdLabel: "ИИН / БИН",
        autofillText: "Автозаполнение...",
        btnSubmit: "Найти задолженности",
        dialogs: {
          step1: "AccessLayer активен. Скажите что сделать или нажмите на элемент.",
          step2: "Слушаю... «Оплатить налог на транспорт»",
          step3: "Нашёл нужный раздел. Выбираю «Налоги»...",
          step4: "Заполняю ИИН автоматически из профиля...",
          step5: "Готово. Сумма: 12 500 ₸. Подтвердить?",
        }
      }
    },
    widget: {
      title: "BariWeb Инклюзия",
      tabs: { lang: "Русский", profiles: "Профили" },
      accordions: {
        features: "Основные функции",
        profiles: "Профили доступности",
        howItWorks: "Как это работает?",
        about: "О нас"
      },
      features: [
        "Размер текста", "Контрастность", "ЧБ Режим", "Курсор", "Чтение вслух", "Скрытые ссылки"
      ],
      profileBlocks: [
        "Безопасно для приступов", "Когнитивная помощь"
      ],
      howItWorksDesc: "Этот виджет помогает адаптировать сайт под ваши нужды (увеличение текста, смена контрастности и др.)."
    },
    integration: {
      label: "Интеграция",
      title: "Быстрее, чем выпить ",
      titleHighlight: "кофе",
      desc: "Никаких сложных API и долгой разработки. Один тег — и ваш сайт полностью соответствует WCAG 2.1 AA.",
      step1Title: "1. Копируете скрипт",
      step1Desc: "Получите уникальный CDN-скрипт в личном кабинете.",
      step2Title: "2. Вставляете в <head>",
      step2Desc: "Добавьте скрипт в код любого сайта (React, WordPress, Tilda, Vanilla).",
      step3Title: "3. Готово",
      step3Desc: "ИИ-агент автоматически сканирует DOM и исправляет проблемы контраста, ARIA и читаемости.",
      tryBtn: "Попробовать бесплатно в песочнице"
    },
    endUsers: {
      label: "Наши пользователи",
      title: "Кто использует ",
      titleHighlight: "AccessLayer?",
      desc: "Наш виджет ежедневно помогает тысячам людей комфортно пользоваться цифровыми сервисами.",
      metrics: [
        { val: "3.4x", label: "Увеличение сессий пользователей с инвалидностью" },
        { val: "8.1%", label: "Клик-рейт от виджета" },
        { val: "+45с", label: "Среднее время на сайте" }
      ],
      personas: [
        { name: "Слабовидящие", status: "Глаукома, +4.5D", quote: "Я могу самостоятельно оплачивать налоги без помощи внуков благодаря авто-озвучке.", tag: "Экранный диктор" },
        { name: "Нарушения моторики", status: "Тремор рук", quote: "Огромные отступы и управление клавиатурой спасают меня от случайных кликов.", tag: "Умный фокус" },
        { name: "Когнитивные особенности", status: "СДВГ, Дислексия", quote: "Скрытие мигающей рекламы позволяет мне сосредоточиться на чтении условий кредита.", tag: "Режим фокусировки" }
      ]
    },
    comparison: {
      label: "Сравнение",
      title: "Никаких ",
      titleHighlight: "капитальных",
      title2: " затрат",
      desc: "Сравните стоимость классического редизайна и мгновенного внедрения AccessLayer.",
      th1: "Параметр",
      th2: "Традиционный Редизайн",
      th3: "Игнорирование (Штраф)",
      thFull: "AccessLayer",
      rows: [
        { name: "Сроки внедрения", r1: "3-6 месяцев", r2: "-", r3: "10 минут" },
        { name: "Затраты на разработку", r1: "От 2 000 000 ₸", r2: "-", r3: "0 ₸" },
        { name: "Риск блокировки", r1: "Сохраняется в процессе", r2: "Высокий (100%)", r3: "Устранен мгновенно" },
        { name: "Участие команды", r1: "Дизайнеры, Программисты, QA", r2: "Юристы", r3: "Только 1 контент-менеджер" },
        { name: "Поддержка WCAG", r1: "Зависит от квалификации", r2: "Нет", r3: "Автоматическая (AA)" }
      ]
    },
    pricing: {
      label: "Тарифы",
      title: "Инвестиция в ",
      titleHighlight: "лояльность",
      desc: "Выберите план, который подходит масштабу вашего бизнеса. Платите меньше, чем за один час работы разработчика.",
      month: "мес",
      recommended: "ХИТ",
      chooseBtn: "Выбрать",
      plans: {
        starter: {
          desc: "Для небольших статических сайтов и лендингов",
          features: ["До 10 000 просмотров/мес", "Базовый виджет доступности", "1 домен", "Email-поддержка", "Соответствие WCAG 2.1 A"]
        },
        business: {
          desc: "Для корпоративных порталов и интернет-магазинов",
          features: ["До 100 000 просмотров/мес", "Продвинутый ИИ-виджет (AA)", "До 3 доменов", "Приоритетная поддержка", "Автоматические отчеты"]
        },
        enterprise: {
          desc: "Для госсектора и высоконагруженных платформ",
          features: ["Нелимитированный трафик", "Полное соответствие (AAA)", "Неограниченно доменов", "Выделенный менеджер (SLA)", "On-premise интеграция"]
        }
      }
    },
    roi: {
      label: "Калькулятор Штрафов",
      title: "Сколько стоит ",
      titleGlitch: "НЕ",
      title2: " внедрить AccessLayer?",
      desc: "Оцените реальную стоимость игнорирования Цифрового кодекса РК.",
      sizes: ["Микробизнес", "Малый и средний бизнес", "Крупный бизнес", "Квазигоссектор / Госсектор"],
      companySize: "Размер компании",
      traffic: "Посещаемость сайта / мес",
      riskCost: "Риск штрафа",
      redesignCost: "Стоимость редизайна",
      alCost: "AccessLayer / год",
      savings: "Ваша чистая экономия:",
      btn: "Защитить компанию за"
    },
    faq: {
      title: "Частые ",
      titleHighlight: "вопросы",
      items: [
        { q: "Нужно ли переписывать код моего сайта?", a: "Нет. AccessLayer работает поверх вашего существующего сайта. Он анализирует DOM-дерево и добавляет необходимые ARIA-атрибуты, корректирует фокус и стили (например, контрастность) на лету." },
        { q: "Влияет ли виджет на скорость загрузки сайта?", a: "Скрипт загружается асинхронно через CDN и весит менее 20КБ. Он не блокирует основной поток рендеринга и начинает работу только после полной загрузки страницы." },
        { q: "Как AccessLayer помогает избежать штрафов?", a: "Виджет мгновенно внедряет требования WCAG 2.1 AA, что закрывает технические обязательства по инклюзивности согласно Цифровому кодексу РК." },
        { q: "Можно ли кастомизировать дизайн виджета?", a: "Да, на тарифах Business и Enterprise вы можете изменить цвета, иконки и позицию виджета в личном кабинете, чтобы он соответствовал вашему бренду." }
      ]
    },
    lead: {
      title: "Проверьте свой сайт на уязвимости",
      desc: "Введите адрес вашего сайта, и наш ИИ проведет мгновенный аудит на соответствие Цифровому кодексу РК.",
      placeholder: "https://vash-site.kz",
      btn: "Запустить скан",
      terms1: "Нажимая кнопку, вы соглашаетесь с",
      terms2: "политикой конфиденциальности"
    }
  },
  kz: {
    nav: {
      problem: "Мәселе",
      solution: "Шешім",
      pricing: "Тарифтер",
      docs: "Құжаттама",
      login: "Кіру",
      audit: "Тегін аудит"
    },
    hero: {
      glitchText: "Қолжетімді",
      title: "Интернет тек таңдаулылар үшін емес.",
      title2: "Интернет ",
      title2Glitch: "Барлығына",
      desc: "Қазақстандағы алғашқы автономды AI-агент, ол кез-келген сайтты 10 минут ішінде ҚР Цифрлық кодексіне бейімдейді. Редизайнсыз және программистсіз.",
      btnPrimary: "Скриптті орнату",
      btnSecondary: "Ол қалай жұмыс істейді"
    },
    countdown: {
      deadline: "ДЕДЛАЙН:",
      title: "ҚР Цифрлық Кодексі",
      days: "күн",
      hours: "с",
      dev: "редизайнсыз",
      wcag: "WCAG 2.1 AA",
      ready: "Сайтыңызды дәл қазір дайындаңыз"
    },
    industries: {
      label: "Индустриялар",
      title: "Нарық көшбасшылары сенеді",
      desc: "Кез-келген жария платформа ҚР 2026 Цифрлық кодексіне сәйкес болуы керек.",
      cards: [
        { name: "Банктер мен финтех", desc: "Kaspi, Halyk, Freedom" },
        { name: "E-commerce", desc: "Wildberries, Mechta, OLX" },
        { name: "Мемлекеттік қызметтер", desc: "eGov, ХҚКО, әкімдіктер" },
        { name: "Білім беру", desc: "Университеттер, EdTech" },
        { name: "Сақтандыру", desc: "Nomad, Jusan, Eurasia" },
        { name: "Телеком", desc: "Kcell, Beeline, Tele2" }
      ]
    },
    problem: {
      label: "Жоғары Тәуекел",
      title1: "Цифрлық ",
      titleGlitch: "оқшаулау",
      desc: "Инклюзивтіліктің жоқтығы жақын арада тек этикалық мәселе емес, сіздің бизнесіңіз үшін үлкен құқықтық тәуекелге айналады.",
      cards: [
        { title: "Дедлайн: 11 шілде 2026", desc: "ҚР Цифрлық кодексінің жаңа нормаларының күшіне енуі. Барлық жария платформалар инклюзивті болуға міндетті." },
        { title: "700 000+", desc: "ҚР-дағы ерекше қажеттіліктері бар, цифрлық қызметтерден шеттетілген пайдаланушылар." },
        { title: "Миллиондаған Айыппұлдар", desc: "Қолжетімділік нормаларын сақтамағаны үшін ресурстарды бұғаттау және бизнес үшін әкімшілік жауапкершілік." },
        { title: "Беделді жоғалту қаупі", desc: "Цифрлық ортадағы кемсітушілік үшін сот істері және қоғамдық айыптау." }
      ]
    },
    scrollTransform: {
      label: "SCROLL TRANSFORM",
      title1: "Бір скрипт.",
      title2: "Басқа",
      title3: "сайт.",
      desc: "AccessLayer кез-келген сайтты нақты уақытта қалай түрлендіретінін көру үшін төмен айналдырыңыз — редизайнсыз.",
      stages: [
        "STEP_0 · стандартты интерфейс",
        "STEP_1 · ARIA-навигация қосылды",
        "STEP_2 · контраст бейімделді",
        "STEP_3 · көрнекі шу жойылды",
        "STEP_4 · CTA оңтайландырылды",
        "STEP_5 · COMPLIANCE ЖЕТТІ ✓",
      ],
      mockup: {
        headerName: "Банк Қызметтері",
        phoneLabel: "Қолдау қызметіне қоңырау шалу",
        phoneText: "Байланыс",
        userLabel: "Пайдаланушы профилі",
        userText: "Менің Банкім",
        serviceTitle: "Салықтар мен айыппұлдарды төлеу",
        serviceDesc: "Қатырыздарды автоматты түрде іздеу үшін деректерді енгізіңіз",
        inputIdLabel: "ЖСН / БСН",
        autofillText: "Автоматты толтыру...",
        btnSubmit: "Қатырыздарды табу",
        dialogs: {
          step1: "AccessLayer белсенді. Не істеу керектігін айтыңыз немесе элементті басыңыз.",
          step2: "Тыңдап тұрмын... «Көлік салығын төлеу»",
          step3: "Қажетті бөлімді таптым. «Салықтарды» таңдаймын...",
          step4: "Профильден ЖСН автоматты түрде толтырамын...",
          step5: "Дайын. Сомасы: 12 500 ₸. Растау?",
        }
      }
    },
    widget: {
      title: "BariWeb Инклюзия",
      tabs: { lang: "Қазақ тілі", profiles: "Профильдер" },
      accordions: {
        features: "Негізгі функциялар",
        profiles: "Қолжетімділік профильдері",
        howItWorks: "Бұл қалай жұмыс істейді?",
        about: "Біз туралы"
      },
      features: [
        "Мәтін өлшемі", "Контраст", "Ақ-қара режим", "Курсор", "Дауыстап оқу", "Жасырын сілтемелер"
      ],
      profileBlocks: [
        "Құрыспалар үшін қауіпсіз", "Когнитивтік көмек"
      ],
      howItWorksDesc: "Бұл виджет сайтты сіздің қажеттіліктеріңізге (мәтінді ұлғайту, контрастты өзгерту және т.б.) бейімдеуге көмектеседі."
    },
    integration: {
      label: "Интеграция",
      title: "Кофе ішкеннен де ",
      titleHighlight: "тезірек",
      desc: "Күрделі API немесе ұзақ әзірлеу қажет емес. Бір тег — және сіздің сайтыңыз WCAG 2.1 AA талаптарына толық сәйкес келеді.",
      step1Title: "1. Скриптті көшіресіз",
      step1Desc: "Жеке кабинетте бірегей CDN скриптін алыңыз.",
      step2Title: "2. <head> ішіне қоясыз",
      step2Desc: "Скриптті кез-келген сайт кодына қосыңыз (React, WordPress, Tilda, Vanilla).",
      step3Title: "3. Дайын",
      step3Desc: "AI-агент DOM-ды автоматты түрде сканерлейді және контраст, ARIA және оқылымдық мәселелерін түзетеді.",
      tryBtn: "Құмсалғышта тегін көріңіз"
    },
    endUsers: {
      label: "Біздің пайдаланушылар",
      title: "AccessLayer кімге ",
      titleHighlight: "арналған?",
      desc: "Біздің виджет күн сайын мыңдаған адамға цифрлық қызметтерді ыңғайлы пайдалануға көмектеседі.",
      metrics: [
        { val: "3.4x", label: "Мүгедектігі бар пайдаланушылар сессиясының өсуі" },
        { val: "8.1%", label: "Виджеттен клик-рейт" },
        { val: "+45с", label: "Сайттағы орташа уақыт" }
      ],
      personas: [
        { name: "Нашар көретіндер", status: "Глаукома, +4.5D", quote: "Авто-дыбыстаудың арқасында немерелерімнің көмегінсіз салықтарды өзім төлей аламын.", tag: "Экран дикторы" },
        { name: "Моторика бұзылулары", status: "Қол треморы", quote: "Үлкен шегіністер мен пернетақта арқылы басқару мені кездейсоқ басулардан құтқарады.", tag: "Ақылды фокус" },
        { name: "Когнитивтік ерекшеліктер", status: "СДВГ, Дислексия", quote: "Жыпылықтайтын жарнаманы жасыру маған несие шарттарын оқуға зейін қоюға мүмкіндік береді.", tag: "Фокустау режимі" }
      ]
    },
    comparison: {
      label: "Салыстыру",
      title: "Ешқандай ",
      titleHighlight: "күрделі",
      title2: " шығындар жоқ",
      desc: "Классикалық редизайн мен AccessLayer-ді жылдам енгізудің құнын салыстырыңыз.",
      th1: "Параметр",
      th2: "Дәстүрлі Редизайн",
      th3: "Елемеу (Айыппұл)",
      thFull: "AccessLayer",
      rows: [
        { name: "Енгізу мерзімі", r1: "3-6 ай", r2: "-", r3: "10 минут" },
        { name: "Әзірлеу шығындары", r1: "2 000 000 ₸ бастап", r2: "-", r3: "0 ₸" },
        { name: "Блокталу қаупі", r1: "Процесс барысында сақталады", r2: "Жоғары (100%)", r3: "Лезде жойылады" },
        { name: "Команданың қатысуы", r1: "Дизайнерлер, Программистер, QA", r2: "Заңгерлер", r3: "Тек 1 контент-менеджер" },
        { name: "WCAG Қолдауы", r1: "Біліктілікке байланысты", r2: "Жоқ", r3: "Автоматты (AA)" }
      ]
    },
    pricing: {
      label: "Тарифтер",
      title: "Лоялдылыққа ",
      titleHighlight: "инвестиция",
      desc: "Бизнесіңіздің ауқымына сәйкес келетін жоспарды таңдаңыз. Платите меньше, чем за один час работы разработчика.",
      month: "ай",
      recommended: "ХИТ",
      chooseBtn: "Таңдау",
      plans: {
        starter: {
          desc: "Шағын статикалық сайттар мен лендингтер үшін",
          features: ["Айына 10 000 қаралымға дейін", "Қолжетімділіктің базалық виджеті", "1 домен", "Email-қолдау", "WCAG 2.1 A сәйкестік"]
        },
        business: {
          desc: "Корпоративтік порталдар мен интернет-дүкендер үшін",
          features: ["Айына 100 000 қаралымға дейін", "Кеңейтілген ЖИ-виджеті (AA)", "3 доменге дейін", "Басымдықпен қолдау", "Автоматты есептер"]
        },
        enterprise: {
          desc: "Мемлекеттік сектор мен жоғары жүктемелі платформалар үшін",
          features: ["Шексіз трафик", "Толық сәйкестік (AAA)", "Шексіз домендер", "Жеке менеджер (SLA)", "On-premise интеграция"]
        }
      }
    },
    roi: {
      label: "Айыппұлдар калькуляторы",
      title: "AccessLayer-ді орнатпау ",
      titleGlitch: "ҚАНША",
      title2: " тұрады?",
      desc: "ҚР Цифрлық кодексін елемеудің нақты құнын бағалаңыз.",
      sizes: ["Микробизнес", "Шағын және орта бизнес", "Ірі бизнес", "Квазимемлекеттік сектор / Мемсектор"],
      companySize: "Компания көлемі",
      traffic: "Сайтқа кірушілер / айына",
      riskCost: "Айыппұл тәуекелі",
      redesignCost: "Редизайн құны",
      alCost: "AccessLayer / жылына",
      savings: "Сіздің таза үнемдеуіңіз:",
      btn: "Компанияны қорғау"
    },
    faq: {
      title: "Жиі қойылатын ",
      titleHighlight: "сұрақтар",
      items: [
        { q: "Менің сайтымның кодын қайта жазу қажет пе?", a: "Жоқ. AccessLayer сіздің бар сайтыңыздың үстінен жұмыс істейді. Ол DOM ағашын талдайды және қажетті ARIA атрибуттарын қосады, фокус пен стильдерді (мысалы, контраст) лезде түзетеді." },
        { q: "Виджет сайттың жүктелу жылдамдығына әсер ете ме?", a: "Скрипт CDN арқылы асинхронды түрде жүктеледі және салмағы 20КБ-тан аз. Ол негізгі рендеринг ағынын блоктамайды және парақ толық жүктелгеннен кейін ғана жұмыс істей бастайды." },
        { q: "AccessLayer айыппұлдардан қалай құтылуға көмектеседі?", a: "Виджет бірден WCAG 2.1 AA талаптарын енгізеді, бұл ҚР Цифрлық кодексіне сәйкес инклюзивтілік бойынша техникалық міндеттемелерді жабады." },
        { q: "Виджет дизайнын өзгертуге бола ма?", a: "Иә, Business және Enterprise тарифтерінде виджеттің түстерін, белгішелерін және орналасуын жеке кабинетте брендіңізге сәйкестендіруге болады." }
      ]
    },
    lead: {
      title: "Сайтыңыздың осалдығын тексеріңіз",
      desc: "Сайтыңыздың мекенжайын енгізіңіз, біздің ЖИ оның ҚР Цифрлық кодексіне сәйкестігін лезде аудитін өткізеді.",
      placeholder: "https://vash-site.kz",
      btn: "Сканды бастау",
      terms1: "Түймені басу арқылы сіз келісесіз",
      terms2: "құпиялылық саясатымен"
    }
  },
  en: {
    nav: {
      problem: "Problem",
      solution: "Solution",
      pricing: "Pricing",
      docs: "Documentation",
      login: "Login",
      audit: "Free Audit"
    },
    hero: {
      glitchText: "Accessible",
      title: "The Internet is not for the few.",
      title2: "The Internet is for ",
      title2Glitch: "Everyone",
      desc: "Kazakhstan's first autonomous AI agent that adapts any website to the Digital Code requirements within 10 minutes. Without redesign or programmers.",
      btnPrimary: "Embed Script",
      btnSecondary: "How it works"
    },
    countdown: {
      deadline: "DEADLINE:",
      title: "Digital Code of Kazakhstan",
      days: "days",
      hours: "h",
      dev: "no redesign",
      wcag: "WCAG 2.1 AA",
      ready: "Prepare your website right now"
    },
    industries: {
      label: "Industries",
      title: "Trusted by Market Leaders",
      desc: "Every public platform is obligated to comply with the Digital Code of Kazakhstan 2026.",
      cards: [
        { name: "Banks & Fintech", desc: "Kaspi, Halyk, Freedom" },
        { name: "E-commerce", desc: "Wildberries, Mechta, OLX" },
        { name: "Government", desc: "eGov, PSCs, Akimats" },
        { name: "Education", desc: "Universities, EdTech" },
        { name: "Insurance", desc: "Nomad, Jusan, Eurasia" },
        { name: "Telecom", desc: "Kcell, Beeline, Tele2" }
      ]
    },
    problem: {
      label: "High Risk",
      title1: "Digital ",
      titleGlitch: "Isolation",
      desc: "Lack of inclusivity will soon become not just an ethical issue, but a major legal risk for your business.",
      cards: [
        { title: "Deadline: July 11, 2026", desc: "New norms of the Digital Code come into force. All public platforms must become inclusive." },
        { title: "700,000+", desc: "Users with special needs in Kazakhstan, cut off from digital services." },
        { title: "Millions in Fines", desc: "Asset blocking and administrative liability for business non-compliance." },
        { title: "Reputation Damage Risk", desc: "Lawsuits and public condemnation for discrimination in the digital environment." }
      ]
    },
    scrollTransform: {
      label: "SCROLL TRANSFORM",
      title1: "One Script.",
      title2: "Different",
      title3: " Site.",
      desc: "Scroll down to see how AccessLayer transforms any website in real-time — without a redesign.",
      stages: [
        "STEP_0 · standard interface",
        "STEP_1 · ARIA-navigation initialized",
        "STEP_2 · contrast adapted",
        "STEP_3 · visual noise removed",
        "STEP_4 · CTA optimized",
        "STEP_5 · COMPLIANCE ACHIEVED ✓",
      ],
      mockup: {
        headerName: "Bank Services",
        phoneLabel: "Call Support",
        phoneText: "Contact",
        userLabel: "User Profile",
        userText: "My Bank",
        serviceTitle: "Pay Taxes & Fines",
        serviceDesc: "Enter data to automatically search for debts",
        inputIdLabel: "IIN / BIN",
        autofillText: "Autofilling...",
        btnSubmit: "Find Debts",
        dialogs: {
          step1: "AccessLayer active. Tell me what to do or click an element.",
          step2: "Listening... «Pay transport tax»",
          step3: "Found the right section. Selecting «Taxes»...",
          step4: "Autofilling IIN from your profile...",
          step5: "Done. Amount: 12 500 ₸. Confirm?",
        }
      }
    },
    widget: {
      title: "BariWeb Inclusion",
      tabs: { lang: "English", profiles: "Profiles" },
      accordions: {
        features: "Core Features",
        profiles: "Accessibility Profiles",
        howItWorks: "How it works?",
        about: "About Us"
      },
      features: [
        "Text Size", "Contrast", "B&W Mode", "Cursor", "Read Aloud", "Hidden Links"
      ],
      profileBlocks: [
        "Seizure Safe", "Cognitive Assist"
      ],
      howItWorksDesc: "This widget helps adapt the site to your needs (text enlargement, contrast changes, etc.)."
    },
    integration: {
      label: "Integration",
      title: "Faster than drinking ",
      titleHighlight: "coffee",
      desc: "No complex APIs or long development cycles. One tag — and your site is fully WCAG 2.1 AA compliant.",
      step1Title: "1. Copy the script",
      step1Desc: "Get your unique CDN script in the dashboard.",
      step2Title: "2. Paste into <head>",
      step2Desc: "Add the script to the code of any site (React, WordPress, Tilda, Vanilla).",
      step3Title: "3. Complete",
      step3Desc: "The AI agent automatically scans the DOM and fixes contrast, ARIA, and readability issues.",
      tryBtn: "Try free in sandbox"
    },
    endUsers: {
      label: "Our Users",
      title: "Who uses ",
      titleHighlight: "AccessLayer?",
      desc: "Our widget helps thousands of people comfortably use digital services every day.",
      metrics: [
        { val: "3.4x", label: "Increase in sessions by users with disabilities" },
        { val: "8.1%", label: "Widget click rate" },
        { val: "+45s", label: "Average time on site" }
      ],
      personas: [
        { name: "Visually Impaired", status: "Glaucoma, +4.5D", quote: "I can pay taxes myself without my grandchildren's help thanks to the screen reader.", tag: "Screen Reader" },
        { name: "Motor Impairments", status: "Hand tremors", quote: "Huge padding and keyboard navigation save me from accidental misclicks.", tag: "Smart Focus" },
        { name: "Cognitive Features", status: "ADHD, Dyslexia", quote: "Hiding flashing ads allows me to focus on reading the loan terms.", tag: "Focus Mode" }
      ]
    },
    comparison: {
      label: "Comparison",
      title: "No heavy ",
      titleHighlight: "capital",
      title2: " expenses",
      desc: "Compare the cost of a classic redesign versus instant AccessLayer integration.",
      th1: "Parameter",
      th2: "Traditional Redesign",
      th3: "Ignorance (Fine)",
      thFull: "AccessLayer",
      rows: [
        { name: "Time to implement", r1: "3-6 months", r2: "-", r3: "10 minutes" },
        { name: "Development costs", r1: "From 2,000,000 ₸", r2: "-", r3: "0 ₸" },
        { name: "Risk of blocking", r1: "Persists during process", r2: "High (100%)", r3: "Eliminated instantly" },
        { name: "Team engagement", r1: "Designers, Devs, QA", r2: "Lawyers", r3: "Just 1 Content Manager" },
        { name: "WCAG Support", r1: "Depends on expertise", r2: "None", r3: "Automatic (AA)" }
      ]
    },
    pricing: {
      label: "Pricing",
      title: "An investment in ",
      titleHighlight: "loyalty",
      desc: "Choose a plan that fits the scale of your business. Pay less than for one hour of a developer's time.",
      month: "mo",
      recommended: "POPULAR",
      chooseBtn: "Select",
      plans: {
        starter: {
          desc: "For small static websites and landing pages",
          features: ["Up to 10,000 pageviews/mo", "Basic accessibility widget", "1 domain", "Email support", "WCAG 2.1 A compliance"]
        },
        business: {
          desc: "For corporate portals and e-commerce",
          features: ["Up to 100,000 pageviews/mo", "Advanced AI widget (AA)", "Up to 3 domains", "Priority support", "Automated reports"]
        },
        enterprise: {
          desc: "For government and high-traffic platforms",
          features: ["Unlimited traffic", "Full compliance (AAA)", "Unlimited domains", "Dedicated manager (SLA)", "On-premise integration"]
        }
      }
    },
    roi: {
      label: "Penalty Calculator",
      title: "How much does it cost ",
      titleGlitch: "NOT",
      title2: " to use AccessLayer?",
      desc: "Estimate the real cost of ignoring the Digital Code of Kazakhstan.",
      sizes: ["Microbusiness", "SMB / Small & Medium Business", "Enterprise", "Government / Quasi-Gov"],
      companySize: "Company Size",
      traffic: "Website traffic / month",
      riskCost: "Penalty Risk",
      redesignCost: "Redesign Cost",
      alCost: "AccessLayer / year",
      savings: "Your Net Savings:",
      btn: "Protect Company for"
    },
    faq: {
      title: "Frequently Asked ",
      titleHighlight: "Questions",
      items: [
        { q: "Do I need to rewrite my website's code?", a: "No. AccessLayer works on top of your existing website. It analyzes the DOM tree and adding necessary ARIA attributes, adjusting focus and styles (e.g. contrast) on the fly." },
        { q: "Does the widget impact website loading speed?", a: "The script runs asynchronously via CDN and weighs less than 20KB. It does not block the main rendering thread and only activates after the page is fully loaded." },
        { q: "How does AccessLayer help avoid fines?", a: "The widget instantly implements WCAG 2.1 AA requirements, thereby covering your technical inclusivity obligations under the Digital Code of Kazakhstan." },
        { q: "Can I customize the widget design?", a: "Yes, on Business and Enterprise plans you can change the widget's colors, icons, and position from the dashboard to match your brand." }
      ]
    },
    lead: {
      title: "Check your website for vulnerabilities",
      desc: "Enter your website address, and our AI will conduct an instant compliance audit against the Digital Code.",
      placeholder: "https://your-site.kz",
      btn: "Run Scan",
      terms1: "By clicking this button you agree to the",
      terms2: "privacy policy"
    }
  }
};
