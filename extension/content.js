console.log(" content.js loaded");

let lastVideoId = null;
let pauseTimer = null;
let lastPlayTimestamp = 0;
let currentVideo = null;

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
			console.log("Transcript saved:", data);
		})
		.catch((err) => {
			console.error(" Error sending videoId:", err);
		});
}

// Send pause event to server
function sendPauseEventToServer(videoId, intervalMinutes, playbackPosition) {
	console.log("Sending pause event to server:", {
		videoId,
		intervalMinutes,
		playbackPosition,
	});

	fetch("http://localhost:3000/api/pause-event", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			videoId,
			interval: intervalMinutes,
			pauseTime: playbackPosition,
		}),
	})
		.then((res) => {
			if (!res.ok) throw new Error(`Server error: ${res.status}`);
			return res.json();
		})
		.then((data) => {
			console.log(" Pause event recorded:", data);
		})
		.catch((err) => {
			console.error(" Error sending pause event:", err);
		});
}

// Handle auto-pause functionality
function startPauseTimer(intervalMs) {
	clearTimeout(pauseTimer);
	pauseTimer = setTimeout(() => {
		if (currentVideo && !currentVideo.paused) {
			//const pauseTime = new Date().toISOString();
			const intervalMinutes = intervalMs / 60000;
			const playbackPosition = currentVideo.currentTime;

			currentVideo.pause();
			console.log(`Auto-paused at position: ${playbackPosition.toFixed(1)}s`);

			// Show pause notification
			showPauseNotification(intervalMinutes);

			// Get current video ID
			const videoId = getCurrentVideoId();

			// Send pause event to server
			if (videoId) {
				sendPauseEventToServer(videoId, intervalMinutes, playbackPosition);
			}
		}
	}, intervalMs);
}

// Show notification when paused
function showPauseNotification(minutes) {
	const notification = document.createElement("div");
	notification.style = `
		position: fixed;
		top: 20px;
		right: 20px;
		background: rgba(0,0,0,0.8);
		color: white;
		padding: 15px;
		border-radius: 5px;
		z-index: 10000;
		font-family: Arial, sans-serif;
		box-shadow: 0 4px 8px rgba(0,0,0,0.3);
	`;
	notification.innerHTML = `
		<div style="font-size: 16px; margin-bottom: 8px;">⏸️ Auto-Paused</div>
		<div>Video paused after ${minutes} minutes</div>
	`;
	document.body.appendChild(notification);

	setTimeout(() => {
		notification.style.transition = "opacity 0.5s";
		notification.style.opacity = "0";
		setTimeout(() => notification.remove(), 500);
	}, 3000);
}

// Setup video event listeners
function setupVideoListeners() {
	if (!currentVideo) return;

	// Remove existing listeners to prevent duplicates
	currentVideo.removeEventListener("play", handleVideoPlay);
	currentVideo.removeEventListener("pause", handleVideoPause);

	// Add new listeners
	currentVideo.addEventListener("play", handleVideoPlay);
	currentVideo.addEventListener("pause", handleVideoPause);
}

function handleVideoPlay() {
	lastPlayTimestamp = Date.now();
	chrome.storage.local.get(["pauseInterval", "extensionEnabled"], (data) => {
		if (data.extensionEnabled && data.pauseInterval) {
			startPauseTimer(data.pauseInterval * 60000);
		}
	});
}

function handleVideoPause() {
	clearTimeout(pauseTimer);
	const elapsed = (Date.now() - lastPlayTimestamp) / 60000;
	if (elapsed > 0.1) {
		console.log(`⏱️ Played for ${elapsed.toFixed(2)} minutes`);
	}
}

// Monitor URL changes (for YouTube SPA navigation)
function monitorVideoChanges() {
	const currentId = getCurrentVideoId();

	if (currentId && currentId !== lastVideoId) {
		lastVideoId = currentId;
		sendVideoIdToServer(currentId);

		// Clear existing timer when video changes
		clearTimeout(pauseTimer);

		// Setup new video reference
		currentVideo = document.querySelector("video");

		if (currentVideo) {
			setupVideoListeners();

			// If video is already playing when detected
			if (!currentVideo.paused) {
				handleVideoPlay();
			}
		}
	}
}

// Initial setup
currentVideo = document.querySelector("video");
if (currentVideo) {
	setupVideoListeners();
	if (!currentVideo.paused) {
		handleVideoPlay();
	}
}

// Check every second for video changes
setInterval(monitorVideoChanges, 1000);

