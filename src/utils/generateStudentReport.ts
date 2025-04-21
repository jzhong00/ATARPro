import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

/**
 * Helper function to get base64 data from an image URL
 */
const getImageBase64 = async (imagePath: string): Promise<string | null> => {
  try {
    // For browser environment, fetch the image and convert to base64
    const response = await fetch(imagePath);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return null;
  }
};

// Define the structure of the input subject results
// This should align with how data is prepared before calling this function
interface SubjectResultInput {
  subject: string | null; // Subject display name
  rawResult: string | null;
  lowerResult?: string | null; // Optional, used in range mode
  upperResult?: string | null; // Optional, used in range mode
  scaledScore?: number | null; 
  lowerScaledScore?: number | null;
  upperScaledScore?: number | null;
  // SET Plan specific fields
  rank?: string | null; // Student's rank in subject
  resultRange?: string | null; // Result range based on rank
}

// Define the input parameters for the generatePDF function
interface GeneratePdfInput {
  studentName: string;
  subjectResults: SubjectResultInput[];
  rangeMode: boolean;
  atarText: string | number | null; // Allow number type from calculation result
  teText: string | null;
  chartImageBase64?: string | null; // Optional base64 PNG string
  warningText?: string | null; // New: Optional warning text string
  // SET Plan specific fields
  setPlanMode?: boolean;
  explanatoryText?: string | null;
  imagePath?: string | null;
  hideRangeColumns?: boolean;
  reduceChartSize?: boolean;
}

