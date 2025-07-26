import express from "express";
import cors from "cors";
import getYoutubeTranscript from "./getTranscript.js";
import fs from "fs/promises";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/transcript", async (req, res) => {
	const { videoId } = req.body;
	console.log("Received videoId on server:", videoId);
	if (!videoId) return res.status(400).json({ error: "No videoId provided" });

	try {
		const transcript = await getYoutubeTranscript(videoId, "en");

		const formatted = transcript
			.map(
				({ caption, startTime, endTime }) =>
					`[${startTime.toFixed(2)} - ${endTime.toFixed(2)}] ${caption}`
			)
			.join("\n");

		const fileName = `transcript.txt`;
		await fs.writeFile(fileName, formatted);

		console.log(`Transcript for ${videoId} saved as ${fileName}`);
		res.json({ message: "Transcript saved", file: fileName });
	} catch (error) {
		console.error("Transcript fetch error:", error);
		res.status(500).json({ error: error.message || "Transcript fetch failed" });
	}
});

app.listen(3000, () => {
	console.log("Server is listening on port 3000");
});
