/**
 * ══════════════════════════════════════════════
 *  MUNDO DE FE SANTO DOMINGO — Content Config
 *
 *  HOW TO EDIT (no coding needed):
 *  ─────────────────────────────────────────────
 *  1. Open this file in any text editor
 *     (Notes, TextEdit, Notepad, VS Code)
 *  2. Change the text between quotes " "
 *  3. Do NOT delete commas, colons, or brackets
 *  4. Save the file
 *  5. Refresh the website in your browser
 *
 *  To ADD a photo: drop the image file into
 *  the images/ folder, then update the path here.
 *
 *  SAFE TO CHANGE: anything after the colon ":"
 *  DO NOT CHANGE: the words before the colon
 * ══════════════════════════════════════════════
 */

window.SITE = {

  // ─────────────────────────────────────────────
  // ANNOUNCEMENT BAR (top of page)
  // Set show: false to hide it
  // ─────────────────────────────────────────────
  announcement: {
    show: true,
    emoji: "🌱",
    text: "FORMADOS — 9 semanas para responder una pregunta. Comenzamos el jueves 3 de septiembre",
    cta_text: "Conoce e inscríbete",
    cta_url: "/formados",
  },

  // ─────────────────────────────────────────────
  // CHURCH INFO
  // ─────────────────────────────────────────────
  church: {
    name:     "Mundo de Fe",
    subtitle: "Santo Domingo",
    tagline:  "Más que una iglesia — somos familia",
    network:  "Mundo de Fe Internacional",
    location: "Santo Domingo, República Dominicana",
  },

  // ─────────────────────────────────────────────
  // HERO
  // ─────────────────────────────────────────────
  hero: {
    eyebrow:       "Santo Domingo, República Dominicana",
    verse:         '"Si puedes creer, al que cree todo le es posible." — Marcos 9:23',
    cta_visit:     "Planifica tu visita",
    cta_watch:     "Ver prédicas",
    current_series: "Serie actual: La Fe que Todo lo Puede",
  },

  // ─────────────────────────────────────────────
  // NEW HERE / SOY NUEVO
  // ─────────────────────────────────────────────
  new_here: {
    headline:  "¿Es tu primera vez?",
    sub:       "Bienvenido. No necesitas saber nada para llegar. Solo ven como eres.",
    cards: [
      {
        icon:  "fa-location-dot",
        title: "Dónde estamos",
        body:  "Santo Domingo, República Dominicana. Síguenos en redes para la dirección exacta.",
      },
      {
        icon:  "fa-clock",
        title: "Cuándo",
        body:  "Domingos a las 10:00 AM. Las puertas abren 30 minutos antes.",
      },
      {
        icon:  "fa-shirt",
        title: "Cómo venir",
        body:  "Ven como eres. Casual, relajado. Lo importante eres tú.",
      },
      {
        icon:  "fa-child-reaching",
        title: "Para tus hijos",
        body:  "Tenemos ministerio de niños durante el servicio. Ambiente seguro y divertido.",
      },
    ],
    cta_text: "Planifica tu visita",
    cta_url:  "#contacto",
  },

  // ─────────────────────────────────────────────
  // PRÓXIMOS PASOS (Next Steps / Growth Track)
  // ─────────────────────────────────────────────
  next_steps: {
    headline: "Próximos pasos",
    sub:      "Sin importar dónde estés en tu camino de fe, hay un próximo paso para ti.",
    steps: [
      {
        number: "01",
        color:  "#B08A3E",
        title:  "Conoce a Dios",
        body:   "Todo comienza con una relación. Descubre quién es Dios y lo que tiene para tu vida.",
        cta:    "Empieza aquí",
        url:    "#contacto",
      },
      {
        number: "02",
        color:  "#8A6428",
        title:  "Encuentra libertad",
        body:   "Dios quiere que vivas libre. Descubre cómo romper ciclos y caminar en plenitud.",
        cta:    "Conoce más",
        url:    "#contacto",
      },
      {
        number: "03",
        color:  "#072A18",
        title:  "Crece en comunidad",
        body:   "La fe se vive mejor en familia. Conéctate con un grupo y crece junto a otros.",
        cta:    "Únete a un grupo",
        url:    "#contacto",
      },
      {
        number: "04",
        color:  "#14492C",
        title:  "Haz la diferencia",
        body:   "Fuiste creado con un propósito. Usa tus dones para impactar tu ciudad y el mundo.",
        cta:    "Sirve con nosotros",
        url:    "#contacto",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // PASTORS
  // photo: filename inside the images/ folder
  // ─────────────────────────────────────────────
  pastors: [
    {
      name:   "Otoniel Rincón",
      role:   "Pastor Principal",
      photo:  "images/otoniel.jpg",
      bio:    "Hombre de fe, visión y amor profundo por la casa de Dios. El Pastor Otoniel guía a la congregación con integridad, pasión por la Palabra y un corazón de padre hacia cada miembro de la familia.",
    },
    {
      name:   "Jhanna Báez",
      role:   "Pastora",
      photo:  "images/jhanna.jpg",
      bio:    "Mujer ungida, apasionada por la adoración y el discipulado. La Pastora Jhanna imparte vida a cada persona que toca con su ministerio, reflejando el corazón de Dios para las familias y la comunidad.",
    },
  ],

  // ─────────────────────────────────────────────
  // SERVICES
  // ─────────────────────────────────────────────
  services: [
    {
      day:         "Domingo",
      time:        "10:30 AM",
      name:        "Servicio Principal",
      description: "Adoración poderosa, Palabra que transforma y comunidad que te abraza.",
      featured:    true,
    },
    {
      day:         "Miércoles",
      time:        "7:00 PM",
      name:        "Estudio Bíblico",
      description: "Palabra profunda e íntima para crecer en tu fe durante la semana.",
    },
  ],

  // ─────────────────────────────────────────────
  // CURRENT SERMON SERIES
  // ─────────────────────────────────────────────
  current_series: {
    name:        "La Fe que Todo lo Puede",
    description: "Una serie poderosa sobre cómo la fe genuina mueve lo imposible y transforma cada área de tu vida.",
    watch_url:   "https://www.youtube.com/@mundodefesd/videos",
  },

  // ─────────────────────────────────────────────
  // SERMONS (most recent first)
  // RESPALDO MANUAL — solo se usa si YOUTUBE_API_KEY no está configurada
  // en Vercel (ver .env.example). Con la key puesta, /api/sermons trae
  // automáticamente los videos reales del canal y esto se ignora.
  // ─────────────────────────────────────────────
  sermons: [
    {
      title:    "Fe que mueve montañas",
      speaker:  "Ps. Otoniel Rincón",
      date:     "Esta semana",
      url:      "https://www.youtube.com/@mundodefesd/videos",
      featured: true,
    },
    {
      title:    "El poder de la oración",
      speaker:  "Ps. Jhanna Báez",
      date:     "Semana pasada",
      url:      "https://www.youtube.com/@mundodefesd/videos",
    },
    {
      title:    "Identidad en Cristo",
      speaker:  "Ps. Otoniel Rincón",
      date:     "Hace 2 semanas",
      url:      "https://www.youtube.com/@mundodefesd/videos",
    },
    {
      title:    "Vivir en abundancia",
      speaker:  "Ps. Jhanna Báez",
      date:     "Hace 3 semanas",
      url:      "https://www.youtube.com/@mundodefesd/videos",
    },
  ],

  // ─────────────────────────────────────────────
  // EVENTS (upcoming — remove past events)
  // NOTE: "Jornada" y "Encuentro Familiar" todavía no tienen hora
  // confirmada — actualiza el campo "time" apenas la tengas.
  // ─────────────────────────────────────────────
  events: [
    {
      date_day:   "01",
      date_month: "SEP",
      title:      "Mes de la Biblia",
      time:       "Todo el mes",
      description:"Un mes dedicado a sumergirnos en la Palabra como iglesia. Más detalles próximamente.",
      tag:        "Septiembre",
      tag_color:  "#14492C",
      url:        "#contacto",
    },
    {
      date_day:   "06",
      date_month: "SEP",
      title:      "Jornada",
      time:       "Hora por confirmar",
      description:"La primera clase de la iglesia. Un espacio para empezar tu camino de fe con fundamentos claros.",
      tag:        "Jornada",
      tag_color:  "#B08A3E",
      url:        "#contacto",
    },
    {
      date_day:   "06",
      date_month: "DIC",
      title:      "Encuentro Familiar",
      time:       "Hora por confirmar",
      description:"Un tiempo especial para reunir a la familia Mundo de Fe antes de cerrar el año.",
      tag:        "Encuentro Familiar",
      tag_color:  "#8A6428",
      url:        "#contacto",
    },
  ],

  // ─────────────────────────────────────────────
  // SERVE / DREAM TEAM
  // ─────────────────────────────────────────────
  serve: {
    headline: "Sirve con nosotros",
    sub:      "Cada persona en Mundo de Fe tiene dones únicos. Úsalos para hacer la diferencia.",
    areas: [
      { icon: "fa-music",          label: "Adoración" },
      { icon: "fa-child-reaching", label: "Niños" },
      { icon: "fa-camera",         label: "Media" },
      { icon: "fa-hand-holding-heart", label: "Hospitalidad" },
      { icon: "fa-laptop",         label: "Tecnología" },
      { icon: "fa-earth-americas", label: "Alcance" },
    ],
    cta_text: "Quiero servir",
    cta_url:  "#contacto",
  },

  // ─────────────────────────────────────────────
  // GIVE / DIEZMO
  // ─────────────────────────────────────────────
  give: {
    headline:  "Diezmos y ofrendas",
    sub:       "Tu generosidad hace posible que más personas conozcan a Dios en Santo Domingo y el mundo.",
    verse:     '"Dios ama al dador alegre." — 2 Corintios 9:7',
    cta_text:  "Dar en línea",
    cta_url:   "#",           // ← replace with your giving platform URL
    methods: [
      { icon: "fa-globe",     label: "En línea",    detail: "Próximamente disponible" },
      { icon: "fa-mobile",    label: "WhatsApp",    detail: "Contáctanos para información" },
      { icon: "fa-church",    label: "En persona",  detail: "Domingos durante el servicio" },
    ],
  },

  // ─────────────────────────────────────────────
  // MINISTRIES
  // ─────────────────────────────────────────────
  ministries: [
    { name: "Niños",     icon: "fa-child-reaching",       color: "#8A6428",
      description: "Sembramos fe en el corazón de los más pequeños a través de historias, juegos y amor genuino." },
    { name: "Jóvenes",   icon: "fa-bolt",                 color: "#B08A3E",
      description: "Identidad, propósito y comunidad real para la generación que cambiará al mundo." },
    { name: "Adoración", icon: "fa-music",                color: "#C9A45C",
      description: "Un equipo apasionado que lleva a la congregación a la presencia de Dios cada semana." },
    { name: "Mujeres",   icon: "fa-venus",                color: "#6b4423",
      description: "Comunidad, mentorship y crecimiento espiritual diseñado para la mujer de fe." },
    { name: "Hombres",   icon: "fa-mars",                 color: "#072A18",
      description: "Hombres que se levantan como pilares en sus hogares, iglesias y comunidades." },
    { name: "Alcance",   icon: "fa-earth-americas",       color: "#14492C",
      description: "Llevamos el amor de Dios más allá de las cuatro paredes — a Santo Domingo y al mundo." },
  ],

  // ─────────────────────────────────────────────
  // SCRIPTURE
  // ─────────────────────────────────────────────
  scripture: {
    text:      "Todo lo puedo en Cristo que me fortalece.",
    reference: "Filipenses 4:13",
  },

  // ─────────────────────────────────────────────
  // ABOUT
  // ─────────────────────────────────────────────
  about: {
    lead: "Mundo de Fe Santo Domingo es una iglesia cristiana evangélica en el corazón de la República Dominicana, parte de la red internacional Mundo de Fe Internacional fundada por los Apóstoles Rafael y Donna Holland.",
    body: "Creemos que cada persona fue creada con un propósito eterno. Nuestro llamado es conectar a cada vida con Dios, con una comunidad auténtica y con una visión que trasciende generaciones.",
    stat_nations:   "25",
    stat_countries: "70",
  },

  // ─────────────────────────────────────────────
  // CONTACT & SOCIAL
  // ─────────────────────────────────────────────
  contact: {
    address:          "Santo Domingo, República Dominicana",
    phone:            "",                // e.g. "+1 809 000 0000"
    email:            "",                // e.g. "info@mundodefesd.com"
    whatsapp_url:     "",              // e.g. "https://wa.me/18090000000"
    facebook_url:     "https://www.facebook.com/MundodefeSD/",
    facebook_handle:  "@MundodefeSD",
    instagram_url:    "https://www.instagram.com/mundodefesd/",
    instagram_handle: "@mundodefesd",
    youtube_url:      "https://www.youtube.com/@mundodefesd",
    videos_url:       "https://www.youtube.com/@mundodefesd/videos",
  },

};
