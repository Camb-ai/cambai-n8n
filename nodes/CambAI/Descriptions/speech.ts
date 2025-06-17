import { IDataObject, IExecuteSingleFunctions, IHttpRequestOptions, IN8nHttpFullResponse, INodeExecutionData, INodeProperties } from "n8n-workflow";

export const SpeechOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Text to Speech',
				value: 'textToSpeech',
				description: 'Converts text into speech using CambAI TTS',
				action: 'Convert text to speech',
				routing: {
					send: {
						preSend: [ createTTSTask ],
					},
					output: {
						postReceive: [ pollAndRetrieveAudio ],
					}
				},
			},
		],
		default: 'textToSpeech',
		displayOptions: {
			show: {
				resource: ['speech'],
			},
		},
	}
];

export const SpeechFields: INodeProperties[] = [
	// Text to Speech Fields
	{
		displayName: 'Voice',
		description: 'Select the voice to use for the conversion',
		name: 'voice',
		type: 'resourceLocator',
		default: { mode: 'list', value: 20303 },
		displayOptions: {
			show: {
				resource: ['speech'],
				operation: ['textToSpeech'],
			},
		},
		modes: [
			{
				displayName: 'From list',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'listVoices',
					searchable: true,
				},
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				placeholder: '20303',
			},
		],
		required: true,
	},
	{
		displayName: 'Text',
		description: 'The text that will get converted into speech',
		placeholder: 'e.g. Hello from CambAI!',
		name: 'text',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['speech'],
				operation: ['textToSpeech'],
			},
		},
		required: true,
	},
	{
		displayName: 'Source Language',
		description: 'Select the source language for the speech synthesis',
		name: 'language',
		type: 'resourceLocator',
		default: { mode: 'list', value: 1 },
		displayOptions: {
			show: {
				resource: ['speech'],
				operation: ['textToSpeech'],
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
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['speech'],
				operation: ['textToSpeech'],
			},
		},
		options: [
			{
				displayName: 'Age',
				name: 'age',
				description: 'Preferred voice age',
				type: 'number',
				default: 30,
				typeOptions: {
					minValue: 18,
					maxValue: 80,
				},
			},
			{
				displayName: 'Gender',
				name: 'gender',
				description: 'Voice gender preference',
				type: 'options',
				options: [
					{
						name: 'Male',
						value: 1,
					},
					{
						name: 'Female',
						value: 2,
					},
				],
				default: 1,
			},
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
			{
				displayName: 'Project Description',
				name: 'projectDescription',
				description: 'Optional project description',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Project Name',
				name: 'projectName',
				description: 'Optional project name for organization',
				type: 'string',
				default: '',
			},
		],
	},
];

// Step 1: Create TTS task and get task_id
async function createTTSTask(this: IExecuteSingleFunctions, requestOptions: IHttpRequestOptions): Promise<IHttpRequestOptions> {
	const text = this.getNodeParameter('text') as string;
	const voiceId = this.getNodeParameter('voice') as number;
	const language = this.getNodeParameter('language') as number;
	const additionalOptions = this.getNodeParameter('additionalOptions', {}) as IDataObject;

	const requestBody: IDataObject = {
		text,
		voice_id: voiceId,
		language,
	};

	// Add optional parameters
	if (additionalOptions.gender) {
		requestBody.gender = additionalOptions.gender;
	}
	if (additionalOptions.age) {
		requestBody.age = additionalOptions.age;
	}
	if (additionalOptions.projectName) {
		requestBody.project_name = additionalOptions.projectName;
	}
	if (additionalOptions.projectDescription) {
		requestBody.project_description = additionalOptions.projectDescription;
	}

	// Override request options for create TTS task
	requestOptions.method = 'POST';
	requestOptions.url = '/tts';
	requestOptions.body = requestBody;
	requestOptions.json = true;
	
	return requestOptions;
}

// Step 2: Poll status and retrieve final audio
async function pollAndRetrieveAudio(this: IExecuteSingleFunctions, items: INodeExecutionData[], responseData: IN8nHttpFullResponse): Promise<INodeExecutionData[]> {
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

	// Poll for completion
	const startTime = Date.now();
	let runId: number | null = null;
	
	while (Date.now() - startTime < pollingTimeout * 1000) {
		// Check task status
		const statusResponse = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'cambaiApi',
			{
				method: 'GET',
				url: `/tts/${taskId}`,
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
		url: `/tts-result/${runId}`,
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
			`cambai_tts_${taskId}.flac`,
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