# Flame Education

Ignite the spark of learning, pass on the torch of civilization.

## Introduction

### Vision & Story

If one day human civilization faces a catastrophic event, and survivors need to rebuild their homes and repopulate on new lands, who will be their teacher? Who will pass down the wisdom accumulated by humanity over thousands of years?

That teacher might no longer be human, but **Artificial Intelligence**.

**Flame Education** was born from this humanistic vision. We aim to create an intelligent education system capable of operating independently even in extreme environments. When humanity faces a scarcity of educational resources, this project can serve as the unextinguished bonfire, passing down knowledge efficiently and accurately to the next generation through AI tutors, voice interaction, and holographic knowledge graphs.

We are dedicated to using existing cutting-edge technology to ensure that knowledge acquisition is no longer limited by the availability of teachers or geography, allowing everyone equal access to the highest quality educational resources.

### Core Model

This project adopts a "Open Source Frontend + Containerized Backend" model:
*   **Frontend**: Fully open source, transparent, and customizable.
*   **Backend**: Core services are encapsulated in Docker containers, free for personal use, and ready to use out of the box.

## License

The project (including code, documentation, and container images) is subject to the following license:

*   ✅ **Free for Personal Use**: You may download, install, and run this project for personal learning, research, or non-profit purposes for free.
*   🚫 **Commercial Use Prohibited**: Unauthorized commercial use (including but not limited to selling software, providing paid services, enterprise deployment, etc.) is strictly prohibited.

## Supported Service Providers

We are committed to integrating the world's most advanced AI models to provide you with the best experience. Below is the list of currently supported and planned service providers:

### LLM

| Provider         | Supported |
|:-----------------------| :--- |
| **Google Gemini**      | ✅ |
| **Doubao**    | ✅ |
| **OpenAI (GPT)**       | ✅ |
| **OneApi**             | ✅ |
| **Anthropic (Claude)** | ❌ (Planned) |
| **DeepSeek**           | ❌ (Planned) |

### ASR

| Provider | Supported |
| :--- | :--- |
| **Google Gemini** | ✅ |
| **Doubao** | ✅ |
| **OpenAI Whisper** | ❌ (Planned) |

### TTS

| Provider | Supported |
| :--- | :--- |
| **Doubao** | ✅ |
| **Microsoft Azure** | ✅ |
| **ElevenLabs** | ❌ (Planned) |
| **OpenAI TTS** | ❌ (Planned) |

### Image Gen

| Provider | Supported |
| :--- | :--- |
| **SiliconFlow (FLUX)** | ✅ |
| **Google Imagen** | ✅ |
| **Doubao** | ✅ |
| **Midjourney** | ❌ (Planned) |
| **DALL-E 3** | ❌ (Planned) |

## Key Features

*   **AI Intelligent Tutor**: Provides AI tutors with different personalities and teaching styles for interactive teaching through natural language.
*   **Intelligent Course Generation**: Built-in powerful course generation tool. Just enter a topic (e.g., "Quantum Mechanics", "Roman History"), and it will automatically generate a complete course syllabus and content via LLM.
*   **Real-time Voice Interaction**: Supports high-precision Automatic Speech Recognition (ASR) and Text-to-Speech (TTS), making the learning process as natural and smooth as a face-to-face conversation.
*   **Intelligent Mind Map**: Real-time analysis of dialogue content to automatically generate a course knowledge graph, helping students build a clear and visual knowledge system.
*   **Rich Course Ecosystem**: Supports various course forms, covering everything from basic theory to practical exercises.
*   **Powerful Admin Panel**: Comprehensive course scheduling, user management, and data analysis functions.

## How to Learn

In **Flame Education**, learning is no longer boring reading, but a journey of exploration:

1.  **Set a Goal**: Tell the system what you want to learn, or use the "Course Generation" feature to create a new topic directly.
2.  **Interactive Exploration**: Talk to the AI tutor. The tutor will explain knowledge points according to your progress. You can interrupt, ask questions, or ask for examples at any time.
3.  **Visual Construction**: During the learning process, the mind map on the right will grow in real-time, helping you connect scattered knowledge points into a network.
4.  **Review & Consolidate**: After the course, you can review the generated knowledge graph to ensure that every knowledge point has been mastered.

## Tech Stack

*   **Core Framework**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **UI Library**: [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) + [Shadcn/ui](https://ui.shadcn.com/)
*   **State Management**: React Context + Hooks
*   **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/) (VS Code core)
*   **Voice Tech**: Silero VAD (On-device Voice Activity Detection) + Web Audio API

## Quick Start

### Method 1: As a User/Explorer (Docker One-Click Deployment)

If you just want to quickly experience the full features of Flame Education without configuring the development environment, simply run our provided Docker image.

```bash
# Pull and run the complete image (Frontend + Backend)
docker run -d \
  --name flame-education \
  -p 8080:80 \
  -v /your/host/storage/path:/app/storage \
  -e PG_DB=flame-education \
  -e PG_HOST=127.0.0.1 \
  -e PG_PASSWORD=passwd \
  -e PG_PORT=5432 \
  -e PG_USERNAME=flame-education \
  -e STORAGE_DIR=/app/storage \
  flameeducation/flame-education:latest
```

### Environment Variables

| Variable | Default | Description |
|:-----------------|:-----------------|:-------------------|
| `PG_DB` | `flame-education` | PostgreSQL database name |
| `PG_HOST` | `127.0.0.1` | PostgreSQL server address |
| `PG_PASSWORD` | `passwd` | PostgreSQL password |
| `PG_PORT` | `5432` | PostgreSQL port |
| `PG_USERNAME` | `flame-education` | PostgreSQL username |
| `STORAGE_DIR` | `/app/storage` | Storage directory path |

**Note**: Please modify these environment variable values according to your actual environment. The container internally uses `/app/storage` as the storage directory mapping.

**Storage Directory Binding Recommendation**: To prevent data loss due to container reconstruction, it is strongly recommended to bind-mount the container directory `/app/storage` corresponding to `STORAGE_DIR` with the host directory. For example, use the `-v /your/host/storage/path:/app/storage` parameter. This way, even if the container is deleted, the data remains on the host.

After startup, visit `http://localhost` to start learning!

### Method 2: As a Frontend Developer (Contributing)

If you want to participate in frontend development or customize the UI, please follow these steps:

#### 1. Prerequisites
*   Node.js (Recommended v18+)
*   npm or yarn

#### 2. Install Dependencies

```bash
# Install dependencies
npm install
```

#### 3. Start Development Server

```bash
npm run dev
```

#### 4. Backend Connection Config
By default, the development server proxies `/api` requests to local `http://127.0.0.1:8080`.
*   If you are already running the backend service locally via Docker (as in Method 1), no extra configuration is needed.
*   If the backend service is running at a different address, please modify the `server.proxy` configuration in `vite.config.ts`.

## Contributing

We warmly welcome community developers to participate in the frontend construction of **Flame Education**! Whether it's fixing bugs, optimizing UI, or submitting new features, every submission makes this project better.

1.  Fork this repository
2.  Create your feature branch: `git checkout -b feature/AmazingFeature`
3.  Commit your changes: `git commit -m 'Add some AmazingFeature'`
4.  Push to the branch: `git push origin feature/AmazingFeature`
5.  Submit a Pull Request

<div align="center">
  <p>Made with ❤️ by Flame Education Team</p>
</div>