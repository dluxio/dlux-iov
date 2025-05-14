import { BarController, BarElement, Chart } from 'chart.js';
import { valueOrDefault, isNullOrUndef, clipArea, unclipArea } from 'chart.js/helpers';

// Note: Accessing Chart.defaults directly for plugin/element defaults.

/**
 * This class is based off controller.bar.js from the upstream Chart.js library
 */
class FinancialController extends BarController {

  static overrides = {
    label: '',

    parsing: false,

    hover: {
      mode: 'label'
    },
    animations: {
      numbers: {
        type: 'number',
        properties: ['x', 'y', 'base', 'width', 'open', 'high', 'low', 'close']
      }
    },

    scales: {
      x: {
        type: 'timeseries',
        offset: true,
        ticks: {
          major: {
            enabled: true,
          },
          source: 'data',
          maxRotation: 0,
          autoSkip: true,
          autoSkipPadding: 75,
          sampleSize: 100
        },
      },
      y: {
        type: 'linear'
      }
    },

    plugins: {
      tooltip: {
        intersect: false,
        mode: 'index',
        callbacks: {
          label(ctx) {
            const point = ctx.parsed;

            if (!isNullOrUndef(point.y)) { // direct import
              return Chart.defaults.plugins.tooltip.callbacks.label(ctx);
            }

            const ohlc = point._custom;
            return `${ctx.dataset.label}: O ${ohlc.o} H ${ohlc.h} L ${ohlc.l} C ${ohlc.c} (${ohlc.s || ''} ${ohlc.v || ''})`;
          }
        }
      }
    }
  };

  getLabelAndValue(index) {
    const me = this;
    const meta = me._cachedMeta;
    const iScale = meta.iScale;
    const vScale = meta.vScale;
    const parsed = me.getParsed(index);
    const custom = parsed._custom;
    const {o, h, l, c} = custom;

    const value = `${iScale.getLabelForValue(parsed[iScale.axis])}: O ${o} H ${h} L ${l} C ${c}`;
    return {
      label: meta.label,
      value
    };
  }

  // Adjusted from BarController
  _ruler() {
    const me = this;
    const meta = me._cachedMeta;
    const iScale = meta.iScale;
    const vScale = meta.vScale;
    const opts = iScale.options;
    // Chart.js v4 uses getMinMax() on the scale directly for bounds used in _getResplvedDataLimits
    // For ruler, it seems to use data limits or explicit min/max if set on scale options.
    // This is a simplified version focusing on getting the scale itself.
    // The actual BarController _ruler is more complex and involves _getBounds and _getUserBounds.
    // For now, the critical part is ruler.scale
    return {
      scale: iScale, // Assuming index scale is the primary ruler for financial charts
      // The following are placeholders or simplified values often found in a ruler object.
      // The actual complexity of these might be needed if further issues arise.
      min: iScale.min,
      max: iScale.max,
      minDefined: !isNullOrUndef(iScale.min),
      maxDefined: !isNullOrUndef(iScale.max),
      snapToPixel: true // Usually true for bar-like charts
    };
  }

  getUserBounds(scale) {
    const {min, max, minDefined, maxDefined} = scale.getUserBounds();
    return {
      min: minDefined ? min : Number.NEGATIVE_INFINITY,
      max: maxDefined ? max : Number.POSITIVE_INFINITY
    };
  }

