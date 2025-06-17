import { INodeType, INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';
import { SpeechFields, SpeechOperations } from './Descriptions/speech';
import { listSearch } from './Descriptions/utils';

export class CambAI implements INodeType {
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
				],
				default: 'speech',
			},
			...SpeechOperations,
			...SpeechFields,
		],
	};

	methods = {
		listSearch,
	};
}