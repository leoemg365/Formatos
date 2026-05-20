const config = {
    theme: {
        primaryColor: "#c5a059",
        primaryColorHover: "#e0bc75",
        bgDark: "#0f0f0f",
        bgAccent: "#1a1a1a",
        textLight: "#f5f5f5",
        textMuted: "#a0a0a0",
        fontHeading: "'Playfair Display', serif",
        fontBody: "'Inter', sans-serif"
    },
    business: {
        name: "Lúmina",
        logoText: "LÚMINA",
        establishedYear: "2010",
        phone: "+34 (555) 123-4567",
        addressLine1: "Calle del Sabor, 123",
        addressLine2: "Madrid, España 28001",
        hours: [
            "Lun - Jue: 13:00 - 23:00",
            "Vie - Sab: 13:00 - 00:00",
            "Domingos: 13:00 - 17:00"
        ],
        socials: [
            { platform: "Instagram", link: "#" },
            { platform: "Facebook", link: "#" }
        ]
    },
    hero: {
        subtitle: "Bienvenido a Lúmina Gastronomía",
        title: "Perfección Culinaria",
        buttonText: "Explorar Menú",
        buttonLink: "#menu",
        backgroundImage: "assets/hero_bg.png"
    },
    specials: {
        subtitle: "Recomendaciones del Chef",
        title: "Colección Exclusiva",
        items: [
            {
                name: "Filete Añejo",
                description: "Añejado por 45 días, servido con mantequilla de trufa.",
                price: "$52",
                image: "assets/hero_bg.png"
            },
            {
                name: "Salmón Nórdico",
                description: "Sellado en sartén con arroz salvaje, espárragos y limón.",
                price: "$38",
                image: "assets/hero_bg.png"
            },
            {
                name: "Fondant de Medianoche",
                description: "Pastel de lava de chocolate negro con reducción de frambuesa.",
                price: "$18",
                image: "assets/hero_bg.png"
            }
        ]
    },
    about: {
        subtitle: "Desde 2010",
        title: "El Arte de la Gastronomía",
        paragraphs: [
            "Fundado sobre los principios de elegancia y excelencia, Lúmina Gastronomía ha sido un referente de la alta cocina. Nuestra filosofía es simple: buscar los mejores ingredientes y dejar que hablen por sí mismos.",
            "Cada plato es un lienzo, y cada ingrediente es un elemento cuidadosamente elegido para contar una historia mayor. Te invitamos a ser parte de nuestra experiencia."
        ],
        buttonText: "Leer Más",
        buttonLink: "#",
        image: "assets/hero_bg.png"
    },
    menu: {
        subtitle: "Descubre Nuestros Sabores",
        title: "El Menú Principal",
        categories: [
            { id: "all", name: "Todo" },
            { id: "mains", name: "Platos Principales" },
            { id: "desserts", name: "Postres" }
        ],
        items: [
            {
                category: "mains",
                name: "Costilla de Res Estofada",
                description: "Cocción lenta durante 12 horas con jugo de vino tinto.",
                price: "$45"
            },
            {
                category: "mains",
                name: "Carré de Cordero",
                description: "Con pesto de menta, ajo asado y patatas fondant.",
                price: "$48"
            },
            {
                category: "mains",
                name: "Risotto de Setas Silvestres",
                description: "Arroz arborio, boletus, parmesano y cebollino.",
                price: "$32"
            },
            {
                category: "desserts",
                name: "Crème Brûlée de Vainilla",
                description: "Costra de azúcar caramelizada, bayas frescas de temporada.",
                price: "$14"
            },
            {
                category: "desserts",
                name: "Tartaleta de Limón",
                description: "Crema de cítricos, merengue flameado, masa quebrada.",
                price: "$12"
            }
        ]
    },
    reservations: {
        subtitle: "Asegura tu Experiencia",
        title: "Haz una Reserva",
        buttonText: "Confirmar Reserva"
    }
};
