document.addEventListener('DOMContentLoaded', () => {
    
    /* ==========================================================================
       1. NAVIGATION & SCROLL EFFECTS
       ========================================================================== */
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelector('.nav-links');
    const menuBtn = document.querySelector('.nav-menu-btn');
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-links a');

    // Sticky Header on Scroll
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    // Apply saved theme on load
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('theme-light');
    }
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('theme-light');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    }

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Active Link Highlight
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href').slice(1) === current) {
                item.classList.add('active');
            }
        });
    });

    // Mobile Navigation Menu Toggle
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // Close mobile menu on link click
    navItems.forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });


    /* ==========================================================================
       2. LOOKBOOK SLIDER / CAROUSEL
       ========================================================================== */
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(document.querySelectorAll('.carousel-slide'));
    const nextBtn = document.querySelector('.carousel-btn-next');
    const prevBtn = document.querySelector('.carousel-btn-prev');
    const dotsContainer = document.querySelector('.carousel-indicators');
    
    let currentIndex = 0;
    const totalSlides = slides.length;

    // Create Indicator Dots
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('indicator-dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => moveToSlide(index));
        dotsContainer.appendChild(dot);
    });

    const dots = Array.from(document.querySelectorAll('.indicator-dot'));

    // Move to specific slide
    function moveToSlide(index) {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        
        track.style.transform = `translateX(-${index * (100 / totalSlides)}%)`;
        
        // Update dots
        dots.forEach(dot => dot.classList.remove('active'));
        dots[index].classList.add('active');
        
        currentIndex = index;
    }

    // Event listeners for controls
    if (nextBtn) {
        nextBtn.addEventListener('click', () => moveToSlide(currentIndex + 1));
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', () => moveToSlide(currentIndex - 1));
    }

    // Auto-advance slideshow
    let autoPlay = setInterval(() => {
        moveToSlide(currentIndex + 1);
    }, 6000);

    // Pause autoplay on interaction
    const resetAutoPlay = () => {
        clearInterval(autoPlay);
        autoPlay = setInterval(() => {
            moveToSlide(currentIndex + 1);
        }, 8000);
    };

    [nextBtn, prevBtn, dotsContainer].forEach(el => {
        if (el) el.addEventListener('click', resetAutoPlay);
    });


    /* ==========================================================================
       3. INTERACTIVE BRAND CUSTOMIZER
       ========================================================================== */
    // DOM Elements
    const tshirtFabric = document.querySelector('.tshirt-fabric');
    const teeLogoGroup = document.getElementById('tee-logo-group');
    
    // Logo Art SVG groups
    const logoSlash = document.getElementById('logo-art-slash');
    const logoStitch = document.getElementById('logo-art-stitch');
    const logoText = document.getElementById('logo-art-text');
    
    // Config option containers
    const fabricSwatches = document.querySelectorAll('[data-fabric]');
    const logoArtOptions = document.querySelectorAll('[data-logo-art]');
    const logoColors = document.querySelectorAll('[data-logo-color]');
    const placementBtns = document.querySelectorAll('[data-placement]');
    
    // Feedback Display Labels
    const fabricLabel = document.getElementById('selected-fabric');
    const logoLabel = document.getElementById('selected-logo');
    const colorLabel = document.getElementById('selected-color');
    const placementLabel = document.getElementById('selected-placement');
    const badgeLabel = document.getElementById('badge-placement');

    // Mappings
    const fabricColorMap = {
        'obsidian': '#0D0E10',
        'cream': '#ECE7DE',
        'sage': '#6C7A69',
        'bronze': '#8C7862'
    };

    const logoColorMap = {
        'gold': '#C5B49E',
        'black': '#0B0B0C',
        'white': '#FAF9F6',
        'sage': '#4E5A4D'
    };

    // Placement Coordinates: transform values for SVG group
    const placementMap = {
        'chest': 'translate(42, 33) scale(1)',
        'sleeve': 'translate(28, 28) scale(0.8)',
        'tag': 'translate(36, 84) scale(0.8)',
        'collar': 'translate(50, 23) scale(0.6)'
    };

    // State
    const customizerState = {
        fabric: 'obsidian',
        logoArt: 'slash',
        logoColor: 'gold',
        placement: 'chest'
    };

    // Initialize customizer
    function updateCustomizerUI() {
        // 1. Update fabric color
        tshirtFabric.style.fill = fabricColorMap[customizerState.fabric];
        fabricLabel.textContent = customizerState.fabric;

        // 2. Update active logo art concept
        logoSlash.style.display = customizerState.logoArt === 'slash' ? 'block' : 'none';
        logoStitch.style.display = customizerState.logoArt === 'stitch' ? 'block' : 'none';
        logoText.style.display = customizerState.logoArt === 'text' ? 'block' : 'none';
        logoLabel.textContent = customizerState.logoArt === 'slash' ? 'Elegant Slash' :
                                  customizerState.logoArt === 'stitch' ? 'Craft Stitch' : 'Minimal Text';

        // 3. Update logo color / fill
        const colorHex = logoColorMap[customizerState.logoColor];
        colorLabel.textContent = customizerState.logoColor;
        
        // Apply color to all vector paths inside logo group
        logoSlash.setAttribute('stroke', colorHex);
        logoStitch.querySelectorAll('line').forEach(line => line.setAttribute('stroke', colorHex));
        logoText.setAttribute('fill', colorHex);

        // 4. Update logo position (transform)
        teeLogoGroup.setAttribute('transform', placementMap[customizerState.placement]);
        placementLabel.textContent = customizerState.placement;
        badgeLabel.textContent = `Placement: ${customizerState.placement}`;
    }

    // Event Listeners for Fabric
    fabricSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            fabricSwatches.forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            customizerState.fabric = swatch.getAttribute('data-fabric');
            updateCustomizerUI();
        });
    });

    // Event Listeners for Logo Art
    logoArtOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            logoArtOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            customizerState.logoArt = opt.getAttribute('data-logo-art');
            updateCustomizerUI();
        });
    });

    // Event Listeners for Logo Thread Color
    logoColors.forEach(btn => {
        btn.addEventListener('click', () => {
            logoColors.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            customizerState.logoColor = btn.getAttribute('data-logo-color');
            updateCustomizerUI();
        });
    });

    // Event Listeners for Placement Position
    placementBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            placementBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            customizerState.placement = btn.getAttribute('data-placement');
            updateCustomizerUI();
        });
    });

    // Run initial configuration
    updateCustomizerUI();


    /* ==========================================================================
       4. ACCORDION / BRAND BOOK DETAILS
       ========================================================================== */
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isActive = item.classList.contains('active');
            
            // Close all items
            document.querySelectorAll('.accordion-item').forEach(accItem => {
                accItem.classList.remove('active');
            });

            // If it wasn't active, open it
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });


    /* ==========================================================================
       5. NEWSLETTER SIGNUP INTERACTION
       ========================================================================== */
    const newsletterForm = document.getElementById('newsletter-form');
    const formMsg = document.getElementById('form-msg');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            
            if (emailInput.value.trim() !== '') {
                emailInput.value = '';
                formMsg.textContent = 'YOU HAVE BEEN INCLUDED.';
                formMsg.classList.add('active');
                
                setTimeout(() => {
                    formMsg.classList.remove('active');
                }, 5000);
            }
        });
    }

});
