/**
 * MCP Tools for WCAG 2.2
 * Powered by official W3C data
 */

import {
  principles,
  terms,
  stripHtml,
  getScUrl,
  getUnderstandingUrl,
  getQuickRefUrl,
  findPrinciple,
  findGuideline,
  findSuccessCriterion,
  findSuccessCriterionById,
  getAllSuccessCriteria,
  getAllTechniques,
  findTechnique,
  getTechniquesForCriterion,
  findTerm,
  searchTerms,
  getNewInVersion,
  textResponse
} from './data-helpers.js';

// ============================================================================
// CORE WCAG TOOLS (Updated for W3C format)
// ============================================================================

const listPrinciples = {
  name: 'list-principles',
  description: 'Lists all four WCAG 2.2 principles: Perceivable, Operable, Understandable, and Robust.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async () => {
    const output = principles.map(p => 
      `**${p.num}. ${p.handle}**\n${stripHtml(p.content)}\nURL: https://www.w3.org/TR/WCAG22/#${p.id}`
    ).join('\n\n');
    return textResponse(`# WCAG 2.2 Principles\n\n${output}`);
  }
};

const listGuidelines = {
  name: 'list-guidelines',
  description: 'Lists WCAG 2.2 guidelines, optionally filtered by principle number (1-4).',
  inputSchema: {
    type: 'object',
    properties: {
      principle: {
        type: 'string',
        description: 'Filter by principle number (1=Perceivable, 2=Operable, 3=Understandable, 4=Robust)',
        enum: ['1', '2', '3', '4']
      }
    },
    required: []
  },
  handler: async (args) => {
    let targetPrinciples = principles;
    if (args.principle) {
      const p = findPrinciple(args.principle);
      targetPrinciples = p ? [p] : [];
    }

    if (targetPrinciples.length === 0) {
      return textResponse('No principles found matching your criteria.');
    }

    const output = targetPrinciples.map(p => {
      const guidelines = p.guidelines.map(g => 
        `  **${g.num} ${g.handle}**\n  ${stripHtml(g.content)}`
      ).join('\n\n');
      return `## Principle ${p.num}: ${p.handle}\n\n${guidelines}`;
    }).join('\n\n---\n\n');

    return textResponse(`# WCAG 2.2 Guidelines\n\n${output}`);
  }
};

const listSuccessCriteria = {
  name: 'list-success-criteria',
  description: 'Lists WCAG 2.2 success criteria with optional filters by level (A, AA, AAA), guideline (e.g., "1.1"), or principle (1-4).',
  inputSchema: {
    type: 'object',
    properties: {
      level: {
        type: 'string',
        description: 'Filter by conformance level',
        enum: ['A', 'AA', 'AAA']
      },
      guideline: {
        type: 'string',
        description: 'Filter by guideline number (e.g., "1.1", "2.4")'
      },
      principle: {
        type: 'string',
        description: 'Filter by principle number (1-4)',
        enum: ['1', '2', '3', '4']
      }
    },
    required: []
  },
  handler: async (args) => {
    const criteria = getAllSuccessCriteria({
      level: args.level,
      guideline: args.guideline,
      principle: args.principle
    });

    if (criteria.length === 0) {
      return textResponse('No success criteria found matching your filters.');
    }

    const output = criteria.map(sc => 
      `**${sc.num} ${sc.handle}** (Level ${sc.level})\nGuideline: ${sc.guideline_num} ${sc.guideline_handle}`
    ).join('\n\n');

    const filterDesc = [];
    if (args.level) filterDesc.push(`Level: ${args.level}`);
    if (args.guideline) filterDesc.push(`Guideline: ${args.guideline}`);
    if (args.principle) filterDesc.push(`Principle: ${args.principle}`);
    const filterText = filterDesc.length > 0 ? `\nFilters: ${filterDesc.join(', ')}\n` : '';

    return textResponse(`# WCAG 2.2 Success Criteria (${criteria.length} found)\n${filterText}\n${output}`);
  }
};

