function updateToggleUI(enabled) {
	const toggleBtn = document.getElementById("toggleBtn");
	toggleBtn.textContent = enabled ? "Disable Extension" : "Enable Extension";
	toggleBtn.className = enabled ? "enabled" : "disabled";
	document.getElementById("status").textContent =
		"Status: " + (enabled ? "Enabled" : "Disabled");
}

// On popup load, set initial state
chrome.storage.local.get(["extensionEnabled", "pauseInterval"], (res) => {
	if (res.extensionEnabled === undefined) {
		chrome.storage.local.set({ extensionEnabled: true });
		updateToggleUI(true);
	} else {
		updateToggleUI(res.extensionEnabled);
	}

	// Set interval input value
	document.getElementById("intervalInput").value = res.pauseInterval || 0.02;
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

// Save interval button handler
document.getElementById("saveIntervalBtn").addEventListener("click", () => {
	const interval = parseFloat(document.getElementById("intervalInput").value);

	if (isNaN(interval) || interval < 0.02) {
		alert("Please enter a valid number (minimum 0.02 minute)");
		return;
	}

	chrome.storage.local.set({ pauseInterval: interval }, () => {
		alert(`Auto-pause interval set to ${interval} minutes`);

		// Notify content script about interval change
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs[0]?.id) {
				chrome.tabs.sendMessage(tabs[0].id, {
					type: "INTERVAL_CHANGED",
					interval,
				});
			}
		});
	});
});
