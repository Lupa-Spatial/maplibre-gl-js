import {describe, expect, test, vi} from 'vitest';
import {Painter} from '../../render/painter.ts';
import {FrameRenderContext} from '../../render/frame_render_context.ts';
import {createMercatorTransform} from '../../geo/projection/mercator_transform.ts';
import {FillStyleLayer} from '../../style/style_layer/fill_style_layer.ts';
import {createFrameRenderData} from '../../util/test/util.ts';
import {createNullGL} from '../../util/test/null_gl.ts';
import {ColorMode} from '../color_mode.ts';
import {drawLayerComposite, prepareDrawLayerComposite} from './draw_layer_composite.ts';

import type {LayerBlend} from './draw_layer_composite.ts';

describe('layer composite', () => {
    test('restores the target and viewport when the layer has no tiles', () => {
        const painter = new Painter(createNullGL());
        const frame = createFrame(painter);
        const layer = new FillStyleLayer({id: 'fill', type: 'fill', source: 'source'}, {});
        const target = painter.context.gl.createFramebuffer();
        painter.context.bindFramebuffer.set(target);
        painter.context.viewport.set([4, 8, 128, 256]);

        const prepared = prepareDrawLayerComposite(painter, null, layer, [], frame);
        drawLayerComposite(painter, 0.5, 'normal', prepared, layer, frame);

        expect(prepared.bounds).toEqual([0, 0, 0, 0]);
        expect(painter.context.bindFramebuffer.get()).toBe(target);
        expect(painter.context.viewport.get()).toEqual([4, 8, 128, 256]);
        painter.destroy();
    });

    test('selects shader and fixed-function blending through the frame context', () => {
        const painter = new Painter(createNullGL());
        const frame = createFrame(painter);
        const layer = new FillStyleLayer({id: 'fill', type: 'fill', source: 'source'}, {});
        const prepared = prepareDrawLayerComposite(painter, null, layer, [], frame);
        prepared.bounds = [0, 0, 128, 128];
        const getProgram = vi.spyOn(painter.programCache, 'getProgram');
        const colorMode = vi.spyOn(painter.context, 'setColorMode');
        const modes: LayerBlend[] = ['normal', 'multiply', 'screen', 'overlay', 'color', 'luminosity', 'lighter'];

        for (const mode of modes) {
            drawLayerComposite(painter, 0.5, mode, prepared, layer, frame);
            const shaderBlend = ['multiply', 'overlay', 'color', 'luminosity'].includes(mode);
            expect(getProgram.mock.lastCall[0].name).toBe('layerComposite');
            expect(getProgram.mock.lastCall[0].defines.includes('#define LAYER_BLEND;')).toBe(shaderBlend);
            expect(colorMode).toHaveBeenLastCalledWith(shaderBlend ? ColorMode.unblended : mode === 'screen' ? ColorMode.screen : mode === 'lighter' ? ColorMode.lighter : ColorMode.alphaBlended);
        }
        painter.destroy();
    });
});

function createFrame(painter: Painter): FrameRenderContext {
    const transform = createMercatorTransform();
    transform.resize(128, 128);
    painter.context.viewport.set([0, 0, 128, 128]);
    return new FrameRenderContext({transform, terrain: null, data: createFrameRenderData(), context: painter.context, programCache: painter.programCache, currentPass: 'translucent', projection: null});
}
