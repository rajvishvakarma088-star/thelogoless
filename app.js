document.addEventListener('DOMContentLoaded', () => {
    
    /* ==========================================================================
       0. PREMIUM CORE INTERACTIONS (CURSOR, SCROLL, AUDIO SYNTH)
       ========================================================================== */
    
    // Custom Cursor Easing (mouse trailing)
    const cursorDot = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (cursorDot) {
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top = `${mouseY}px`;
        }
    });

    function animateCursor() {
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;
        if (cursorRing) {
            cursorRing.style.left = `${ringX}px`;
            cursorRing.style.top = `${ringY}px`;
        }
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    const hoverTargets = 'a, button, .swatch, .logo-art-option, .accordion-header';
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(hoverTargets)) {
            document.body.classList.add('hover-active');
        }
    });
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(hoverTargets)) {
            document.body.classList.remove('hover-active');
        }
    });

    // Scroll Progress Tracker
    const progressBar = document.getElementById('progress-bar');
    window.addEventListener('scroll', () => {
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercent = (window.scrollY / docHeight);
        if (progressBar) {
            progressBar.style.transform = `scaleX(${scrollPercent})`;
        }
    });

    // Scroll Reveal Intersection Observer
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    revealElements.forEach(el => revealObserver.observe(el));

    // Web Audio Synthesizer Organic Micro-Clicks
    let audioEnabled = false;
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playClickSound() {
        if (!audioEnabled) return;
        initAudio();
        if (!audioCtx) return;
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        // Custom wood-click oscillator structure
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.06);
        
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
        
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.06);
    }

    // Bind click sound globally to interactive tags
    document.addEventListener('click', (e) => {
        if (e.target.closest('button, a, .swatch, .logo-art-option, .accordion-header')) {
            playClickSound();
        }
    });

    // Audio Toggle Handler
    const audioToggleBtn = document.getElementById('audio-toggle-btn');
    const audioMutedSvg = document.querySelector('.audio-icon.audio-muted');
    const audioPlayingSvg = document.querySelector('.audio-icon.audio-playing');

    if (audioToggleBtn) {
        audioToggleBtn.addEventListener('click', () => {
            audioEnabled = !audioEnabled;
            if (audioEnabled) {
                initAudio();
                audioMutedSvg.style.display = 'none';
                audioPlayingSvg.style.display = 'block';
                // confirmation sound
                setTimeout(() => playClickSound(), 100);
            } else {
                audioMutedSvg.style.display = 'block';
                audioPlayingSvg.style.display = 'none';
            }
        });
    }

    // Scroll parallax for Quote Interlude Video
    const interludeVideo = document.getElementById('interlude-video');
    const interludeSection = document.getElementById('video-interlude');
    if (interludeVideo && interludeSection) {
        window.addEventListener('scroll', () => {
            const rect = interludeSection.getBoundingClientRect();
            const viewHeight = window.innerHeight;
            if (rect.top < viewHeight && rect.bottom > 0) {
                const scrollFactor = (rect.top / viewHeight);
                interludeVideo.style.transform = `translateY(${scrollFactor * 8}%) scale(1.05)`;
            }
        });
    }

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
    const tshirtSvg = document.getElementById('tshirt-svg');
    
    // Logo Art SVG groups
    const logoSlash = document.getElementById('logo-art-slash');
    const logoStitch = document.getElementById('logo-art-stitch');
    const logoText = document.getElementById('logo-art-text');
    
    // Config option containers
    const fabricSwatches = document.querySelectorAll('[data-fabric]');
    const logoArtOptions = document.querySelectorAll('[data-logo-art]');
    const logoColors = document.querySelectorAll('[data-logo-color]');
    const placementBtns = document.querySelectorAll('[data-placement]');
    const presetBtns = document.querySelectorAll('[data-preset]');
    
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

    // Camera zoom and translations map for SVG viewport focus
    const tshirtZoomMap = {
        'chest': 'scale(2.0) translate(8%, 15%)',
        'sleeve': 'scale(2.5) translate(22%, 22%)',
        'tag': 'scale(2.0) translate(14%, -24%)',
        'collar': 'scale(3.0) translate(0%, 27%)'
    };

    // Curated Aesthetics Presets Mappings
    const presetsMap = {
        'obsidian-core': { fabric: 'obsidian', logoArt: 'slash', logoColor: 'black', placement: 'chest' },
        'linen-nomad': { fabric: 'cream', logoArt: 'stitch', logoColor: 'white', placement: 'sleeve' },
        'selvedge-artist': { fabric: 'sage', logoArt: 'stitch', logoColor: 'sage', placement: 'collar' },
        'bronze-signature': { fabric: 'bronze', logoArt: 'slash', logoColor: 'gold', placement: 'tag' }
    };

    // State
    const customizerState = {
        fabric: 'obsidian',
        logoArt: 'slash',
        logoColor: 'gold',
        placement: 'chest'
    };

    // Initialize customizer UI
    function updateCustomizerUI() {
        // 1. Update fabric color
        if (tshirtFabric) {
            tshirtFabric.style.fill = fabricColorMap[customizerState.fabric];
        }
        if (fabricLabel) {
            fabricLabel.textContent = customizerState.fabric;
        }

        // 2. Adjust procedural fabric texture parameters dynamically
        const fabricFilter = document.querySelector('#fabric-texture feTurbulence');
        const fabricColorMatrix = document.querySelector('#fabric-texture feColorMatrix');
        if (fabricFilter && fabricColorMatrix) {
            if (customizerState.fabric === 'cream') { // Linen: coarser weave
                fabricFilter.setAttribute('baseFrequency', '0.55');
                fabricColorMatrix.setAttribute('values', '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.16 0');
            } else if (customizerState.fabric === 'sage') { // Terry: loop/terry texture
                fabricFilter.setAttribute('baseFrequency', '0.45');
                fabricColorMatrix.setAttribute('values', '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0');
            } else if (customizerState.fabric === 'bronze') { // Cashmere: fine soft texture
                fabricFilter.setAttribute('baseFrequency', '0.85');
                fabricColorMatrix.setAttribute('values', '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.10 0');
            } else { // Obsidian: standard premium cotton
                fabricFilter.setAttribute('baseFrequency', '0.75');
                fabricColorMatrix.setAttribute('values', '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.12 0');
            }
        }

        // 3. Update active logo art concept
        if (logoSlash) logoSlash.style.display = customizerState.logoArt === 'slash' ? 'block' : 'none';
        if (logoStitch) logoStitch.style.display = customizerState.logoArt === 'stitch' ? 'block' : 'none';
        if (logoText) logoText.style.display = customizerState.logoArt === 'text' ? 'block' : 'none';
        if (logoLabel) {
            logoLabel.textContent = customizerState.logoArt === 'slash' ? 'Elegant Slash' :
                                      customizerState.logoArt === 'stitch' ? 'Craft Stitch' : 'Minimal Text';
        }

        // 4. Update logo color / fill
        const colorHex = logoColorMap[customizerState.logoColor];
        if (colorLabel) {
            colorLabel.textContent = customizerState.logoColor;
        }
        
        // Apply color to all vector paths inside logo group
        if (logoSlash) logoSlash.setAttribute('stroke', colorHex);
        if (logoStitch) logoStitch.querySelectorAll('line').forEach(line => line.setAttribute('stroke', colorHex));
        if (logoText) logoText.setAttribute('fill', colorHex);

        // 5. Update logo position (transform) inside shirt SVG
        if (teeLogoGroup) {
            teeLogoGroup.setAttribute('transform', placementMap[customizerState.placement]);
        }
        if (placementLabel) {
            placementLabel.textContent = customizerState.placement;
        }
        if (badgeLabel) {
            badgeLabel.textContent = `Placement: ${customizerState.placement}`;
        }

        // 6. Apply dynamic camera zoom focusing on the active customisation area
        if (tshirtSvg) {
            tshirtSvg.style.transform = tshirtZoomMap[customizerState.placement];
        }
    }

    // Helper to clear active state from curated preset buttons
    function clearActivePresets() {
        presetBtns.forEach(btn => btn.classList.remove('active'));
    }

    // Curated presets click listener
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const presetKey = btn.getAttribute('data-preset');
            const preset = presetsMap[presetKey];
            if (!preset) return;

            // Set preset active class
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Apply preset values to state
            customizerState.fabric = preset.fabric;
            customizerState.logoArt = preset.logoArt;
            customizerState.logoColor = preset.logoColor;
            customizerState.placement = preset.placement;

            // Align option buttons on layout UI
            fabricSwatches.forEach(s => {
                s.classList.toggle('active', s.getAttribute('data-fabric') === preset.fabric);
            });
            logoArtOptions.forEach(o => {
                o.classList.toggle('active', o.getAttribute('data-logo-art') === preset.logoArt);
            });
            logoColors.forEach(c => {
                c.classList.toggle('active', c.getAttribute('data-logo-color') === preset.logoColor);
            });
            placementBtns.forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-placement') === preset.placement);
            });

            updateCustomizerUI();
        });
    });

    // Event Listeners for Fabric swatches
    fabricSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            clearActivePresets();
            fabricSwatches.forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            customizerState.fabric = swatch.getAttribute('data-fabric');
            
            // Subtle zoom overview feedback when changing fabric textures
            if (tshirtSvg) {
                tshirtSvg.style.transform = 'scale(1.2) translate(0%, 0%)';
                setTimeout(() => {
                    tshirtSvg.style.transform = tshirtZoomMap[customizerState.placement];
                }, 500);
            }
            
            updateCustomizerUI();
        });
    });

    // Event Listeners for Logo Art
    logoArtOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            clearActivePresets();
            logoArtOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            customizerState.logoArt = opt.getAttribute('data-logo-art');
            updateCustomizerUI();
        });
    });

    // Event Listeners for Logo Thread Color
    logoColors.forEach(btn => {
        btn.addEventListener('click', () => {
            clearActivePresets();
            logoColors.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            customizerState.logoColor = btn.getAttribute('data-logo-color');
            updateCustomizerUI();
        });
    });

    // Event Listeners for Placement Position
    placementBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            clearActivePresets();
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
