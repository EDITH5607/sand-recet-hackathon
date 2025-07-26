function updateToggleUI(enabled) {
	const toggleBtn = document.getElementById("toggleBtn");
	toggleBtn.textContent = enabled ? "Disable Extension" : "Enable Extension";
	document.getElementById("status").textContent =
		"Status: " + (enabled ? "Enabled" : "Disabled");
}

// On popup load, set initial state
chrome.storage.local.get(["extensionEnabled"], (res) => {
	if (res.extensionEnabled === undefined) {
		chrome.storage.local.set({ extensionEnabled: true });
		updateToggleUI(true);
	} else {
		updateToggleUI(res.extensionEnabled);
	}
});

// Pause button
document.getElementById("pauseBtn").addEventListener("click", () => {
	chrome.storage.local.get(["extensionEnabled"], (res) => {
		if (!res.extensionEnabled) return alert("Extension is disabled.");

		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const tab = tabs[0];
			if (!tab || !tab.id) return alert("No active tab found.");

			chrome.scripting.executeScript({
				target: { tabId: tab.id },
				func: () => {
					const video = document.querySelector("video");
					if (video) video.pause();
					else alert("No video found.");
				},
			});
		});
	});
});

// Toggle enable/disable button
document.getElementById("toggleBtn").addEventListener("click", () => {
	chrome.storage.local.get(["extensionEnabled"], (res) => {
		const newState = !res.extensionEnabled;
		chrome.storage.local.set({ extensionEnabled: newState }, () => {
			updateToggleUI(newState);
		});
	});
});