const getSuccessCriteriaDetail = {
  name: 'get-success-criteria-detail',
  description: 'Gets the normative success criterion requirements - just the title and exception details without Understanding documentation.',
  inputSchema: {
    type: 'object',
    properties: {
      ref_id: {
        type: 'string',
        description: 'Success criterion reference number (e.g., "1.1.1", "2.4.7")'
      }
    },
    required: ['ref_id']
  },
  handler: async (args) => {
    const result = findSuccessCriterion(args.ref_id);
    
    if (!result) {
      return textResponse(`No success criterion found with number "${args.ref_id}". Use format like "1.1.1" or "2.4.7".`);
    }

    const { principle, guideline, sc } = result;
    
    let output = `# ${sc.num} ${sc.handle}\n\n`;
    output += `**Level:** ${sc.level}\n`;
    output += `**Principle:** ${principle.num} ${principle.handle}\n`;
    output += `**Guideline:** ${guideline.num} ${guideline.handle}\n`;
    output += `**WCAG Versions:** ${sc.versions.join(', ')}\n\n`;
    
    output += `## Success Criterion\n\n${sc.title}\n\n`;
    
    // Add details (exceptions, notes, etc.)
    if (sc.details && sc.details.length > 0) {
      output += `## Details\n\n`;
      for (const detail of sc.details) {
        if (detail.type === 'ulist' && detail.items) {
          for (const item of detail.items) {
            if (item.handle) {
              output += `- **${item.handle}:** ${item.text}\n`;
            } else {
              output += `- ${item.text}\n`;
            }
          }
          output += '\n';
        } else if (detail.type === 'note') {
          output += `> **${detail.handle}:** ${detail.text}\n\n`;
        } else if (detail.type === 'p') {
          output += `${detail.text}\n\n`;
        }
      }
    }

    output += `## Links\n\n`;
    output += `- [WCAG Specification](${getScUrl(sc)})\n`;
    output += `- [Understanding ${sc.num}](${getUnderstandingUrl(sc)})\n`;
    output += `- [How to Meet ${sc.num}](${getQuickRefUrl(sc)})\n`;

    return textResponse(output);
  }
};

