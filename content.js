function getYouTubeVideoId() {
	const url = window.location.href;

	// Case: regular YouTube URL
	const standard = new URLSearchParams(window.location.search).get("v");
	if (standard) return standard;

	// Case: short link
	const matchShort = url.match(/youtu\.be\/([^?&]+)/);
	if (matchShort) return matchShort[1];

	// Case: embed URL
	const matchEmbed = url.match(/youtube\.com\/embed\/([^?&]+)/);
	if (matchEmbed) return matchEmbed[1];

	return null; // Not a YouTube video
}

async function handlePauseAndSendToServer() {
	const video = document.querySelector("video");
	if (!video) return;

	video.pause();
	const pausedTime = video.currentTime.toFixed(2);

	console.log("📺 Video ID:", videoId);
	console.log("⏸️ Paused at:", pausedTime);

	fetch(`http://localhost:3000/api/transcript/${videoId}/${pausedTime}`)
		.then((res) => res.json())
		.then((data) => console.log("📤 Server response:", data))
		.catch((err) => console.error("❌ Error contacting server:", err));

	const videoId = getYouTubeVideoId();
	if (!videoId) {
		console.error("❌ Could not extract YouTube video ID");
		return;
	}

	try {
		await fetch(
			`http://localhost:3000/api/transcript/${videoId}/${pausedTime}`
		);
	} catch (error) {
		console.error("❌ Failed to contact server:", error);
	}
}

chrome.runtime.onMessage.addListener((msg) => {
	if (msg.action === "pause-and-fetch") {
		handlePauseAndSendToServer();
	}
});
