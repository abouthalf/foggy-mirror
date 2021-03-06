import Stackblur from 'stackblur-canvas';
import getUserMedia from 'get-user-media-promise';

import {ohNo} from './lib/messages';

import './index.less';
import brushSrc from './circle.png';

/**
 * Get an element
 * @param {string} sel 
 * @returns {HTMLElement}
 */
let $ = (sel) => document.querySelector(sel);

/**
 * Make an element
 * @param {string} el
 * @returns {HTMLElement} 
 */
let el = (el) => document.createElement(el);

// Get / Make DOM elements

/** @type {HTMLElement} */
const container = $('#mirror');

/** @type {HTMLCanvasElement} */
const stage = $('#stage');
/** @type {CanvasRenderingContext2D} */
const stageCtx = stage.getContext('2d');

/** @type {HTMLCanvasElement} */
const fog = el('canvas');
/** @type {CanvasRenderingContext2D} */
const fogCtx = fog.getContext('2d');

/** @type {HTMLCanvasElement} */
const drawing = el('canvas');
/** @type {CanvasRenderingContext2D} */
const drawingCtx = drawing.getContext('2d');

/** @type {HTMLCanvasElement} */
const brush = el('canvas');
/** @type {CanvasRenderingContext2D} */
const brushCtx = brush.getContext('2d');

/** @type {HTMLCanvasElement} */
const clean = el('canvas');
/** @type {CanvasRenderingContext2D} */
const cleanCtx = clean.getContext('2d');

/** @type {HTMLVideoElement} */
const vid = $('video');

/**
 * Debugging Canvases?
 */
const DEBUG = global.location.search.indexOf('debug') > -1;
if (DEBUG) {
    document.body.appendChild(drawing);
    document.body.appendChild(clean);
}

// constants and state
const blur = 35;
const brushSize = 50;
const constraints = {
    video: {facingMode: 'user'}
}
let isDrawing = false;

// load a brush to draw with
let brushImg = new Image();
brushImg.onload = e => {
    brush.width = brushSize;
    brush.height = brushSize;
    brushCtx.drawImage(brushImg, 0, 0);
};
brushImg.src = brushSrc;

// Do work
getUserMedia(constraints).then(mediaStrem => {
    vid.srcObject = mediaStrem;
    vid.addEventListener('play', e => {
        setCanvasToVideoDimensions(vid, stage, fog, drawing, clean);
        mirrorCanvas(fogCtx);
        mirrorCanvas(cleanCtx);
        attachEvents(stage);
        (function loop() {
            if (!vid.paused && !vid.ended) {
                // apply effects and coposite
                captureCleanVideo(vid, cleanCtx);
                blurVideo(vid, fogCtx);
                applyDrawingToCleanVideo(drawingCtx, cleanCtx);
                composite(stageCtx, fog, clean);
                setTimeout(loop, 1000 / 30); // drawing at 30fps
            }
        })();
    });
    vid.onloadedmetadata = e => {
        vid.play();
    };
}).catch(err => {
    // hide vid, show error
    showErrorMsg();
    console.log(err);
});

/**
 * Add an error message, hide the video container
 */
function showErrorMsg() {
    let div = el('div');
    div.className = 'content oh-no';
    div.innerHTML = ohNo;
    container.parentNode.insertBefore(div, container);
    container.setAttribute('hidden', 'hideen');
}

/**
 * Using video as a guide, set dim on all provided canvases
 * @param {HTMLVideoElement} video 
 * @param {HTMLCanvasElement[]]} canvases 
 */
function setCanvasToVideoDimensions(video, ...canvases) {
    let w = video.videoWidth;
    let h = video.videoHeight;
    canvases.forEach(c => {
        c.width = w;
        c.height = h;
    })
}

/**
 * Flip it!
 * @param {CanvasRenderingContext2D} ctx 
 */
function mirrorCanvas(ctx) {
    ctx.translate(ctx.canvas.width, 0);
    ctx.scale(-1, 1);
}

/**
 * Blur it
 * @param {HTMLVideoElement} video 
 * @param {HTMLCanvasElement} canvas 
 * @param {CanvasRenderingContext2D} ctx 
 */
function blurVideo(video, ctx) {
    ctx.drawImage(video, 0, 0);
    Stackblur.canvasRGB(ctx.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height, blur);
}

/**
 * Drop clean video into clean canvas
 * @param {HTMLVideoElement} video
 * @param {CanvasRenderingContext2D} cleanCtx 
 */
function captureCleanVideo(video, cleanCtx) {
    let w = cleanCtx.canvas.width;
    let h = cleanCtx.canvas.height;
    cleanCtx.drawImage(video, 0, 0, w, h);
}

/**
 * Copy alpha channel from drawing to clean video
 * @param {CanvasRenderingContext2D} drawingCtx 
 * @param {CanvasRenderingContext2D} cleanCtx 
 */
function applyDrawingToCleanVideo(drawingCtx, cleanCtx) {
    let w = drawingCtx.canvas.width;
    let h = drawingCtx.canvas.height;
    /** @type ImageData */
    let drawingImageData = drawingCtx.getImageData(0,0,w,h);
    /** @type ImageData */
    let cleanImageData = cleanCtx.getImageData(0,0,w,h);
    // copy alpha channel from drawing to clean video data
    drawingImageData.data.forEach((v,i) => {
        let a = i + 1;
        if (a % 4 === 0) {
            cleanImageData.data[i] = drawingImageData.data[i];
        }
    });
    cleanCtx.putImageData(cleanImageData, 0, 0);
}

/**
 * Composite layers into context in order of params
 * @param {CanvasRenderingContext2D} stageCtx 
 * @param {HTMLCanvasElement[]} layers 
 */
function composite(stageCtx, ...layers) {
    layers.forEach(l => {
        stageCtx.drawImage(l, 0, 0);
    });
}

/**
 * Try to determine the coordinates of a mouse event on an element
 * @param {UIEvent} e 
 * @param {HTMLElement} el 
 */
function coords(e, el) {
    return {
        x: e.layerX || e.pageX - el.offsetLeft,
        y: e.layerY || e.pageY - el.offsetTop
    }
}

/**
 * Get coords - place brush mark at same
 * @param {Event} e 
 * @param {HTMLElement} el 
 */
function doBrush(e, el) {
    let xy = coords(e, el);
    let x = xy.x - (brushSize / 2);
    let y = xy.y -  - (brushSize / 2);
    drawingCtx.drawImage(brush, xy.x, xy.y);
}

/**
 * Add touch / mouse events to target
 * @param {HTMLElement} target 
 */
function attachEvents(target) {
    let touch = false;
    try {
        document.createEvent("TouchEvent");  
        touch = true;
    } catch(e) {
        touch = false;
    }
    if (touch) {
        target.addEventListener('touchstart', onDown);
        target.addEventListener('touchend', onUp);
        target.addEventListener('touchcancel', onUp);
        target.addEventListener('touchmove', onMove);
        return;
    }
    target.addEventListener('mousemove', onMove);
    target.addEventListener('mousedown', onDown);
    target.addEventListener('mouseup', onUp);
    target.addEventListener('mouseout', onUp);
    target.addEventListener('mouseleave', onUp);
}

/**
 * Draw
 * @param {Event} e 
 */
function onMove(e) {
    if (isDrawing) {
        doBrush(e, this);
    }
    e.preventDefault();
}

/**
 * Pen down
 * @param {Event} e 
 */
function onDown(e) {
    isDrawing = true;
    e.preventDefault();
}

/**
 * Pen up
 * @param {Event} e 
 */
function onUp(e) {
    isDrawing = false;
    e.preventDefault();
}