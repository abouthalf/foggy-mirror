# Foggy Mirror

This is a fun little experiment with HTML5 `MediaDevices` API.

In working browsers it captures video from your device camera, flips it like a mirror, and then fogs it up real good.

You _should_ be able to draw on the “mirror” with your mouse or finger and see clear video beneath.

## Set up and development

Using `yarn` as your package manager...

`yarn install` to install dependencies.

`yarn build` to do a production build

`yarn dev` to run the webpack development server.

## How it do?

This relies on the new-ish HTML5 MediaDevices api which is a _bit_ finicky and may not behave right in your favorite browser. 

Assuming everything up-to-date and happy, this web site will ask permission to use your devices front-facing camera. That video feed is captured in an HTML5 video element. 30 times a second the current frame of video is captured in an HTML5 canvas element where it is mirrored and blurred to create the fogged effect. This image is composited into a "stage" canvas for display on the page.

Touch or mouse events on the stage are translated into drawing on a third canvas. The clean "un-fogged" video is composited into the drawing canvas, so that clean video appears in the areas where the canvas is touched. Lastly the "clean" drawn video is composited into the fogged video to create the foggy mirror effect.