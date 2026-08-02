window.SITE_CONFIG = {
  brand: {
    name: "Yasmin Santos",
    handle: "@yasminsantos",
    botHandle: "@yasminsantos_bot",
    eyebrow: "CONTEÚDO • 18+",
    headline: "Seu acesso exclusivo começa aqui",
    description: "Conteúdos, prévias e canais exclusivos em um só lugar."
  },

  links: {
    instagramReal: "https://instagram.com/SEU_USUARIO",
    telegramReal: "https://t.me/SEU_USUARIO",
    telegramBot: "https://t.me/SEU_BOT",
    previewsReal: "https://t.me/SEU_GRUPO_DE_PREVIAS",
    support: "https://wa.me/55SEUNUMERO",
    rouletteExternal: "https://sharkbot.com.br/r/yasminsantos"
  },

  instagram: {
    posts: "12",
    followers: "12,8 mil",
    following: "184"
  },

  privacy: {
    photos: "50",
    videos: "89",
    likes: "15,2 mil"
  },

  subscription: {
    plans: {
      daily: {
        code: "diario",
        name: "Acesso diário",
        period: "24 horas",
        price: "R$ 9,90"
      },
      monthly: {
        code: "mensal",
        name: "Acesso mensal",
        period: "30 dias",
        price: "R$ 24,90"
      },
      lifetime: {
        code: "vitalicio",
        name: "Vitalício VIP",
        period: "Sem expiração",
        price: "R$ 199,00"
      }
    }
  },

  payment: {
    endpoint: "https://yasmin-backend.novinhadize9.workers.dev/api/criar-pagamento",
    timeoutMs: 25000,
    pixPersistenceMinutes: 60
  },

  aiChat: {
    enabled: false,
    endpoint: "",
    welcomeMessage: "Oi, vi que você chegou por aqui 😊 Quer conhecer meu conteúdo exclusivo?",
    fallbackReply: "Adorei sua mensagem. Meu atendimento inteligente ainda está sendo configurado, mas você já pode conhecer as opções exclusivas no perfil."
  },

  instagramSuggestions: [
    {name:"Luna Martins",handle:"@lunamartins",image:"../assets/images/modelo-piscina.png",url:"https://SEU-SITE-LUNA.com"},
    {name:"Maya Costa",handle:"@mayacosta",image:"../assets/images/modelo-piscina.png",url:"https://SEU-SITE-MAYA.com"},
    {name:"Clara Alves",handle:"@claraalves",image:"../assets/images/modelo-piscina.png",url:"https://SEU-SITE-CLARA.com"}
  ],

  instagramReels: [
    {title:"Reel 1",thumbnail:"../assets/images/modelo-piscina.png",videoUrl:""},
    {title:"Reel 2",thumbnail:"../assets/images/modelo-piscina.png",videoUrl:""},
    {title:"Reel 3",thumbnail:"../assets/images/modelo-piscina.png",videoUrl:""}
  ]
};
