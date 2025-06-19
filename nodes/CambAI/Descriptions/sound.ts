import { IDataObject, IExecuteSingleFunctions, IHttpRequestOptions, IN8nHttpFullResponse, INodeExecutionData, INodeProperties } from "n8n-workflow";

export const SoundOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Generate Sound',
				value: 'textToSound',
				description: 'Generate sound from description',
				action: 'Generate sound from description',
				routing: {
					send: {
						preSend: [ createTTSTask ],
					},
					output: {
						postReceive: [ pollAndRetrieveSound ],
					}
				},
			},
		],
		default: 'textToSound',
		displayOptions: {
			show: {
				resource: ['sound'],
			},
		},
	}
];

export const SoundFields: INodeProperties[] = [
    // Text to Sound Fields
	{
		displayName: 'Prompt',
		description: 'The description of the sound',
		placeholder: 'e.g. ocean waves crashing',
		name: 'text',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['sound'],
				operation: ['textToSound'],
			},
		},
		required: true,
	},
    {
		displayName: 'Duration',
		description: 'The number of seconds the sound has to be played for.',
		placeholder: '5',
		name: 'duration',
		type: 'number',
		default: '5',
		displayOptions: {
			show: {
				resource: ['sound'],
				operation: ['textToSound'],
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
				resource: ['sound'],
				operation: ['textToSound'],
			},
		},
		options: [
			{
				displayName: 'Output Type',
				name: 'outputType',
				description: 'How to retrieve the final audio',
				type: 'options',
				options: [
					{
						name: 'Raw Bytes (FLAC)',
						value: 'raw_bytes',
						description: 'Direct audio file streaming',
					},
					{
						name: 'File URL',
						value: 'file_url',
						description: 'Get a downloadable URL',
					},
				],
				default: 'raw_bytes',
			},
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
				description: 'Maximum time to wait for TTS completion',
				type: 'number',
				default: 120,
				typeOptions: {
					minValue: 30,
					maxValue: 600,
				},
			},
		],
	},
]

// Create TTS task and get task_id
async function createTTSTask(this: IExecuteSingleFunctions, requestOptions: IHttpRequestOptions): Promise<IHttpRequestOptions> {
	const text = this.getNodeParameter('text') as string;
	const duration = this.getNodeParameter('duration') as number;

	const requestBody: IDataObject = {
		prompt: text,
		duration,
	};

	// Override request options for create TTS task
	requestOptions.method = 'POST';
	requestOptions.url = '/text-to-sound';
	requestOptions.body = requestBody;
	requestOptions.json = true;
	
	return requestOptions;
}

// Poll status and retrieve final audio
async function pollAndRetrieveSound(this: IExecuteSingleFunctions, items: INodeExecutionData[], responseData: IN8nHttpFullResponse): Promise<INodeExecutionData[]> {
	const additionalOptions = this.getNodeParameter('additionalOptions', {}) as IDataObject;
	const outputType = (additionalOptions.outputType as string) || 'raw_bytes';
	const pollingTimeout = (additionalOptions.pollingTimeout as number) || 120;
	const pollingInterval = (additionalOptions.pollingInterval as number) || 5;

	// Get task_id from initial response
	const responseBody = responseData.body as any;
	const taskId = responseBody.task_id;
	
	if (!taskId) {
		throw new Error('No task_id received from TTS creation request');
	}

	let runId: string | null = null;
	const startTime = Date.now();

	while (Date.now() - startTime < pollingTimeout * 1000) {
		// Check task status
		const statusResponse = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'cambaiApi',
			{
				method: 'GET',
				url: `https://client.camb.ai/apis/text-to-sound/${taskId}`,
				json: true,
			}
		);

		const status = statusResponse.status;
		
		if (status === 'SUCCESS') {
			runId = statusResponse.run_id;
			break;
		} else if (status === 'ERROR') {
			throw new Error(`TTS task failed with error status`);
		} else if (status === 'TIMEOUT') {
			throw new Error(`TTS task timed out on server`);
		} else if (status === 'PAYMENT_REQUIRED') {
			throw new Error(`TTS task failed: Payment required - insufficient credits`);
		}
		
		// Wait before next poll
		await new Promise(resolve => setTimeout(resolve, pollingInterval * 1000));
	}

	if (!runId) {
		throw new Error(`TTS task did not complete within ${pollingTimeout} seconds`);
	}

	// Retrieve final audio
	const audioRequestOptions: any = {
		method: 'GET',
		url: `https://client.camb.ai/apis/text-to-sound-result/${runId}`,
	};

	if (outputType === 'file_url') {
		audioRequestOptions.qs = { output_type: 'file_url' };
		audioRequestOptions.json = true;
		
		const audioResponse = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'cambaiApi',
			audioRequestOptions
		);

		// Return JSON with URL
		return items.map(() => ({
			json: {
				taskId,
				runId,
				outputType,
				audioUrl: audioResponse.output_url,
				status: 'SUCCESS'
			}
		}));
	} else {
		// raw_bytes - get direct audio stream
		audioRequestOptions.encoding = 'arraybuffer';
		audioRequestOptions.returnFullResponse = true;
		
		const audioResponse = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'cambaiApi',
			audioRequestOptions
		);

		const binaryData = await this.helpers.prepareBinaryData(
			audioResponse.body,
			`cambai_sound_${taskId}.flac`,
			'audio/flac',
		);

		return items.map(() => ({
			json: {
				taskId,
				runId,
				outputType,
				status: 'SUCCESS'
			},
			binary: { ['data']: binaryData }
		}));
	}
}