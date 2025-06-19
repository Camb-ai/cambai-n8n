import { IDataObject, IExecuteSingleFunctions, IHttpRequestOptions, IN8nHttpFullResponse, INodeExecutionData, INodeProperties } from "n8n-workflow";

export const DubbingOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'End-to-End Dubbing',
				value: 'endToEndDubbing',
				description: 'Dub video/audio content from one language to another',
				action: 'Perform end to end dubbing',
				routing: {
					send: {
						preSend: [ createDubbingTask ],
					},
					output: {
						postReceive: [ pollAndRetrieveDubbing ],
					}
				},
			},
		],
		default: 'endToEndDubbing',
		displayOptions: {
			show: {
				resource: ['dubbing'],
			},
		},
	}
];

export const DubbingFields: INodeProperties[] = [
	// End-to-End Dubbing Fields
	{
		displayName: 'Video URL',
		description: 'Link to media files (YouTube, Google Drive, or direct media file URLs)',
		placeholder: 'e.g. https://www.youtube.com/watch?v=example or https://example.com/video.mp4',
		name: 'videoUrl',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['dubbing'],
				operation: ['endToEndDubbing'],
			},
		},
		required: true,
	},
	{
		displayName: 'Source Language',
		description: 'The original language spoken in your media',
		name: 'sourceLanguage',
		type: 'resourceLocator',
		default: { mode: 'list', value: 1 },
		displayOptions: {
			show: {
				resource: ['dubbing'],
				operation: ['endToEndDubbing'],
			},
		},
		modes: [
			{
				displayName: 'From list',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'listSourceLanguages',
					searchable: true,
				},
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				placeholder: '1',
			},
		],
		required: true,
	},
	{
		displayName: 'Target Languages',
		description: 'The language(s) you want your content to be dubbed into',
		name: 'targetLanguages',
		type: 'resourceLocator',
		typeOptions: {
			multipleValues: true,
			multipleValueButtonText: 'Add Target Language',
		},
		default: { mode: 'list', value: [] },
		displayOptions: {
			show: {
				resource: ['dubbing'],
				operation: ['endToEndDubbing'],
			},
		},
		modes: [
			{
				displayName: 'From list',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'listTargetLanguages',
					searchable: true,
				},
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				placeholder: '5',
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['dubbing'],
				operation: ['endToEndDubbing'],
			},
		},
		options: [
			{
				displayName: 'Polling Interval (Seconds)',
				name: 'pollingInterval',
				description: 'Time between status checks',
				type: 'number',
				default: 10,
				typeOptions: {
					minValue: 5,
					maxValue: 30,
				},
			},
			{
				displayName: 'Polling Timeout (Seconds)',
				name: 'pollingTimeout',
				description: 'Maximum time to wait for dubbing completion (dubbing can take longer)',
				type: 'number',
				default: 600,
				typeOptions: {
					minValue: 300,
					maxValue: 1800,
				},
			},
		],
	},
];

// Step 1: Create dubbing task and get task_id
async function createDubbingTask(this: IExecuteSingleFunctions, requestOptions: IHttpRequestOptions): Promise<IHttpRequestOptions> {
	const videoUrl = this.getNodeParameter('videoUrl') as string;
	const sourceLanguage = this.getNodeParameter('sourceLanguage') as IDataObject;
	const targetLanguages = this.getNodeParameter('targetLanguages', []) as IDataObject | IDataObject[];

	// Extract source language value properly
	let sourceLanguageValue: number;
	if (sourceLanguage && typeof sourceLanguage === 'object' && sourceLanguage.value !== undefined) {
		sourceLanguageValue = parseInt(sourceLanguage.value as string, 10);
	} else {
		sourceLanguageValue = parseInt(sourceLanguage as any, 10);
	}

	const requestBody: IDataObject = {
		video_url: videoUrl,
		source_language: sourceLanguageValue,
	};

	// Add target languages if provided - handle the nested structure
	if (targetLanguages && typeof targetLanguages === 'object') {
		let targetLanguageValues: number[] = [];
		
		// Handle case where targetLanguages is an object with __rl property
		if (!Array.isArray(targetLanguages) && '__rl' in targetLanguages) {
			const rlObject = targetLanguages.__rl as IDataObject;
			if (rlObject.value !== undefined) {
				targetLanguageValues = [parseInt(rlObject.value as string, 10)];
			}
		}
		// Handle case where targetLanguages is an array
		else if (Array.isArray(targetLanguages)) {
			targetLanguageValues = targetLanguages.map((lang: IDataObject) => {
				if (typeof lang === 'object' && lang.value !== undefined) {
					return parseInt(lang.value as string, 10);
				}
				return parseInt(lang as any, 10);
			});
		}
		
		if (targetLanguageValues.length > 0) {
			requestBody.target_languages = targetLanguageValues;
		}
	}

	requestOptions.method = 'POST';
	requestOptions.url = '/dub';
	requestOptions.body = requestBody;
	requestOptions.json = true;
	
	return requestOptions;
}

// Step 2: Poll status and retrieve final dubbing results
async function pollAndRetrieveDubbing(this: IExecuteSingleFunctions, items: INodeExecutionData[], responseData: IN8nHttpFullResponse): Promise<INodeExecutionData[]> {
	const additionalOptions = this.getNodeParameter('additionalOptions', {}) as IDataObject;
	const pollingTimeout = (additionalOptions.pollingTimeout as number) || 600;
	const pollingInterval = (additionalOptions.pollingInterval as number) || 10;

	// Get task_id from initial response
	const responseBody = responseData.body as any;
	const taskId = responseBody.task_id;
	
	if (!taskId) {
		throw new Error('No task_id received from dubbing creation request');
	}
	// Poll for completion
	const startTime = Date.now();
	let runId: string | null = null;
	
	while (Date.now() - startTime < pollingTimeout * 1000) {
		// Check task status
		const statusResponse = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'cambaiApi',
			{
				method: 'GET',
				url: `https://client.camb.ai/apis/dub/${taskId}`,
				json: true,
			}
		);

		const status = statusResponse.status;
		
		if (status === 'SUCCESS') {
			runId = statusResponse.run_id;
			break;
		} else if (status === 'ERROR') {
			throw new Error(`Dubbing task failed with error status`);
		} else if (status === 'TIMEOUT') {
			throw new Error(`Dubbing task timed out on server`);
		} else if (status === 'PAYMENT_REQUIRED') {
			throw new Error(`Dubbing task failed: Payment required - insufficient credits`);
		}
		
		// Wait before next poll
		await new Promise(resolve => setTimeout(resolve, pollingInterval * 1000));
	}

	if (!runId) {
		throw new Error(`Dubbing task did not complete within ${pollingTimeout} seconds`);
	}
	// Retrieve final dubbing results
	const dubbingResponse = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'cambaiApi',
		{
			method: 'GET',
			url: `https://client.camb.ai/apis/dub-result/${runId}`,
			json: true,
		}
	);

	// Return JSON with the dubbing results
	return items.map(() => ({
		json: {
			taskId,
			runId,
			status: 'SUCCESS',
			outputVideoUrl: dubbingResponse.video_url,
			outputAudioUrl: dubbingResponse.audio_url,
			transcript: dubbingResponse.transcript,
			transcriptLength: dubbingResponse.transcript?.length || 0
		}
	}));
}