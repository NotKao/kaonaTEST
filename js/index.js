const nav = document.getElementById('tb-nav'); 
const hamburger = document.getElementById('tb-hamburger');
const modal = document.querySelector('.modal');
const backdrop = document.querySelector('.modal-backdrop');
const closeBtn = document.querySelector('.modal-close');
const imgModal = document.getElementById('imgModal');
const vidModal = document.getElementById('vidModal');
const ytModal  = document.getElementById('ytModal'); // NEW

function isVideoSrc(src) {
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(src || '');
}

function isYoutube(src) {
    return /(youtube\.com|youtu\.be)/i.test(src || '');
}

function getYouTubeId(url) {
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtu.be')) {
            return u.pathname.slice(1);
        }
        if (u.searchParams.has('v')) {
            return u.searchParams.get('v');
        }
        const parts = u.pathname.split('/').filter(Boolean);
        const i = parts.findIndex(p => p === 'embed' || p === 'shorts' || p === 'live');
        if (i !== -1 && parts[i + 1]) return parts[i + 1];
        return parts.pop() || null;
    } catch {
        return null;
    }
}

function youTubeEmbedUrl(id) {
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
}

function youTubeThumbUrl(id) {
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function setMediaPreview(src) {
    const isVid = isVideoSrc(src);
    const isYT  = isYoutube(src);

    imgModal.classList.remove('show');
    vidModal.classList.remove('show');
    ytModal.classList.remove('show');

    if (isYT) {
        const id = getYouTubeId(src);
        if (id) {
            ytModal.src = youTubeEmbedUrl(id);
            ytModal.classList.add('show');
        }
        vidModal.pause();
        imgModal.removeAttribute('src');
        vidModal.removeAttribute('src');
        return;
    }

    if (isVid) {
        vidModal.src = src;
        vidModal.currentTime = 0;
        vidModal.classList.add('show');
        imgModal.removeAttribute('src');
        ytModal.removeAttribute('src');
    } else {
        imgModal.src = src;
        imgModal.classList.add('show');
        vidModal.pause();
        vidModal.removeAttribute('src');
        ytModal.removeAttribute('src');
    }
}

function openModal(src) {
    setMediaPreview(src);
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
}

function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
    vidModal.pause();
    imgModal.removeAttribute('src');
    vidModal.removeAttribute('src');
    ytModal.removeAttribute('src');
}

function createVideoThumb(src) {
    return new Promise((resolve, reject) => {
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.src = src;
        v.muted = true;
        v.playsInline = true;
        v.crossOrigin = 'anonymous';
        v.addEventListener('loadeddata', () => {
            try {
                if (v.readyState < 2) { reject(); return; }
                v.currentTime = Math.min(0.2, v.duration || 0.2);
            } catch { reject(); }
        }, { once: true });
        v.addEventListener('seeked', () => {
            try {
                const c = document.createElement('canvas');
                c.width = v.videoWidth || 640;
                c.height = v.videoHeight || 360;
                const ctx = c.getContext('2d');
                ctx.drawImage(v, 0, 0, c.width, c.height);
                resolve(c.toDataURL('image/jpeg', 0.75));
            } catch { reject(); }
        }, { once: true });
        v.addEventListener('error', reject, { once: true });
    });
}

function hydrateMediaButtons() {
    const btns = document.querySelectorAll('.media-btn');
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
        entries.forEach(async e => {
            if (!e.isIntersecting) return;
            const btn = e.target;
            io.unobserve(btn);
            const src = btn.getAttribute('data-src');
            if (!src) return;
            if (btn.querySelector('img')) return;

            if (isYoutube(src)) {
                try {
                    const id = getYouTubeId(src);
                    const thumb = id ? youTubeThumbUrl(id) : '';
                    const img = new Image();
                    img.loading = 'lazy';
                    img.decoding = 'async';
                    img.alt = '';
                    img.src = thumb || '';
                    btn.appendChild(img);
                    const badge = document.createElement('span');
                    badge.className = 'media-badge';
                    badge.textContent = 'YouTube';
                    btn.appendChild(badge);
                } catch {
                    const badge = document.createElement('span');
                    badge.className = 'media-badge';
                    badge.textContent = 'YouTube';
                    btn.appendChild(badge);
                }
            } else if (isVideoSrc(src)) {
                try {
                    const dataUrl = await createVideoThumb(src);
                    const img = new Image();
                    img.loading = 'lazy';
                    img.decoding = 'async';
                    img.alt = '';
                    img.src = dataUrl;
                    btn.appendChild(img);
                    const badge = document.createElement('span');
                    badge.className = 'media-badge';
                    badge.textContent = 'Video';
                    btn.appendChild(badge);
                } catch {
                    const badge = document.createElement('span');
                    badge.className = 'media-badge';
                    badge.textContent = 'Video';
                    btn.appendChild(badge);
                }
            } else {
                const img = new Image();
                img.loading = 'lazy';
                img.decoding = 'async';
                img.alt = '';
                img.src = src;
                img.addEventListener('error', () => {});
                btn.appendChild(img);
            }
        });
    }, { rootMargin: '200px 0px' }) : null;

    btns.forEach(btn => {
        if (io) io.observe(btn);
        else {
            const src = btn.getAttribute('data-src');
            if (!src) return;

            if (isYoutube(src)) {
                const id = getYouTubeId(src);
                const thumb = id ? youTubeThumbUrl(id) : '';
                const img = new Image();
                img.loading = 'lazy';
                img.decoding = 'async';
                img.alt = '';
                img.src = thumb || '';
                btn.appendChild(img);
                const badge = document.createElement('span');
                badge.className = 'media-badge';
                badge.textContent = 'YouTube';
                btn.appendChild(badge);
            } else if (isVideoSrc(src)) {
                createVideoThumb(src).then(dataUrl => {
                    const img = new Image();
                    img.loading = 'lazy';
                    img.decoding = 'async';
                    img.alt = '';
                    img.src = dataUrl;
                    btn.appendChild(img);
                    const badge = document.createElement('span');
                    badge.className = 'media-badge';
                    badge.textContent = 'Video';
                    btn.appendChild(badge);
                }).catch(() => {
                    const badge = document.createElement('span');
                    badge.className = 'media-badge';
                    badge.textContent = 'Video';
                    btn.appendChild(badge);
                });
            } else {
                const img = new Image();
                img.loading = 'lazy';
                img.decoding = 'async';
                img.alt = '';
                img.src = src;
                btn.appendChild(img);
            }
        }
    });
}

hydrateMediaButtons();

document.addEventListener('click', e => {
    const trigger = e.target.closest('.media-btn');
    if (trigger) {
        const src = trigger.getAttribute('data-src');
        if (src) openModal(src);
    }
});

backdrop.addEventListener('click', closeModal);
closeBtn.addEventListener('click', closeModal);

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

hamburger.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('active');
});

nav.addEventListener('click', e => {
    if (e.target.tagName === 'A' && nav.classList.contains('active')) {
        nav.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
    }
});  
