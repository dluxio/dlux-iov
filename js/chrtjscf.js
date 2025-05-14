import { BarController, BarElement, Chart } from 'chart.js';
import { valueOrDefault, isNullOrUndef, clipArea, unclipArea } from 'chart.js/helpers';
function getPixelForValueManual(value, scale) {
  if (typeof scale.min !== 'number' || typeof scale.max !== 'number' ||
      typeof scale.top !== 'number' || typeof scale.bottom !== 'number') {
    console.error('Manual pixel calculation failed: Scale properties missing or not numeric.', 
                  {min: scale.min, max: scale.max, top: scale.top, bottom: scale.bottom, value: value});
    // Cannot reliably calculate, return a value that might indicate error or be neutral
    return (scale.top + scale.bottom) / 2; 
  }

  if (scale.min === scale.max) {
    // If data range is zero, map all to the middle of the pixel range.
    return scale.top + (scale.bottom - scale.top) / 2;
  }

  const range = scale.max - scale.min;
  const pixelRange = scale.bottom - scale.top; 
  const ratio = (value - scale.min) / range;

  let pixel;
  if (scale.options && scale.options.reverse) {
    pixel = scale.top + ratio * pixelRange;
  } else {
    // Standard y-axis: higher data values are lower pixel values (closer to top of canvas)
    // However, scale.bottom is often the higher pixel value (further down screen)
    // And scale.top is the lower pixel value (further up screen)
    // So, if bottom > top:
    // pixel = scale.bottom - ratio * pixelRange
    // If top > bottom (inverted canvas for some reason, less common for y):
    // pixel = scale.top + ratio * (scale.bottom - scale.top) -> this is actually scale.top - ratio * (top - bottom)
    // Let's assume standard Chart.js: 0 is at the top, y increases downwards.
    // A scale's `top` is the pixel for scale.max (if not reversed)
    // A scale's `bottom` is the pixel for scale.min (if not reversed)
    // This means pixel = scale.top + ratio * pixelRange if not reversed.
    // Let's re-verify standard Chart.js behavior or rely on a more direct interpolation:
    // Pixel = P_min + (value - V_min) * ( (P_max - P_min) / (V_max - V_min) )
    // If not reversed: P_max is scale.top, P_min is scale.bottom
    // If reversed: P_max is scale.bottom, P_min is scale.top

    if (scale.options && scale.options.reverse) { // Data max at bottom pixel, data min at top pixel
        pixel = scale.top + ratio * pixelRange;
    } else { // Data max at top pixel, data min at bottom pixel
        pixel = scale.bottom - ratio * pixelRange;
    }
  }
  
  // console.log(`MANUAL_PIXEL_CALC: val=${value}, scale_min=${scale.min}, scale_max=${scale.max}, scale_top=${scale.top}, scale_bottom=${scale.bottom}, reverse=${scale.options?.reverse}, ratio=${ratio}, PIXEL=${pixel}`);
  return pixel;
}

/**
 * This class is based off controller.bar.js from the upstream Chart.js library
 */
export class FinancialController extends BarController {

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

            if (!isNullOrUndef(point.y) && typeof point.y === 'number') {
              return Chart.defaults.plugins.tooltip.callbacks.label(ctx);
            }

