document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Config and Theme
    applyTheme();
    renderContent();
    setupEvents();
    reveal(); // Initial reveal check
});

function applyTheme() {
    const root = document.documentElement;
    if (config.theme.primaryColor) root.style.setProperty('--gold', config.theme.primaryColor);
    if (config.theme.primaryColorHover) root.style.setProperty('--gold-hover', config.theme.primaryColorHover);
    if (config.theme.bgDark) root.style.setProperty('--bg-dark', config.theme.bgDark);
    if (config.theme.bgAccent) root.style.setProperty('--bg-accent', config.theme.bgAccent);
    if (config.theme.textLight) root.style.setProperty('--text-light', config.theme.textLight);
    if (config.theme.textMuted) root.style.setProperty('--text-muted', config.theme.textMuted);
}

function renderContent() {
    // Title & Logo
    document.getElementById('page-title').textContent = config.business.name;
    document.getElementById('logo').textContent = config.business.logoText;
    document.getElementById('footer-logo').textContent = config.business.logoText;

    // Hero
    document.getElementById('home').style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${config.hero.backgroundImage}')`;
    document.getElementById('hero-subtitle').textContent = config.hero.subtitle;
    document.getElementById('hero-title').textContent = config.hero.title;
    document.getElementById('hero-btn').textContent = config.hero.buttonText;
    document.getElementById('hero-btn').href = config.hero.buttonLink;

    // Specials
    document.getElementById('specials-subtitle').textContent = config.specials.subtitle;
    document.getElementById('specials-title').textContent = config.specials.title;
    
    const specialsGrid = document.getElementById('specials-grid');
    config.specials.items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'special-card reveal';
        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="card-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <span class="price">${item.price}</span>
            </div>
        `;
        specialsGrid.appendChild(card);
    });

    // Menu
    document.getElementById('menu-subtitle').textContent = config.menu.subtitle;
    document.getElementById('menu-title').textContent = config.menu.title;

    const menuTabs = document.getElementById('menu-tabs');
    config.menu.categories.forEach((cat, index) => {
        const btn = document.createElement('button');
        btn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
        btn.textContent = cat.name;
        btn.onclick = () => filterMenu(cat.id);
        menuTabs.appendChild(btn);
    });

    const menuItems = document.getElementById('menu-items');
    config.menu.items.forEach(item => {
        const div = document.createElement('div');
        div.className = `menu-item ${item.category}`;
        div.innerHTML = `
            <div class="item-info">
                <h4>${item.name}</h4>
                <p>${item.description}</p>
            </div>
            <div class="item-dots"></div>
            <span class="item-price">${item.price}</span>
        `;
        menuItems.appendChild(div);
    });

    // About
    document.getElementById('about-subtitle').textContent = config.about.subtitle;
    document.getElementById('about-title').textContent = config.about.title;
    
    const aboutTextContainer = document.getElementById('about-text-container');
    const aboutBtn = document.getElementById('about-btn');
    
    config.about.paragraphs.forEach(p => {
        const pEl = document.createElement('p');
        pEl.style.marginBottom = '1.5rem';
        pEl.style.color = 'var(--text-muted)';
        pEl.textContent = p;
        aboutTextContainer.insertBefore(pEl, aboutBtn);
    });

    aboutBtn.textContent = config.about.buttonText;
    aboutBtn.href = config.about.buttonLink;
    document.getElementById('about-image').src = config.about.image;

    // Reservations
    document.getElementById('res-subtitle').textContent = config.reservations.subtitle;
    document.getElementById('res-title').textContent = config.reservations.title;
    document.getElementById('res-btn').textContent = config.reservations.buttonText;

    // Footer
    document.getElementById('footer-desc').textContent = `Fundado en ${config.business.establishedYear}. Experiencia culinaria excepcional.`;
    
    const locationCol = document.getElementById('footer-location');
    locationCol.innerHTML += `<p>${config.business.addressLine1}<br>${config.business.addressLine2}</p><p>${config.business.phone}</p>`;

    const hoursCol = document.getElementById('footer-hours');
    const ulHours = document.createElement('ul');
    config.business.hours.forEach(h => {
        const li = document.createElement('li');
        li.textContent = h;
        ulHours.appendChild(li);
    });
    hoursCol.appendChild(ulHours);

    const socialsCol = document.getElementById('footer-socials');
    const ulSocials = document.createElement('ul');
    ulSocials.style.display = 'flex';
    ulSocials.style.gap = '1rem';
    config.business.socials.forEach(s => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${s.link}" class="gold-text">${s.platform}</a>`;
        ulSocials.appendChild(li);
    });
    socialsCol.appendChild(ulSocials);

    const currentYear = new Date().getFullYear();
    document.getElementById('footer-bottom').innerHTML = `&copy; ${currentYear} ${config.business.name}. Todos los derechos reservados.`;
}

window.filterMenu = function(category) {
    const items = document.querySelectorAll('.menu-item');
    const buttons = document.querySelectorAll('.tab-btn');
    const targetCatObj = config.menu.categories.find(c => c.id === category);

    // Update active button
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (targetCatObj && btn.textContent === targetCatObj.name) {
            btn.classList.add('active');
        }
    });

    // Filter items
    items.forEach(item => {
        if (category === 'all' || item.classList.contains(category)) {
            item.style.display = 'flex';
            item.style.animation = 'fadeInUp 0.5s forwards';
        } else {
            item.style.display = 'none';
        }
    });
}

function setupEvents() {
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        
        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // Scroll reveal
    window.addEventListener('scroll', reveal);

    // Reservation form simulation
    const reservationForm = document.getElementById('reservation-form');
    if (reservationForm) {
        reservationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = document.getElementById('res-btn');
            const originalText = btn.innerText;
            
            btn.innerText = 'Procesando...';
            btn.disabled = true;

            setTimeout(() => {
                alert(`¡Gracias! Tu reserva en ${config.business.name} ha sido recibida. Nos comunicaremos en breve.`);
                reservationForm.reset();
                btn.innerText = originalText;
                btn.disabled = false;
            }, 1500);
        });
    }

    // Smooth scroll for anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function reveal() {
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => {
        const windowHeight = window.innerHeight;
        const revealTop = el.getBoundingClientRect().top;
        const revealPoint = 150;

        if (revealTop < windowHeight - revealPoint) {
            el.classList.add('active');
        }
    });
}
