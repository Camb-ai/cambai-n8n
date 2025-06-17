import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CambAIApi implements ICredentialType {
	name = 'cambaiApi';
	displayName = 'CambAI API';
	documentationUrl = 'https://docs.camb.ai/introduction';
	properties: INodeProperties[] = [
		{
			displayName: 'CambAI API Key',
			name: 'xApiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your CambAI API key. You can find this in your CambAI dashboard.',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.xApiKey}}',
				"Accept": "application/json",
			},
		},
	};

	test: ICredentialTestRequest | undefined = {
		request: {
			baseURL: 'https://client.camb.ai/apis',
			url: '/list-voices',
		},
	};
}