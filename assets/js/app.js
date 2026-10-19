const menuBtn = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
const navItems = document.querySelectorAll(".mobile-menu .nav-sections");

// Toggle menu open/close
menuBtn.addEventListener("click", () => {
  mobileMenu.classList.toggle("active");
  menuBtn.classList.toggle("active");
});

// Close menu after clicking a link
navItems.forEach(item => {
  item.addEventListener("click", () => {
    setTimeout(() => {
      mobileMenu.classList.remove("active");
      menuBtn.classList.remove("active");
    }, 300); 
  });
});


const navLinks = document.querySelectorAll(".nav-sections");

// Only observe sections that have a corresponding nav link
const targetSections = [];
navLinks.forEach(link => {
  let href = link.getAttribute("href");
  if (!href) return;
  if (href === "#" || href === "index.html#") {
    let homeSec = document.getElementById("home-sec");
    if (homeSec && !targetSections.includes(homeSec)) targetSections.push(homeSec);
  } else if (href.includes("#")) {
    let id = href.substring(href.indexOf("#") + 1);
    let sec = document.getElementById(id);
    if (sec && !targetSections.includes(sec)) targetSections.push(sec);
  }
});

const observerOptions = {
  root: null,
  rootMargin: "-20% 0px -50% 0px",
  threshold: 0
};

// Sections can be nested (testimonials sit inside journey), so track every visible
// section and highlight the one that comes last in the document - the innermost.
targetSections.sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
const visibleSections = new Set();

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) visibleSections.add(entry.target);
    else visibleSections.delete(entry.target);
  });

  const current = targetSections.filter(sec => visibleSections.has(sec)).pop();
  if (!current) return;
  let currentId = current.getAttribute("id");

  navLinks.forEach(link => {
    link.classList.remove("active");

    let href = link.getAttribute("href");
    if (!href) return;

    // Handle Home link
    if (currentId === "home-sec" && (href === "#" || href === "index.html#")) {
      link.classList.add("active");
    }
    // Handle other links
    else if (currentId && href.endsWith("#" + currentId) && currentId !== "home-sec") {
      link.classList.add("active");
    }
  });
}, observerOptions);

targetSections.forEach(section => {
  observer.observe(section);
});

// Manual click override
navLinks.forEach(link => {
  link.addEventListener("click", () => {
    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");
  });
});


// testimonial section
const cards = document.querySelectorAll(".testimonial-card");
const dotsContainer = document.querySelector(".dots");
const prevBtn = document.querySelector(".prev-btn");
const nextBtn = document.querySelector(".next-btn");
const testimonialContainer = document.querySelector(".testimonial-container");

if (cards.length > 0 && dotsContainer) {
  let currentIndex = 0;
  let interval;

  // create dots dynamically
  cards.forEach((_, index) => {
    const dot = document.createElement("button");
    if (index === 0) dot.classList.add("active"); // start active
    dot.addEventListener("click", () => {
      showCard(index);
      resetAutoSlide(); // restart autoplay when user clicks
    });
    dotsContainer.appendChild(dot);
  });

  // function to show selected testimonial
  function showCard(index) {
    currentIndex = index;
    cards.forEach((card, i) => {
      card.classList.toggle("active", i === index);
    });
    document.querySelectorAll(".dots button").forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
  }

  // autoplay every 3.5s
  function autoSlide() {
    currentIndex = (currentIndex + 1) % cards.length;
    showCard(currentIndex);
  }

  function resetAutoSlide() {
    clearInterval(interval);
    interval = setInterval(autoSlide, 3500); // 3.5 seconds
  }

  // Next and Previous button events
  if (prevBtn && nextBtn) {
    prevBtn.addEventListener("click", () => {
      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      showCard(currentIndex);
      resetAutoSlide();
    });

    nextBtn.addEventListener("click", () => {
      currentIndex = (currentIndex + 1) % cards.length;
      showCard(currentIndex);
      resetAutoSlide();
    });
  }

  // Pause on hover
  if (testimonialContainer) {
    testimonialContainer.addEventListener("mouseenter", () => {
      clearInterval(interval);
    });

    testimonialContainer.addEventListener("mouseleave", () => {
      resetAutoSlide();
    });
  }

  // init
  showCard(0);
  interval = setInterval(autoSlide, 3500);
}



const scrollBtn = document.querySelector(".scrolltotop");

if (scrollBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 200) {
      scrollBtn.classList.add("show");
    } else {
      scrollBtn.classList.remove("show");
    }
  });
}


// --- Premium Enhancements ---

// 1. Cursor Glow Effect
const cursorGlow = document.getElementById("cursor-glow");
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let glowX = mouseX;
let glowY = mouseY;

if (cursorGlow) {
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateGlow() {
    glowX += (mouseX - glowX) * 0.1;
    glowY += (mouseY - glowY) * 0.1;
    // We adjust by translating using transform for better performance, but left/top is already centered via CSS translate(-50%,-50%)
    // Wait, CSS has: left: 50%, top: 50%, transform: translate(-50%, -50%). 
    // If we set left and top here, it will move from that center based on mouse.
    cursorGlow.style.left = `${glowX}px`;
    cursorGlow.style.top = `${glowY}px`;
    requestAnimationFrame(animateGlow);
  }
  animateGlow();
}

// 3. GSAP Scroll Reveals
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  const revealElements = document.querySelectorAll(".gsap-reveal");

  revealElements.forEach((el) => {
    gsap.fromTo(el, 
      { 
        autoAlpha: 0, // autoAlpha handles both opacity and visibility
        y: 60
      }, 
      {
        autoAlpha: 1, 
        y: 0,
        duration: 1, 
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%", // Trigger when the top of the element reaches 85% down the viewport
          toggleActions: "play none none none" // Only play once when scrolling down
        }
      }
    );
  });
}
