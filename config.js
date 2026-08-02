window.SITE_CONFIG = {
  brand: {
    name: "Yasmin Santos",
    handle: "@yasminsantos",
    botHandle: "@yasminsantos_bot",
    eyebrow: "CONTEÚDO • 18+",
    headline: "Seu acesso exclusivo começa aqui",
    description: "Conheça meu canal VIP, conteúdos e prévias em um só lugar."
  },
  links: {
    instagramReal: "https://instagram.com/SEU_USUARIO",
    telegramReal: "https://t.me/SEU_USUARIO",
    telegramBot: "https://t.me/SEU_BOT",
    previewsReal: "https://t.me/SEU_GRUPO_DE_PREVIAS",
    support: "https://wa.me/55SEUNUMERO",
    rouletteExternal: "https://sharkbot.com.br/r/yasminsantos",
    exclusiveCheckout: "https://SEU-CHECKOUT-CONTEUDO-EXCLUSIVO.com"
  },
  instagram: {
    posts: "9",
    followers: "12,8 mil",
    following: "184"
  },
  privacy: {
    photos: "50",
    videos: "89",
    likes: "15,2k"
  },
  subscription: {
    mainOffer: {
      originalPrice: "R$ 25,00",
      price: "R$ 20,00",
      discount: "20% OFF",
      checkoutUrl: "https://SEU-CHECKOUT-PRINCIPAL.com"
    },
    plans: {
      monthly: { code:"privacy_mensal", name:"Plano mensal Privacy", period:"30 dias", price:"R$ 20,00", checkoutUrl:"https://SEU-CHECKOUT-MENSAL.com" },
      quarterly: { code:"privacy_trimestral", name:"Plano trimestral Privacy", period:"90 dias", price:"R$ 55,00", checkoutUrl:"https://SEU-CHECKOUT-TRIMESTRAL.com" },
      semiannual: { code:"privacy_semestral", name:"Plano semestral Privacy", period:"180 dias", price:"R$ 99,90", checkoutUrl:"https://SEU-CHECKOUT-SEMESTRAL.com" }
    }
  },

  payment: {
    endpoint: "https://yasmin-backend.novinhadize9.workers.dev/api/criar-pagamento",
    timeoutMs: 25000
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
