// // background.js
// import { getYoutubeTranscript } from "./getTranscript.js";

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
// 	if (message.action === "fetchTranscript") {
// 		const videoId = message.videoId;

// 		getYoutubeTranscript(videoId, "en")
// 			.then((transcript) => {
// 				// Send it back to content script or popup
// 				chrome.tabs.sendMessage(sender.tab.id, {
// 					action: "transcriptReady",
// 					transcript,
// 				});
// 			})
// 			.catch((error) => {
// 				console.error("Error fetching transcript:", error);
// 			});

// 		return true; // Keeps the response channel open for async
// 	}
// });