const getCriterion = {
  name: 'get-criterion',
  description: 'Gets full details for a specific WCAG success criterion by its reference number (e.g., "1.1.1", "2.4.7", "4.1.2"), including complete Understanding documentation.',
  inputSchema: {
    type: 'object',
    properties: {
      ref_id: {
        type: 'string',
        description: 'Success criterion reference number (e.g., "1.1.1", "2.4.7")'
      }
    },
    required: ['ref_id']
  },
  handler: async (args) => {
    const result = findSuccessCriterion(args.ref_id);
    
    if (!result) {
      return textResponse(`No success criterion found with number "${args.ref_id}". Use format like "1.1.1" or "2.4.7".`);
    }

    const { principle, guideline, sc } = result;
    
    let output = `# ${sc.num} ${sc.handle}\n\n`;
    output += `**Level:** ${sc.level}\n`;
    output += `**Principle:** ${principle.num} ${principle.handle}\n`;
    output += `**Guideline:** ${guideline.num} ${guideline.handle}\n`;
    output += `**WCAG Versions:** ${sc.versions.join(', ')}\n\n`;
    
    // Add Understanding brief if available
    if (sc.understanding?.brief) {
      output += `## In Brief\n\n`;
      if (sc.understanding.brief.goal) {
        output += `**Goal:** ${sc.understanding.brief.goal}\n`;
      }
      if (sc.understanding.brief['what to do']) {
        output += `**What to do:** ${sc.understanding.brief['what to do']}\n`;
      }
      if (sc.understanding.brief["why it's important"]) {
        output += `**Why it's important:** ${sc.understanding.brief["why it's important"]}\n`;
      }
      output += '\n';
    }
    
    output += `## Description\n\n${sc.title}\n\n`;
    
    // Add details (exceptions, notes, etc.)
    if (sc.details && sc.details.length > 0) {
      output += `## Details\n\n`;
      for (const detail of sc.details) {
        if (detail.type === 'ulist' && detail.items) {
          for (const item of detail.items) {
            if (item.handle) {
              output += `- **${item.handle}:** ${item.text}\n`;
            } else {
              output += `- ${item.text}\n`;
            }
          }
          output += '\n';
        } else if (detail.type === 'note') {
          output += `> **${detail.handle}:** ${detail.text}\n\n`;
        } else if (detail.type === 'p') {
          output += `${detail.text}\n\n`;
        }
      }
    }
    
    // Add Understanding intent
    if (sc.understanding?.intent) {
      output += `## Intent\n\n${sc.understanding.intent}\n\n`;
    }
    
    // Add Understanding benefits
    if (sc.understanding?.benefits) {
      output += `## Benefits\n\n`;
      for (const benefit of sc.understanding.benefits) {
        output += `- ${benefit}\n`;
      }
      output += '\n';
    }
    
    // Add Understanding examples
    if (sc.understanding?.examples && sc.understanding.examples.length > 0) {
      output += `## Examples\n\n`;
      for (let i = 0; i < sc.understanding.examples.length; i++) {
        output += `### Example ${i + 1}\n\n${sc.understanding.examples[i]}\n\n`;
      }
    }
    
    // Add Understanding resources
    if (sc.understanding?.resources && sc.understanding.resources.length > 0) {
      output += `## Resources\n\n`;
      for (const resource of sc.understanding.resources) {
        output += `- [${resource.title}](${resource.url})\n`;
      }
      output += '\n';
    }

    output += `## Links\n\n`;
    output += `- [WCAG Specification](${getScUrl(sc)})\n`;
    output += `- [Understanding ${sc.num}](${getUnderstandingUrl(sc)})\n`;
    output += `- [How to Meet ${sc.num}](${getQuickRefUrl(sc)})\n`;

    return textResponse(output);
  }
};

const getGuideline = {
  name: 'get-guideline',
  description: 'Gets full details for a specific WCAG guideline including all its success criteria.',
  inputSchema: {
    type: 'object',
    properties: {
      ref_id: {
        type: 'string',
        description: 'Guideline reference number (e.g., "1.1", "2.4", "4.1")'
      }
    },
    required: ['ref_id']
  },
  handler: async (args) => {
    const result = findGuideline(args.ref_id);
    
    if (!result) {
      return textResponse(`No guideline found with number "${args.ref_id}". Use format like "1.1" or "2.4".`);
    }

    const { principle, guideline } = result;
    
    let output = `# Guideline ${guideline.num}: ${guideline.handle}\n\n`;
    output += `**Principle:** ${principle.num} ${principle.handle}\n\n`;
    output += `## Description\n\n${stripHtml(guideline.content)}\n\n`;
    output += `**URL:** https://www.w3.org/TR/WCAG22/#${guideline.id}\n`;

    output += `\n## Success Criteria (${guideline.successcriteria.length})\n\n`;
    for (const sc of guideline.successcriteria) {
      output += `### ${sc.num} ${sc.handle} (Level ${sc.level})\n`;
      output += `${sc.title.substring(0, 200)}${sc.title.length > 200 ? '...' : ''}\n\n`;
    }

    return textResponse(output);
  }
};

