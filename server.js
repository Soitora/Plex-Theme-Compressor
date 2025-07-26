// server.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import axios from "axios";
import ID3Writer from "node-id3";
import * as mm from "music-metadata";
import tmp from "tmp-promise";
import dotenv from "dotenv";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

dotenv.config();

// Configure ffmpeg to use the bundled binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const app = express();
const storage = multer.memoryStorage();
const upload = multer({ storage });
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Endpoint to check TMDB API key status
app.get("/api/tmdb-status", (req, res) => {
    res.json({ 
        configured: !!process.env.TMDB_API_KEY,
        message: process.env.TMDB_API_KEY ? "TMDB API key is configured" : "TMDB API key not configured"
    });
});

app.post("/compress", upload.single("mp3file"), async (req, res) => {
    const quality = req.body.quality || "128k";
    const tmdbTitle = req.body.tmdbTitle;
    const tmdbId = req.body.tmdbId;
    const tmdbType = req.body.tmdbType || "movie"; // movie or tv
    const metadataOverrides = {
        title: req.body.title,
        artist: req.body.artist,
        album: req.body.album
    };

    console.log(`Processing MP3 compression with quality: ${quality}`);
    
    if (!req.file) {
        console.error("No file uploaded");
        return res.status(400).send("No MP3 file uploaded.");
    }

    try {
        const tmpInput = await tmp.file({ postfix: ".mp3" });
        const tmpOutput = await tmp.file({ postfix: "-compressed.mp3" });

        fs.writeFileSync(tmpInput.path, req.file.buffer);
        console.log("Temporary files created, starting compression...");

        console.log("Starting ffmpeg compression with fluent-ffmpeg...");

        ffmpeg(tmpInput.path)
            .audioBitrate(quality.replace('k', ''))
            .audioCodec('libmp3lame')
            .format('mp3')
            .on('start', (commandLine) => {
                console.log('FFmpeg command:', commandLine);
            })
            .on('progress', (progress) => {
                console.log('Processing: ' + progress.percent + '% done');
            })
            .on('end', async () => {
                console.log("Compression completed, processing metadata...");

                try {
                    let coverUrl = null;
                    
                    // Try to fetch cover art if TMDB data is provided and API key exists
                    if ((tmdbId && tmdbId.trim()) || (tmdbTitle && tmdbTitle.trim())) {
                        try {
                            if (tmdbId && tmdbId.trim()) {
                                coverUrl = await fetchTMDBPosterById(tmdbId, tmdbType);
                            } else {
                                coverUrl = await fetchTMDBPosterByTitle(tmdbTitle, tmdbType);
                            }
                            console.log("Cover art fetched successfully");
                        } catch (err) {
                            console.warn("Could not fetch cover art:", err.message);
                            // Continue without cover art
                        }
                    }

                    await updateMetadata(tmpOutput.path, coverUrl, metadataOverrides);
                    console.log("Metadata updated successfully");

                    res.download(tmpOutput.path, "theme.mp3", (downloadError) => {
                        if (downloadError) {
                            console.error("Download error:", downloadError);
                        }
                        // Clean up temporary files
                        fs.unlinkSync(tmpInput.path);
                        fs.unlinkSync(tmpOutput.path);
                        console.log("Temporary files cleaned up");
                    });
                } catch (err) {
                    console.error("Metadata processing error:", err);
                    fs.unlinkSync(tmpInput.path);
                    fs.unlinkSync(tmpOutput.path);
                    res.status(500).send("Metadata update failed: " + err.message);
                }
            })
            .on('error', (error) => {
                console.error("FFmpeg compression error:", error);
                fs.unlinkSync(tmpInput.path);
                if (fs.existsSync(tmpOutput.path)) fs.unlinkSync(tmpOutput.path);
                res.status(500).send("Compression failed: " + error.message);
            })
            .save(tmpOutput.path);
    } catch (err) {
        console.error("Temp file error:", err);
        res.status(500).send("Internal server error: " + err.message);
    }
});

async function fetchTMDBPosterById(id, type = "movie") {
    const apiKey = process.env.TMDB_API_KEY;
    
    if (!apiKey) {
        throw new Error("TMDB API key not configured. Set TMDB_API_KEY environment variable.");
    }
    
    console.log(`Fetching TMDB ${type} by ID: ${id}`);
    const url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}`;
    
    try {
        const res = await axios.get(url);
        if (!res.data.poster_path) {
            throw new Error(`TMDB ${type} ID "${id}" has no poster.`);
        }
        return `https://image.tmdb.org/t/p/w500${res.data.poster_path}`;
    } catch (error) {
        if (error.response) {
            throw new Error(`TMDB API error: ${error.response.status} - ${error.response.statusText}`);
        }
        throw error;
    }
}

async function fetchTMDBPosterByTitle(title, type = "movie") {
    const apiKey = process.env.TMDB_API_KEY;
    
    if (!apiKey) {
        throw new Error("TMDB API key not configured. Set TMDB_API_KEY environment variable.");
    }
    
    console.log(`Searching TMDB ${type} for: ${title}`);
    const url = `https://api.themoviedb.org/3/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(title)}`;
    
    try {
        const res = await axios.get(url);
        if (!res.data.results.length || !res.data.results[0].poster_path) {
            throw new Error(`TMDB ${type} "${title}" not found or has no poster.`);
        }
        return `https://image.tmdb.org/t/p/w500${res.data.results[0].poster_path}`;
    } catch (error) {
        if (error.response) {
            throw new Error(`TMDB API error: ${error.response.status} - ${error.response.statusText}`);
        }
        throw error;
    }
}

async function updateMetadata(filePath, coverUrl, metadataOverrides = {}) {
    const tags = {
        title: metadataOverrides.title || "",
        artist: metadataOverrides.artist || "",
        album: metadataOverrides.album || ""
    };

    // Only add cover art if we have a valid URL
    if (coverUrl) {
        try {
            console.log("Downloading cover image...");
            const coverImage = await axios.get(coverUrl, { responseType: "arraybuffer" });
            tags.APIC = {
                mime: "image/jpeg",
                type: {
                    id: 3,
                    name: "front cover"
                },
                description: "Cover",
                imageBuffer: Buffer.from(coverImage.data)
            };
            console.log("Cover image embedded successfully");
        } catch (error) {
            console.warn("Failed to download/embed cover image:", error.message);
            // Continue without cover art
        }
    } else {
        console.log("No cover art to embed");
    }

    ID3Writer.write(tags, filePath);
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`TMDB API Key configured: ${process.env.TMDB_API_KEY ? "Yes" : "No"}`);
});
