# CambAI n8n Community Node

![CambAI](https://img.shields.io/badge/CambAI-AI%20Dubbing-blue)
![n8n](https://img.shields.io/badge/n8n-Community%20Node-green)
![License](https://img.shields.io/badge/license-MIT-blue)

This is an n8n community node that integrates with [CambAI](https://camb.ai), an AI-powered voice translation and dubbing platform.

## Features

- **Text-to-Speech**: Convert text to natural-sounding speech in 140+ languages
- **Dubbing Status**: Check the status and retrieve results of dubbing jobs
- **Multi-language Support**: Support for various target languages and voice options

## Installation

### Community Nodes (Self-Hosted)

1. Open your n8n instance
2. Go to Settings > Community Nodes
3. Install the package: `@cambai/n8n-nodes-cambai`

### Manual Installation

```bash
# In your n8n custom nodes directory
npm install @cambai/n8n-nodes-cambai
```

## Credentials Setup

1. Sign up for a [CambAI account](https://camb.ai)
2. Generate an API key from your dashboard
3. In n8n, create new credentials:
   - **Type**: CambAI API
   - **API Key**: Your CambAI API key

## Operations

### Speech Operations

#### Text to Speech
Convert text into natural-sounding audio in multiple languages.

**Parameters:**
- **Text**: The text to convert to speech
- **Target Language**: Language code (e.g., `en-US`, `es-MX`, `fr-FR`)
- **Voice ID** (optional): Specific voice ID for synthesis

**Output:** Audio file in MP3 format

### Dubbing Operations

#### Get Dubbed Audio
Retrieve the status and result of a dubbing job.

**Parameters:**
- **Job ID**: The ID of the dubbing job to check

**Output:** JSON object with job status and result URLs

## Example Workflows

### Basic Text-to-Speech
1. Add a **CambAI** node
2. Select **Speech** > **Text to Speech**
3. Enter your text and target language
4. Execute to get audio output

### Dubbing Status Check
1. Add a **CambAI** node  
2. Select **Dubbing** > **Get Dubbed Audio**
3. Enter the job ID from a previous dubbing request
4. Execute to get status and download URLs

## API Reference

This node uses the CambAI API v1. For detailed API documentation, visit [CambAI API Docs](https://docs.camb.ai/introduction).

## Contributing

This is an open-source project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[MIT](LICENSE)

## Support

- [CambAI Documentation](https://docs.camb.ai/)
- [n8n Community](https://community.n8n.io/)
- [GitHub Issues](https://github.com/cambai/n8n-nodes-cambai/issues)