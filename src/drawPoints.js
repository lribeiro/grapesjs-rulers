// Configuration based on provided data
const config = {
    units: 'cm',
    dpiStandard: 96,
    pixelsPerCm: 37.795275591,
    pixelsPerInch: 96,
    tickHeights: {
        cm: 10,
        halfCm: 8,
        mm: 5
    },
    colors: {
        background: '#f5f5f5',
        rulerLine: '#333333',
        tickMarks: '#000000',
        text: '#000000'
    },
    font: {
        family: 'Arial, sans-serif',
        size: 14,
        weight: 'normal'
    }
};


/**
 * Draws ruler tick marks and labels on a canvas
 */
export const drawPoints = (context, rulLength, rulThickness, rulScale, options) => {
    console.log('drawPoints called:', { rulLength, rulThickness, rulScale, unit: options.unit, dpi: options.dpi });
    
    // Clear the canvas with light background
    context.fillStyle = '#f5f5f5';
    context.fillRect(0, 0, rulLength, rulThickness);
    
    // Calculate pixels per unit based on the ruler scale
    const pxPerMmLocal = options.dpi / 25.4;
    const pxPerCmLocal = pxPerMmLocal * 10;
    
    // Determine the unit to use
    const useUnit = options.unit || 'cm';
    const pixelsPerUnit = useUnit === 'cm' ? pxPerCmLocal : (useUnit === 'mm' ? pxPerMmLocal : 1);
    
    // Adjust for the canvas width multiplication (ruler.js multiplies by 4)
    const adjustedPixelsPerUnit = pixelsPerUnit / rulScale;
    
    // Calculate the zero point (center of the ruler canvas)
    const zeroPoint = rulLength / 2;
    
    // Calculate how many units fit to the left and right of zero
    const unitsLeft = Math.ceil(zeroPoint / adjustedPixelsPerUnit);
    const unitsRight = Math.ceil((rulLength - zeroPoint) / adjustedPixelsPerUnit);
    
    console.log('Ruler calculations:', { pixelsPerUnit, adjustedPixelsPerUnit, zeroPoint, unitsLeft, unitsRight });
    
    // Define tick heights matching the reference image
    const tickHeights = {
        major: rulThickness - 3,       // Full height for major marks
        medium: (rulThickness - 3) * 0.6,    // 60% height for half units
        minor: (rulThickness - 3) * 0.4      // 40% height for minor marks
    };
    
    // Draw tick marks
    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    context.beginPath();
    
    // Draw the ruler marks from negative to positive
    for (let i = -unitsLeft; i <= unitsRight; i++) {
        const x = Math.round(zeroPoint + (i * adjustedPixelsPerUnit));
        
        if (x < 0 || x > rulLength) continue;
        
        // Draw major tick mark
        context.moveTo(x + 0.5, 0);
        context.lineTo(x + 0.5, tickHeights.major);
        
        // Draw subdivision marks
        if (i < unitsRight) {
            const subdivisions = useUnit === 'cm' ? 10 : (useUnit === 'mm' ? 10 : 50);
            
            for (let j = 1; j < subdivisions; j++) {
                const subX = Math.round(x + (j * adjustedPixelsPerUnit / subdivisions));
                
                if (subX < 0 || subX > rulLength) continue;
                
                let tickHeight;
                if (useUnit === 'cm' || useUnit === 'mm') {
                    // For metric: 5mm/5 units gets medium tick, others get small tick
                    tickHeight = (j === 5) ? tickHeights.medium : tickHeights.minor;
                } else {
                    // For pixels: every 25 gets medium, every 5 gets small
                    if (j % 25 === 0) tickHeight = tickHeights.medium;
                    else if (j % 5 === 0) tickHeight = tickHeights.minor;
                    else continue;
                }
                
                context.moveTo(subX + 0.5, 0);
                context.lineTo(subX + 0.5, tickHeight);
            }
        }
    }
    
    context.stroke();
    
    // Draw number labels (after stroke, so they're on top)
    context.fillStyle = '#000000';
    context.font = '10px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    
    console.log('Drawing labels from', -unitsLeft, 'to', unitsRight);
    for (let i = -unitsLeft; i <= unitsRight; i++) {
        const x = Math.round(zeroPoint + (i * adjustedPixelsPerUnit));
        if (x < 0 || x > rulLength) continue;
        const y = tickHeights.major + 2;
        if (Math.abs(i) <= 3) console.log(`Drawing label "${i}" at x:${x}, y:${y}`);
        context.fillText(i.toString(), x, y);
    }
};


