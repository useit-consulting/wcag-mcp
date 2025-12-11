/**
 * Parse Understanding documents from WCAG submodule HTML files
 * and integrate them into the WCAG data structure
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
const understandingDir = join(dataDir, 'wcag', 'understanding');

/**
 * Extract text content from HTML, preserving structure
 */
function extractTextContent(element) {
  if (!element) return '';
  
  let text = '';
  for (const node of element.childNodes) {
    if (node.nodeType === 3) { // Text node
      text += node.textContent;
    } else if (node.nodeType === 1) { // Element node
      const tagName = node.tagName.toLowerCase();
      
      // Skip template includes and script tags
      if (tagName === 'script' || node.textContent.includes('{%')) {
        continue;
      }
      
      if (tagName === 'p' || tagName === 'div') {
        text += extractTextContent(node) + '\n\n';
      } else if (tagName === 'li') {
        text += '- ' + extractTextContent(node) + '\n';
      } else if (tagName === 'a') {
        text += extractTextContent(node);
      } else if (tagName === 'code') {
        text += '`' + node.textContent + '`';
      } else if (tagName === 'strong' || tagName === 'em') {
        text += extractTextContent(node);
      } else {
        text += extractTextContent(node);
      }
    }
  }
  
  return text;
}

/**
 * Parse a section by ID
 */
function parseSection(doc, sectionId) {
  const section = doc.getElementById(sectionId);
  if (!section) return null;
  
  const content = extractTextContent(section).trim();
  return content || null;
}

/**
 * Parse the brief section which has structured content
 */
function parseBrief(doc) {
  const brief = doc.getElementById('brief');
  if (!brief) return null;
  
  const result = {};
  const dts = brief.querySelectorAll('dt');
  const dds = brief.querySelectorAll('dd');
  
  for (let i = 0; i < dts.length && i < dds.length; i++) {
    const key = dts[i].textContent.trim().toLowerCase();
    const value = dds[i].textContent.trim();
    result[key] = value;
  }
  
  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Parse benefits list
 */
function parseBenefits(doc) {
  const benefitsSection = doc.getElementById('benefits');
  if (!benefitsSection) return null;
  
  const listItems = benefitsSection.querySelectorAll('ul > li');
  if (listItems.length === 0) return null;
  
  const benefits = [];
  for (const li of listItems) {
    const text = extractTextContent(li).trim();
    if (text && !text.startsWith('{%')) {
      benefits.push(text.replace(/^- /, ''));
    }
  }
  
  return benefits.length > 0 ? benefits : null;
}

/**
 * Parse examples section
 */
function parseExamples(doc) {
  const examplesSection = doc.getElementById('examples');
  if (!examplesSection) return null;
  
  const examples = [];
  
  // Look for aside elements with class="example"
  const exampleElements = examplesSection.querySelectorAll('aside.example, .example');
  for (const example of exampleElements) {
    const text = extractTextContent(example).trim();
    if (text && !text.startsWith('{%')) {
      examples.push(text);
    }
  }
  
  // Also check for list items
  const listItems = examplesSection.querySelectorAll('ul > li, ol > li');
  for (const li of listItems) {
    const text = extractTextContent(li).trim();
    if (text && !text.startsWith('{%')) {
      examples.push(text.replace(/^- /, ''));
    }
  }
  
  return examples.length > 0 ? examples : null;
}

/**
 * Parse resources section
 */
function parseResources(doc) {
  const resourcesSection = doc.getElementById('resources');
  if (!resourcesSection) return null;
  
  const resources = [];
  const links = resourcesSection.querySelectorAll('ul > li a');
  
  for (const link of links) {
    const title = link.textContent.trim();
    const url = link.getAttribute('href');
    if (title && url && !title.startsWith('{%')) {
      resources.push({ title, url });
    }
  }
  
  return resources.length > 0 ? resources : null;
}

/**
 * Parse an Understanding HTML file
 */
function parseUnderstandingDoc(filePath) {
  try {
    const html = readFileSync(filePath, 'utf-8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    const understanding = {
      brief: parseBrief(doc),
      intent: parseSection(doc, 'intent'),
      benefits: parseBenefits(doc),
      examples: parseExamples(doc),
      resources: parseResources(doc)
    };
    
    // Remove null values
    Object.keys(understanding).forEach(key => {
      if (understanding[key] === null) {
        delete understanding[key];
      }
    });
    
    return Object.keys(understanding).length > 0 ? understanding : null;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Get Understanding file path for a success criterion
 */
function getUnderstandingFilePath(scId) {
  // Try WCAG 2.0 location first (most criteria are here)
  const paths = [
    join(understandingDir, '20', `${scId}.html`),
    join(understandingDir, '21', `${scId}.html`),
    join(understandingDir, '22', `${scId}.html`)
  ];
  
  for (const path of paths) {
    if (existsSync(path)) {
      return path;
    }
  }
  
  return null;
}

/**
 * Main function to enhance WCAG data with Understanding documents
 */
export function enhanceWithUnderstanding() {
  console.log('Loading WCAG data...');
  const wcagDataPath = join(dataDir, 'wcag.json');
  const wcagData = JSON.parse(readFileSync(wcagDataPath, 'utf-8'));
  
  console.log('Parsing Understanding documents...');
  let enhanced = 0;
  let notFound = 0;
  
  for (const principle of wcagData.principles) {
    for (const guideline of principle.guidelines) {
      for (const sc of guideline.successcriteria) {
        const filePath = getUnderstandingFilePath(sc.id);
        
        if (filePath) {
          const understanding = parseUnderstandingDoc(filePath);
          if (understanding) {
            sc.understanding = understanding;
            enhanced++;
            console.log(`✓ Enhanced ${sc.num} ${sc.handle}`);
          }
        } else {
          notFound++;
          console.log(`✗ No Understanding doc found for ${sc.num} ${sc.handle}`);
        }
      }
    }
  }
  
  console.log(`\nEnhanced ${enhanced} success criteria`);
  console.log(`Missing ${notFound} Understanding documents`);
  
  // Write enhanced data back
  console.log('\nWriting enhanced data...');
  writeFileSync(wcagDataPath, JSON.stringify(wcagData, null, 2));
  console.log('Done!');
  
  return wcagData;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  enhanceWithUnderstanding();
}