const searchWcag = {
  name: 'search-wcag',
  description: 'Searches WCAG 2.2 success criteria by keyword in titles and descriptions.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query (searches titles and descriptions)'
      },
      level: {
        type: 'string',
        description: 'Optional: Filter results by conformance level',
        enum: ['A', 'AA', 'AAA']
      }
    },
    required: ['query']
  },
  handler: async (args) => {
    const query = args.query.toLowerCase();
    const allCriteria = getAllSuccessCriteria({ level: args.level });
    
    const matches = allCriteria.filter(sc => 
      sc.handle.toLowerCase().includes(query) || 
      sc.title.toLowerCase().includes(query) ||
      stripHtml(sc.content).toLowerCase().includes(query)
    );

    if (matches.length === 0) {
      return textResponse(`No success criteria found matching "${args.query}"${args.level ? ` at level ${args.level}` : ''}.`);
    }

    const output = matches.map(sc => 
      `**${sc.num} ${sc.handle}** (Level ${sc.level})\n${sc.title.substring(0, 150)}${sc.title.length > 150 ? '...' : ''}`
    ).join('\n\n---\n\n');

    return textResponse(`# Search Results for "${args.query}" (${matches.length} found)\n\n${output}`);
  }
};

const getCriteriaByLevel = {
  name: 'get-criteria-by-level',
  description: 'Gets all success criteria for a specific conformance level. Optionally includes lower levels (e.g., AA includes A).',
  inputSchema: {
    type: 'object',
    properties: {
      level: {
        type: 'string',
        description: 'Conformance level to retrieve',
        enum: ['A', 'AA', 'AAA']
      },
      include_lower: {
        type: 'boolean',
        description: 'If true, includes criteria from lower levels (e.g., AA query returns both A and AA criteria)'
      }
    },
    required: ['level']
  },
  handler: async (args) => {
    const levelHierarchy = { 'A': ['A'], 'AA': ['A', 'AA'], 'AAA': ['A', 'AA', 'AAA'] };
    const levels = args.include_lower ? levelHierarchy[args.level] : [args.level];
    
    const criteria = getAllSuccessCriteria({ levels });
    
    if (criteria.length === 0) {
      return textResponse(`No success criteria found for level ${args.level}.`);
    }

    // Group by level
    const grouped = {};
    criteria.forEach(sc => {
      if (!grouped[sc.level]) grouped[sc.level] = [];
      grouped[sc.level].push(sc);
    });

    let output = `# WCAG 2.2 Level ${args.level}${args.include_lower ? ' (including lower levels)' : ''}\n\n`;
    output += `Total: ${criteria.length} success criteria\n\n`;

    for (const level of levels) {
      if (grouped[level]) {
        output += `## Level ${level} (${grouped[level].length} criteria)\n\n`;
        grouped[level].forEach(sc => {
          output += `- **${sc.num}** ${sc.handle}\n`;
        });
        output += '\n';
      }
    }

    return textResponse(output);
  }
};

const countCriteria = {
  name: 'count-criteria',
  description: 'Returns counts of success criteria grouped by level, principle, or guideline.',
  inputSchema: {
    type: 'object',
    properties: {
      group_by: {
        type: 'string',
        description: 'How to group the counts',
        enum: ['level', 'principle', 'guideline']
      }
    },
    required: ['group_by']
  },
  handler: async (args) => {
    const allCriteria = getAllSuccessCriteria();
    const counts = {};

    allCriteria.forEach(sc => {
      let key;
      switch (args.group_by) {
        case 'level':
          key = `Level ${sc.level}`;
          break;
        case 'principle':
          key = `${sc.principle_num}. ${sc.principle_handle}`;
          break;
        case 'guideline':
          key = `${sc.guideline_num} ${sc.guideline_handle}`;
          break;
      }
      counts[key] = (counts[key] || 0) + 1;
    });

    const output = Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, count]) => `- **${key}**: ${count}`)
      .join('\n');

    return textResponse(`# WCAG 2.2 Success Criteria by ${args.group_by.charAt(0).toUpperCase() + args.group_by.slice(1)}\n\nTotal: ${allCriteria.length} success criteria\n\n${output}`);
  }
};

// ============================================================================
// TECHNIQUE TOOLS (New)
// ============================================================================

