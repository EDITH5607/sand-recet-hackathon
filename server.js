// // server.js (Express backend)
// import express from "express";
// import cors from "cors";
// import { YoutubeTranscript } from "youtube-transcript";

// const app = express();
// app.use(cors());

// app.get("/api/transcript/:videoId/:pausedTime", async (req, res) => {
// 	const { videoId, pausedTime } = req.params;

// 	try {
// 		const transcript = await YoutubeTranscript.fetchTranscript(videoId);
// 		console.log(" Raw Transcript:");
// 		console.table(
// 			transcript.map(({ start, duration, text }) => ({
// 				start,
// 				duration,
// 				text,
// 			}))
// 		);

// 		const filtered = transcript.filter(
// 			(entry) => entry.start <= parseFloat(pausedTime)
// 		);

// 		console.log(`Transcript for video ${videoId} up to ${pausedTime}s:`);
// 		console.table(
// 			filtered.map(({ start, duration, text }) => ({ start, duration, text }))
// 		);
// 		res.json({
// 			message: "Transcript fetched successfully",
// 			transcript: filtered,
// 		});
// 	} catch (err) {
// 		console.error(" Error fetching transcript:", err);
// 		res
// 			.status(500)
// 			.json({ error: "Transcript fetch failed", details: err.toString() });
// 	}
// });

// app.listen(3000, () =>
// 	console.log("Server running at http://localhost:3000")
// );
