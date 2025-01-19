import { readFile } from "fs/promises";
import { join } from "path";

export async function getWords(): Promise<string[]> {
	const filePath = join(process.cwd(), "public", "words.txt");
	const data = await readFile(filePath, "utf-8");
	// Split on newlines, trim extra whitespace, and filter out empty lines
	return data
		.split(/\r?\n/)
		.map((word) => word.trim())
		.filter(Boolean);
}
