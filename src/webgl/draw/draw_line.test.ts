import {expect, test} from 'vitest';
import {Painter} from '../../render/painter.ts';
import {FrameRenderContext} from '../../render/frame_render_context.ts';
import {createMercatorTransform} from '../../geo/projection/mercator_transform.ts';
import {LineStyleLayer} from '../../style/style_layer/line_style_layer.ts';
import {EvaluationParameters} from '../../style/evaluation_parameters.ts';
import {createFrameRenderData} from '../../util/test/util.ts';
import {createNullGL} from '../../util/test/null_gl.ts';
import {drawLine} from './draw_line.ts';

test('restores the render target for an empty blended line layer', () => {
    const painter = new Painter(createNullGL());
    const transform = createMercatorTransform();
    transform.resize(128, 128);
    const frame = new FrameRenderContext({transform, terrain: null, data: createFrameRenderData(), context: painter.context, programCache: painter.programCache, currentPass: 'translucent', projection: null});
    const layer = new LineStyleLayer({id: 'line', type: 'line', source: 'source', paint: {'line-layer-blend': 'multiply'}}, {});
    layer.recalculate(new EvaluationParameters(0), []);
    const target = painter.context.gl.createFramebuffer();
    painter.context.bindFramebuffer.set(target);
    painter.context.viewport.set([0, 0, 128, 128]);

    drawLine(painter, null, layer, [], frame);

    expect(painter.context.bindFramebuffer.get()).toBe(target);
    expect(painter.context.viewport.get()).toEqual([0, 0, 128, 128]);
    painter.destroy();
});
