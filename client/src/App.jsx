import React, { useState, useEffect, useRef, useCallback } from 'react';

// Default seeded products fallback
const defaultProducts = [
    {
        _id: 'prod_1',
        name: 'Obsidian Heavyweight Tee',
        price: 120,
        material: '320GSM Long-Staple Egyptian Cotton',
        image: '/logo_tee_mockup.png'
    },
    {
        _id: 'prod_2',
        name: 'Normandy Linen Shirt',
        price: 160,
        material: 'Pure Normandy Linen-Cotton Weave',
        image: '/logo_tag_mockup.png'
    },
    {
        _id: 'prod_3',
        name: 'Okayama Selvedge Denim',
        price: 220,
        material: 'Raw Selvedge Denim on Vintage Looms',
        image: '/logo_concept_seam.png'
    },
    {
        _id: 'prod_4',
        name: 'Sage Terry Hoodie',
        price: 190,
        material: '380GSM Organic Terry Fleece',
        image: '/logo_concept_dots.png'
    },
    {
        _id: 'prod_5',
        name: 'Bronze Cashmere Coat',
        price: 380,
        material: 'Brushed Italian Cashmere Blend',
        image: '/logo_concept_fold.png'
    },
    {
        _id: 'prod_6',
        name: 'Bronze Sculptural Hanger',
        price: 80,
        material: 'Solid Engraved Bronze Boutique Hardware',
        image: '/logo_concept_hanger.png'
    }
];

// Customizer Mappings
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

const placementMap = {
    'chest': 'translate(42, 33) scale(1)',
    'sleeve': 'translate(28, 28) scale(0.8)',
    'tag': 'translate(36, 84) scale(0.8)',
    'collar': 'translate(50, 23) scale(0.6)'
};

const tshirtZoomMap = {
    'chest': 'scale(2.0) translate(8%, 15%)',
    'sleeve': 'scale(2.5) translate(22%, 22%)',
    'tag': 'scale(2.0) translate(14%, -24%)',
    'collar': 'scale(3.0) translate(0%, 27%)'
};

const presetsMap = {
    'obsidian-core': { fabric: 'obsidian', logo: 'slash', color: 'black', placement: 'chest' },
    'linen-nomad': { fabric: 'cream', logo: 'stitch', color: 'white', placement: 'sleeve' },
    'selvedge-artist': { fabric: 'sage', logo: 'stitch', color: 'sage', placement: 'collar' },
    'bronze-signature': { fabric: 'bronze', logo: 'slash', color: 'gold', placement: 'tag' }
};

// Lookbook Slides
const lookbookSlides = [
    { tag: "Primary Logo", title: "Typography & Slash Concept", num: "01", img: "/logo_typography_dark.png" },
    { tag: "Packaging Mockup", title: "Debossed Cotton Paper Clothing Tag", num: "02", img: "/logo_tag_mockup.png" },
    { tag: "Apparel Mockup", title: "Heavyweight Tee with Tone-on-Tone Stitch", num: "03", img: "/logo_tee_mockup.png" },
    { tag: "Retail Facade", title: "Limestone boutique with backlit bronze metal letters", num: "04", img: "/logo_facade_mockup.png" },
    { tag: "Detail Mockup", title: "Hand-Tied Cotton Thread Knot", num: "05", img: "/logo_concept_knot.png" },
    { tag: "Tailoring Detail", title: "Indigo Denim with Gold Stitch Line", num: "06", img: "/logo_concept_seam.png" },
    { tag: "Stamp Signature", title: "Minimal Japanese Hanko Seal", num: "07", img: "/logo_concept_hanko.png" },
    { tag: "Boutique Hardware", title: "Engraved Sculptural Bronze Hanger", num: "08", img: "/logo_concept_hanger.png" },
    { tag: "Collar Detail", title: "Origami Fabric Fold Seam Label", num: "09", img: "/logo_concept_fold.png" },
    { tag: "Embroidery Mockup", title: "Embroidered Cotton Seed Cashmere", num: "10", img: "/logo_concept_seed.png" },
    { tag: "Packaging Mockup", title: "Minimal Matte Black Wax Seal", num: "11", img: "/logo_concept_wax.png" },
    { tag: "Hardware Detail", title: "Brushed Silver Blank Pin Label", num: "12", img: "/logo_concept_metal.png" },
    { tag: "Sleeve Detail", title: "Triple Silk Thread Alignment Dots", num: "13", img: "/logo_concept_dots.png" }
];