// Handle storage changes (interval updates or enable/disable toggle)
chrome.storage.onChanged.addListener((changes) => {
	if (changes.pauseInterval || changes.extensionEnabled) {
		if (currentVideo && !currentVideo.paused) {
			clearTimeout(pauseTimer);

			if (changes.extensionEnabled?.newValue !== false) {
				chrome.storage.local.get(["pauseInterval"], (data) => {
					if (data.pauseInterval) {
						// Calculate remaining time for new interval
						const elapsed = Date.now() - lastPlayTimestamp;
						const remaining = data.pauseInterval * 60000 - elapsed;

						if (remaining > 0) {
							startPauseTimer(remaining);
						} else {
							// If interval expired while changing settings
							currentVideo.pause();
							startPauseTimer(data.pauseInterval * 60000);
						}
					}
				});
			}
		}
	}
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message) => {
	if (message.type === "INTERVAL_CHANGED") {
		if (currentVideo && !currentVideo.paused) {
			clearTimeout(pauseTimer);
			chrome.storage.local.get(
				["pauseInterval", "extensionEnabled"],
				(data) => {
					if (data.extensionEnabled && data.pauseInterval) {
						// Calculate remaining time for new interval
						const elapsed = Date.now() - lastPlayTimestamp;
						const remaining = data.pauseInterval * 60000 - elapsed;

						if (remaining > 0) {
							startPauseTimer(remaining);
						} else {
							currentVideo.pause();
							startPauseTimer(data.pauseInterval * 60000);
						}
					}
				}
			);
		}
	}
});

function showPauseNotification(minutes) {
	// Notification Banner
	const notification = document.createElement("div");
	notification.style = `
		position: fixed;
		bottom: 20px;
		right: 20px;
		background: rgba(0,0,0,0.8);
		color: white;
		padding: 15px;
		border-radius: 5px;
		z-index: 10000;
		font-family: Arial, sans-serif;
		box-shadow: 0 4px 8px rgba(0,0,0,0.3);
	`;
	notification.innerHTML = `
		<div style="font-size: 16px; margin-bottom: 8px;">⏸️ Auto-Paused</div>
		<div>Video paused after ${minutes} minutes</div>
	`;
	document.body.appendChild(notification);

	setTimeout(() => {
		notification.style.transition = "opacity 0.5s";
		notification.style.opacity = "0";
		setTimeout(() => notification.remove(), 500);
	}, 3000);

	// ⬇️ Show floating question panel (or popup)
	showFloatingPanel();
}

function showFloatingPanel() {
	if (document.getElementById("yt-qa-panel")) return;

	const panel = document.createElement("div");
	panel.id = "yt-qa-panel";
	panel.style = `
		position: fixed;
		top: 50px;
		right: 50px;
		width: 480px;
		max-height: 90vh;
		opacity: 95%;
		background: #273F4F;
		backdrop-filter: blur(10px);
		border: 2px solid black;
		border-radius: 12px;
		padding: 20px;
		z-index: 10001;
		overflow-y: auto;
		font-family: Arial, sans-serif;
		color: white;
		font-size: 16px;
	`;

	panel.innerHTML = `
		<div style="font-size: 22px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
			<strong>🧠 Learning Checkpoint</strong>
			<button id="yt-qa-close" style="border:none;background:none;font-size:24px; color:red;cursor:pointer;">🗙</button>
		</div>
		<div id="yt-qa-questions" style="font-size: 16px;">
			<p>⏳ Loading questions...</p>
		</div>
	`;

	document.body.appendChild(panel);

	document.getElementById("yt-qa-close").onclick = () => {
		panel.remove();
	};

	// 🔽 Fetch questions from your Express backend
	fetch("http://localhost:3000/api/questions")
		.then((res) => res.json())
		.then((data) => {
			const container = document.getElementById("yt-qa-questions");
			container.innerHTML = "";

			if (!data.questions || data.questions.length === 0) {
				container.innerHTML = "<p>No questions found.</p>";
				return;
			}

			data.questions.forEach((q) => {
				const qDiv = document.createElement("div");
				qDiv.style =
					"margin-bottom: 24px; border-bottom: 1px solid #444; padding-bottom: 12px;";

				const optionsHtml = q.options
					.map(
						(opt, i) => `
						<label style="display:block;margin:4px 0;cursor:pointer;">
							<input type="radio" name="q${q.id}" value="${opt}" data-answer="${q.answer}" style="margin-right:8px;">
							${opt}
						</label>`
					)
					.join("");

				qDiv.innerHTML = `
					<div style="font-weight:bold; margin-bottom: 6px;">Q${q.id}: ${q.question}</div>
					<div>${optionsHtml}</div>
					<div style="margin-top: 6px; font-size: 14px; color: #ccc;"><em>Difficulty: ${q.difficulty}</em></div>
					<div id="explanation-${q.id}" style="margin-top:8px; display:none; background:#1a2c38; padding:10px; border-radius:6px; font-size:14px;"></div>
				`;

				// Add listener to highlight correct answer
				setTimeout(() => {
					const radios = qDiv.querySelectorAll(`input[name="q${q.id}"]`);
					radios.forEach((radio) => {
						radio.addEventListener("change", () => {
							const explanationBox = document.getElementById(
								`explanation-${q.id}`
							);
							if (radio.value === radio.dataset.answer) {
								explanationBox.style.display = "block";
								explanationBox.style.color = "#6afc94";
								explanationBox.innerHTML = `✅ Correct!<br>${q.explanation}`;
							} else {
								explanationBox.style.display = "block";
								explanationBox.style.color = "#ff8e8e";
								explanationBox.innerHTML = `❌ Incorrect. <br>💡 ${q.explanation}`;
							}
						});
					});
				}, 0);

				container.appendChild(qDiv);
			});
		})
		.catch((err) => {
			console.error("Error loading questions:", err);
			document.getElementById("yt-qa-questions").innerHTML =
				"<p style='color:red;'>❌ Failed to load questions.</p>";
		});
}
