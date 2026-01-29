/**
 * Data helpers for WCAG MCP server
 * Provides utility functions for accessing and querying WCAG data
 */

import wcagData from '../data/wcag.json' with { type: 'json' };

// Export raw data for direct access
export const principles = wcagData.principles;
export const terms = wcagData.terms;

/**
 * Strip HTML tags from a string
 */
export function stripHtml(html) {
  return html?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || '';
}

/**
 * Get URL for a success criterion
 */
export function getScUrl(sc) {
  return `https://www.w3.org/TR/WCAG22/#${sc.id}`;
}

/**
 * Get Understanding document URL for a success criterion
 */
export function getUnderstandingUrl(sc) {
  return `https://www.w3.org/WAI/WCAG22/Understanding/${sc.id}.html`;
}

/**
 * Get Quick Reference (How to Meet) URL for a success criterion
 */
export function getQuickRefUrl(sc) {
  return `https://www.w3.org/WAI/WCAG22/quickref/#${sc.id}`;
}

/**
 * Find a principle by number (1-4)
 */
export function findPrinciple(num) {
  return principles.find(p => p.num === String(num));
}

/**
 * Find a guideline by number (e.g., "1.1", "2.4")
 */
export function findGuideline(num) {
  for (const principle of principles) {
    const guideline = principle.guidelines.find(g => g.num === num);
    if (guideline) {
      return { principle, guideline };
    }
  }
  return null;
}

/**
 * Find a success criterion by number (e.g., "1.1.1", "2.4.7")
 */
export function findSuccessCriterion(num) {
  for (const principle of principles) {
    for (const guideline of principle.guidelines) {
      const sc = guideline.successcriteria.find(s => s.num === num);
      if (sc) {
        return { principle, guideline, sc };
      }
    }
  }
  return null;
}

/**
 * Find a success criterion by its slug ID (e.g., "non-text-content")
 */
export function findSuccessCriterionById(id) {
  for (const principle of principles) {
    for (const guideline of principle.guidelines) {
      const sc = guideline.successcriteria.find(s => s.id === id);
      if (sc) {
        return { principle, guideline, sc };
      }
    }
  }
  return null;
}

/**
 * Get all success criteria with optional filters
 */
export function getAllSuccessCriteria(filters = {}) {
  const results = [];
  
  for (const principle of principles) {
    if (filters.principle && principle.num !== String(filters.principle)) continue;
    
    for (const guideline of principle.guidelines) {
      if (filters.guideline && guideline.num !== filters.guideline) continue;
      
      for (const sc of guideline.successcriteria) {
        if (filters.level && sc.level !== filters.level) continue;
        if (filters.levels && !filters.levels.includes(sc.level)) continue;
        if (filters.version && !sc.versions.includes(filters.version)) continue;
        
        results.push({
          ...sc,
          principle_num: principle.num,
          principle_handle: principle.handle,
          guideline_num: guideline.num,
          guideline_handle: guideline.handle
        });
      }
    }
  }
  
  return results;
}

/**
 * Get all unique techniques from all success criteria
 */
export function getAllTechniques() {
  const techniquesMap = new Map();
  
  for (const principle of principles) {
    for (const guideline of principle.guidelines) {
      for (const sc of guideline.successcriteria) {
        if (!sc.techniques) continue;
        
        const collectTechniques = (techniques, type) => {
          if (!techniques) return;
          
          for (const item of techniques) {
            // Handle sections with nested techniques
            if (item.techniques) {
              collectTechniques(item.techniques, type);
              if (item.groups) {
                for (const group of item.groups) {
                  collectTechniques(group.techniques, type);
                }
              }
            }
            
            // Handle individual techniques
            if (item.id && item.title) {
              const existing = techniquesMap.get(item.id);
              if (!existing) {
                techniquesMap.set(item.id, {
                  id: item.id,
                  technology: item.technology,
                  title: item.title,
                  types: new Set([type]),
                  criteria: new Set([sc.num])
                });
              } else {
                existing.types.add(type);
                existing.criteria.add(sc.num);
              }
            }
            
            // Handle nested using arrays
            if (item.using) {
              collectTechniques(item.using, type);
            }
            
            // Handle AND combinations
            if (item.and) {
              collectTechniques(item.and, type);
            }
          }
        };
        
        collectTechniques(sc.techniques.sufficient, 'sufficient');
        collectTechniques(sc.techniques.advisory, 'advisory');
        collectTechniques(sc.techniques.failure, 'failure');
      }
    }
  }
  
  // Convert Sets to arrays for serialization
  return Array.from(techniquesMap.values()).map(t => ({
    ...t,
    types: Array.from(t.types),
    criteria: Array.from(t.criteria)
  }));
}

/**
 * Find a technique by ID (e.g., "H37", "ARIA1", "G94")
 */
export function findTechnique(id) {
  const allTechniques = getAllTechniques();
  return allTechniques.find(t => t.id.toLowerCase() === id.toLowerCase());
}

/**
 * Get techniques for a specific success criterion
 */
export function getTechniquesForCriterion(scNum) {
  const result = findSuccessCriterion(scNum);
  if (!result) return null;
  
  const { sc } = result;
  return sc.techniques || {};
}

/**
 * Find a glossary term by name (case-insensitive)
 */
export function findTerm(name) {
  const searchName = name.toLowerCase();
  return terms.find(t => 
    t.name.toLowerCase() === searchName ||
    t.id.toLowerCase() === `dfn-${searchName.replace(/\s+/g, '-')}`
  );
}

/**
 * Search glossary terms by keyword
 */
export function searchTerms(query) {
  const searchQuery = query.toLowerCase();
  return terms.filter(t => 
    t.name.toLowerCase().includes(searchQuery) ||
    stripHtml(t.definition).toLowerCase().includes(searchQuery)
  );
}

/**
 * Get success criteria added in a specific WCAG version
 */
export function getNewInVersion(version) {
  const versionStr = version.includes('.') ? version : `2.${version.replace('2', '')}`;
  return getAllSuccessCriteria().filter(sc => {
    // SC is new in this version if it appears in this version but not earlier ones
    const versions = sc.versions || [];
    const earlierVersions = versions.filter(v => v < versionStr);
    return versions.includes(versionStr) && earlierVersions.length === 0;
  });
}

/**
 * Create a standard text response for MCP
 */
export function textResponse(text) {
  return {
    content: [{ type: 'text', text }]
  };
}