export default function App() {
    // --- STYLING & NAVIGATION STATES ---
    const [light, setLight] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('philosophy');
    const [scrollProgress, setScrollProgress] = useState(0);

    // --- PRODUCTS & CART & CHECKOUT STATES ---
    const [products, setProducts] = useState(defaultProducts);
    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [checkoutForm, setCheckoutForm] = useState({ name: '', email: '', location: '' });
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);

    // --- CUSTOMIZER STATES ---
    const [customizerState, setCustomizerState] = useState({
        fabric: 'obsidian',
        logo: 'slash',
        color: 'gold',
        placement: 'chest'
    });
    const [activePreset, setActivePreset] = useState('');
    const [tshirtTransform, setTshirtTransform] = useState(tshirtZoomMap.chest);

    // --- INTERACTIVE FEATURES STATES ---
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterMsg, setNewsletterMsg] = useState('');
    const [accordionOpen, setAccordionOpen] = useState(1);
    const [lookbookIndex, setLookbookIndex] = useState(0);

    // --- WEB AUDIO API NODE ---
    const audioCtxRef = useRef(null);

    // --- ELEMENT REFS ---
    const collectionTrackRef = useRef(null);
    const isDownRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftRef = useRef(0);
    const interludeSecRef = useRef(null);
    const interludeVidRef = useRef(null);

    // Initialize Web Audio
    const initAudio = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
    }, []);

    // Play Synthesized Click
    const playClickSound = useCallback(() => {
        if (!audioEnabled) return;
        initAudio();
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.06);

        gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.06);
    }, [audioEnabled, initAudio]);

    // Handle generic document clicks for interface sound
    useEffect(() => {
        const handleGlobalClick = (e) => {
            if (e.target.closest('button, a, .swatch, .logo-art-option, .accordion-header')) {
                playClickSound();
            }
        };
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, [playClickSound]);

    // Audio Switch Toggle
    const handleAudioToggle = () => {
        setAudioEnabled(prev => {
            const next = !prev;
            if (next) {
                initAudio();
                setTimeout(() => playClickSound(), 80);
            }
            return next;
        });
    };

    // Toggle Light Theme
    useEffect(() => {
        document.body.className = light ? 'light' : '';
    }, [light]);

    // Fetch Products from API
    useEffect(() => {
        fetch('http://localhost:5001/api/products')
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) setProducts(data);
            })
            .catch(() => {
                console.log('MongoDB server offline, displaying local file fallback products.');
                setProducts(defaultProducts);
            });
    }, []);

    // Scroll Effects
    useEffect(() => {
        const handleScroll = () => {
            // Sticky Navbar
            setScrolled(window.scrollY > 50);

            // Scroll Progress
            const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            setScrollProgress((window.scrollY / docHeight) * 100);

            // Active Section Spy
            const sections = ['philosophy', 'collection', 'concepts', 'lookbook', 'customizer', 'brandbook'];
            for (let sec of [...sections].reverse()) {
                const el = document.getElementById(sec);
                if (el && window.scrollY >= (el.offsetTop - 200)) {
                    setActiveSection(sec);
                    break;
                }
            }

            // Parallax Interlude Video
            if (interludeVidRef.current && interludeSecRef.current) {
                const rect = interludeSecRef.current.getBoundingClientRect();
                const viewHeight = window.innerHeight;
                if (rect.top < viewHeight && rect.bottom > 0) {
                    const scrollFactor = rect.top / viewHeight;
                    interludeVidRef.current.style.transform = `translateY(${scrollFactor * 8}%) scale(1.05)`;
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Intersection Observer for scroll reveal transitions
    useEffect(() => {
        const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        revealElements.forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [products]);

    // Customizer SVG update logic
    useEffect(() => {
        setTshirtTransform(tshirtZoomMap[customizerState.placement]);

        // Dynamically shift SVG Weave Pattern
        const fabricFilter = document.querySelector('#fabric-texture feTurbulence');
        const fabricColorMatrix = document.querySelector('#fabric-texture feColorMatrix');
        if (fabricFilter && fabricColorMatrix) {
            if (customizerState.fabric === 'cream') {
                fabricFilter.setAttribute('baseFrequency', '0.55');
                fabricColorMatrix.setAttribute('values', '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.16 0');
            } else if (customizerState.fabric === 'sage') {
                fabricFilter.setAttribute('baseFrequency', '0.45');
                fabricColorMatrix.setAttribute('values', '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0');
            } else if (customizerState.fabric === 'bronze') {
                fabricFilter.setAttribute('baseFrequency', '0.85');
                fabricColorMatrix.setAttribute('values', '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.10 0');
            } else {
                fabricFilter.setAttribute('baseFrequency', '0.75');
                fabricColorMatrix.setAttribute('values', '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.12 0');
            }
        }
    }, [customizerState]);

    // Apply Curator Preset Style
    const handlePresetApply = (key) => {
        const preset = presetsMap[key];
        if (!preset) return;
        setActivePreset(key);
        setCustomizerState(preset);
    };

    // Clear active presets when custom settings are clicked
    const clearPresetSelection = () => setActivePreset('');

    // --- CAROUSEL SLIDESHOW LOGIC ---
    const handleLookbookNext = () => {
        setLookbookIndex(prev => (prev + 1) % lookbookSlides.length);
    };

    const handleLookbookPrev = () => {
        setLookbookIndex(prev => (prev - 1 + lookbookSlides.length) % lookbookSlides.length);
    };

    // Auto Advance lookbook slideshow
    useEffect(() => {
        const timer = setInterval(() => {
            handleLookbookNext();
        }, 5500);
        return () => clearInterval(timer);
    }, []);

    // --- CART FUNCTIONALITY ---
    const addToCart = (product) => {
        setCart(prev => {
            const exists = prev.find(item => item.product._id === product._id);
            if (exists) {
                return prev.map(item => 
                    item.product._id === product._id 
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
        setCartOpen(true);
    };

    const updateCartQty = (productId, change) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.product._id === productId) {
                    const newQty = item.quantity + change;
                    return newQty > 0 ? { ...item, quantity: newQty } : item;
                }
                return item;
            });
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.product._id !== productId));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleQuickBuy = (product) => {
        setCart([{ product, quantity: 1 }]);
        setCartOpen(false);
        setCheckoutSuccess(false);
        setCheckoutOpen(true);
    };

    // --- CHECKOUT SUBMISSION ---
    const handleCheckoutSubmit = (e) => {
        e.preventDefault();
        setCheckoutLoading(true);

        const orderData = {
            customerName: checkoutForm.name,
            customerEmail: checkoutForm.email,
            items: cart.map(item => ({
                productId: item.product._id,
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity
            })),
            total: subtotal
        };

        fetch('http://localhost:5001/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        })
        .then(res => res.json())
        .then(data => {
            setCheckoutLoading(false);
            if (data.success) {
                setCheckoutSuccess(true);
                setCart([]);
            }
        })
        .catch(() => {
            // Local simulation fallback
            setTimeout(() => {
                setCheckoutLoading(false);
                setCheckoutSuccess(true);
                setCart([]);
            }, 1800);
        });
    };

    // --- NEWSLETTER FORM SUBMISSION ---
    const handleNewsletterSubmit = (e) => {
        e.preventDefault();
        if (!newsletterEmail) return;

        fetch('http://localhost:5001/api/newsletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newsletterEmail })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setNewsletterMsg('YOU HAVE BEEN INCLUDED.');
                setNewsletterEmail('');
                setTimeout(() => setNewsletterMsg(''), 5000);
            }
        })
        .catch(() => {
            // Fallback simulation
            setNewsletterMsg('YOU HAVE BEEN INCLUDED.');
            setNewsletterEmail('');
            setTimeout(() => setNewsletterMsg(''), 5000);
        });
    };

    // --- PRODUCTS CAROUSEL SCROLL/DRAG DRAG HANDLERS ---
    const handleMouseDown = (e) => {
        isDownRef.current = true;
        startXRef.current = e.pageX - collectionTrackRef.current.offsetLeft;
        scrollLeftRef.current = collectionTrackRef.current.scrollLeft;
    };

    const handleMouseLeave = () => {
        isDownRef.current = false;
    };

    const handleMouseUp = () => {
        isDownRef.current = false;
    };

    const handleMouseMove = (e) => {
        if (!isDownRef.current) return;
        e.preventDefault();
        const x = e.pageX - collectionTrackRef.current.offsetLeft;
        const walk = (x - startXRef.current) * 1.5;
        collectionTrackRef.current.scrollLeft = scrollLeftRef.current - walk;
    };

    return (
        <>
            {/* Scroll progress indicator */}
            <div className="progress-bar" style={{ transform: `scaleX(${scrollProgress / 100})` }}></div>

            {/* --- NAVIGATION BAR --- */}
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="container">
                    <a href="#hero" className="nav-logo">T H E L O G O L E S S</a>
                    <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
                        <li><a href="#philosophy" className={activeSection === 'philosophy' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Philosophy</a></li>
                        <li><a href="#collection" className={activeSection === 'collection' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Collection</a></li>
                        <li><a href="#concepts" className={activeSection === 'concepts' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Signatures</a></li>
                        <li><a href="#lookbook" className={activeSection === 'lookbook' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Lookbook</a></li>
                        <li><a href="#customizer" className={activeSection === 'customizer' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Customizer</a></li>
                        <li><a href="#brandbook" className={activeSection === 'brandbook' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Brand Book</a></li>
                    </ul>

                    <div className="nav-right-controls" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {/* Interactive audio click switch */}
                        <button className="audio-toggle-btn" onClick={handleAudioToggle} aria-label="Toggle interface sounds" title="Toggle audio feedback">
                            {audioEnabled ? (
                                <svg className="audio-icon audio-playing" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                </svg>
                            ) : (
                                <svg className="audio-icon audio-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                    <line x1="23" y1="9" x2="17" y2="15"></line>
                                    <line x1="17" y1="9" x2="23" y2="15"></line>
                                </svg>
                            )}
                        </button>

                        {/* Shopping cart trigger */}
                        <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label="Open Cart" title="View Cart">
                            <svg className="cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                        </button>

                        {/* Light/Dark Toggle */}
                        <button className="theme-toggle-btn" onClick={() => setLight(prev => !prev)} aria-label="Toggle Theme">
                            <svg className="theme-icon sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5"></circle>
                                <line x1="12" y1="1" x2="12" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="23"></line>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                <line x1="1" y1="12" x2="3" y2="12"></line>
                                <line x1="21" y1="12" x2="23" y2="12"></line>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                            </svg>
                            <svg className="theme-icon moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                        </button>

                        {/* Mobile menu trigger */}
                        <div className={`nav-menu-btn ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION WITH SPLIT-SCREEN BACKGROUND VIDEOS --- */}
            <section id="hero" className="hero">
                <div className="hero-video-bg">
                    {/* Left Pane: Boy in hoodie */}
                    <div className="hero-video-pane">
                        <video autoPlay muted loop playsInline>
                            <source src="https://assets.mixkit.co/videos/preview/mixkit-man-in-a-black-hoodie-standing-in-the-dark-43015-large.mp4" type="video/mp4" />
                        </video>
                    </div>
                    {/* Right Pane: Girl in t-shirt/clothing */}
                    <div className="hero-video-pane">
                        <video autoPlay muted loop playsInline>
                            <source src="https://assets.mixkit.co/videos/preview/mixkit-woman-walking-in-a-dark-studio-in-fashion-clothes-43006-large.mp4" type="video/mp4" />
                        </video>
                    </div>
                </div>
                <div className="hero-bg"></div>
                <div className="hero-bg-texture"></div>
                <div className="hero-grid-overlay"></div>
                <div className="hero-noise"></div>
                <div className="container">
                    <div className="hero-content">
                        <span className="accent-text">ESTABLISHED IN ABSENCE</span>
                        <h1 className="hero-title">
                            The elegance of
                            <span>O M I S S I O N</span>
                        </h1>
                        <p className="hero-description">
                            A premium clothing brand that rejects loud, ostentatious branding. We focus entirely on high-end craftsmanship, architectural silhouettes, and quiet luxury.
                        </p>
                        <div className="hero-buttons">
                            <a href="#customizer" className="btn-primary">Simulate Brand</a>
                            <a href="#lookbook" className="btn-secondary" style={{ marginLeft: '20px' }}>View Lookbook</a>
                        </div>
                    </div>
                </div>
                <a href="#philosophy" className="scroll-indicator">
                    <span>Scroll</span>
                    <div className="scroll-line"></div>
                </a>
            </section>

            {/* --- BRAND MARQUEE --- */}
            <div className="marquee-section">
                <div className="marquee-track">
                    <span className="marquee-item">Quiet Luxury <span className="marquee-sep">✦</span></span>
                    <span className="marquee-item">Organic Materials <span className="marquee-sep">✦</span></span>
                    <span className="marquee-item">Architectural Form <span class="marquee-sep">✦</span></span>
                    <span className="marquee-item">Tactile Craftsmanship <span class="marquee-sep">✦</span></span>
                    <span className="marquee-item">No Logo Policy <span class="marquee-sep">✦</span></span>
                    <span className="marquee-item">Premium Textiles <span class="marquee-sep">✦</span></span>
                    <span className="marquee-item">Zero Noise <span class="marquee-sep">✦</span></span>
                    <span className="marquee-item">Pure Garment <span class="marquee-sep">✦</span></span>
                    {/* Repeated items for seamless animation loop */}
                    <span className="marquee-item">Quiet Luxury <span class="marquee-sep">✦</span></span>
                    <span className="marquee-item">Organic Materials <span class="marquee-sep">✦</span></span>
                    <span className="marquee-item">Architectural Form <span class="marquee-sep">✦</span></span>
                    <span className="marquee-item">Tactile Craftsmanship <span class="marquee-sep">✦</span></span>
                    <span className="marquee-item">No Logo Policy <span class="marquee-sep">✦</span></span>
                    <span className="marquee-item">Premium Textiles <span class="marquee-sep">✦</span></span>
                    <span className="marquee-item">Zero Noise <span class="marquee-sep">✦</span></span>
                    <span className="marquee-item">Pure Garment <span class="marquee-sep">✦</span></span>
                </div>
            </div>

            {/* --- MOVING PRODUCTS SECTION --- */}
            <section id="collection" className="collection">
                <div className="container">
                    <div className="text-center reveal">
                        <span className="accent-text">Woven Absence</span>
                        <h2 className="section-title">The Product Collection</h2>
                        <p style={{ color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                            Discover our structural silhouettes crafted from GOTS organic fibers. Drag left or right to browse.
                        </p>
                        <div className="divider"></div>
                    </div>

                    <div className="collection-slider-container reveal">
                        <div 
                            className="collection-slider-track"
                            ref={collectionTrackRef}
                            onMouseDown={handleMouseDown}
                            onMouseLeave={handleMouseLeave}
                            onMouseUp={handleMouseUp}
                            onMouseMove={handleMouseMove}
                        >
                            {products.map((prod) => (
                                <div className="product-card" key={prod._id || prod.id}>
                                    <div className="product-img-wrapper">
                                        <img src={prod.image} alt={prod.name} className="product-image" draggable="false" />
                                        {/* Hover Actions */}
                                        <div className="product-actions">
                                            <button className="btn-primary" onClick={() => addToCart(prod)} style={{ width: '100%' }}>Add To Cart</button>
                                            <button className="btn-secondary" onClick={() => handleQuickBuy(prod)} style={{ width: '100%', borderColor: 'rgba(255,255,255,0.2)' }}>Quick Buy</button>
                                        </div>
                                    </div>
                                    <div className="product-info">
                                        <h3 className="product-name">{prod.name}</h3>
                                        <p className="product-material">{prod.material}</p>
                                        <div className="product-price-row">
                                            <span className="product-price">${prod.price}</span>
                                            <button className="product-add-btn" onClick={() => addToCart(prod)}>+ Add</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- PHILOSOPHY SECTION --- */}
            <section id="philosophy" className="section-padding philosophy">
                <div className="container">
                    <div className="philosophy-grid">
                        <div className="philosophy-image-container reveal-left">
                            <img src="/logo_facade_mockup.png" alt="thelogoless boutique facade" className="philosophy-image" width="600" height="600" />
                        </div>
                        <div className="philosophy-text-content reveal-right">
                            <span className="accent-text">Our Philosophy</span>
                            <h2 className="section-title">Luxury does not advertise.</h2>
                            <p className="philosophy-lead">
                                In an era of loud consumerism, true luxury speaks through tactile quality, impeccable drape, and invisible details.
                            </p>
                            <p className="philosophy-paragraph">
                                "thelogoless" is curated for the individual who values personal expression over commercial branding. By removing external logos, we restore the focus to what matters: the finest Italian linen, Japanese raw denim, GOTS certified organic Egyptian cotton, and the unique architecture of the garment itself.
                            </p>
                            <p className="philosophy-paragraph">
                                Our logo is not a billboard. It is a stitch, a slash, a tactile impression. It is felt by the wearer, not broadcast to the world.
                            </p>

                            {/* Philosophy stat items */}
                            <div className="philosophy-stats">
                                <div className="stat-item">
                                    <div className="stat-num">320</div>
                                    <div className="stat-label">GSM Weight</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-num">12</div>
                                    <div className="stat-label">Stitches / Inch</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-num">0</div>
                                    <div className="stat-label">Logos</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '40px' }}>
                                <a href="#concepts" className="btn-secondary">Explore Design Elements</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- BRAND CONCEPTS SECTION --- */}
            <section id="concepts" className="section-padding concepts">
                <div className="container">
                    <div className="text-center reveal">
                        <span className="accent-text">Design System</span>
                        <h2 className="section-title">The Four Design Signatures</h2>
                        <p style={{ color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }} className="philosophy-paragraph">
                            We replace traditional branding with four subtle architectural marks that carry the brand's identity quietly.
                        </p>
                        <div className="divider"></div>
                    </div>

                    <div className="concepts-grid">
                        {/* Concept 1 */}
                        <div className="concept-card reveal reveal-delay-1" id="card-concept-1">
                            <div className="concept-icon">/</div>
                            <h3 className="concept-title">The Elegant Slash</h3>
                            <p className="concept-desc">A subtle, diagonal line representing an empty space or missing label. An architectural slash carved into buttons or embroidered in tone-on-tone thread.</p>
                        </div>
                        
                        {/* Concept 2 */}
                        <div className="concept-card reveal reveal-delay-2" id="card-concept-2">
                            <div className="concept-icon">
                                <svg className="concept-icon-svg" viewBox="0 0 24 24">
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                </svg>
                            </div>
                            <h3 className="concept-title">The Single Stitch</h3>
                            <p className="concept-desc">An abstract single hand-stitch or four corner threads at the neck seam. It emphasizes physical craftsmanship, tailoring, and textile construction.</p>
                        </div>

                        {/* Concept 3 */}
                        <div className="concept-card reveal reveal-delay-3" id="card-concept-3">
                            <div className="concept-icon" style={{ fontFamily: 'var(--font-display)' }}>TL</div>
                            <h3 className="concept-title">Architectural Monogram</h3>
                            <p className="concept-desc">A highly-stylized, single-stroke monogram combining T and L in a fluid geometric layout. Primarily used for custom customizer hardware.</p>
                        </div>

                        {/* Concept 4 */}
                        <div className="concept-card reveal reveal-delay-4" id="card-concept-4">
                            <div className="concept-icon">
                                <svg className="concept-icon-svg" viewBox="0 0 24 24">
                                    <rect x="4" y="4" width="16" height="16" rx="1" />
                                    <line x1="8" y1="12" x2="16" y2="12" />
                                </svg>
                            </div>
                            <h3 className="concept-title">The Pure Void</h3>
                            <p className="concept-desc">Blind debossed branding pressed into thick cotton clothing tags or fine paper wrap. No ink, no dye, only depth and tactile shadows.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- MANIFESTO PARALLAX VIDEO INTERLUDE --- */}
            <section className="video-interlude reveal" id="video-interlude" ref={interludeSecRef}>
                <div className="interlude-video-container">
                    <video autoPlay muted loop playsInline className="interlude-video" id="interlude-video" ref={interludeVidRef}>
                        <source src="https://assets.mixkit.co/videos/preview/mixkit-fashion-model-walking-in-a-dark-studio-43010-large.mp4" type="video/mp4" />
                    </video>
                </div>
                <div className="interlude-overlay"></div>
                <div className="interlude-content container">
                    <blockquote>"The garment speaks when you cannot."</blockquote>
                    <cite>thelogoless brand manifesto</cite>
                </div>
            </section>

            {/* --- LOOKBOOK CAROUSEL SECTION --- */}
            <section id="lookbook" className="section-padding lookbook">
                <div className="container">
                    <div className="text-center reveal">
                        <span className="accent-text">Brand Book Showcase</span>
                        <h2 className="section-title">Visual Identity in Environment</h2>
                        <div className="divider"></div>
                    </div>

                    <div className="carousel-container reveal" id="lookbook-carousel">
                        <div className="carousel-track-wrapper">
                            <div className="carousel-track" style={{ transform: `translateX(-${lookbookIndex * 100}%)`, width: `${lookbookSlides.length * 100}%` }}>
                                {lookbookSlides.map((slide, idx) => (
                                    <div className="carousel-slide" key={idx} style={{ width: `${100 / lookbookSlides.length}%` }}>
                                        <img src={slide.img} alt={slide.title} className="carousel-image" />
                                        <div className="carousel-caption">
                                            <div className="caption-details">
                                                <span className="caption-tag">{slide.tag}</span>
                                                <h3 className="caption-title">{slide.title}</h3>
                                            </div>
                                            <span className="caption-number">{slide.num}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className="carousel-btn carousel-btn-prev" onClick={handleLookbookPrev} aria-label="Previous image">
                            &#8592;
                        </button>
                        <button className="carousel-btn carousel-btn-next" onClick={handleLookbookNext} aria-label="Next image">
                            &#8594;
                        </button>
                    </div>

                    <div className="carousel-indicators">
                        {lookbookSlides.map((_, idx) => (
                            <div key={idx} className={`indicator-dot ${idx === lookbookIndex ? 'active' : ''}`} onClick={() => setLookbookIndex(idx)}></div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- INTERACTIVE BRAND CUSTOMIZER --- */}
            <section id="customizer" className="section-padding customizer">
                <div className="container">
                    <div className="text-center reveal">
                        <span className="accent-text">Simulator</span>
                        <h2 className="section-title">Interactive Brand Customizer</h2>
                        <p style={{ color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }} className="philosophy-paragraph">
                            Experiment with placement, tone, and design of our minimalist signatures on a luxury organic t-shirt.
                        </p>
                        <div className="divider"></div>
                    </div>

                    <div className="customizer-layout">
                        {/* Canvas */}
                        <div className="canvas-container reveal-left" id="customizer-canvas">
                            <span className="placement-badge">Placement: {customizerState.placement}</span>
                            
                            <svg className="tshirt-svg" id="tshirt-svg" style={{ transform: tshirtTransform }} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <filter id="fabric-texture" x="0%" y="0%" width="100%" height="100%">
                                        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" result="noise" />
                                        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.12 0" in="noise" result="coloredNoise" />
                                        <feComposite operator="in" in2="SourceGraphic" in="coloredNoise" result="textureOverlay" />
                                        <feBlend mode="multiply" in="SourceGraphic" in2="textureOverlay" />
                                    </filter>
                                </defs>
                                <path d="M41 18 C45 20.5, 55 20.5, 59 18 C58 14.5, 42 14.5, 41 18 Z" fill="#060607" opacity="0.3" />
                                <path className="tshirt-fabric" id="tshirt-fabric" filter="url(#fabric-texture)" d="M30 18 C33 19, 37 19, 40 18 C43 15, 57 15, 60 18 C63 19, 67 19, 70 18 L76 29 C77.5 31.5, 75 33, 73 33 L67 31 L67 85 C67 87.5, 65 89, 62 89 L38 89 C35 89, 33 87.5, 33 85 L33 31 L27 33 C25 33, 22.5 31.5, 24 29 Z" fill="#0D0E10" />
                                <path className="tshirt-collar" d="M40 18 C43 22, 57 22, 60 18" fill="none" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.08" />
                                <path d="M40.5 18 C43.5 21.5, 56.5 21.5, 59.5 18" fill="none" stroke="#000000" strokeWidth="0.8" opacity="0.4" />
                                <path d="M33 31 C34 33, 35 34, 37 35" fill="none" stroke="#000000" stroke-width="0.5" opacity="0.3" />
                                <path d="M67 31 C66 33, 65 34, 63 35" fill="none" stroke="#000000" stroke-width="0.5" opacity="0.3" />
                                <path d="M24 29 L27.2 32.5" fill="none" stroke="#000000" stroke-width="0.4" opacity="0.2" />
                                <path d="M76 29 L72.8 32.5" fill="none" stroke="#000000" stroke-width="0.4" opacity="0.2" />
                                <path d="M33 31 C35 48, 35 68, 37 89" fill="none" stroke="#000000" stroke-width="0.6" opacity="0.25" />
                                <path d="M67 31 C65 48, 65 68, 63 89" fill="none" stroke="#000000" stroke-width="0.6" opacity="0.25" />
                                <path d="M38 18 C36 40, 42 65, 40 89" fill="none" stroke="#000" stroke-width="1.2" opacity="0.1" />
                                <path d="M60 18 C62 40, 56 65, 58 89" fill="none" stroke="#000" stroke-width="1.2" opacity="0.1" />
                                
                                <g id="tee-logo-group" className="tee-logo-element" transform={placementMap[customizerState.placement]}>
                                    <line 
                                        id="logo-art-slash" 
                                        x1="-1.5" y1="-3.5" x2="1.5" y2="3.5" 
                                        stroke={logoColorMap[customizerState.color]} 
                                        strokeWidth="0.6" strokeLinecap="round" 
                                        style={{ display: customizerState.logo === 'slash' ? 'block' : 'none' }}
                                    />
                                    <g id="logo-art-stitch" style={{ display: customizerState.logo === 'stitch' ? 'block' : 'none' }}>
                                        <line x1="-1.5" y1="-1.5" x2="1.5" y2="1.5" stroke={logoColorMap[customizerState.color]} strokeWidth="0.5" />
                                        <line x1="1.5" y1="-1.5" x2="-1.5" y2="1.5" stroke={logoColorMap[customizerState.color]} strokeWidth="0.5" />
                                    </g>
                                    <text 
                                        id="logo-art-text" 
                                        x="0" y="0.8" 
                                        fontFamily="'Cinzel', serif" fontSize="1.2" letterSpacing="0.1" 
                                        fill={logoColorMap[customizerState.color]} 
                                        textAnchor="middle" 
                                        style={{ display: customizerState.logo === 'text' ? 'block' : 'none' }}
                                    >
                                        TL
                                    </text>
                                </g>
                            </svg>
                        </div>

                        {/* Controls */}
                        <div className="customizer-settings reveal-right">
                            {/* Preset Quick Bars */}
                            <div className="setting-group" id="preset-group">
                                <div className="setting-title">Curated Aesthetics <span style={{ textTransform: 'none' }}>Curated combinations</span></div>
                                <div className="option-grid">
                                    <button className={`btn-pill ${activePreset === 'obsidian-core' ? 'active' : ''}`} onClick={() => handlePresetApply('obsidian-core')}>Obsidian Core</button>
                                    <button className={`btn-pill ${activePreset === 'linen-nomad' ? 'active' : ''}`} onClick={() => handlePresetApply('linen-nomad')}>Linen Nomad</button>
                                    <button className={`btn-pill ${activePreset === 'selvedge-artist' ? 'active' : ''}`} onClick={() => handlePresetApply('selvedge-artist')}>Selvedge Artist</button>
                                    <button className={`btn-pill ${activePreset === 'bronze-signature' ? 'active' : ''}`} onClick={() => handlePresetApply('bronze-signature')}>Bronze Signature</button>
                                </div>
                            </div>

                            {/* Fabric */}
                            <div className="setting-group">
                                <div className="setting-title">Fabric & Color <span>{customizerState.fabric}</span></div>
                                <div className="option-grid">
                                    {Object.keys(fabricColorMap).map(f => (
                                        <div 
                                            key={f}
                                            className={`swatch swatch-${f} ${customizerState.fabric === f ? 'active' : ''}`} 
                                            title={f}
                                            onClick={() => {
                                                clearPresetSelection();
                                                setCustomizerState(prev => ({ ...prev, fabric: f }));
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Logo Concept */}
                            <div className="setting-group">
                                <div className="setting-title">Brand Signature <span>{customizerState.logo}</span></div>
                                <div className="option-grid">
                                    <div className={`logo-art-option ${customizerState.logo === 'slash' ? 'active' : ''}`} onClick={() => { clearPresetSelection(); setCustomizerState(prev => ({ ...prev, logo: 'slash' })); }}>
                                        <div className="logo-art-preview">/</div>
                                        <div className="logo-art-label">The Slash</div>
                                    </div>
                                    <div className={`logo-art-option ${customizerState.logo === 'stitch' ? 'active' : ''}`} onClick={() => { clearPresetSelection(); setCustomizerState(prev => ({ ...prev, logo: 'stitch' })); }}>
                                        <div className="logo-art-preview">×</div>
                                        <div className="logo-art-label">The Stitch</div>
                                    </div>
                                    <div className={`logo-art-option ${customizerState.logo === 'text' ? 'active' : ''}`} onClick={() => { clearPresetSelection(); setCustomizerState(prev => ({ ...prev, logo: 'text' })); }}>
                                        <div className="logo-art-preview" style={{ fontSize: '0.7rem' }}>T L</div>
                                        <div className="logo-art-label">Typography</div>
                                    </div>
                                </div>
                            </div>

                            {/* Thread Color */}
                            <div className="setting-group">
                                <div className="setting-title">Thread Color <span>{customizerState.color}</span></div>
                                <div className="option-grid">
                                    {Object.keys(logoColorMap).map(c => (
                                        <button 
                                            key={c}
                                            className={`btn-pill ${customizerState.color === c ? 'active' : ''}`}
                                            onClick={() => {
                                                clearPresetSelection();
                                                setCustomizerState(prev => ({ ...prev, color: c }));
                                            }}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Placement */}
                            <div className="setting-group">
                                <div className="setting-title">Placement <span>{customizerState.placement}</span></div>
                                <div className="option-grid">
                                    {Object.keys(placementMap).map(p => (
                                        <button 
                                            key={p}
                                            className={`btn-pill ${customizerState.placement === p ? 'active' : ''}`}
                                            onClick={() => {
                                                clearPresetSelection();
                                                setCustomizerState(prev => ({ ...prev, placement: p }));
                                            }}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- BRAND BOOK DETAILS --- */}
            <section id="brandbook" className="section-padding brandbook">
                <div className="container">
                    <div className="brandbook-layout">
                        <div className="brandbook-intro reveal-left">
                            <span className="accent-text">Brand Book excerpt</span>
                            <h2 className="section-title">The Omission Guidelines</h2>
                            <p className="philosophy-paragraph" style={{ marginBottom: 0 }}>
                                An internal guide outlining visual design systems, quality control metrics, and material standards that preserve the "thelogoless" identity across physical space.
                            </p>
                        </div>
                        
                        <div className="accordion reveal-right">
                            {/* Accordion Item 1 */}
                            <div className={`accordion-item ${accordionOpen === 1 ? 'active' : ''}`}>
                                <div className="accordion-header" onClick={() => setAccordionOpen(accordionOpen === 1 ? 0 : 1)}>
                                    <h3 className="accordion-title">01 / Material Standards</h3>
                                    <span className="accordion-icon">+</span>
                                </div>
                                <div className="accordion-content">
                                    <p>We source raw fibers from sustainable, traceably verified family farms. Every thread and weave is optimized for maximum structural memory and natural texture.</p>
                                    <ul>
                                        <li>Heavyweight 320GSM certified organic Egyptian cotton (long-staple).</li>
                                        <li>Eco-friendly linen-blend spun and milled in small batches in Normandy, France.</li>
                                        <li>Raw Japanese selvedge denim woven on vintage shuttle looms in Okayama.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Accordion Item 2 */}
                            <div className={`accordion-item ${accordionOpen === 2 ? 'active' : ''}`}>
                                <div className="accordion-header" onClick={() => setAccordionOpen(accordionOpen === 2 ? 0 : 2)}>
                                    <h3 className="accordion-title">02 / Stitching & Architecture</h3>
                                    <span className="accordion-icon">+</span>
                                </div>
                                <div className="accordion-content">
                                    <p>Without printed branding, structural seams become the decorative voice of the garment. Every stitch line serves an ergonomic and visual purpose.</p>
                                    <ul>
                                        <li>Reinforced french seams with 12 stitches per inch to prevent fraying and structural distortion.</li>
                                        <li>Double-needle drop stitching on necklines for structural longevity.</li>
                                        <li>A singular offset lock-stitch at the rear hem signifying tailors' authenticity.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Accordion Item 3 */}
                            <div className={`accordion-item ${accordionOpen === 3 ? 'active' : ''}`}>
                                <div className="accordion-header" onClick={() => setAccordionOpen(accordionOpen === 3 ? 0 : 3)}>
                                    <h3 className="accordion-title">03 / The Omission Philosophy</h3>
                                    <span className="accordion-icon">+</span>
                                </div>
                                <div className="accordion-content">
                                    <p>Branding is not a display; it is an intimate conversation between the garment and its owner. We believe in quiet sophistication.</p>
                                    <ul>
                                        <li>No external branded graphics or words on outer surfaces.</li>
                                        <li>Physical tags should be easily removable, leaving no stitch scars on the garment.</li>
                                        <li>Tone-on-tone embroidery should never exceed 1cm in size.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="footer" id="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <div className="footer-logo">T H E L O G O L E S S</div>
                            <p className="footer-brand-desc">
                                A modern design project returning clothing to the purity of textiles, geometry, and quiet elegance. Made for the discerning individual.
                            </p>
                        </div>

                        <div>
                            <h4 className="footer-title">Navigation</h4>
                            <div className="footer-links">
                                <a href="#philosophy">Philosophy</a>
                                <a href="#collection">Collection</a>
                                <a href="#concepts">Design Signatures</a>
                                <a href="#lookbook">Lookbook Mockups</a>
                                <a href="#customizer">Brand Simulator</a>
                                <a href="#brandbook">Brand Book</a>
                            </div>
                        </div>

                        <div>
                            <h4 className="footer-title">Include Yourself</h4>
                            <p className="footer-brand-desc" style={{ marginBottom: '20px' }}>
                                Receive notification of private releases and visual essays. Understated updates, never spam.
                            </p>
                            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                                <div className="input-group">
                                    <input 
                                        type="email" 
                                        placeholder="EMAIL ADDRESS" 
                                        value={newsletterEmail}
                                        onChange={(e) => setNewsletterEmail(e.target.value)}
                                        required 
                                        aria-label="Email address for updates" 
                                    />
                                    <button type="submit" className="submit-btn" aria-label="Submit email address">
                                        &#8594;
                                    </button>
                                </div>
                                <div className={`form-response-msg ${newsletterMsg ? 'active' : ''}`}>{newsletterMsg}</div>
                            </form>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <div>&copy; 2026 thelogoless. All rights observed.</div>
                        <div>Quiet Luxury Brand Suite</div>
                    </div>
                </div>
            </footer>

            {/* --- SLIDING SHOPPING CART DRAWER --- */}
            <div className={`cart-overlay ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)}></div>
            <div className={`cart-drawer ${cartOpen ? 'open' : ''}`}>
                <div className="cart-drawer-header">
                    <h3>Shopping Cart</h3>
                    <button className="cart-close-btn" onClick={() => setCartOpen(false)} aria-label="Close cart">&times;</button>
                </div>

                <div className="cart-drawer-items">
                    {cart.length === 0 ? (
                        <div className="cart-empty-msg">Your wardrobe is empty.</div>
                    ) : (
                        cart.map(item => (
                            <div className="cart-item" key={item.product._id}>
                                <img src={item.product.image} alt={item.product.name} className="cart-item-img" />
                                <div className="cart-item-info">
                                    <div className="cart-item-name">{item.product.name}</div>
                                    <div className="cart-item-price">${item.product.price}</div>
                                    <div className="cart-item-qty">
                                        <button className="qty-btn" onClick={() => updateCartQty(item.product._id, -1)}>-</button>
                                        <span className="qty-num">{item.quantity}</span>
                                        <button className="qty-btn" onClick={() => updateCartQty(item.product._id, 1)}>+</button>
                                    </div>
                                    <button className="cart-remove-btn" onClick={() => removeFromCart(item.product._id)}>Remove</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="cart-drawer-footer">
                        <div className="cart-total-row">
                            <span>Subtotal</span>
                            <span>${subtotal}</span>
                        </div>
                        <button 
                            className="btn-primary checkout-btn" 
                            onClick={() => {
                                setCartOpen(false);
                                setCheckoutSuccess(false);
                                setCheckoutOpen(true);
                            }}
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>

            {/* --- DYNAMIC CHECKOUT MODAL --- */}
            <div className={`checkout-modal-overlay ${checkoutOpen ? 'open' : ''}`}>
                <div className="checkout-modal">
                    {!checkoutLoading && !checkoutSuccess ? (
                        <>
                            <h3>Checkout</h3>
                            <p className="checkout-modal-sub">Secure your place in absence.</p>
                            <form className="checkout-form" onSubmit={handleCheckoutSubmit}>
                                <div className="form-group">
                                    <label htmlFor="chk-name">Full Name</label>
                                    <input 
                                        type="text" 
                                        id="chk-name" 
                                        required 
                                        value={checkoutForm.name} 
                                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, name: e.target.value }))} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="chk-email">Email Address</label>
                                    <input 
                                        type="email" 
                                        id="chk-email" 
                                        required 
                                        value={checkoutForm.email} 
                                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, email: e.target.value }))} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="chk-location">Shipping City</label>
                                    <input 
                                        type="text" 
                                        id="chk-location" 
                                        required 
                                        value={checkoutForm.location} 
                                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, location: e.target.value }))} 
                                    />
                                </div>
                                <div className="checkout-total-row">
                                    <span>Total Due</span>
                                    <span>${subtotal}</span>
                                </div>
                                <div className="checkout-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setCheckoutOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary">Submit Order</button>
                                </div>
                            </form>
                        </>
                    ) : checkoutLoading ? (
                        <div className="checkout-loading">
                            <div className="spinner"></div>
                            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-accent-gold)' }}>
                                Registering Absence...
                            </p>
                        </div>
                    ) : (
                        <div className="checkout-success-msg">
                            <h4>Order Confirmed</h4>
                            <p style={{ marginBottom: '25px' }}>Your wardrobe has been updated. Your shipping allocation is registered.</p>
                            <button className="btn-primary" onClick={() => setCheckoutOpen(false)}>Complete</button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
