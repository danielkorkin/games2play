// src/app/api/trends/svg/route.ts
import { NextRequest, NextResponse } from "next/server";
import googleTrends from "google-trends-api-429-fix";

// Our desired SVG width/height
const WIDTH = 800;
const HEIGHT = 400;

interface TrendsResponse {
	default: {
		timelineData: Array<{
			value: number[];
		}>;
	};
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const keyword = searchParams.get("keyword");

		if (!keyword) {
			return NextResponse.json(
				{ error: "Missing 'keyword' query parameter" },
				{ status: 400 },
			);
		}

		// 1) Fetch data from Google Trends
		let results: string;
		try {
			results = await googleTrends.interestOverTime({
				keyword,
				startTime: new Date("2004-01-01"),
				geo: "", // worldwide
			});
		} catch (fetchError: unknown) {
			console.error("Failed to fetch Google Trends data:", fetchError);
			return NextResponse.json(
				{ error: "Error fetching data from Google Trends API" },
				{ status: 500 },
			);
		}

		// Quick check if we obviously got HTML instead of JSON
		if (results.trim().startsWith("<html")) {
			console.error(
				"Google Trends response was HTML (likely blocked or captcha).",
			);
			return NextResponse.json(
				{
					error: "Google returned HTML instead of JSON (possibly blocked or captcha)",
				},
				{ status: 500 },
			);
		}

		// 2) Parse results - google-trends-api returns a stringified JSON
		let parsedResults: TrendsResponse;
		try {
			parsedResults = JSON.parse(results);
		} catch (parseError) {
			console.error(
				"Failed to parse Google Trends response:",
				parseError,
			);
			console.error("Response snippet:", results.slice(0, 200));
			return NextResponse.json(
				{ error: "Invalid/malformed response from Google Trends API" },
				{ status: 500 },
			);
		}

		const timelineData = parsedResults?.default?.timelineData || [];

		if (!Array.isArray(timelineData) || timelineData.length < 2) {
			return NextResponse.json(
				{
					error: "Insufficient trend data available for this keyword.",
				},
				{ status: 400 },
			);
		}

		// Extract numeric values
		const values: number[] = timelineData.map(
			(item: { value: number[] }) => item.value?.[0] ?? 0,
		);

		// 3) Scale data to fit the 800x400
		const maxVal = Math.max(...values);
		const minVal = Math.min(...values);

		// Avoid divide-by-zero if maxVal == 0
		const range = maxVal - minVal || 1;

		// Build a list of coordinates (x,y) in [0..WIDTH] x [0..HEIGHT].
		// We map each index i to an x coordinate,
		// each value to a scaled y coordinate (inverted so highest is near the top).
		const coords = values.map((v, i) => {
			const x = (i / (values.length - 1)) * (WIDTH - 40) + 20; // +20 for left padding
			const y =
				HEIGHT -
				20 - // bottom padding
				((v - minVal) / range) * (HEIGHT - 40); // top/bottom padding
			return [x, y];
		});

		// Build a "path" string (e.g. "M x0,y0 L x1,y1 L x2,y2 ...")
		const pathD = coords
			.map(([x, y], i) => (i === 0 ? `M ${x},${y}` : `L ${x},${y}`))
			.join(" ");

		// 4) Construct an SVG string
		// minimal styling: line with a stroke color, fill 'none'
		const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" style="background: #fff;">
  <path d="${pathD}" stroke="#FEE440" stroke-width="3" fill="none" />
</svg>
`;

		// 5) Return as image/svg+xml
		return new NextResponse(svg, {
			status: 200,
			headers: {
				"Content-Type": "image/svg+xml; charset=utf-8",
				"Cache-Control": "no-store", // or any other policy you want
			},
		});
	} catch (error: unknown) {
		console.error("SVG Route Error:", error);
		return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
	}
}
