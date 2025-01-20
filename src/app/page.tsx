// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
	return (
		<main className="flex flex-col items-center justify-center min-h-screen p-4">
			<h1 className="text-3xl font-bold mb-8">Welcome to Games2Play</h1>

			{/* Card for the Trends Guessing Game */}
			<div className="max-w-md w-full bg-white rounded-lg shadow p-6 mb-4">
				<h2 className="text-xl font-semibold mb-2">
					Google Trends Guessing Game
				</h2>
				<p className="text-gray-700 mb-4">
					Can you guess which keyword’s trend line this is?
				</p>
				<Link
					href="/games/trends"
					className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
				>
					Play Now
				</Link>
			</div>
			<div className="max-w-md w-full bg-white rounded-lg shadow p-6 mb-4">
				<h2 className="text-xl font-semibold mb-2">
					Food Health Guessing Game
				</h2>
				<p className="text-gray-700 mb-4">
					Can you guess which food is healthier?
				</p>
				<Link
					href="/games/food"
					className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
				>
					Play Now
				</Link>
			</div>
		</main>
	);
}
