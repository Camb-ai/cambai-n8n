import { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

export const listSearch = {
	async listVoices(this: ILoadOptionsFunctions): Promise<INodeListSearchResult> {
		try {
			const response = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'cambaiApi',
				{
					method: 'GET',
					url: 'https://client.camb.ai/apis/list-voices',
					json: true,
				}
			);

			const voices = response || [];

			const results = voices.map((voice: any) => ({
				name: voice.voice_name,
				value: voice.id,
			}));

			return {
				results,
			};
		} catch (error) {
			// Return default voices if API call fails
			return {
				results: [
					{ name: 'Default Voice', value: 20303 },
					{ name: 'Voice 2', value: 20298 },
					{ name: 'Voice 3', value: 20305 },
				],
			};
		}
	},

	async listSourceLanguages(this: ILoadOptionsFunctions): Promise<INodeListSearchResult> {
		try {
			const response = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'cambaiApi',
				{
					method: 'GET',
					url: 'https://client.camb.ai/apis/source-languages',
					json: true,
				}
			);

			// Response is an array of language objects
			const languages = Array.isArray(response) ? response : [];

			const results = languages.map((language: any) => ({
				name: `${language.language} (${language.short_name})`,
				value: language.id,
			}));

			return {
				results,
			};
		} catch (error) {
			// Return default source languages if API call fails
			return {
				results: [
					{ name: 'English (en-US)', value: 1 },
				],
			};
		}
	},

	async listTargetLanguages(this: ILoadOptionsFunctions): Promise<INodeListSearchResult> {
		try {
			const response = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'cambaiApi',
				{
					method: 'GET',
					url: 'https://client.camb.ai/apis/target-languages',
					json: true,
				}
			);

			// Response is an array of language objects
			const languages = Array.isArray(response) ? response : [];

			const results = languages.map((language: any) => ({
				name: `${language.language} (${language.short_name})`,
				value: language.id,
			}));

			return {
				results,
			};
		} catch (error) {
			// Return default target languages if API call fails
			return {
				results: [
					{ name: 'English (en-US)', value: 1 },
				],
			};
		}
	},
};