const listTechniques = {
  name: 'list-techniques',
  description: 'Lists WCAG techniques, optionally filtered by technology (html, aria, css, pdf, general, etc.) or type (sufficient, advisory, failure).',
  inputSchema: {
    type: 'object',
    properties: {
      technology: {
        type: 'string',
        description: 'Filter by technology',
        enum: ['html', 'aria', 'css', 'pdf', 'general', 'client-side-script', 'server-side-script', 'smil', 'text', 'failures']
      },
      type: {
        type: 'string',
        description: 'Filter by technique type',
        enum: ['sufficient', 'advisory', 'failure']
      }
    },
    required: []
  },
  handler: async (args) => {
    let techniques = getAllTechniques();
    
    if (args.technology) {
      const tech = args.technology === 'failures' ? 'failures' : args.technology;
      techniques = techniques.filter(t => t.technology === tech);
    }
    
    if (args.type) {
      techniques = techniques.filter(t => t.types.includes(args.type));
    }

    if (techniques.length === 0) {
      return textResponse('No techniques found matching your filters.');
    }

    // Group by technology
    const grouped = {};
    techniques.forEach(t => {
      const tech = t.technology || 'other';
      if (!grouped[tech]) grouped[tech] = [];
      grouped[tech].push(t);
    });

    let output = `# WCAG Techniques (${techniques.length} found)\n\n`;
    
    for (const [tech, techs] of Object.entries(grouped).sort()) {
      output += `## ${tech.toUpperCase()} (${techs.length})\n\n`;
      techs.sort((a, b) => a.id.localeCompare(b.id)).forEach(t => {
        output += `- **${t.id}**: ${t.title}\n`;
      });
      output += '\n';
    }

    return textResponse(output);
  }
};

const getTechnique = {
  name: 'get-technique',
  description: 'Gets details for a specific technique by ID (e.g., "H37", "ARIA1", "G94", "F65").',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Technique ID (e.g., "H37", "ARIA1", "G94", "F65")'
      }
    },
    required: ['id']
  },
  handler: async (args) => {
    const technique = findTechnique(args.id);
    
    if (!technique) {
      return textResponse(`No technique found with ID "${args.id}".`);
    }

    let output = `# ${technique.id}: ${technique.title}\n\n`;
    output += `**Technology:** ${technique.technology}\n`;
    output += `**Types:** ${technique.types.join(', ')}\n`;
    output += `**Applies to:** ${technique.criteria.length} success criteria\n\n`;
    
    output += `## Related Success Criteria\n\n`;
    technique.criteria.sort().forEach(scNum => {
      const result = findSuccessCriterion(scNum);
      if (result) {
        output += `- **${scNum}** ${result.sc.handle} (Level ${result.sc.level})\n`;
      }
    });
    
    output += `\n## Links\n\n`;
    output += `- [Full Technique Documentation](https://www.w3.org/WAI/WCAG22/Techniques/${technique.technology}/${technique.id})\n`;

    return textResponse(output);
  }
};