export const generatePDF = async ({
  studentName,
  subjectResults,
  rangeMode,
  atarText,
  teText,
  chartImageBase64,
  warningText,
  setPlanMode = false,
  explanatoryText = null,
  imagePath = null,
  hideRangeColumns = false,
  reduceChartSize = false
}: GeneratePdfInput): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage(); // Default A4 size
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const contentWidth = width - 2 * margin;
  let y = height - margin; // Start drawing from the top margin

  // Title
  page.drawText('ATAR Prediction Report', {
    x: margin,
    y,
    font: fontBold,
    size: 18,
    color: rgb(0, 0, 0.5), // Dark blue
  });
  y -= 30; // Space after title

  // Student Name
  // Conditionally display the name based on whether it's provided
  const studentLabel = studentName ? `Student: ${studentName}` : 'Student:';
  page.drawText(studentLabel, {
    x: margin,
    y,
    font: fontBold,
    size: 14,
  });
  y -= 25; // Space after name

  // Add SET Plan specific content if in SET Plan mode
  if (setPlanMode && explanatoryText) {
    // Add explanatory text
    const lines = explanatoryText.split('\n');
    for (const line of lines) {
      page.drawText(line, {
        x: margin,
        y,
        font: font,
        size: 11,
      });
      y -= 16; // Space between lines
    }
    y -= 10; // Extra space after text

    // Add image if provided
    if (imagePath) {
      // For SET Plan mode, we include the image from the public folder
      // Set the image dimensions based on the original mockup
      const imgWidth = contentWidth * 0.66; // 66% of content width as per specs
      const imgHeight = 80; // 80px height as per specs
      
      try {
        // Try to load the image from the provided path
        const imageBase64 = await getImageBase64(imagePath);
        
        if (imageBase64) {
          // If we successfully got the base64 data, embed it in the PDF
          const image = await pdfDoc.embedPng(imageBase64);
          
          // Calculate dimensions to maintain aspect ratio within constraints
          const imageDims = image.scale(1);
          const scale = Math.min(imgWidth / imageDims.width, imgHeight / imageDims.height);
          const finalWidth = imageDims.width * scale;
          const finalHeight = imageDims.height * scale;
          
          // Left-justify the image
          const drawX = margin; // Align to left margin instead of centering
          
          page.drawImage(image, {
            x: drawX,
            y: y - finalHeight, // Position below current y coordinate
            width: finalWidth,
            height: finalHeight
          });
          
          y -= finalHeight + 20; // Update y position for next element
        } else {
          // Fallback if image loading fails
          page.drawText("SET Plan image could not be loaded", {
            x: margin,
            y,
            font: font,
            size: 11,
          });
          y -= 20; // Space after text
        }
      } catch (error) {
        console.error("Failed to embed SET Plan image:", error);
        page.drawText("Failed to load SET Plan image", {
          x: margin, 
          y,
          font: font,
          size: 11,
          color: rgb(0.8, 0, 0) // Red text for error
        });
        y -= 20; // Space after error text
      }
    }
  }

  // --- Results Table ---
  const tableTop = y;
  const tableHeaderSize = 10;
  const tableBodySize = 9;
  const rowHeight = 15;
  const tableLeft = margin;

  // Calculate column widths based on mode
  let numCols = rangeMode && !hideRangeColumns ? 5 : 3; // Subject, [Lower, Result, Upper] or [Result], Scaled
  
  // If we're hiding range columns in SET Plan mode, reduce column count
  if (hideRangeColumns && rangeMode) {
    numCols = 3; // Just Subject, Result Range, Scaled Range for SET Plan
  }
  
  // Add columns for SET Plan mode
  if (setPlanMode) {
    numCols += 2; // Add columns for Rank and Result Range (only if not already included)
  }
  
  const subjectColWidth = contentWidth * 0.25; // Allocate less space for subject name to accommodate extra columns
  const resultColsWidth = contentWidth - subjectColWidth;
  const individualResultColWidth = resultColsWidth / (numCols - 1); // Divide remaining space

  const subjectColX = tableLeft;
  const firstResultColX = tableLeft + subjectColWidth;

  // Draw table header
  page.drawText('Subject', { x: subjectColX, y, font: fontBold, size: tableHeaderSize });

  // Helper to center text within a column width
  const centerHeaderText = (text: string, startX: number, colWidth: number) => 
    startX + colWidth / 2 - fontBold.widthOfTextAtSize(text, tableHeaderSize) / 2;

  let currentColX = firstResultColX;
  
  // Add SET Plan specific headers if in SET Plan mode
  if (setPlanMode) {
    page.drawText('Rank', { 
      x: centerHeaderText('Rank', currentColX, individualResultColWidth), 
      y, 
      font: fontBold, 
      size: tableHeaderSize 
    });
    currentColX += individualResultColWidth;
    
    page.drawText('Result Range', { 
      x: centerHeaderText('Result Range', currentColX, individualResultColWidth), 
      y, 
      font: fontBold, 
      size: tableHeaderSize 
    });
    currentColX += individualResultColWidth;
  }

  if (rangeMode && !hideRangeColumns) {
    // Only show these columns if we're not hiding range columns
    page.drawText('Lower', { x: centerHeaderText('Lower', currentColX, individualResultColWidth), y, font: fontBold, size: tableHeaderSize });
    currentColX += individualResultColWidth;
    
    page.drawText('Result', { x: centerHeaderText('Result', currentColX, individualResultColWidth), y, font: fontBold, size: tableHeaderSize });
    currentColX += individualResultColWidth;
    
    page.drawText('Upper', { x: centerHeaderText('Upper', currentColX, individualResultColWidth), y, font: fontBold, size: tableHeaderSize });
    currentColX += individualResultColWidth;
  } else if (!setPlanMode) {
    // For non-SET Plan mode without range columns
    page.drawText('Result', { x: centerHeaderText('Result', currentColX, individualResultColWidth), y, font: fontBold, size: tableHeaderSize });
    currentColX += individualResultColWidth;
  }
  
  // Always show scaled score/range column
  const scaledHeader = rangeMode ? 'Scaled Range' : 'Scaled';
  page.drawText(scaledHeader, { x: centerHeaderText(scaledHeader, currentColX, individualResultColWidth), y, font: fontBold, size: tableHeaderSize });
  
  y -= rowHeight; // Move down for the first row

  // Draw table body
  subjectResults.forEach((result) => {
    // Only draw rows with a subject selected
    if (result.subject) {
      page.drawText(result.subject, { x: subjectColX, y, font: font, size: tableBodySize });

      // Helper to center body text
      const centerBodyText = (text: string | number | null | undefined, startX: number, colWidth: number) => {
          // Ensure text is a string, provide default '-' if null/undefined
          const textStr = text !== null && text !== undefined ? String(text) : '-'; 
          // Ensure textStr is not empty before calculating width, as widthOfTextAtSize might error on empty string depending on library version
          if (textStr === '') return startX + colWidth / 2; 
          return startX + colWidth / 2 - font.widthOfTextAtSize(textStr, tableBodySize) / 2;
      }

      let currentColX = firstResultColX;
      
      // Add SET Plan specific data if in SET Plan mode
      if (setPlanMode) {
        const rankText = result.rank ?? '-';
        const rankTextStr = String(rankText);
        page.drawText(rankTextStr, { 
          x: centerBodyText(rankTextStr, currentColX, individualResultColWidth), 
          y, 
          font: font, 
          size: tableBodySize 
        });
        currentColX += individualResultColWidth;
        
        const resultRangeText = result.resultRange ?? '-';
        const resultRangeTextStr = String(resultRangeText);
        page.drawText(resultRangeTextStr, { 
          x: centerBodyText(resultRangeTextStr, currentColX, individualResultColWidth), 
          y, 
          font: font, 
          size: tableBodySize 
        });
        currentColX += individualResultColWidth;
      }

      if (rangeMode && !hideRangeColumns) {
        // Only show these columns if we're not hiding range columns
        const lowerText = result.lowerResult ?? '-';
        const resultText = result.rawResult ?? '-';
        const upperText = result.upperResult ?? '-';
        
        const lowerTextStr = String(lowerText);
        page.drawText(lowerTextStr, { x: centerBodyText(lowerTextStr, currentColX, individualResultColWidth), y, font: font, size: tableBodySize });
        currentColX += individualResultColWidth;
        
        const resultTextStr = String(resultText);
        page.drawText(resultTextStr, { x: centerBodyText(resultTextStr, currentColX, individualResultColWidth), y, font: font, size: tableBodySize });
        currentColX += individualResultColWidth;
        
        const upperTextStr = String(upperText);
        page.drawText(upperTextStr, { x: centerBodyText(upperTextStr, currentColX, individualResultColWidth), y, font: font, size: tableBodySize });
        currentColX += individualResultColWidth;
      } else if (!setPlanMode) {
        // For non-SET Plan mode without range columns
        const resultText = result.rawResult ?? '-';
        const resultTextStr = String(resultText);
        page.drawText(resultTextStr, { x: centerBodyText(resultTextStr, currentColX, individualResultColWidth), y, font: font, size: tableBodySize });
        currentColX += individualResultColWidth;
      }

      // Always show scaled score/range column
      if (rangeMode) {
        const lowerScaled = result.lowerScaledScore?.toFixed(1) ?? '-';
        const upperScaled = result.upperScaledScore?.toFixed(1) ?? '-';
        // scaledRangeText is already guaranteed to be a string here
        const scaledRangeText = `${lowerScaled} - ${upperScaled}`;
        page.drawText(scaledRangeText, { x: centerBodyText(scaledRangeText, currentColX, individualResultColWidth), y, font: font, size: tableBodySize });
      } else {
        // scaledText is already guaranteed to be a string here
        const scaledText = result.scaledScore?.toFixed(1) ?? '-';
        page.drawText(scaledText, { x: centerBodyText(scaledText, currentColX, individualResultColWidth), y, font: font, size: tableBodySize });
      }
      
      y -= rowHeight; // Move to next row
    }
  });
  y -= 10; // Space after table

  // --- TE and ATAR Summary ---
  const summaryTextSize = 12;
  const teLabel = rangeMode ? 'TE Range:' : 'TE:';
  const atarLabel = rangeMode ? 'ATAR Range:' : 'ATAR:';

  page.drawText(`${teLabel} ${teText ?? 'N/A'}`, {
      x: margin,
      y,
      font: fontBold,
      size: summaryTextSize
  });

  page.drawText(`${atarLabel} ${atarText ?? 'N/A'}`, {
      x: margin + contentWidth / 2, // Position ATAR on the right half
      y,
      font: fontBold,
      size: summaryTextSize
  });
  y -= summaryTextSize + 15; // Space after summary

  // --- Add Warning Text (if provided) ---
  if (warningText) {
    const warningFontSize = 9;
    const warningPadding = 5;
    const textWidth = font.widthOfTextAtSize(warningText, warningFontSize);
    const lines = [];
    let currentLine = '';

    // Basic word wrapping
    warningText.split(' ').forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(testLine, warningFontSize) < contentWidth - 2 * warningPadding) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });
    lines.push(currentLine);

    const textHeight = lines.length * (warningFontSize + 2); // Approximate height with line spacing
    const boxHeight = textHeight + 2 * warningPadding;

    // Check for page break
    if (y - boxHeight < margin) {
      page = pdfDoc.addPage();
      y = height - margin;
    }

    // Draw background box (light yellow)
    page.drawRectangle({
      x: margin,
      y: y - boxHeight,
      width: contentWidth,
      height: boxHeight,
      color: rgb(1, 1, 0.8), // Light yellow
      borderColor: rgb(0.9, 0.9, 0.7), // Slightly darker yellow border
      borderWidth: 0.5,
    });

    // Draw text lines
    let textY = y - warningPadding - warningFontSize;
    lines.forEach(line => {
      page.drawText(line, {
        x: margin + warningPadding,
        y: textY,
        font: font,
        size: warningFontSize,
        color: rgb(0.4, 0.4, 0) // Dark yellow/brown text
      });
      textY -= (warningFontSize + 2);
    });

    y -= boxHeight + 15; // Update y position, add padding
  }

  // --- Chart Image ---
  if (chartImageBase64) {
    try {
      // 1. Embed Image
      const pngImage = await pdfDoc.embedPng(chartImageBase64);
      
      // 2. Get Original Dimensions
      const pngDims = pngImage.scale(1);

      // 3. Get Page Dimensions
      const { width: pageWidth, height: pageHeight } = page.getSize(); // Use current page dimensions
      
      // 4. Determine available space
      const yAfterText = y; // Current y position after text rendering
      const bottomMargin = 50;
      // Ensure availableHeight is not negative if text is already near the bottom
      const availableHeight = Math.max(0, yAfterText - bottomMargin); 

      // 5. Define Max Width (use contentWidth for consistency)
      const maxWidth = contentWidth * (reduceChartSize ? 0.7 : 1); // Reduce width if reduceChartSize is true

      // 6. Calculate Scale and Final Dimensions
      const scale = Math.min(maxWidth / pngDims.width, availableHeight / pngDims.height, 1) * (reduceChartSize ? 0.8 : 1);
      const chartWidth = pngDims.width * scale;
      const chartHeight = pngDims.height * scale;

      // 7. Conditional Drawing Logic
      if (chartHeight > availableHeight || chartHeight <= 0) { // Add check for zero/negative height
        // Image doesn't fit or is invalid size - Add a new page
        page = pdfDoc.addPage([pageWidth, pageHeight]); // Assign to 'page'
        const drawX = (pageWidth - chartWidth) / 2; // Center horizontally
        const drawY = pageHeight - chartHeight - margin; // Position from top margin
        
        page.drawImage(pngImage, {
          x: drawX,
          y: drawY,
          width: chartWidth,
          height: chartHeight
        });
        // No need to update 'y' as it's the last element on this new page

      } else {
        // Image fits on the current page
        const drawX = (pageWidth - chartWidth) / 2; // Center horizontally
        const drawY = yAfterText - chartHeight; // Position below the text (draws from bottom-left)

        page.drawImage(pngImage, {
          x: drawX,
          y: drawY,
          width: chartWidth,
          height: chartHeight
        });
        // Update y for subsequent elements (like the footer)
        y = drawY - 15; // Add 15 points space after image
      }

    } catch (error) {
      console.error("Failed to embed chart image:", error);
      // Optionally draw an error message on the PDF
      page.drawText('Error embedding chart image.', { x: margin, y, font: font, size: 10, color: rgb(1, 0, 0) });
      y -= 15;
    }
  }

  // --- Footer ---
  const footerText = 'Generated by ATAR Predictions Queensland';
  const footerTextWidth = font.widthOfTextAtSize(footerText, 8);
  page.drawText(footerText, {
    x: width - margin - footerTextWidth,
    y: margin / 2, // Position near bottom margin
    font: font,
    size: 8,
    color: rgb(0.5, 0.5, 0.5), // Gray color
  });

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}; 