  /**
     * Implement this ourselves since it doesn't handle high and low values
     * https://github.com/chartjs/Chart.js/issues/7328
     * @protected
     */
  getMinMax(scale) {
    const meta = this._cachedMeta;
    const _parsed = meta._parsed;
    const axis = meta.iScale.axis;
    const otherScale = this._getOtherScale(scale);
    const {min: otherMin, max: otherMax} = this.getUserBounds(otherScale);

    if (_parsed.length < 2) {
      return {min: 0, max: 1};
    }

    if (scale === meta.iScale) {
      return {min: _parsed[0][axis], max: _parsed[_parsed.length - 1][axis]};
    }

    const newParsedData = _parsed.filter(({x}) => x >= otherMin && x < otherMax);

    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < newParsedData.length; i++) {
      const data = newParsedData[i];
      min = Math.min(min, data.l);
      max = Math.max(max, data.h);
    }
    return {min, max};
  }

  /**
     * @protected
     */
  calculateElementProperties(index, ruler, reset, options) {
    const me = this;
    const vscale = me._cachedMeta.vScale;
    const base = vscale.getBasePixel();
    const ipixels = me._calculateBarIndexPixels(index, ruler, options);
    // Correctly access chart instance from the controller context
    const data = me.chart.data.datasets[me.index].data[index]; 
    const open = vscale.getPixelForValue(data.o);
    const high = vscale.getPixelForValue(data.h);
    const low = vscale.getPixelForValue(data.l);
    const close = vscale.getPixelForValue(data.c);

    return {
      base: reset ? base : low,
      x: ipixels.center,
      y: (low + high) / 2,
      width: ipixels.size,
      open,
      high,
      low,
      close
    };
  }

  draw() {
    const me = this;
    const chart = me.chart;
    const rects = me._cachedMeta.data;
    clipArea(chart.ctx, chart.chartArea); // direct import
    for (let i = 0; i < rects.length; ++i) {
      rects[i].draw(me._ctx);
    }
    unclipArea(chart.ctx); // direct import
  }

  updateElements(elements, start, count, mode) {
    const me = this;
    const reset = mode === 'reset';
    const {index, _cachedMeta: meta} = me;
    const firstOpts = me.resolveDataElementOptions(index, mode);
    const sharedOptions = me.getSharedOptions(firstOpts);
    const includeOptions = me.includeOptions(mode, sharedOptions);
    const ruler = me._ruler(); // Get the ruler

    me.updateSharedOptions(sharedOptions, mode, firstOpts);

    for (let i = start; i < start + count; i++) {
      const options = sharedOptions || me.resolveDataElementOptions(i, mode);
      // Pass the actual ruler object instead of undefined
      const baseProperties = me.calculateElementProperties(i, ruler, reset, options);
      if (includeOptions) {
        baseProperties.options = options;
      }
      me.updateElement(elements[i], i, baseProperties, mode);
    }
  }
}

/**
 * Helper function to get the bounds of the bar regardless of the orientation
 * @param {Rectangle} bar the bar
 * @param {boolean} [useFinalPosition]
 * @return {object} bounds of the bar
 * @private
 */
function getBarBounds(bar, useFinalPosition) {
  const {x, y, base, width, height} = bar.getProps(['x', 'low', 'high', 'width', 'height'], useFinalPosition);

  let left, right, top, bottom, half;

  if (bar.horizontal) {
    half = height / 2;
    left = Math.min(x, base);
    right = Math.max(x, base);
    top = y - half;
    bottom = y + half;
  } else {
    half = width / 2;
    left = x - half;
    right = x + half;
    top = Math.min(y, base); // use min because 0 pixel at top of screen
    bottom = Math.max(y, base);
  }

  return {left, top, right, bottom};
}

function inRange(bar, x, y, useFinalPosition) {
  const skipX = x === null;
  const skipY = y === null;
  const bounds = !bar || (skipX && skipY) ? false : getBarBounds(bar, useFinalPosition);

  return bounds
        && (skipX || x >= bounds.left && x <= bounds.right)
        && (skipY || y >= bounds.top && y <= bounds.bottom);
}

class FinancialElement extends BarElement {

  static defaults = {
    backgroundColors: {
      up: 'rgba(75, 192, 192, 0.5)',
      down: 'rgba(255, 99, 132, 0.5)',
      unchanged: 'rgba(201, 203, 207, 0.5)',
    },
    borderColors: {
      up: 'rgb(75, 192, 192)',
      down: 'rgb(255, 99, 132)',
      unchanged: 'rgb(201, 203, 207)',
    }
  };

  height() {
    return this.base - this.y;
  }

  inRange(mouseX, mouseY, useFinalPosition) {
    return inRange(this, mouseX, mouseY, useFinalPosition);
  }

  inXRange(mouseX, useFinalPosition) {
    return inRange(this, mouseX, null, useFinalPosition);
  }

  inYRange(mouseY, useFinalPosition) {
    return inRange(this, null, mouseY, useFinalPosition);
  }

  getRange(axis) {
    return axis === 'x' ? this.width / 2 : this.height / 2;
  }

  getCenterPoint(useFinalPosition) {
    const {x, low, high} = this.getProps(['x', 'low', 'high'], useFinalPosition);
    return {
      x,
      y: (high + low) / 2
    };
  }

  tooltipPosition(useFinalPosition) {
    const {x, open, close} = this.getProps(['x', 'open', 'close'], useFinalPosition);
    return {
      x,
      y: (open + close) / 2
    };
  }
}

export class CandlestickElement extends FinancialElement {
  static id = 'candlestick';

  static defaults = {
    ...valueOrDefault(Chart.defaults.elements[FinancialElement.id], {}), // direct import
    borderWidth: 1
  };