const getTechniquesForCriterionTool = {
  name: 'get-techniques-for-criterion',
  description: 'Gets all techniques (sufficient, advisory, and failures) for a specific success criterion.',
  inputSchema: {
    type: 'object',
    properties: {
      ref_id: {
        type: 'string',
        description: 'Success criterion reference number (e.g., "1.1.1", "2.4.7")'
      }
    },
    required: ['ref_id']
  },
  handler: async (args) => {
    const result = findSuccessCriterion(args.ref_id);
    
    if (!result) {
      return textResponse(`No success criterion found with number "${args.ref_id}".`);
    }

    const { sc } = result;
    const techniques = sc.techniques || {};

    let output = `# Techniques for ${sc.num} ${sc.handle}\n\n`;
    
    const formatTechniques = (items, indent = '') => {
      let text = '';
      if (!items) return text;
      
      for (const item of items) {
        if (item.title && !item.id) {
          // Section header
          text += `${indent}**${stripHtml(item.title)}**\n`;
          if (item.techniques) {
            text += formatTechniques(item.techniques, indent + '  ');
          }
          if (item.groups) {
            for (const group of item.groups) {
              text += `${indent}  *${group.title}*\n`;
              text += formatTechniques(group.techniques, indent + '    ');
            }
          }
        } else if (item.id) {
          text += `${indent}- **${item.id}**: ${item.title}\n`;
          if (item.using) {
            text += formatTechniques(item.using, indent + '  ');
          }
        } else if (item.and) {
          text += `${indent}- Combined techniques:\n`;
          for (const andItem of item.and) {
            if (andItem.id) {
              text += `${indent}  - **${andItem.id}**: ${andItem.title}\n`;
            }
          }
        }
      }
      return text;
    };

    if (techniques.sufficient) {
      output += `## Sufficient Techniques\n\n`;
      output += formatTechniques(techniques.sufficient);
      output += '\n';
    }

    if (techniques.advisory) {
      output += `## Advisory Techniques\n\n`;
      output += formatTechniques(techniques.advisory);
      output += '\n';
    }

    if (techniques.failure) {
      output += `## Failure Techniques\n\n`;
      output += formatTechniques(techniques.failure);
      output += '\n';
    }

    return textResponse(output);
  }
};

const searchTechniques = {
  name: 'search-techniques',
  description: 'Searches techniques by keyword in titles.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query'
      }
    },
    required: ['query']
  },
  handler: async (args) => {
    const query = args.query.toLowerCase();
    const techniques = getAllTechniques().filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.id.toLowerCase().includes(query)
    );

    if (techniques.length === 0) {
      return textResponse(`No techniques found matching "${args.query}".`);
    }

    const output = techniques.map(t => 
      `**${t.id}** (${t.technology}): ${t.title}`
    ).join('\n');

    return textResponse(`# Technique Search Results for "${args.query}" (${techniques.length} found)\n\n${output}`);
  }
};

const getFailuresForCriterion = {
  name: 'get-failures-for-criterion',
  description: 'Gets failure techniques (common mistakes) for a specific success criterion.',
  inputSchema: {
    type: 'object',
    properties: {
      ref_id: {
        type: 'string',
        description: 'Success criterion reference number (e.g., "1.1.1", "2.4.7")'
      }
    },
    required: ['ref_id']
  },
  handler: async (args) => {
    const result = findSuccessCriterion(args.ref_id);
    
    if (!result) {
      return textResponse(`No success criterion found with number "${args.ref_id}".`);
    }

    const { sc } = result;
    const failures = sc.techniques?.failure || [];

    if (failures.length === 0) {
      return textResponse(`No documented failure techniques for ${sc.num} ${sc.handle}.`);
    }

    let output = `# Failure Techniques for ${sc.num} ${sc.handle}\n\n`;
    output += `These are common mistakes that would cause this success criterion to fail:\n\n`;

    for (const item of failures) {
      if (item.id) {
        output += `- **${item.id}**: ${item.title}\n`;
      }
    }

    return textResponse(output);
  }
};

// ============================================================================
// GLOSSARY TOOLS (New)
// ============================================================================

const getGlossaryTerm = {
  name: 'get-glossary-term',
  description: 'Gets the definition of a WCAG glossary term.',
  inputSchema: {
    type: 'object',
    properties: {
      term: {
        type: 'string',
        description: 'The term to look up (e.g., "programmatically determined", "text alternative")'
      }
    },
    required: ['term']
  },
  handler: async (args) => {
    const term = findTerm(args.term);
    
    if (!term) {
      // Try to find similar terms
      const similar = searchTerms(args.term).slice(0, 5);
      if (similar.length > 0) {
        const suggestions = similar.map(t => `- ${t.name}`).join('\n');
        return textResponse(`Term "${args.term}" not found. Did you mean:\n\n${suggestions}`);
      }
      return textResponse(`Term "${args.term}" not found in the WCAG glossary.`);
    }

    let output = `# ${term.name}\n\n`;
    output += `${stripHtml(term.definition)}\n\n`;
    output += `[View in WCAG 2.2 Glossary](https://www.w3.org/TR/WCAG22/#${term.id})`;

    return textResponse(output);
  }
};

