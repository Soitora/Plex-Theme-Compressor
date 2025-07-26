# Plex Theme Compressor

A modern Node.js web app to compress MP3 files, fetch movie/show artwork from TMDB, and tag your audio with metadata — optimized for Plex libraries.

## ✨ Features

- **Web Interface**: Beautiful, responsive UI with real-time progress feedback
- **MP3 Compression**: Select quality from 64–256 kbps using built-in FFmpeg
- **TMDB Integration**: Fetch cover art using TMDB ID or title search
- **Movie & TV Support**: Separate handling for movies and TV series
- **Metadata Embedding**: Override title, artist, album with custom values
- **Smart Downloads**: Files download as "theme.mp3" ready for Plex
- **No Dependencies**: Built-in FFmpeg, no system installation required
- **Docker Ready**: Fully containerized for easy deployment

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** package manager ([Install pnpm](https://pnpm.io/installation))

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/Soitora/Plex-Theme-Compressor.git
cd Plex-Theme-Compressor

# Install dependencies
pnpm install
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```bash
# Copy the example file (if it exists)
cp .env.example .env

# Or create manually
echo "TMDB_API_KEY=your_api_key_here" > .env
```

**Getting a TMDB API Key (Optional):**
1. Visit [The Movie Database](https://www.themoviedb.org/)
2. Create a free account
3. Go to Settings → API → Request API Key
4. Choose "Developer" and fill out the form
5. Add your API key to the `.env` file

**Note:** The app works without a TMDB API key, but cover art will be disabled.

### 4. Run the Application

```bash
# Development mode (with auto-reload)
pnpm run dev

# Production mode
pnpm start
```

Open your browser to `http://localhost:3000`

## 🎯 Usage

1. **Upload MP3**: Select your audio file
2. **Choose Quality**: Pick compression bitrate (64k-256k)
3. **Add Cover Art** (optional):
   - **TMDB ID**: More accurate (e.g., `157336` for Interstellar)
   - **Title Search**: Fallback option (e.g., "Interstellar")
   - **Type**: Select Movie or TV Series
4. **Override Metadata** (optional): Custom title, artist, album
5. **Process**: Click "Compress & Tag" and watch progress
6. **Download**: File saves as "theme.mp3"

## 🐳 Docker Deployment

```bash
# Build the image
docker build -t plex-theme-compressor .

# Run with TMDB API key
docker run -p 3000:3000 -e TMDB_API_KEY=your_key_here plex-theme-compressor

# Run without TMDB (cover art disabled)
docker run -p 3000:3000 plex-theme-compressor
```

## 🔧 Technical Stack

- **ES6 Modules**: Modern JavaScript with import/export
- **pnpm**: Fast, efficient package management
- **Express.js**: Lightweight web server
- **Fluent-FFmpeg**: Built-in audio compression (no system FFmpeg needed)
- **Node-ID3**: MP3 metadata embedding
- **Bootstrap 5**: Responsive UI framework
- **TMDB API**: Movie/TV show artwork integration

## 📁 Project Structure

```
Plex-Theme-Compressor/
├── server.js          # Express server with compression logic
├── public/
│   └── index.html     # Web interface
├── package.json       # Dependencies and scripts
├── Dockerfile         # Container configuration
├── .env              # Environment variables (create this)
└── README.md         # This file
```

## 🎵 Perfect for Plex

This tool creates optimized theme music files for Plex media libraries:
- Compressed for smaller file sizes
- Embedded metadata for proper identification
- Cover art from TMDB for visual appeal
- Consistent "theme.mp3" naming for Plex recognition
