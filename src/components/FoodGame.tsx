"use client";

import { useEffect, useState } from "react";

// Local data structure from your JSON
interface LocalProduct {
	barcode: string;
	name: string;
	imageUrl: string;
}

// Data structure for UI usage
interface ProductInfo extends LocalProduct {
	ecoScore: number; // Higher = “healthier”
}

export default function FoodGame() {
	const [products, setProducts] = useState<LocalProduct[]>([]);
	const [score, setScore] = useState<number>(0);
	const [highScore, setHighScore] = useState<number>(0);
	const [isGameOver, setIsGameOver] = useState<boolean>(false);

	// The two “options” in the current round
	const [optionA, setOptionA] = useState<ProductInfo | null>(null);
	const [optionB, setOptionB] = useState<ProductInfo | null>(null);

	// Feedback states
	const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);
	const [showFeedback, setShowFeedback] = useState<boolean>(false);

	// On mount: load local data & high score
	useEffect(() => {
		// Generate local user ID if needed
		const storedUserId = localStorage.getItem("foodGuessUserId");
		if (!storedUserId) {
			const newId = "user-" + Math.floor(Math.random() * 1_000_000);
			localStorage.setItem("foodGuessUserId", newId);
		}

		// Retrieve high score
		const hs = localStorage.getItem("foodGameHighScore");
		if (hs) {
			setHighScore(parseInt(hs, 10));
		}

		// Load JSON from /food-barcodes.json
		fetch("/food-barcodes.json")
			.then((res) => res.json())
			.then((data: LocalProduct[]) => {
				setProducts(data);
			});
	}, []);

	// When products are loaded, start the first round
	useEffect(() => {
		if (products.length > 1) {
			startNewRound();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [products]);

	// Utility to pick 2 distinct items
	function pickTwoDistinctItems(
		list: LocalProduct[],
	): [LocalProduct, LocalProduct] {
		if (list.length < 2) {
			throw new Error("Need at least two items to play!");
		}
		let idx1 = Math.floor(Math.random() * list.length);
		let idx2 = Math.floor(Math.random() * list.length);
		while (idx2 === idx1) {
			idx2 = Math.floor(Math.random() * list.length);
		}
		return [list[idx1], list[idx2]];
	}

	// Fetch just the EcoScore from OFF
	async function fetchEcoScore(barcode: string): Promise<number> {
		const localUserId =
			localStorage.getItem("foodGuessUserId") || "anonymous";
		const userAgent = `Food Guessing Game - Web - ${localUserId} - games2play.vercel.app`;

		try {
			const res = await fetch(
				`https://us.openfoodfacts.org/api/v0/product/${barcode}`,
				{
					headers: {
						"User-Agent": userAgent,
					},
				},
			);
			const data = await res.json();
			if (!data || data.status !== 1 || !data.product) {
				// fallback
				return 50;
			}
			// The correct field: data.product.ecoscore_data.score
			let rawScore = data.product.nutriscore_score;
			if (typeof rawScore !== "number" || isNaN(rawScore)) {
				rawScore = 50;
			}
			// We assume 0..100 is valid, clamp if needed
			let ecoScore = Math.max(0, Math.min(100, rawScore));
			return ecoScore;
		} catch (error) {
			console.error("Error fetching ecoScore:", error);
			return 50; // fallback
		}
	}

	// Start a new round
	async function startNewRound() {
		setIsGameOver(false);
		setShowFeedback(false);
		setSelectedBarcode(null);

		// Pick 2 random items
		const [item1, item2] = pickTwoDistinctItems(products);

		// fetch EcoScores
		const [score1, score2] = await Promise.all([
			fetchEcoScore(item1.barcode),
			fetchEcoScore(item2.barcode),
		]);

		// Build final ProductInfo
		const productA: ProductInfo = {
			...item1,
			ecoScore: score1,
		};
		const productB: ProductInfo = {
			...item2,
			ecoScore: score2,
		};

		setOptionA(productA);
		setOptionB(productB);
	}

	function handleGuess(guessBarcode: string) {
		if (!optionA || !optionB) return;
		setShowFeedback(true);
		setSelectedBarcode(guessBarcode);

		// “Healthier” means higher ecoScore
		const correctBarcode =
			optionA.ecoScore > optionB.ecoScore
				? optionA.barcode
				: optionB.barcode;

		if (guessBarcode === correctBarcode) {
			setScore((prev) => prev + 1);
			// Wait, then next round
			setTimeout(() => {
				startNewRound();
			}, 1500);
		} else {
			// Wrong => game over
			setTimeout(() => {
				setIsGameOver(true);
			}, 1500);
		}
	}

	// Once game is over, check high score
	useEffect(() => {
		if (isGameOver) {
			if (score > highScore) {
				setHighScore(score);
				localStorage.setItem("foodGameHighScore", score.toString());
			}
		}
	}, [isGameOver, score, highScore]);

	function copyShareText() {
		const text = `I scored ${score} points in the Food Guessing Game! Can you beat me?`;
		navigator.clipboard.writeText(text).then(() => {
			alert("Score copied to clipboard!");
		});
	}

	// Game Over screen
	if (isGameOver) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
				<div className="w-full max-w-md border border-gray-300 rounded-lg p-6 text-center shadow-md animate-fadeIn">
					<h2 className="text-3xl font-bold text-red-600 mb-4 animate-pulse">
						Game Over!
					</h2>
					<p className="text-xl mb-2">Your Score: {score}</p>
					<p className="text-xl mb-6">High Score: {highScore}</p>
					<button
						onClick={copyShareText}
						className="bg-gray-200 rounded-md px-4 py-2 mr-3 hover:bg-gray-300 transition-colors"
					>
						Copy My Score
					</button>
					<button
						onClick={() => {
							setScore(0);
							startNewRound();
						}}
						className="bg-green-500 text-white rounded-md px-4 py-2 hover:bg-green-600 transition-colors"
					>
						Play Again
					</button>
				</div>
			</div>
		);
	}

	// Loading
	if (!optionA || !optionB) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-white">
				<p className="text-gray-600 animate-pulse">
					Loading products...
				</p>
			</div>
		);
	}

	// Main in-game UI
	return (
		<div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 animate-fadeIn">
			{/* Scoreboard */}
			<div className="mb-4 text-center">
				<h1 className="text-3xl font-bold text-gray-700 mb-2">
					Food Guessing Game
				</h1>
				<p className="text-sm text-gray-500 mb-4">
					Guess the healthier food!
				</p>
				<p className="text-gray-600">
					Score: {score} | High Score: {highScore}
				</p>
			</div>

			{/* Two product cards */}
			<div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-6">
				<ProductCard
					info={optionA}
					selected={selectedBarcode === optionA.barcode}
					correct={optionA.ecoScore >= optionB.ecoScore}
					showFeedback={showFeedback}
					onClick={() =>
						!showFeedback && handleGuess(optionA.barcode)
					}
				/>
				<ProductCard
					info={optionB}
					selected={selectedBarcode === optionB.barcode}
					correct={optionB.ecoScore >= optionA.ecoScore}
					showFeedback={showFeedback}
					onClick={() =>
						!showFeedback && handleGuess(optionB.barcode)
					}
				/>
			</div>
		</div>
	);
}

interface ProductCardProps {
	info: ProductInfo;
	selected: boolean;
	correct: boolean; // Is this the “healthier” (bigger ecoScore) item?
	showFeedback: boolean;
	onClick: () => void;
}

function ProductCard({
	info,
	selected,
	correct,
	showFeedback,
	onClick,
}: ProductCardProps) {
	let borderColor = "border-gray-200";
	let shakeClass = "";

	if (showFeedback && selected) {
		if (correct) {
			borderColor = "border-green-500";
		} else {
			borderColor = "border-red-500";
			shakeClass = "animate-wiggle";
		}
	}

	return (
		<div
			onClick={onClick}
			className={`relative w-64 p-4 border-4 ${borderColor} rounded-lg bg-white shadow cursor-pointer 
        transform transition-transform duration-300 hover:scale-105
        ${shakeClass}
      `}
		>
			<img
				src={info.imageUrl}
				alt={info.name}
				className="object-contain w-full h-44 mb-2"
			/>
			<h3 className="text-lg font-semibold text-gray-700 text-center">
				{info.name}
			</h3>

			{showFeedback && (
				<p className="mt-2 text-center text-gray-500">
					EcoScore: <span className="font-bold">{info.ecoScore}</span>
				</p>
			)}
		</div>
	);
}
