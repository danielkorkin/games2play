declare module "google-trends-api-429-fix" {
	interface TrendsOptions {
		keyword: string;
		startTime?: Date;
		endTime?: Date;
		geo?: string;
	}

	interface TrendsResponse {
		default: {
			timelineData: Array<{
				time: string;
				formattedTime: string;
				formattedAxisTime: string;
				value: number[];
				hasData?: boolean[];
			}>;
		};
	}

	interface GoogleTrendsAPI {
		interestOverTime(options: TrendsOptions): Promise<string>;
		interestByRegion(options: TrendsOptions): Promise<string>;
		relatedTopics(options: TrendsOptions): Promise<string>;
		relatedQueries(options: TrendsOptions): Promise<string>;
		dailyTrends(options: TrendsOptions): Promise<string>;
		realTimeTrends(options: TrendsOptions): Promise<string>;
	}

	const googleTrends: GoogleTrendsAPI;
	export default googleTrends;
}
