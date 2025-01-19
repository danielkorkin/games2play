// src/app/api/trends/route.ts
import { NextRequest, NextResponse } from "next/server";
import googleTrends from "google-trends-api-429-fix";

export async function POST(request: NextRequest) {
	try {
		const { keyword } = await request.json();

		if (!keyword) {
			return NextResponse.json(
				{ error: "Missing keyword" },
				{ status: 400 },
			);
		}

		// Call google-trends-api from 2004 until now (default if no endTime given).
		const results = await googleTrends.interestOverTime({
			keyword,
			startTime: new Date("2004-01-01"),
			// endTime defaults to now, but you can specify if you want
			// endTime: new Date(),
			geo: "", // Worldwide
		});

		// results is a string; parse it
        const parsedResults = JSON.parse(results);

        // We'll send back just the timeline data for simplicity
        return NextResponse.json({
            timelineData: parsedResults.default.timelineData || [],
        });
    } catch (error: unknown) {
        console.error("API error:", error);
        // Type guard to check if error is Error instance
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
}
