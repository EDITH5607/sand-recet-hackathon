(function () {
	function getVideoIdFromUrl() {
		const urlParams = new URLSearchParams(window.location.search);
		return urlParams.get("v");
	}

	const videoId = getVideoIdFromUrl();

	if (videoId) {
		console.log("Sending videoId to server:", videoId);
// ... existing code ...
		fetch("http://localhost:3000/api/transcript", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ videoId }),
		})
		.then((res) => {
		if (!res.ok) {
			throw new Error(`Server error: ${res.status}`);
		}
		return res.json();
		})
		.then((data) => {
		console.log("Transcript saved:", data);
		})
		.catch((err) => {
		console.error("Error sending videoId:", err);
		});
	}
})();
