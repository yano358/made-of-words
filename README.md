# Made of Words

A retro TV in your browser. It cuts you out of your webcam feed and fills your silhouette with the words you speak, live. Your fingertips throw characters across the screen. Pick one of four TV styles, or design your own, then record up to 3 minutes and download the clip.

Everything runs locally and offline after a one-time download. Your camera and voice never leave your machine.

- **Moonshine Base** (Moonshine AI): speech to text
- **MediaPipe Selfie Segmenter** (Google): finds you in the frame
- **MediaPipe Hand Landmarker** (Google): tracks your hands

## Run it

```bash
npm install
npm run fetch-assets   # one-time download of the models and libraries (~107 MB, git-ignored)
npm run dev            # http://localhost:8787
```

Press **Power** and allow camera and microphone access. Speech recognition needs about 30 s to warm up the first time.

## Credits

The idea and the original demo code come from [Live Captions on Your Laptop](https://claude.ai/artifact/E8PpubxbXAMFGSoMR9PdTK) by Kem, Glitch Cat Club. This project wraps that demo in a React app and adds the TV, its styles and recording.

The code in this repository was written with AI (Claude Code).
