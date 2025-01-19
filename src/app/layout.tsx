import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "My Trends Game",
	description: "A Next.js Google Trends guessing game",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className="bg-gray-100 text-gray-900">{children}</body>
		</html>
	);
}
