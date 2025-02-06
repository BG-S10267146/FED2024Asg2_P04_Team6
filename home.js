// Toggle Menu
const menuBtn = document.querySelector('.menu-toggle-btn');
const navigation = document.querySelector('nav');
const overlayElement = document.createElement('div');

overlayElement.classList.add('overlay');
document.body.appendChild(overlayElement);

menuBtn.addEventListener('click', () => {
  menuBtn.classList.toggle('active');
  navigation.classList.toggle('active');
  overlayElement.classList.toggle('active');
});

overlayElement.addEventListener('click', () => {
  menuBtn.classList.remove('active');
  navigation.classList.remove('active');
  overlayElement.classList.remove('active');
});

// Slideshow Functionality
const slidesWrapper = document.querySelector('.slides-wrapper');
const slideItems = document.querySelectorAll('.slide');
const dotsNavContainer = document.querySelector('.dots-navigation');
let currentSlideIdx = 0;
let autoScrollInterval;

function updateSlide() {
  // Hide all slides
  slideItems.forEach((slide, index) => {
    slide.classList.remove('active', 'prev');
    const video = slide.querySelector('.background-video');
    if (video) {
      video.pause(); // Pause videos on inactive slides
    }
  });

  // Show the current slide
  slideItems[currentSlideIdx].classList.add('active');

  // Show the previous slide for transition effect
  const prevSlideIdx = (currentSlideIdx - 1 + slideItems.length) % slideItems.length;
  slideItems[prevSlideIdx].classList.add('prev');

  const currentVideo = slideItems[currentSlideIdx].querySelector('.background-video');
  if (currentVideo) {
    currentVideo.play().catch((error) => {
      console.error('Video playback failed:', error);
    });
  }

  // Update dots navigation
  updateDots();
}

function moveSlide(direction) {
  stopAutoScroll();
  currentSlideIdx = (currentSlideIdx + direction + slideItems.length) % slideItems.length;
  updateSlide();
  startAutoScroll();
}

function startAutoScroll() {
  autoScrollInterval = setInterval(() => {
    moveSlide(1);
  }, 5000);
}

function stopAutoScroll() {
  clearInterval(autoScrollInterval);
}

function createDots() {
  slideItems.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    dot.addEventListener('click', () => {
      stopAutoScroll();
      currentSlideIdx = idx;
      updateSlide();
      startAutoScroll();
    });
    dotsNavContainer.appendChild(dot);
  });
  updateDots();
}

function updateDots() {
  document.querySelectorAll('.dot').forEach((dot, idx) => {
    dot.classList.toggle('active', idx === currentSlideIdx);
  });
}

// Initialize slideshow
createDots();
updateSlide(); // Show the first slide
startAutoScroll();

// Preload all videos
function preloadVideos() {
  slideItems.forEach((slide) => {
    const video = slide.querySelector('.background-video');
    if (video) {
      video.load(); // Force the browser to load the video
    }
  });
}

// Preload videos when the page loads
preloadVideos();