            const ohlc = point; 
            if (ohlc && !isNullOrUndef(ohlc.o) && !isNullOrUndef(ohlc.h) && !isNullOrUndef(ohlc.l) && !isNullOrUndef(ohlc.c)) {
              // Here, o,h,l,c are data values from parsed point, not pixel values from element
              return `${ctx.dataset.label}: O ${ohlc.o} H ${ohlc.h} L ${ohlc.l} C ${ohlc.c} (${ohlc.s || ''} ${ohlc.v || ''})`;
            }
            return `${ctx.dataset.label || 'Data'}: OHLC data not available`;
          }
        }
      }
    }
  };

  getLabelAndValue(index) {
    const me = this;
    const meta = me._cachedMeta;
    const iScale = meta.iScale;
    const parsed = me.getParsed(index);

    if (!parsed) {
      return {
        label: meta.label,
        value: 'Data not available'
      };
    }

    const {o, h, l, c} = parsed; 

    if (isNullOrUndef(o) || isNullOrUndef(h) || isNullOrUndef(l) || isNullOrUndef(c)) {
        return {
            label: meta.label,
            value: `OHLC data incomplete for ${iScale.getLabelForValue(parsed[iScale.axis])}`
        };
    }

    const value = `${iScale.getLabelForValue(parsed[iScale.axis])}: O ${o} H ${h} L ${l} C ${c}`;
    return {
      label: meta.label,
      value
    };
  }

  // Helper method to get value scale
  _getValueScale() {
    return this._cachedMeta.vScale;
  }

  // Helper method to create a bar size ruler
  _ruler() {
    const me = this;
    const meta = me._cachedMeta;
    const iScale = meta.iScale;
    const pixels = [];

    if (meta.data && iScale) { // Add checks for meta.data and iScale
      for (let i = 0; i < meta.data.length; i++) {
        const parsedX = me.getParsed(i)?.x;
        if (typeof parsedX !== 'undefined') {
          pixels.push(iScale.getPixelForValue(parsedX));
        } else {
          pixels.push(null); // Push null if parsed.x is undefined
          console.warn(`FinancialCtrl _ruler: parsed.x undefined for index ${i}`);
        }
      }
    } else {
      console.warn('FinancialCtrl _ruler: meta.data or iScale is undefined. Cannot populate pixels.');
    }

    return {
      pixels,
      start: iScale?._startPixel,
      end: iScale?._endPixel,
      stackCount: meta._stacked ? meta._stacked.count : 1,
      scale: iScale,
      getBarWidth() {
        if (!this.scale) return 10; // Default if scale is missing
        const barThickness = this.scale.options?.barThickness;
        if (barThickness !== undefined) {
          return barThickness;
        }
        const categoryWidth = this._computeBarWidth();
        const maxBarWidth = this._calculateMaxBarWidth();
        return Math.min(maxBarWidth, categoryWidth);
      },
      _computeBarWidth() {
        if (!this.scale || !this.pixels || this.pixels.length === 0) return 10; // Default
        
        const distinctPixels = this.pixels.filter(p => typeof p === 'number' && isFinite(p));
        if (distinctPixels.length <= 1) return 10; // Default if not enough distinct points

        const minPixelSpacing = 1;
        // Use the scale width directly from this.scale
        const totalWidth = this.scale.width;
        if (typeof totalWidth !== 'number' || !isFinite(totalWidth)) return 10;

        // Calculate average spacing between distinct points if possible
        // This is a simplified approach; real bar charts might do more sophisticated things.
        const first = Math.min(...distinctPixels);
        const last = Math.max(...distinctPixels);
        const span = last - first;
        if (span <= 0) return 10;

        const averageSpacing = span / (distinctPixels.length -1);
        return Math.max(minPixelSpacing, averageSpacing * 0.8); // Use 80% of average spacing
      },
      _calculateMaxBarWidth() {
        if (!this.scale) return 20; // Default
        const iScale = this.scale;
        const fullSize = iScale.isHorizontal() ? iScale.width : iScale.height;
        if (typeof fullSize !== 'number' || !isFinite(fullSize)) return 20;
        let maxBarThickness = iScale.options?.maxBarThickness;
        return maxBarThickness !== undefined ? maxBarThickness : Math.max(1, fullSize * 0.1);
      },
      getCenterPoint(index) {
        if (!this.pixels || index < 0 || index >= this.pixels.length) {
          console.warn(`FinancialCtrl: ruler.getCenterPoint invalid index ${index} or pixels array.`);
          return { x: null, y: 0 };
        }
        const currentPixel = this.pixels[index];
        if (typeof currentPixel === 'number' && isFinite(currentPixel)) {
          return { x: currentPixel, y: 0 };
        }
        // Log if currentPixel is not a valid number (it might be null/NaN from iScale.getPixelForValue)
        console.warn(`FinancialCtrl: ruler.getCenterPoint for index ${index} received non-finite pixel: ${currentPixel}.`);
        return { x: null, y: 0 };
      }
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
  calculateElementProperties(index, ruler, reset) {
    const me = this;
    const vscale = me._getValueScale();
    const data = me.chart.data.datasets[me.index].data[index];

    // Explicitly access data fields
    const dataOpen = parseFloat(data.o);
    const dataHigh = parseFloat(data.h);
    const dataLow = parseFloat(data.l);
    const dataClose = parseFloat(data.c);
    if (vscale) {
      
    } else {
      console.warn(`FinancialCtrl Index ${index}: vscale is undefined.`);
      // Assign default pixel values if vscale is missing to prevent further errors down the line
      const openPixel = 0, highPixel = 0, lowPixel = 0, closePixel = 0, base = 0;
      const x_coord = 0, barWidth = 1, height = 1;
      return { base, x: x_coord, y: openPixel, width: barWidth, height, open: openPixel, high: highPixel, low: lowPixel, close: closePixel };
    }


    // Calculate pixel values for various price points
    const getPixelValue = (value) => {
      try {
        return vscale.getPixelForValue(value);
      } catch (e) {
        console.error('Error calculating pixel value for value:', value, e);
        const rangePercentage = (value - vscale.min) / (vscale.max - vscale.min || 1);
        const reverseRange = vscale.options?.reverse ? 1 - rangePercentage : rangePercentage;
        return vscale.top + reverseRange * (vscale.bottom - vscale.top);
      }
    };

    const openPixel = getPixelValue(dataOpen);
    const highPixel = getPixelValue(dataHigh);
    const lowPixel = getPixelValue(dataLow);
    const closePixel = getPixelValue(dataClose);
    const base = vscale.getBasePixel();

    const horizontal = me.isHorizontal(); // Corrected: Use FinancialController's isHorizontal
    let x_coord;

    if (horizontal) {
      // This case is less typical for Candlestick, but for completeness:
      // Value is on the x-axis, category/time on y-axis
      x_coord = getPixelValue(dataOpen); // Example: base x on open value
                                       // y_coord would be iScale.getPixelForValue(parsed.x);
    } else {
      // Standard case: time on x-axis, value on y-axis
      const centerPoint = ruler.getCenterPoint(index);
      x_coord = centerPoint.x; // Correctly get the .x property
      if (x_coord === null || typeof x_coord !== 'number' || !isFinite(x_coord)) {
        console.error(`FinancialCtrl Index ${index}: Calculated x_coord is invalid (${x_coord}). Defaulting to 0. This will affect bar placement.`);
        x_coord = 0; // Fallback if ruler failed
      }
    }
    
    const barWidth = ruler.getBarWidth();
    if (typeof barWidth !== 'number' || !isFinite(barWidth) || barWidth <= 0) {
        console.warn(`FinancialCtrl Index ${index}: Invalid barWidth calculated (${barWidth}). Defaulting to 1.`);
    }


    const isZeroHeight = Math.abs(openPixel - closePixel) < 0.5;
    const height = reset ? 0 : (isZeroHeight ? 1 : Math.abs(openPixel - closePixel));
    
    // y-coordinate for the bar's visual position (top of the body for non-horizontal)
    // CandlestickElement.draw will use open/close pixels to determine exact body placement.
    const y_pos = Math.min(openPixel, closePixel);


    const props = {
      base,
      x: x_coord,
      y: reset ? base : y_pos, // For reset animation, go to base
      width: Math.max(1, barWidth), // Ensure width is at least 1
      height,
      open: openPixel,
      high: highPixel,
      low: lowPixel,
      close: closePixel
    };
    return props;
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
      const currentElementOptions = sharedOptions || me.resolveDataElementOptions(i, mode);
      const baseProperties = me.calculateElementProperties(i, ruler, reset, currentElementOptions);

      if (includeOptions) {
        const parsed = me.getParsed(i); // Get parsed data for color determination
        let chosenBackgroundColor = currentElementOptions.backgroundColors?.unchanged || 'rgba(201, 203, 207, 0.5)';
        let chosenBorderColor = currentElementOptions.borderColors?.unchanged || 'rgb(201, 203, 207)';

        if (parsed && !isNullOrUndef(parsed.c) && !isNullOrUndef(parsed.o)) {
            if (parsed.c > parsed.o) {
                chosenBackgroundColor = currentElementOptions.backgroundColors?.up || 'rgba(75, 192, 192, 0.5)';
                chosenBorderColor = currentElementOptions.borderColors?.up || 'rgb(75, 192, 192)';
            } else if (parsed.c < parsed.o) {
                chosenBackgroundColor = currentElementOptions.backgroundColors?.down || 'rgba(255, 99, 132, 0.5)';
                chosenBorderColor = currentElementOptions.borderColors?.down || 'rgb(255, 99, 132)';
            }
        }
        
        baseProperties.options = {
          ...currentElementOptions, // Spread original options first
          borderRadius: { // Provide borderRadius as a fully resolved object
            topLeft: 0,
            topRight: 0,
            bottomLeft: 0,
            bottomRight: 0,
          },
          borderSkipped: 'start', 
          backgroundColor: chosenBackgroundColor, 
          borderColor: chosenBorderColor,       
        };
      }
      me.updateElement(elements[i], i, baseProperties, mode);
    }
  }

  // Add missing scale helpers
  _getIndexScale() {
    return this._cachedMeta.iScale;
  }

  isHorizontal() {
    return this._cachedMeta.vScale.isHorizontal();
  }

  // Helper to get parsed data at an index
  getParsed(index) {
    const data = this._cachedMeta._parsed;
    if (!data || !data[index]) {
      return {
        x: undefined, y: undefined, 
        o: undefined, h: undefined, l: undefined, c: undefined
      };
    }
    return data[index];
  }

  // Get labels for the x-axis (for category scales)
  _getLabels() {
    const me = this;
    const labels = me.chart.data.labels || [];
    
    // If no explicit labels, try to use parsed x values for time/category
    if (labels.length === 0 && me._cachedMeta._parsed) {
      return me._cachedMeta._parsed.map((item, index) => {
        const x = item.x;
        // Format timestamp appropriately if it's numeric
        if (typeof x === 'number' && !isNaN(x)) {
          // Simple date formatting for logging purposes
          try {
            return new Date(x).toLocaleDateString();
          } catch (e) {
            return String(x);
          }
        }
        return String(x !== undefined ? x : index);
      });
    }
    return labels;
  }

  // Parse the raw data into a format suitable for financial charts
  parse(start, count) {
    const me = this;
    const { _cachedMeta: meta, _data: data } = me;
    //const { iScale, vScale } = meta;
    const parsed = new Array(count);

    for (let i = start, ilen = start + count; i < ilen; ++i) {
      const item = data[i];
      let parsedItem = {
        x: undefined, // For timestamp/category
        o: undefined, // open
        h: undefined, // high
        l: undefined, // low
        c: undefined  // close
      };
      
      // Handle various data formats
      if (Array.isArray(item)) {
        // [timestamp, open, high, low, close, volume?]
        if (item.length >= 5) {
          parsedItem = {
            x: +item[0],
            o: +item[1],
            h: +item[2],
            l: +item[3],
            c: +item[4],
            v: item.length > 5 ? +item[5] : undefined
          };
        } else {
          console.warn(`FinancialController: Data item at index ${i} has insufficient elements:`, item);
        }
      } else if (typeof item === 'object' && item !== null) {
        // {t: timestamp, o: open, h: high, l: low, c: close, v?: volume}
        // or {x: timestamp, o: open, h: high, l: low, c: close, v?: volume}
        parsedItem = {
          x: +(item.t !== undefined ? item.t : item.x),
          o: +item.o,
          h: +item.h,
          l: +item.l,
          c: +item.c,
          v: item.v !== undefined ? +item.v : undefined
        };
      }

      // Set fallbacks if values are missing or invalid
      if (isNaN(parsedItem.x)) parsedItem.x = i;
      if (isNaN(parsedItem.o)) parsedItem.o = 0;
      if (isNaN(parsedItem.h)) parsedItem.h = parsedItem.o;
      if (isNaN(parsedItem.l)) parsedItem.l = parsedItem.o;
      if (isNaN(parsedItem.c)) parsedItem.c = parsedItem.o;

      parsed[i - start] = parsedItem;
    }

    meta._parsed = parsed;
    me._getLabels(); // Update labels from the scale
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

  constructor(cfg) {
    super();
    
    this.x = undefined;
    this.y = undefined;
    this.base = undefined;
    this.width = undefined;
    this.open = undefined;
    this.high = undefined;
    this.low = undefined;
    this.close = undefined;
    
    if (cfg) {
      Object.assign(this, cfg);
    }
  }

  draw(ctx) {
    const me = this;
    const options = me.options || {};
    
    const { x, open, high, low, close } = me;
    
    if (x === undefined || open === undefined || high === undefined || 
        low === undefined || close === undefined) {
      console.warn('CandlestickElement missing required properties', me);
      return;
    }

    // Use a safe width value
    const width = Math.max(me.width, 1);
    
    ctx.save();
    
    // Set line style
    ctx.lineWidth = options.borderWidth || 1;
    
    // Determine color based on price movement
    let color;
    if (close > open) {
      color = options.borderColors?.up || 'rgb(75, 192, 192)';
      ctx.fillStyle = options.backgroundColors?.up || 'rgba(75, 192, 192, 0.5)';
    } else if (close < open) {
      color = options.borderColors?.down || 'rgb(255, 99, 132)';
      ctx.fillStyle = options.backgroundColors?.down || 'rgba(255, 99, 132, 0.5)';
    } else {
      color = options.borderColors?.unchanged || 'rgb(201, 203, 207)';
      ctx.fillStyle = options.backgroundColors?.unchanged || 'rgba(201, 203, 207, 0.5)';
    }
    
    ctx.strokeStyle = color;
    
    // Calculate coordinates safely (force at least 1px height)
    const openY = Number.isFinite(open) ? open : me.base;
    const closeY = Number.isFinite(close) ? close : me.base;
    const highY = Number.isFinite(high) ? high : Math.min(openY, closeY);
    const lowY = Number.isFinite(low) ? low : Math.max(openY, closeY);
    
    // Draw the high-low line
    ctx.beginPath();
    ctx.moveTo(x, highY);
    ctx.lineTo(x, lowY);
    ctx.stroke();
    
    // Draw the body rectangle with at least 1px height
    const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
    const bodyY = Math.min(openY, closeY);
    
    // Fill and stroke the body
    ctx.fillRect(x - width / 2, bodyY, width, bodyHeight);
    ctx.strokeRect(x - width / 2, bodyY, width, bodyHeight);
    
    ctx.restore();
  }

  // Add additional methods needed by the controller
  getRange(axis) {
    const props = this;
    if (axis === 'x') {
      return {min: props.x - props.width / 2, max: props.x + props.width / 2};
    }
    return {
      min: Math.min(props.open, props.close, props.low),
      max: Math.max(props.open, props.close, props.high)
    };
  }
}

export class CandlestickController extends FinancialController {
  static id = 'candlestick';

  static defaults = {
    dataElementType: 'candlestick',
    datasetElementType: false,
    dataElementOptions: {
      borderWidth: 1,
      backgroundColors: {
        up: 'rgba(75, 192, 192, 0.5)',
        down: 'rgba(255, 99, 132, 0.5)',
        unchanged: 'rgba(201, 203, 207, 0.5)',
      },
      borderColors: {
        up: 'rgb(75, 192, 192)',
        down: 'rgb(255, 99, 132)',
        unchanged: 'rgb(201, 203, 207)',
      },
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
            if (!isNullOrUndef(point.y) && typeof point.y === 'number') {
              return Chart.defaults.plugins.tooltip.callbacks.label(ctx);
            }
            const ohlc = point;
            if (ohlc && !isNullOrUndef(ohlc.o) && !isNullOrUndef(ohlc.h) && !isNullOrUndef(ohlc.l) && !isNullOrUndef(ohlc.c)) {
              return `${ctx.dataset.label}: O ${ohlc.o} H ${ohlc.h} L ${ohlc.l} C ${ohlc.c} (${ohlc.s || ''} ${ohlc.v || ''})`;
            }
            return `${ctx.dataset.label || 'Data'}: OHLC data not available`;
          }
        }
      }
    }
  };

  // Override to ensure proper element creation
  constructor(chart, datasetIndex) {
    super(chart, datasetIndex);
    this._elementType = CandlestickElement;
  }

  // Simplified element update method to avoid complexity
  updateElements(elements, start, count, mode) {
    const me = this;
    const reset = mode === 'reset';
    const ruler = me._ruler();

    for (let i = start; i < start + count; i++) {
      const options = me.resolveDataElementOptions(i, mode);
      const baseProperties = me.calculateElementProperties(i, ruler, reset, options);
      
      // Always provide options for CandlestickElement
      baseProperties.options = {
        borderWidth: options.borderWidth,
        width: baseProperties.width,
        backgroundColors: options.backgroundColors,
        borderColors: options.borderColors
      };
      
      me.updateElement(elements[i], i, baseProperties, mode);
    }
  }
}

