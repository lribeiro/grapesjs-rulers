import Ruler from './ruler';

export default (editor, opts = {}) => {
    const options = {
        ...{
            // default options
            dragMode: 'translate',
            rulerHeight: 15,
            canvasZoom: 94,
            rulerOpts: {
                unit: 'mm',
                dpi: 96
            },
        },
        ...opts
    };

    const cm = editor.Commands;
    const rulH = options.rulerHeight;
    const defaultDragMode = editor.getConfig('dragMode');
    let zoom = options.canvasZoom
    let scale = 100 / zoom;
    // Save original setZoom to restore later
    let _origSetZoom = null;
    let _zoomHandler = null;
    let _zoomChangeHandler = null;
    let rulers;

    cm.add('ruler-visibility', {
        run(editor) {
            !rulers && (rulers = new Ruler({
                container: editor.Canvas.getCanvasView().el,
                canvas: editor.Canvas.getFrameEl(),
                rulerHeight: rulH,
                strokeStyle: 'white',
                fillStyle: 'white',
                cornerIcon: 'fa fa-trash',
                ...options.rulerOpts
            })) && editor.on('canvasScroll frame:scroll change:canvasOffset', () => {
                setOffset();
            });
            editor.Rulers = rulers;
            rulers.api.toggleRulerVisibility(true);
            editor.Canvas.setZoom(zoom);
            editor.setDragMode(options.dragMode);
            setOffset();
            rulers.api.setScale(scale);

            // Override Canvas.setZoom so rulers update automatically
            if (!_origSetZoom && editor.Canvas && typeof editor.Canvas.setZoom === 'function') {
                _origSetZoom = editor.Canvas.setZoom.bind(editor.Canvas);
                editor.Canvas.setZoom = function (newZoom) {
                    // call original
                    const out = _origSetZoom(newZoom);
                    try {
                        zoom = newZoom || editor.Canvas.getZoom();
                        scale = 100 / zoom;
                        // update offsets and rulers
                        setOffset();
                        rulers && rulers.api.setScale(scale);
                    } catch (err) {
                        // ignore - should not crash editor on error
                        console.warn('grapesjs-rulers: failed to update rulers on zoom', err);
                    }
                    return out;
                }
            }

            // Also listen to canvas zoom events if present
            _zoomHandler = () => {
                try {
                    zoom = editor.Canvas.getZoom();
                    scale = 100 / zoom;
                    setOffset();
                    rulers && rulers.api.setScale(scale);
                } catch (err) {}
            };
            editor.on('canvas:zoom', _zoomHandler);
            _zoomChangeHandler = () => {
                try {
                    zoom = editor.Canvas.getZoom();
                    scale = 100 / zoom;
                    setOffset();
                    rulers && rulers.api.setScale(scale);
                } catch (err) {}
            };
            editor.on('change:canvasZoom', _zoomChangeHandler);
        },
        stop(editor) {
            rulers && rulers.api.toggleRulerVisibility(false);
            editor.Canvas.setZoom(100);
            editor.setDragMode(defaultDragMode);
            // restore original Canvas.setZoom if we replaced it
            if (_origSetZoom && editor.Canvas) {
                editor.Canvas.setZoom = _origSetZoom;
                _origSetZoom = null;
            }
            if (_zoomHandler) {
                editor.off('canvas:zoom', _zoomHandler);
                _zoomHandler = null;
            }
            if (_zoomChangeHandler) {
                editor.off('change:canvasZoom', _zoomChangeHandler);
                _zoomChangeHandler = null;
            }
        }
    });

    const setOffset = () => {
        const { top, left } = editor.Canvas.getOffset();
        const scrollX = editor.Canvas.getBody().scrollLeft;
        const scrollY = editor.Canvas.getBody().scrollTop;
        rulers.api.setPos({
            x: left - rulH - scrollX / scale,
            y: top - rulH - scrollY / scale
        });
        rulers.api.setScroll({
            x: scrollX,
            y: scrollY
        });
    }

    cm.add('guides-visibility', {
        run() {
            rulers && rulers.api.toggleGuideVisibility(true);
        },
        stop() {
            rulers && rulers.api.toggleGuideVisibility(false);
        }
    });

    cm.add('get-rulers', () => {
        return rulers;
    });

    cm.add('get-rulers-constructor', () => {
        return Ruler;
    });

    cm.add('clear-guides', () => {
        rulers && rulers.api.clearGuides();
    });

    cm.add('get-guides', () => {
        if (rulers) return rulers.api.getGuides();
        else return 0;
    });

    cm.add('set-guides', (editor, sender, options = {}) => {
        rulers && options.guides && rulers.api.setGuides(options.guides);
    });

    cm.add('set-zoom', (editor, sender, options = {}) => {
        zoom = options.zoom;
        scale = 100 / zoom;
        editor.Canvas.setZoom(zoom);
        setOffset();
        rulers && rulers.api.setScale(scale);
    });

    cm.add('destroy-ruler', () => {
        rulers && rulers.api.destroy();
    });
};