  draw(ctx) {
    const {x, open, high, low, close} = this;

    const options = this.options;
    const {up, down, unchanged} = options.backgroundColors; // from defaults
    const {up: borderUp, down: borderDown, unchanged: borderUnchanged} = options.borderColors; // from defaults

    let color = unchanged;
    let borderColor = borderUnchanged;

    if (close > open) {
      color = up;
      borderColor = borderUp;
    } else if (close < open) {
      color = down;
      borderColor = borderDown;
    }

    ctx.strokeStyle = borderColor;
    ctx.fillStyle = color;
    ctx.lineWidth = valueOrDefault(options.borderWidth, 1); // direct import

    // Draw the wick
    ctx.beginPath();
    ctx.moveTo(x, high);
    ctx.lineTo(x, Math.min(open, close));
    ctx.moveTo(x, low);
    ctx.lineTo(x, Math.max(open, close));
    ctx.stroke();

    // Draw the body
    ctx.beginPath();
    ctx.rect(x - options.width / 2, close, options.width, open - close);
    ctx.fill();
    ctx.stroke();
  }
}

export class CandlestickController extends FinancialController {
  static id = 'candlestick';

  static defaults = {
    ...Chart.defaults.financial, // Inherit from FinancialController defaults if any
    datasetElementType: CandlestickElement.id
  };

  static defaultRoutes = BarController.defaultRoutes; // Inherit from imported BarController

  updateElements(elements, start, count, mode) {
    const me = this;
    const reset = mode === 'reset';
    const {index, _cachedMeta: meta} = me;
    const firstOpts = me.resolveDataElementOptions(index, mode);
    const sharedOptions = me.getSharedOptions(firstOpts);
    const includeOptions = me.includeOptions(mode, sharedOptions);
    const ruler = me._ruler(); // Get the ruler

    me.updateSharedOptions(sharedOptions, mode, firstOpts);

    for (let i = start; i < start + count; i++) {
      const options = sharedOptions || me.resolveDataElementOptions(i, mode);
      // Pass the actual ruler object instead of undefined
      const baseProperties = me.calculateElementProperties(i, ruler, reset, options);
      if (includeOptions) {
        baseProperties.options = options;
      }
      me.updateElement(elements[i], i, baseProperties, mode);
    }
  }
}

// Accessing Chart.defaults.elements.ohlc directly
const ohlcElementDefaults = Chart.defaults.elements.ohlc || FinancialElement.defaults;


export class OhlcElement extends FinancialElement {
  static id = 'ohlc';

  static defaults = {
    ...valueOrDefault(Chart.defaults.elements[FinancialElement.id], {}), // direct import
    lineWidth: 2,
    armLength: null,
    armLengthRatio: 0.8,
  };

  draw(ctx) {
    const {x, open, high, low, close} = this;
    const options = this.options;

    const armLength = valueOrDefault(options.armLength, options.width * options.armLengthRatio / 2); // direct import

    ctx.strokeStyle = options.borderColor;
    ctx.lineWidth = options.lineWidth;


    // Draw the main vertical line (high to low)
    ctx.beginPath();
    ctx.moveTo(x, high);
    ctx.lineTo(x, low);
    ctx.stroke();

    // Draw the open tick
    ctx.beginPath();
    ctx.moveTo(x - armLength, open);
    ctx.lineTo(x, open);
    ctx.stroke();

    // Draw the close tick
    ctx.beginPath();
    ctx.moveTo(x, close);
    ctx.lineTo(x + armLength, close);
    ctx.stroke();
  }
}

export class OhlcController extends FinancialController {
  static id = 'ohlc';

  static defaults = {
    ...Chart.defaults.financial, // Inherit from FinancialController defaults if any
    datasetElementType: OhlcElement.id,
    lineWidth: 2,
    armLengthRatio: 0.8,
  };
  static defaultRoutes = BarController.defaultRoutes; // Inherit from imported BarController


  updateElements(elements, start, count, mode) {
    const me = this;
    const reset = mode === 'reset';
    const {index, _cachedMeta: meta} = me;
    const firstOpts = me.resolveDataElementOptions(index, mode);
    const sharedOptions = me.getSharedOptions(firstOpts);
    const includeOptions = me.includeOptions(mode, sharedOptions);
    const ruler = me._ruler(); // Get the ruler

    me.updateSharedOptions(sharedOptions, mode, firstOpts);

    for (let i = start; i < start + count; i++) {
      const options = sharedOptions || me.resolveDataElementOptions(i, mode);
      // Pass the actual ruler object instead of undefined
      const baseProperties = me.calculateElementProperties(i, ruler, reset, options);
       if (includeOptions) {
        baseProperties.options = {
          ...options, // spread original options
          width: me.calculateBarThickness(baseProperties), // ensure width is calculated for OHLC
          lineWidth: options.lineWidth,
          armLengthRatio: options.armLengthRatio
        };
      }
      me.updateElement(elements[i], i, baseProperties, mode);
    }
  }
}
