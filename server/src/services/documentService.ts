import fs from 'fs/promises';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { logger } from '../utils/logger';

/**
 * Extract text from different document formats
 */
export const documentService = {
  /**
   * Extract text from a PDF file
   * @param buffer - PDF file buffer
   * @returns Extracted text
   */
  async extractFromPdf(buffer: Buffer): Promise<string> {
    try {
      const result = await pdfParse(buffer);
      logger.info(`Extracted ${result.text.length} characters from PDF`);
      return result.text;
    } catch (error) {
      logger.error(`Error extracting text from PDF: ${error}`);
      throw new Error('Failed to extract text from PDF');
    }
  },

  /**
   * Extract text from a DOCX file
   * @param buffer - DOCX file buffer
   * @returns Extracted text
   */
  async extractFromDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      logger.info(`Extracted ${result.value.length} characters from DOCX`);
      return result.value;
    } catch (error) {
      logger.error(`Error extracting text from DOCX: ${error}`);
      throw new Error('Failed to extract text from DOCX');
    }
  },

  /**
   * Extract text from a TXT file
   * @param buffer - TXT file buffer
   * @returns Extracted text
   */
  extractFromTxt(buffer: Buffer): string {
    try {
      const text = buffer.toString('utf-8');
      logger.info(`Extracted ${text.length} characters from TXT`);
      return text;
    } catch (error) {
      logger.error(`Error extracting text from TXT: ${error}`);
      throw new Error('Failed to extract text from TXT');
    }
  },

  /**
   * Process document based on its MIME type
   * @param buffer - Document buffer
   * @param mimeType - MIME type of the document
   * @returns Extracted text
   */
  async processDocument(buffer: Buffer, mimeType: string): Promise<string> {
    switch (mimeType) {
      case 'application/pdf':
        return this.extractFromPdf(buffer);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return this.extractFromDocx(buffer);
      
      case 'text/plain':
        return this.extractFromTxt(buffer);
      
      default:
        logger.error(`Unsupported MIME type: ${mimeType}`);
        throw new Error(`Unsupported document type: ${mimeType}`);
    }
  },

  /**
   * Process file from path
   * @param path - Path to the file
   * @param mimeType - MIME type of the document
   * @returns Extracted text
   */
  async processFile(path: string, mimeType: string): Promise<string> {
    try {
      const buffer = await fs.readFile(path);
      return this.processDocument(buffer, mimeType);
    } catch (error) {
      logger.error(`Error processing file: ${error}`);
      throw new Error('Failed to process file');
    }
  }
}; 