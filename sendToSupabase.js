import fs from 'fs/promises';
import fetch from 'node-fetch'; // Not needed in Node.js 18+, remove this line in that case

 function filterTranscriptByTime(transcript, currentTime) {
	const lines = transcript.split('\n');
	return lines
		.filter((line) => {
			const match = line.match(/\[(\d+(\.\d+)?)\s*-\s*(\d+(\.\d+)?)\]/);
			if (!match) return true; // If no timestamp, keep it
			const endTime = parseFloat(match[3]);
			return endTime <= currentTime;
		})
		.join('\n');
 }

export async function sendTranscriptToSupabase(pauseTime) {
	try {
		// 1. Read the transcript
		const transcriptText = await fs.readFile('transcript.txt', 'utf-8');

        const filteredTranscript = filterTranscriptByTime(transcriptText, pauseTime);

		// 2. POST to Supabase Edge Function
		const response = await fetch(
			'https://naatvfcskvcglwteywdc.functions.supabase.co/extensions1',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hYXR2ZmNza3ZjZ2x3dGV5d2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzMxMjcsImV4cCI6MjA2OTA0OTEyN30.hYpywNLVSuLrdCKKh5eOa7uvZcz3orMcAttn9-YbCxg',
				},
				body: JSON.stringify({ transcript: filteredTranscript, pauseTime }),
			}
		);

		if (!response.ok) {
			console.error(`❌ Supabase error: ${response.status} ${response.statusText}`);
			const errorText = await response.text();
			console.error('Response:', errorText);
			return;
		}

		const text = await response.text();

		try {
			const cleaned = text.replace(/^```json\s*|\s*```$/g, '');
            const result = JSON.parse(cleaned);
            console.log('✅ Supabase Response:', result);

            await fs.writeFile('result.json', JSON.stringify(result, null, 2), 'utf-8');
            console.log('✅ Result saved to result.json');

		} catch (err) {
			console.error('❌ Supabase returned non-JSON:', text);
		}

	} catch (error) {
		console.error('❌ Error sending transcript to Supabase:', error);
	}

   

}

// ✅ Run the function
//sendTranscriptToSupabase();
