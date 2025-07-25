import { YoutubeTranscript } from "youtube-transcript";

const videoId = "SccSCuHhOw0"; // The "Why Do We Dream?" video

try {
	const transcript = await YoutubeTranscript.fetchTranscript(videoId);
	console.log(
		`✅ Successfully fetched ${transcript.length} transcript entries.`
	);
	console.table(transcript.slice(0, 5)); // Print first 5 lines for inspection
} catch (err) {
	console.error("❌ Failed to fetch transcript:", err);
}
