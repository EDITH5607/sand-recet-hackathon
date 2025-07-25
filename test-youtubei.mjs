import { Innertube } from "youtubei.js";
import { parseStringPromise } from "xml2js"; // npm install xml2js

const youtube = await Innertube.create();
const videoId = "SccSCuHhOw0"; // Your test video

try {
	const info = await youtube.getInfo(videoId);

	console.log("📺 Captions object:", info.captions);

	const tracks = info.captions?.caption_tracks;
	if (!tracks || tracks.length === 0) {
		console.log("❌ No caption tracks found.");
		process.exit(1);
	}

	const englishTrack = tracks.find((track) =>
		track.language_code.startsWith("en")
	);

	if (!englishTrack) {
		console.log("❌ No English captions found.");
		process.exit(1);
	}

	const response = await fetch(englishTrack.base_url);
	const raw = await response.text();

	console.log("📄 Raw caption response:");
	console.log(raw.slice(0, 1000)); // print first 1000 characters

	// Try to parse XML only if it's likely valid
	if (!raw.startsWith("<?xml")) {
		console.error("❌ Response is not valid XML.");
		process.exit(1);
	}

	const parsed = await parseStringPromise(raw);

	// Diagnostic log
	console.dir(parsed, { depth: null });

	// Safety check before accessing transcript
	if (!parsed || !parsed.transcript || !parsed.transcript.text) {
		console.error("❌ Parsed XML has no transcript or text entries.");
		process.exit(1);
	}

	const texts = parsed.transcript.text;

	const captions = texts.map((t) => ({
		offset: parseFloat(t.$.start),
		duration: parseFloat(t.$.dur),
		text: t._,
	}));

	console.log(`✅ Fetched ${captions.length} lines.`);
	captions
		.slice(0, 5)
		.forEach(({ offset, text }) =>
			console.log(`[${offset.toFixed(2)}s] ${text}`)
		);
} catch (err) {
	console.error("❌ Error fetching captions:", err);
}