const listGlossaryTerms = {
  name: 'list-glossary-terms',
  description: 'Lists all WCAG glossary terms.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async () => {
    const sortedTerms = [...terms].sort((a, b) => a.name.localeCompare(b.name));
    
    let output = `# WCAG 2.2 Glossary (${sortedTerms.length} terms)\n\n`;
    
    // Group by first letter
    const grouped = {};
    sortedTerms.forEach(t => {
      const letter = t.name[0].toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(t);
    });

    for (const [letter, letterTerms] of Object.entries(grouped).sort()) {
      output += `## ${letter}\n\n`;
      letterTerms.forEach(t => {
        output += `- **${t.name}**\n`;
      });
      output += '\n';
    }

    return textResponse(output);
  }
};

const searchGlossary = {
  name: 'search-glossary',
  description: 'Searches the WCAG glossary by keyword.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query'
      }
    },
    required: ['query']
  },
  handler: async (args) => {
    const matches = searchTerms(args.query);

    if (matches.length === 0) {
      return textResponse(`No glossary terms found matching "${args.query}".`);
    }

    const output = matches.map(t => {
      const def = stripHtml(t.definition);
      return `**${t.name}**\n${def.substring(0, 150)}${def.length > 150 ? '...' : ''}`;
    }).join('\n\n---\n\n');

    return textResponse(`# Glossary Search Results for "${args.query}" (${matches.length} found)\n\n${output}`);
  }
};

// ============================================================================
// ENHANCED CONTEXT TOOLS
// ============================================================================

const whatsNewInWcag22 = {
  name: 'whats-new-in-wcag22',
  description: 'Lists all success criteria that were added in WCAG 2.2.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async () => {
    const newCriteria = getNewInVersion('2.2');

    let output = `# What's New in WCAG 2.2\n\n`;
    output += `WCAG 2.2 added ${newCriteria.length} new success criteria:\n\n`;

    // Group by level
    const byLevel = { A: [], AA: [], AAA: [] };
    newCriteria.forEach(sc => {
      byLevel[sc.level].push(sc);
    });

    for (const level of ['A', 'AA', 'AAA']) {
      if (byLevel[level].length > 0) {
        output += `## Level ${level}\n\n`;
        byLevel[level].forEach(sc => {
          output += `### ${sc.num} ${sc.handle}\n`;
          output += `${sc.title.substring(0, 200)}${sc.title.length > 200 ? '...' : ''}\n\n`;
        });
      }
    }

    return textResponse(output);
  }
};

const getFullCriterionContext = {
  name: 'get-full-criterion-context',
  description: 'Gets comprehensive context for a success criterion including techniques, test rules, and related glossary terms.',
  inputSchema: {
    type: 'object',
    properties: {
      ref_id: {
        type: 'string',
        description: 'Success criterion reference number (e.g., "1.1.1", "2.4.7")'
      }
    },
    required: ['ref_id']
  },
  handler: async (args) => {
    const result = findSuccessCriterion(args.ref_id);
    
    if (!result) {
      return textResponse(`No success criterion found with number "${args.ref_id}".`);
    }

    const { principle, guideline, sc } = result;
    
    let output = `# Complete Context: ${sc.num} ${sc.handle}\n\n`;
    
    // Basic info
    output += `## Overview\n\n`;
    output += `**Level:** ${sc.level}\n`;
    output += `**Principle:** ${principle.num} ${principle.handle}\n`;
    output += `**Guideline:** ${guideline.num} ${guideline.handle}\n`;
    output += `**WCAG Versions:** ${sc.versions.join(', ')}\n\n`;
    output += `${sc.title}\n\n`;

    // Techniques summary
    const techniques = sc.techniques || {};
    const countTechniques = (items) => {
      if (!items) return 0;
      let count = 0;
      for (const item of items) {
        if (item.id) count++;
        if (item.techniques) count += countTechniques(item.techniques);
        if (item.groups) {
          for (const g of item.groups) {
            count += countTechniques(g.techniques);
          }
        }
        if (item.using) count += countTechniques(item.using);
        if (item.and) count += item.and.length;
      }
      return count;
    };

    const sufficientCount = countTechniques(techniques.sufficient);
    const advisoryCount = countTechniques(techniques.advisory);
    const failureCount = countTechniques(techniques.failure);

    output += `## Techniques Summary\n\n`;
    output += `- **Sufficient:** ${sufficientCount} techniques\n`;
    output += `- **Advisory:** ${advisoryCount} techniques\n`;
    output += `- **Failure:** ${failureCount} techniques\n\n`;

    // Links
    output += `## Links\n\n`;
    output += `- [WCAG Specification](${getScUrl(sc)})\n`;
    output += `- [Understanding ${sc.num}](${getUnderstandingUrl(sc)})\n`;
    output += `- [How to Meet ${sc.num}](${getQuickRefUrl(sc)})\n`;

    return textResponse(output);
  }
};

