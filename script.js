document.addEventListener('DOMContentLoaded', () => {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const lightbox = document.querySelector('.lightbox');
    const lightboxImg = document.querySelector('.lightbox-img');
    const closeBtn = document.querySelector('.close-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const lightboxTitle = document.querySelector('.lightbox-title');
    const lightboxDescription = document.querySelector('.lightbox-description');
    const downloadBtn = document.querySelector('.download-btn');
    const lightboxThumbnailsContainer = document.querySelector('.lightbox-thumbnails');
    const spinner = document.querySelector('.spinner');

    let currentImageIndex = 0;
    let visibleImages = []; // Stores the current set of visible image elements after filtering

    // --- Lazy Loading for Images ---
    const lazyLoadImages = () => {
        const images = document.querySelectorAll('img[data-src]');
        const config = {
            rootMargin: '0px 0px 100px 0px', // Load images when 100px from viewport
            threshold: 0.01
        };

        let observer = new IntersectionObserver((entries, self) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src'); // Remove data-src once loaded
                    self.unobserve(img);
                }
            });
        }, config);

        images.forEach(image => {
            observer.observe(image);
        });
    };

    lazyLoadImages();

    // --- Image Filtering ---
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            const filter = e.target.dataset.filter;
            filterGallery(filter);

            document.querySelector('.gallery-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    function filterGallery(filter) {
        visibleImages = [];
        galleryItems.forEach(item => {
            const category = item.querySelector('img').dataset.category;
            if (filter === 'all' || category === filter) {
                item.style.display = 'block';
                setTimeout(() => item.style.opacity = '1', 50);
                visibleImages.push(item);
            } else {
                item.style.opacity = '0';
                setTimeout(() => item.style.display = 'none', 500);
            }
        });

        if (visibleImages.length > 0) {
            currentImageIndex = 0; // Reset to the first image of the filtered set
        }
    }

    // Initialize with 'all' filter active on load
    filterGallery('all');

    // --- Lightbox Functionality ---
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            const clickedImageSrc = item.querySelector('img').src;
            // Find the index of the clicked item within the currently visible images
            const clickedVisibleIndex = visibleImages.findIndex(visibleItem => visibleItem.querySelector('img').src === clickedImageSrc);

            if (clickedVisibleIndex !== -1) {
                openLightbox(clickedVisibleIndex);
            }
        });
    });

    function openLightbox(index) {
        currentImageIndex = index;
        updateLightboxContent();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        lightbox.focus(); // Focus on lightbox for keyboard navigation
    }

    function closeLightbox() {
        lightbox.classList.add('closing');
        lightbox.addEventListener('animationend', () => {
            lightbox.classList.remove('active', 'closing');
            document.body.style.overflow = ''; // Restore scrolling
        }, { once: true });
    }

    closeBtn.addEventListener('click', closeLightbox);

    // Close lightbox on outside click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content') || e.target.classList.contains('lightbox-img')) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('active')) {
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowRight') {
                navigateLightbox(1);
            } else if (e.key === 'ArrowLeft') {
                navigateLightbox(-1);
            }
        }
    });

    // --- Lightbox Content Update (Main function for navigation) ---
    function updateLightboxContent() {
        if (visibleImages.length === 0) {
            closeLightbox();
            return;
        }

        const currentImageElement = visibleImages[currentImageIndex].querySelector('img');
        const imageSrc = currentImageElement.src;
        const imageTitle = currentImageElement.dataset.title || 'Untitled Image';
        const imageDescription = currentImageElement.dataset.description || 'No description available.';

        // Show spinner while image loads
        spinner.style.display = 'block';
        lightboxImg.classList.remove('loaded'); // Hide image until loaded

        lightboxImg.src = imageSrc;
        lightboxImg.alt = imageTitle; // Update alt text for accessibility
        lightboxTitle.textContent = imageTitle;
        lightboxDescription.textContent = imageDescription;
        downloadBtn.href = imageSrc;

        // Hide spinner once image is loaded
        lightboxImg.onload = () => {
            spinner.style.display = 'none';
            lightboxImg.classList.add('loaded'); // Show image with fade-in
        };
        // Handle image loading errors
        lightboxImg.onerror = () => {
            spinner.style.display = 'none';
            lightboxImg.src = 'https://placehold.co/800x600/FF0000/FFFFFF?text=Error+Loading+Image'; // Placeholder for error
            lightboxTitle.textContent = 'Image Load Error';
            lightboxDescription.textContent = 'Could not load image. Please try again.';
            lightboxImg.classList.add('loaded');
        };

        generateLightboxThumbnails();
    }

    // --- Lightbox Navigation (Next/Prev) ---
    prevBtn.addEventListener('click', () => navigateLightbox(-1));
    nextBtn.addEventListener('click', () => navigateLightbox(1));

    function navigateLightbox(direction) {
        currentImageIndex += direction;

        if (currentImageIndex < 0) {
            currentImageIndex = visibleImages.length - 1;
        } else if (currentImageIndex >= visibleImages.length) {
            currentImageIndex = 0;
        }
        updateLightboxContent();
    }

    // --- Lightbox Thumbnail Navigation ---
    function generateLightboxThumbnails() {
        lightboxThumbnailsContainer.innerHTML = ''; // Clear previous thumbnails
        visibleImages.forEach((item, idx) => {
            const thumbImgSrc = item.querySelector('img').src;
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.classList.add('lightbox-thumbnail-item');
            if (idx === currentImageIndex) {
                thumbnailDiv.classList.add('active');
            }

            const img = document.createElement('img');
            img.src = thumbImgSrc;
            img.alt = `Thumbnail for ${item.querySelector('img').dataset.title || 'gallery image'}`;

            thumbnailDiv.appendChild(img);
            lightboxThumbnailsContainer.appendChild(thumbnailDiv);

            thumbnailDiv.addEventListener('click', () => {
                currentImageIndex = idx;
                updateLightboxContent();
            });
        });

        // Scroll active thumbnail into view if it's not already
        const activeThumbnail = lightboxThumbnailsContainer.querySelector('.lightbox-thumbnail-item.active');
        if (activeThumbnail) {
            activeThumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
});