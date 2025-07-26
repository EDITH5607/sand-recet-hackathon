// content.js

console.log("✅ content.js loaded");

let lastVideoId = null;

// Extract video ID from URL
function getCurrentVideoId() {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get("v");
}

// Send video ID to your server
function sendVideoIdToServer(videoId) {
	console.log("Sending videoId to server:", videoId);

	fetch("http://localhost:3000/api/transcript", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ videoId }),
	})
		.then((res) => {
			if (!res.ok) throw new Error(`Server error: ${res.status}`);
			return res.json();
		})
		.then((data) => {
			console.log("✅ Transcript saved:", data);
		})
		.catch((err) => {
			console.error("❌ Error sending videoId:", err);
		});
}

// Monitor URL changes (for YouTube SPA navigation)
function monitorVideoChanges() {
	const currentId = getCurrentVideoId();

	if (currentId && currentId !== lastVideoId) {
		lastVideoId = currentId;
		sendVideoIdToServer(currentId);
	}
}

// Check every second for video changes
setInterval(monitorVideoChanges, 1000);
