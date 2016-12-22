/*
 * 360 Panoramas by Roy Curtis
 * Licensed under MIT, 2015
 */

/** Global namespace for Panorama-related methods */
var Panorama = {};

/** Tracks all created panoramas */
Panorama.panos = [];

/** Creates a panorama using the HTML element of the given selector */
Panorama.create = function(selector)
{
    var pano = {};

    /** DOM element of this panorama */
    pano.element = document.querySelector(selector);
    /** List of slides this panorama contains */
    pano.slides  = Panorama.getSlides(pano.element);
    /** Whether this panorama is currently being grabbed by the user */
    pano.grabbed = false;
    /** Index of current slide displayed by this panorama */
    pano.current = 0;
    /** Current energy (velocity) of this panorama */
    pano.energy  = -1;
    /** Current scroll position of this panorama */
    pano.scroll  = 0;
    /** Last X coordinate from user's last input event */
    pano.lastX   = 0;

    // Remove non-JavaScript class from panorama, if present
    pano.element.classList.remove("no-js");

    /** Scrolls this panorama for one frame */
    pano.draw = function()
    {
        if (pano.energy < -1 || pano.energy > 1)
            pano.energy *= 0.9;
        else
            pano.energy  = -1;

        if (pano.grabbed) return;

        pano.scroll += pano.energy;

        // Reset scroll when it eventually gets very large
        if (pano.scroll > 1e6 || pano.scroll < -1e6)
            pano.scroll = 0;

        pano.element.style.backgroundPosition = pano.scroll + 'px 0';
    };

    /** Updates the DOM of this panorama for a slide change */
    pano.update = function()
    {
        var element = pano.element,
            current = pano.slides[pano.current];

        element.style.backgroundImage    = 'url(' + current.src + ')';
        element.style.backgroundRepeat   = 'repeat-x';
        element.style.backgroundPosition = '0px 0px';

        element.querySelector('.title').textContent    = current.title;
        element.querySelector('.subtitle').textContent = current.subtitle;
    };

    /** Changes the slide by a given delta */
    pano.changeBy = function(delta)
    {
        pano.current += delta;

        if      (pano.current < 0)
            pano.current = pano.slides.length - 1;
        else if (pano.current >= pano.slides.length)
            pano.current = 0;

        pano.update();
    };

    pano.onInputDown = function(e)
    {
        pano.lastX = e.touches
            ? e.touches[0].clientX
            : e.clientX;

        pano.grabbed = true;
    };

    pano.onInputUpOrOut = function(e)
    {
        if (!e.touches || e.touches.length == 0)
            pano.grabbed = false;
    };

    pano.onInputMove = function(e)
    {
        if (!pano.grabbed) return;

        var clientX = e.touches
            ? e.touches[0].clientX
            : e.clientX;

        var delta = clientX - pano.lastX;

        pano.energy  = delta;
        pano.scroll += delta;
        pano.lastX   = clientX;
        pano.element.style.backgroundPosition = pano.scroll + "px 0";
    };

    var element = pano.element;

    element.addEventListener('mousedown',   pano.onInputDown);
    element.addEventListener('mouseup',     pano.onInputUpOrOut);
    element.addEventListener('mouseout',    pano.onInputUpOrOut);
    element.addEventListener('mousemove',   pano.onInputMove);
    element.addEventListener('touchstart',  pano.onInputDown);
    element.addEventListener('touchend',    pano.onInputUpOrOut);
    element.addEventListener('touchleave',  pano.onInputUpOrOut);
    element.addEventListener('touchcancel', pano.onInputUpOrOut);
    element.addEventListener('touchmove',   pano.onInputMove);

    element.querySelector('button.prev').onclick = function() { pano.changeBy(-1); };
    element.querySelector('button.next').onclick = function() { pano.changeBy(1);  };

    // Trigger initial update
    pano.update();

    console.log('Created panorama of ' + pano.slides.length + ' slides', pano.element);
    Panorama.panos.push(pano);
};

/**
 * Gets and validates slides defined in a given panorama DOM element
 * @param element DOM element of the panorama
 * @returns {Slide[]} Array of slides
 */
Panorama.getSlides = function(element)
{
    var children = element.getElementsByTagName('slide'),
        slides   = [];

    if (children.length == 0)
        throw new Error('No slides defined in panorama');

    for (var i = 0; i < children.length; i++)
    {
        /** @class Slide */
        var slide = {},
            child = children[i];

        if (!child.attributes['src'])
            throw new Error('No src specified for slide', child);

        /**
         * Image source URL of this slide
         * @type {string}
         */
        slide.src = child.attributes['src'].value;

        /**
         * Title of this slide. If undefined, defaults to blank string.
         * @type {string}
         */
        slide.title    = child.attributes.title
            ? child.attributes.title.value : "";

        /**
         * Subtitle of this slide. If undefined, defaults to blank string.
         * @type {string}
         */
        slide.subtitle = child.attributes.subtitle
            ? child.attributes.subtitle.value : "";

        slides.push(slide);
    }

    return slides;
};

Panorama.loop = function()
{
    for (var i = 0; i < Panorama.panos.length; i++)
        Panorama.panos[i].draw();

    window.requestAnimationFrame(Panorama.loop);
};