// Accessing Chart.defaults.elements.ohlc directly
const ohlcElementDefaults = Chart.defaults.elements.ohlc || FinancialElement.defaults;


export class OhlcElement extends FinancialElement {
  static id = 'ohlc';

  constructor(cfg) {
    super();
    
    this.x = undefined;
    this.y = undefined;
    this.base = undefined;
    this.width = undefined;
    this.open = undefined;
    this.high = undefined;
    this.low = undefined;
    this.close = undefined;
    
    if (cfg) {
      Object.assign(this, cfg);
    }
  }

  draw(ctx) {
    const me = this;
    const options = me.options || {};
    
    const { x, open, high, low, close } = me;
    
    if (x === undefined || open === undefined || high === undefined || 
        low === undefined || close === undefined) {
      console.warn('OhlcElement missing required properties', me);
      return;
    }
    
    ctx.save();
    
    // Set line style
    ctx.lineWidth = options.lineWidth || 2;
    
    // Determine color based on price movement
    let color;
    if (close > open) {
      color = options.borderColors?.up || 'rgb(75, 192, 192)';
    } else if (close < open) {
      color = options.borderColors?.down || 'rgb(255, 99, 132)';
    } else {
      color = options.borderColors?.unchanged || 'rgb(201, 203, 207)';
    }
    
    ctx.strokeStyle = color;
    
    // Calculate arm length
    const width = Math.max(me.width, 1);
    const armLength = options.armLength ?? (width * (options.armLengthRatio || 0.8));
    const halfArmLength = armLength / 2;
    
    // Draw high-low line
    ctx.beginPath();
    ctx.moveTo(x, high);
    ctx.lineTo(x, low);
    ctx.stroke();
    
    // Draw open arm
    ctx.beginPath();
    ctx.moveTo(x - halfArmLength, open);
    ctx.lineTo(x, open);
    ctx.stroke();
    
    // Draw close arm
    ctx.beginPath();
    ctx.moveTo(x, close);
    ctx.lineTo(x + halfArmLength, close);
    ctx.stroke();
    
    ctx.restore();
  }

