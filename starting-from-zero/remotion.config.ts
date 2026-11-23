import {Config} from '@remotion/cli/config';

// Rendering defaults for the Starting From Zero series.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setCrf(18);
Config.setOverwriteOutput(true);
Config.setEntryPoint('src/index.ts');

// Optional: use an already-installed Chrome/Chromium instead of letting
// Remotion download its own. Most people can ignore this.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
