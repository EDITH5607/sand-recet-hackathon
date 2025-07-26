import express from "express";
import cors from "cors";
import getYoutubeTranscript from "./getTranscript.js";
import fs from "fs/promises";
import fetch from "node-fetch"; // Make sure node-fetch is installed (v2 or v3)

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_FUNCTION_URL = "https://<your-project-ref>.functions.supabase.co/<your-function-name>";
const SUPABASE_ANON_KEY = "<your-anon-or-service-role-key>"; // Replace with your key

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

		// ✅ Read the saved transcript
		const transcriptText = await fs.readFile(fileName, "utf-8");

		// ✅ Send to Supabase Edge Function
		const response = await fetch("https://naatvfcskvcglwteywdc.functions.supabase.co/extensions1", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hYXR2ZmNza3ZjZ2x3dGV5d2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzMxMjcsImV4cCI6MjA2OTA0OTEyN30.hYpywNLVSuLrdCKKh5eOa7uvZcz3orMcAttn9-YbCxg`, // required
			},
			body: JSON.stringify({ transcript: transcriptText }),
		});

		const result = await response.json();

		console.log("🧠 AI Response:\n", JSON.stringify(result, null, 2));
		res.json({ message: "Success", questions: result });
	} catch (error) {
		console.error("Transcript fetch error:", error);
		res.status(500).json({ error: error.message || "Transcript fetch failed" });
	}
});

app.listen(3000, () => {
	console.log("Server is listening on port 3000");
});
