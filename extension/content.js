console.log("✅ content.js loaded");

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
			console.log("✅ Transcript saved:", data);
		})
		.catch((err) => {
			console.error("❌ Error sending videoId:", err);
		});
}

// Send pause event to server
function sendPauseEventToServer(videoId, pauseTime, intervalMinutes) {
  console.log("Sending pause event to server:", { videoId, pauseTime, intervalMinutes });
  
  fetch("http://localhost:3000/api/pause-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      videoId, 
      pauseTime, 
      interval: intervalMinutes 
    }),
  })
  .then(res => {
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    return res.json();
  })
  .then(data => {
    console.log("✅ Pause event recorded:", data);
  })
  .catch(err => {
    console.error("❌ Error sending pause event:", err);
  });
}

// Handle auto-pause functionality
function startPauseTimer(intervalMs) {
  clearTimeout(pauseTimer);
  pauseTimer = setTimeout(() => {
    if (currentVideo && !currentVideo.paused) {
      const pauseTime = new Date().toISOString();
      const intervalMinutes = intervalMs / 60000;
      
      currentVideo.pause();
      console.log(`⏸️ Auto-paused after ${intervalMinutes} minutes`);
      
      // Show pause notification
      showPauseNotification(intervalMinutes);
      
      // Get current video ID
      const videoId = getCurrentVideoId();
      
      // Send pause event to server
      if (videoId) {
        sendPauseEventToServer(videoId, pauseTime, intervalMinutes);
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
						const remaining = (data.pauseInterval * 60000) - elapsed;
						
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
			chrome.storage.local.get(["pauseInterval", "extensionEnabled"], (data) => {
				if (data.extensionEnabled && data.pauseInterval) {
					// Calculate remaining time for new interval
					const elapsed = Date.now() - lastPlayTimestamp;
					const remaining = (data.pauseInterval * 60000) - elapsed;
					
					if (remaining > 0) {
						startPauseTimer(remaining);
					} else {
						currentVideo.pause();
						startPauseTimer(data.pauseInterval * 60000);
					}
				}
			});
		}
	}
});