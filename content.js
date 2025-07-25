    // content.js - This script runs directly on the YouTube video page.

    /**
     * Extracts the YouTube video ID from the current window's URL.
     * This function needs to be in the content script because it accesses window.location.href.
     * @returns {string|null} The 11-character YouTube video ID, or null if not found.
     */
    function getYouTubeVideoId() {
        const url = window.location.href;

        // Case: regular YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
        const urlParams = new URLSearchParams(window.location.search);
        const standardId = urlParams.get("v");
        if (standardId) return standardId;

        // Case: short link (e.g., https://youtu.be/dQw4w9WgXcQ)
        const matchShort = url.match(/youtu\.be\/([^?&]+)/);
        if (matchShort && matchShort[1]) return matchShort[1];

        // Case: embed URL (e.g., https://www.youtube.com/embed/dQw4w9WgXcQ)
        const matchEmbed = url.match(/youtube\.com\/embed\/([^?&]+)/);
        if (matchEmbed && matchEmbed[1]) return matchEmbed[1];

        return null; // Not a YouTube video URL we can parse
    }

    // Find the main video element on the YouTube page.
    // We use a MutationObserver to ensure we catch the video element
    // even if it's loaded dynamically after the initial DOM content.
    const observeVideoElement = () => {
        const video = document.querySelector("video");
        if (video) {
            // If video element is found, attach the pause listener
            video.addEventListener("pause", () => {
                const videoId = getYouTubeVideoId();
                if (videoId) {
                    console.log("Extension: YouTube Video Paused. Video ID:", videoId);
                } else {
                    console.log("Extension: YouTube Video Paused, but could not determine Video ID.");
                }
            });
            console.log("Extension: YouTube video pause listener attached.");

            // Disconnect observer once video is found and listener is attached
            observer.disconnect();
        }
    };

    // Create a MutationObserver to watch for changes in the DOM,
    // specifically for when the video element becomes available.
    const observer = new MutationObserver(observeVideoElement);

    // Start observing the document body for child list changes (nodes being added/removed)
    // and subtree changes (changes within descendants).
    observer.observe(document.body, { childList: true, subtree: true });

    // Also, try to find the video immediately in case it's already in the DOM.
    observeVideoElement();
    