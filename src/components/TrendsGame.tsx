"use client";

import React, { useEffect, useState } from "react";

export default function TrendsGame() {
	const [words, setWords] = useState<string[]>([]);
	const [correctWord, setCorrectWord] = useState<string>("");
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [wrongWord, setWrongWord] = useState<string>("");
	const [score, setScore] = useState<number>(0);
	const [highScore, setHighScore] = useState<number>(0);
	const [isGameOver, setIsGameOver] = useState<boolean>(false);
	const [options, setOptions] = useState<string[]>([]);

	// On mount, load high score, fetch words
	useEffect(() => {
		const storedHighScore = localStorage.getItem("trendsHighScore");
		if (storedHighScore) {
			setHighScore(parseInt(storedHighScore, 10));
		}

		// fetch words from /words.txt
		fetch("/words.txt")
			.then((res) => res.text())
			.then((txt) => {
				const allWords = txt
					.split(/\r?\n/)
					.map((w) => w.trim())
					.filter(Boolean);
				setWords(allWords);
			});
	}, []);

	// Whenever words are loaded, start a new round
	useEffect(() => {
		if (words.length > 0) {
			startNewRound();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [words]);

	function pickTwoDistinctWords(wordList: string[]): [string, string] {
		if (wordList.length < 2) {
			throw new Error("Need at least two words to play");
		}
		// eslint-disable-next-line prefer-const
		let idx1 = Math.floor(Math.random() * wordList.length);
		let idx2 = Math.floor(Math.random() * wordList.length);
		while (idx2 === idx1) {
			idx2 = Math.floor(Math.random() * wordList.length);
		}
		return [wordList[idx1], wordList[idx2]];
	}

	async function startNewRound() {
		setIsGameOver(false);

		const [cw, ww] = pickTwoDistinctWords(words);
		setCorrectWord(cw);
		setWrongWord(ww);

		// Shuffle
		const tempOptions = [cw, ww];
		for (let i = tempOptions.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[tempOptions[i], tempOptions[j]] = [tempOptions[j], tempOptions[i]];
		}
		setOptions(tempOptions);
	}

	function handleGuess(word: string) {
		if (word === correctWord) {
			setScore((prev) => prev + 1);
			startNewRound();
		} else {
			setIsGameOver(true);
		}
	}

	function handleGameOver() {
		if (score > highScore) {
			setHighScore(score);
			localStorage.setItem("trendsHighScore", score.toString());
		}
	}

	useEffect(() => {
		if (isGameOver) handleGameOver();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isGameOver]);

	function copyShareText() {
		const text = `I scored ${score} points in the Google Trends Guessing Game! Can you beat me?`;
		navigator.clipboard.writeText(text).then(() => {
			alert("Score copied to clipboard!");
		});
	}

	if (words.length === 0) {
		return (
			<div className="text-center">
				<p>Loading words...</p>
			</div>
		);
	}

	if (isGameOver) {
		return (
			<div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500">
				<div className="text-center space-y-4 mt-8 animate-fadeIn bg-black/40 p-6 rounded-md">
					<h2 className="text-4xl font-extrabold text-yellow-300 drop-shadow-neon">
						GAME OVER!
					</h2>
					<p className="text-2xl text-white">Your Score: {score}</p>
					<p className="text-xl text-white">
						High Score: {highScore}
					</p>

					<button
						onClick={copyShareText}
						className="bg-pink-600 hover:bg-pink-700 transition-all text-white px-6 py-2 rounded-md animate-pulse"
					>
						Copy My Score
					</button>

					<div>
						<button
							onClick={() => {
								setScore(0);
								startNewRound();
							}}
							className="bg-green-600 hover:bg-green-700 transition-all text-white px-6 py-2 rounded-md"
						>
							Play Again
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className="
        h-screen w-screen
        flex flex-col
        bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500
        animate-fadeIn
      "
		>
			{/* Scoreboard up top */}
			<div className="flex items-center justify-center p-4 bg-black/30">
				<div className="text-white text-center space-y-1">
					<p className="text-xl font-bold">Score: {score}</p>
					<p className="text-md">High Score: {highScore}</p>
				</div>
			</div>

			{/* Middle section: heading + chart */}
			<div className="flex-grow flex flex-col items-center justify-center px-4 py-2">
				{/* Retro shining heading */}
				<h2
					className="
            text-4xl font-extrabold mb-4
            text-yellow-300 drop-shadow-neon
            animate-pulse
          "
				>
					Guess That Trend!
				</h2>

				{/* SVG from /api/trends/svg?keyword=... */}
				<div className="bg-white rounded-md p-2 shadow-inner max-w-4xl w-full sm:w-3/4 md:w-2/3 lg:w-1/2">
					{correctWord && (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={`/api/trends/svg?keyword=${encodeURIComponent(
								correctWord,
							)}`}
							alt="Trends Chart"
							className="w-full h-auto max-h-[400px]"
						/>
					)}
				</div>
			</div>

			{/* Bottom: guess buttons */}
			<div
				className="
          flex flex-col sm:flex-row
          items-center justify-center
          gap-4 p-4
          bg-black/30
        "
			>
				{options.map((option) => (
					<button
						key={option}
						onClick={() => handleGuess(option)}
						className="
              bg-blue-600 text-white font-semibold 
              px-6 py-3 rounded-md 
              hover:bg-blue-700 
              hover:scale-110 
              transition-transform
              animate-bounce
              w-full sm:w-auto
              capitalize
            "
					>
						{option}
					</button>
				))}
			</div>
		</div>
	);
}
