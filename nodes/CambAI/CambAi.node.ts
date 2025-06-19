import { INodeType, INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';
import { SpeechFields, SpeechOperations } from './Descriptions/speech';
import { SoundFields, SoundOperations } from './Descriptions/sound';
import { VoiceFields, VoiceOperations } from './Descriptions/voice';
import { DubbingFields, DubbingOperations } from './Descriptions/dubbing';
import { listSearch } from './Descriptions/utils';

export class CambAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CambAI',
		name: 'cambAi',
		icon: 'file:cambai.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with CambAI API for text-to-speech and voice generation',
		defaults: {
			name: 'CambAI',
		},
		usableAsTool: true,
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'cambaiApi',
				required: true,
			},
		],
		requestDefaults: {
			method: 'POST',
			baseURL: 'https://client.camb.ai/apis',
			headers: {
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Speech',
						value: 'speech',
					},
					{
						name: 'Sound',
						value: 'sound',
					},
					{
						name: 'Voice',
						value: 'voice',
					},
					{
						name: 'Dubbing',
						value: 'dubbing',
					}
				],
				default: 'speech',
			},
			...SpeechOperations,
			...SpeechFields,
			...SoundOperations,
			...SoundFields,
			...VoiceOperations,
			...VoiceFields,
			...DubbingOperations,
			...DubbingFields,
		],
	};

	methods = {
		listSearch,
	};
}