const getServerInfo = {
  name: 'get-server-info',
  description: 'Returns information about this WCAG MCP server and data source.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async () => {
    const allCriteria = getAllSuccessCriteria();
    const allTechniques = getAllTechniques();
    const levelCounts = { A: 0, AA: 0, AAA: 0 };
    allCriteria.forEach(sc => levelCounts[sc.level]++);

    return textResponse(
      `**WCAG MCP Server** v2.0.0\n\n` +
      `A Model Context Protocol server providing comprehensive access to WCAG 2.2 guidelines with full Understanding documentation.\n\n` +
      `## Data Source\n\n` +
      `- **Source:** [W3C WCAG Repository](https://github.com/w3c/wcag)\n` +
      `- **WCAG JSON:** [Published WCAG 2.2 JSON](https://www.w3.org/WAI/WCAG22/wcag.json)\n` +
      `- **Understanding Docs:** Parsed from official W3C Understanding HTML files\n` +
      `- **WCAG Version:** 2.2\n\n` +
      `## Statistics\n\n` +
      `- **Principles:** ${principles.length}\n` +
      `- **Guidelines:** ${principles.reduce((sum, p) => sum + p.guidelines.length, 0)}\n` +
      `- **Success Criteria:** ${allCriteria.length} (Level A: ${levelCounts.A}, AA: ${levelCounts.AA}, AAA: ${levelCounts.AAA})\n` +
      `- **Techniques:** ${allTechniques.length}\n` +
      `- **Glossary Terms:** ${terms.length}\n\n` +
      `## Attribution\n\n` +
      `WCAG data from the [W3C WCAG Repository](https://github.com/w3c/wcag) ([W3C Document License](https://www.w3.org/copyright/document-license/)).\n\n` +
      `This software includes material copied from or derived from Web Content Accessibility Guidelines (WCAG) 2.2. ` +
      `Copyright © 2023 W3C® (MIT, ERCIM, Keio, Beihang).`
    );
  }
};

// ============================================================================
// EXPORT ALL TOOLS
// ============================================================================

export const tools = [
  // Core WCAG tools
  listPrinciples,
  listGuidelines,
  listSuccessCriteria,
  getSuccessCriteriaDetail,
  getCriterion,
  getGuideline,
  searchWcag,
  getCriteriaByLevel,
  countCriteria,
  
  // Technique tools
  listTechniques,
  getTechnique,
  getTechniquesForCriterionTool,
  searchTechniques,
  getFailuresForCriterion,
  
  // Glossary tools
  getGlossaryTerm,
  listGlossaryTerms,
  searchGlossary,
  
  // Enhanced context tools
  whatsNewInWcag22,
  getFullCriterionContext,
  
  // Server info
  getServerInfo
];
