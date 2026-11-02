export function cc(...classes: (string | false | null | undefined)[]) {
	return classes.filter(Boolean).join(" ");
}

export function formatTime(seconds: number) {
	seconds = Math.floor(seconds);
	if (!seconds) return "0:00";
	let minutes = Math.floor(seconds / 60);
	seconds -= minutes * 60;
	let hours = Math.floor(minutes / 60);
	minutes -= hours * 60;
	if (hours) {
		return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	}
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function shuffle<T>(array: T[]): T[] {
	const output = [...array];
	let currentIndex = output.length;

	while (currentIndex != 0) {
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		[output[currentIndex], output[randomIndex]] = [
			output[randomIndex],
			output[currentIndex],
		];
	}

	return output;
}

export function compare<T extends string | number>(a: T, b: T) {
	if (a < b) {
		return -1;
	}
	if (a > b) {
		return 1;
	}
	return 0;
}

export function randomString(length: number) {
	let result = "";
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}

	return result;
}

const MONTHS_SHORT = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

export function formatDate(date: Date) {
	const lastMidnight = new Date();
	lastMidnight.setHours(0, 0, 0, 0);

	const yesterdayMidnight = new Date(lastMidnight);
	yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);

	const nextMidnight = new Date(lastMidnight);
	nextMidnight.setDate(nextMidnight.getDate() + 1);

	let dateString: string | null = null;
	if (date.getTime() < nextMidnight.getTime()) {
		if (date.getTime() >= lastMidnight.getTime()) {
			dateString = "Today";
		} else if (date.getTime() >= yesterdayMidnight.getTime()) {
			dateString = "Yesterday";
		}
	}

	if (dateString) {
		dateString += ` at ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
	} else {
		dateString = `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
	}

	return dateString;
}
