import { Config } from '@remotion/cli/config';

// jpeg frames render faster than png and are fine for h264 masters.
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(6);
