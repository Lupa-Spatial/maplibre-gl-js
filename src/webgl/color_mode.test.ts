import {expect, test} from 'vitest';
import {Context} from './context.ts';
import {ColorMode} from './color_mode.ts';
import {createNullGL} from '../util/test/null_gl.ts';

test('uses additive and screen blending with premultiplied alpha', () => {
    const gl = createNullGL();
    const context = new Context(gl);
    context.setColorMode(ColorMode.lighter);
    expect(context.blendFunc.get()).toEqual([gl.ONE, gl.ONE]);
    context.setColorMode(ColorMode.screen);
    expect(context.blendFunc.get()).toEqual([gl.ONE, gl.ONE_MINUS_SRC_COLOR]);
});
