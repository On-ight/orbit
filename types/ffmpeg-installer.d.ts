// @ffmpeg-installer/ffmpeg ships no types — it's a thin wrapper that just
// resolves a platform-specific static ffmpeg binary path.
declare module "@ffmpeg-installer/ffmpeg" {
  const ffmpeg: { path: string; version: string };
  export default ffmpeg;
}
