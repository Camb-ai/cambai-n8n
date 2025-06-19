# CambAI n8n Community Node

![CambAI](https://img.shields.io/badge/CambAI-AI%20Dubbing-blue)
![n8n](https://img.shields.io/badge/n8n-Community%20Node-green)
![License](https://img.shields.io/badge/license-MIT-blue)

This is an n8n community node that integrates with [CambAI](https://camb.ai), an AI-powered voice translation and dubbing platform.

## Features

- **Text-to-Speech**: Convert text to natural-sounding speech with voice and language selection
- **Text-to-Sound**: Generate sound effects from text descriptions  
- **Text-to-Voice**: Create custom voices from text and voice descriptions
- **End-to-End Dubbing**: Dub video/audio content from one language to another
- **Multi-language Support**: Support for 140+ languages with dynamic language loading
- **Voice Management**: Browse and select from available voices

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
Convert text into natural-sounding speech with voice cloning capabilities.

**Parameters:**
- **Text**: The text to convert to speech
- **Voice**: Select from available voices or provide voice ID
- **Source Language**: The language of the input text
- **Additional Options**: Age, gender, project settings, output type (raw bytes/URL)

**Output:** Audio file (FLAC) or download URL

### Sound Operations

#### Generate Sound
Create sound effects from text descriptions.

**Parameters:**
- **Prompt**: Description of the sound to generate (e.g., "ocean waves crashing")
- **Duration**: Length of sound in seconds
- **Additional Options**: Output type, polling settings

**Output:** Audio file (FLAC) or download URL

### Voice Operations

#### Text to Voice
Generate custom voices from text and detailed voice descriptions.

**Parameters:**
- **Text**: The text content for voice synthesis
- **Voice Description**: Detailed description of desired voice characteristics (minimum 18 words)
- **Additional Options**: Polling timeout and interval

**Output:** Array of voice preview URLs

### Dubbing Operations

#### End-to-End Dubbing
Dub video/audio content from one language to another.

**Parameters:**
- **Video URL**: YouTube, Google Drive, or direct media file URLs
- **Source Language**: Original language of the media
- **Target Languages**: Language(s) to dub into (multiple selection supported)
- **Additional Options**: Polling settings for longer processes

**Output:** Dubbed video URL, audio URL, and transcript with timing

## Example Workflows

### Text-to-Speech with Voice Selection
1. Add a **CambAI** node
2. Select **Speech** > **Text to Speech**
3. Enter your text, select voice and language
4. Configure output type (file or URL)
5. Execute to get audio output

### Sound Generation
1. Add a **CambAI** node
2. Select **Sound** > **Generate Sound**
3. Enter sound description and duration
4. Execute to get generated sound

### Custom Voice Creation
1. Add a **CambAI** node
2. Select **Voice** > **Text to Voice**
3. Provide text and detailed voice description
4. Execute to get voice preview URLs

### Video Dubbing
1. Add a **CambAI** node
2. Select **Dubbing** > **End-to-End Dubbing**
3. Enter video URL, source and target languages
4. Execute to get dubbed content (longer processing time)

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