  // Add additional methods needed by the controller
  getRange(axis) {
    const props = this;
    if (axis === 'x') {
      return {min: props.x - props.width / 2, max: props.x + props.width / 2};
    }
    return {
      min: Math.min(props.open, props.close, props.low),
      max: Math.max(props.open, props.close, props.high)
    };
  }
}

export class OhlcController extends FinancialController {
  static id = 'ohlc';

  static defaults = {
    dataElementType: 'ohlc',
    datasetElementType: false,
    dataElementOptions: {
      lineWidth: 2,
      armLength: null,
      armLengthRatio: 0.8,
      backgroundColors: {
        up: 'rgba(75, 192, 192, 0.5)',
        down: 'rgba(255, 99, 132, 0.5)',
        unchanged: 'rgba(201, 203, 207, 0.5)',
      },
      borderColors: {
        up: 'rgb(75, 192, 192)',
        down: 'rgb(255, 99, 132)',
        unchanged: 'rgb(201, 203, 207)',
      },
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
            if (!isNullOrUndef(point.y) && typeof point.y === 'number') {
              return Chart.defaults.plugins.tooltip.callbacks.label(ctx);
            }
            const ohlc = point;
            if (ohlc && !isNullOrUndef(ohlc.o) && !isNullOrUndef(ohlc.h) && !isNullOrUndef(ohlc.l) && !isNullOrUndef(ohlc.c)) {
              return `${ctx.dataset.label}: O ${ohlc.o} H ${ohlc.h} L ${ohlc.l} C ${ohlc.c} (${ohlc.s || ''} ${ohlc.v || ''})`;
            }
            return `${ctx.dataset.label || 'Data'}: OHLC data not available`;
          }
        }
      }
    },
  };

  // Override to ensure proper element creation
  constructor(chart, datasetIndex) {
    super(chart, datasetIndex);
    this._elementType = OhlcElement;
  }

  // Simplified element update method to avoid complexity
  updateElements(elements, start, count, mode) {
    const me = this;
    const reset = mode === 'reset';
    const ruler = me._ruler();

    for (let i = start; i < start + count; i++) {
      const options = me.resolveDataElementOptions(i, mode);
      const baseProperties = me.calculateElementProperties(i, ruler, reset, options);
      
      // Always provide options for OhlcElement
      baseProperties.options = {
        lineWidth: options.lineWidth || 2,
        armLength: options.armLength,
        armLengthRatio: options.armLengthRatio || 0.8,
        width: baseProperties.width,
        borderColors: options.borderColors
      };
      
      me.updateElement(elements[i], i, baseProperties, mode);
    }
  }
}

/**
 * Register custom financial chart components with Chart.js
 * This must be called before using the financial chart controllers
 */
export function registerFinancialChartComponents(Chart) {
  Chart.register(CandlestickController, OhlcController, CandlestickElement, OhlcElement);
  
  // Add debug log to confirm registration
  console.log('Financial chart components registered:', {
    controllers: [CandlestickController.id, OhlcController.id],
    elements: [CandlestickElement.id, OhlcElement.id]
  });
}

// Export all components for direct use if needed
//export {
  //CandlestickController,
  //OhlcController,
  //CandlestickElement,
  //OhlcElement,
  //FinancialController
//};

