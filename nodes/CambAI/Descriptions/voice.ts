import { IDataObject, IExecuteSingleFunctions, IHttpRequestOptions, IN8nHttpFullResponse, INodeExecutionData, INodeProperties } from "n8n-workflow";

export const VoiceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Text to Voice',
				value: 'textToVoice',
				description: 'Generate voice from text and voice description',
				action: 'Generate voice from text and description',
				routing: {
					send: {
						preSend: [ createTextToVoiceTask ],
					},
					output: {
						postReceive: [ pollAndRetrieveVoice ],
					}
				},
			},
		],
		default: 'textToVoice',
		displayOptions: {
			show: {
				resource: ['voice'],
			},
		},
	}
];

export const VoiceFields: INodeProperties[] = [
	// Text to Voice Fields
	{
		displayName: 'Text',
		description: 'The text content that will be converted into synthesized speech',
		placeholder: 'e.g. Welcome to our application. I will be your guide through all the features...',
		name: 'text',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['voice'],
				operation: ['textToVoice'],
			},
		},
		required: true,
	},
	{
		displayName: 'Voice Description',
		description: 'A detailed description of the desired voice characteristics (minimum 18 words/100+ characters)',
		placeholder: 'e.g. A warm and friendly middle-aged woman with a slight British accent, speaking clearly and professionally with a welcoming tone',
		name: 'voiceDescription',
		type: 'string',
		typeOptions: {
			rows: 6,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['voice'],
				operation: ['textToVoice'],
			},
		},
		required: true,
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['voice'],
				operation: ['textToVoice'],
			},
		},
		options: [
			{
				displayName: 'Polling Interval (Seconds)',
				name: 'pollingInterval',
				description: 'Time between status checks',
				type: 'number',
				default: 5,
				typeOptions: {
					minValue: 1,
					maxValue: 10,
				},
			},
			{
				displayName: 'Polling Timeout (Seconds)',
				name: 'pollingTimeout',
				description: 'Maximum time to wait for voice generation completion',
				type: 'number',
				default: 180,
				typeOptions: {
					minValue: 60,
					maxValue: 600,
				},
			},
		],
	},
];

// Step 1: Create text-to-voice task and get task_id
async function createTextToVoiceTask(this: IExecuteSingleFunctions, requestOptions: IHttpRequestOptions): Promise<IHttpRequestOptions> {
	const text = this.getNodeParameter('text') as string;
	const voiceDescription = this.getNodeParameter('voiceDescription') as string;

	const requestBody: IDataObject = {
		text,
		voice_description: voiceDescription,
	};

	// Override request options for create text-to-voice task
	requestOptions.method = 'POST';
	requestOptions.url = '/text-to-voice';
	requestOptions.body = requestBody;
	requestOptions.json = true;
	
	return requestOptions;
}

// Step 2: Poll status and retrieve final voice URLs
async function pollAndRetrieveVoice(this: IExecuteSingleFunctions, items: INodeExecutionData[], responseData: IN8nHttpFullResponse): Promise<INodeExecutionData[]> {
	const additionalOptions = this.getNodeParameter('additionalOptions', {}) as IDataObject;
	const pollingTimeout = (additionalOptions.pollingTimeout as number) || 180;
	const pollingInterval = (additionalOptions.pollingInterval as number) || 5;

	// Get task_id from initial response
	const responseBody = responseData.body as any;
	const taskId = responseBody.task_id;
	
	if (!taskId) {
		throw new Error('No task_id received from text-to-voice creation request');
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
				url: `https://client.camb.ai/apis/text-to-voice/${taskId}`,
				json: true,
			}
		);

		const status = statusResponse.status;
		
		if (status === 'SUCCESS') {
			runId = statusResponse.run_id;
			break;
		} else if (status === 'ERROR') {
			throw new Error(`Text-to-voice task failed with error status`);
		} else if (status === 'TIMEOUT') {
			throw new Error(`Text-to-voice task timed out on server`);
		} else if (status === 'PAYMENT_REQUIRED') {
			throw new Error(`Text-to-voice task failed: Payment required - insufficient credits`);
		}
		
		// Wait before next poll
		await new Promise(resolve => setTimeout(resolve, pollingInterval * 1000));
	}

	if (!runId) {
		throw new Error(`Text-to-voice task did not complete within ${pollingTimeout} seconds`);
	}

	// Retrieve final voice URLs
	const voiceResponse = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'cambaiApi',
		{
			method: 'GET',
			url: `https://client.camb.ai/apis/text-to-voice-result/${runId}`,
			json: true,
		}
	);

	// Return JSON with the voice preview URLs
	return items.map(() => ({
		json: {
			taskId,
			runId,
			status: 'SUCCESS',
			previews: voiceResponse.previews,
			previewCount: voiceResponse.previews?.length || 0
		}
	}));
}