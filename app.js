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

navLinks.forEach(link => {
  link.addEventListener("click", () => {
    navLinks.forEach(l => l.classList.remove("active")); // remove old
    link.classList.add("active"); // add new
  });
});


// testimonial section
// test
const cards = document.querySelectorAll(".testimonial-card");
const dotsContainer = document.querySelector(".dots");

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

// autoplay every 3s
function autoSlide() {
  currentIndex = (currentIndex + 1) % cards.length;
  showCard(currentIndex);
}

function resetAutoSlide() {
  clearInterval(interval);
  interval = setInterval(autoSlide, 3500); // 3 seconds
}

// init
showCard(0);
interval = setInterval(autoSlide, 3500);



const scrollBtn = document.querySelector(".scrolltotop");

window.addEventListener("scroll", () => {
  if (window.scrollY > 200) {
    scrollBtn.classList.add("show");
  } else {
    scrollBtn.classList.remove("show");
  }
});
