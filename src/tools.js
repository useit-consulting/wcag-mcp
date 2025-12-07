// Import WCAG data from the git submodule
import wcagData from '../data/wcag-as-json/wcag.json' with { type: 'json' };

/**
 * Helper to create text response
 */
function textResponse(text) {
  return {
    content: [{ type: 'text', text }]
  };
}

/**
 * Helper to find a principle by ref_id
 */
function findPrinciple(refId) {
  return wcagData.find(p => p.ref_id === refId);
}

/**
 * Helper to find a guideline by ref_id (e.g., "1.1")
 */
function findGuideline(refId) {
  for (const principle of wcagData) {
    const guideline = principle.guidelines.find(g => g.ref_id === refId);
    if (guideline) {
      return { principle, guideline };
    }
  }
  return null;
}

/**
 * Helper to find a success criterion by ref_id (e.g., "1.1.1")
 */
function findSuccessCriterion(refId) {
  for (const principle of wcagData) {
    for (const guideline of principle.guidelines) {
      const criterion = guideline.success_criteria.find(sc => sc.ref_id === refId);
      if (criterion) {
        return { principle, guideline, criterion };
      }
    }
  }
  return null;
}

/**
 * Helper to get all success criteria with optional filters
 */
function getAllSuccessCriteria(filters = {}) {
  const results = [];
  for (const principle of wcagData) {
    if (filters.principle && principle.ref_id !== filters.principle) continue;
    
    for (const guideline of principle.guidelines) {
      if (filters.guideline && guideline.ref_id !== filters.guideline) continue;
      
      for (const criterion of guideline.success_criteria) {
        if (filters.level && criterion.level !== filters.level) continue;
        if (filters.levels && !filters.levels.includes(criterion.level)) continue;
        
        results.push({
          ...criterion,
          principle_ref: principle.ref_id,
          principle_title: principle.title,
          guideline_ref: guideline.ref_id,
          guideline_title: guideline.title
        });
      }
    }
  }
  return results;
}

/**
 * Tool definitions for WCAG MCP server
 */
export const tools = [
  {
    name: 'list-principles',
    description: 'Lists all four WCAG 2.2 principles: Perceivable, Operable, Understandable, and Robust.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async () => {
      const principles = wcagData.map(p => 
        `**${p.ref_id}. ${p.title}**\n${p.description}\nURL: ${p.url}`
      ).join('\n\n');
      return textResponse(`# WCAG 2.2 Principles\n\n${principles}`);
    }
  },

  {
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
      let principles = wcagData;
      if (args.principle) {
        const p = findPrinciple(args.principle);
        principles = p ? [p] : [];
      }

      if (principles.length === 0) {
        return textResponse('No principles found matching your criteria.');
      }

      const output = principles.map(p => {
        const guidelines = p.guidelines.map(g => 
          `  **${g.ref_id} ${g.title}**\n  ${g.description}`
        ).join('\n\n');
        return `## Principle ${p.ref_id}: ${p.title}\n\n${guidelines}`;
      }).join('\n\n---\n\n');

      return textResponse(`# WCAG 2.2 Guidelines\n\n${output}`);
    }
  },

  {
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
          description: 'Filter by guideline ref_id (e.g., "1.1", "2.4")'
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
        `**${sc.ref_id} ${sc.title}** (Level ${sc.level})\nGuideline: ${sc.guideline_ref} ${sc.guideline_title}`
      ).join('\n\n');

      const filterDesc = [];
      if (args.level) filterDesc.push(`Level: ${args.level}`);
      if (args.guideline) filterDesc.push(`Guideline: ${args.guideline}`);
      if (args.principle) filterDesc.push(`Principle: ${args.principle}`);
      const filterText = filterDesc.length > 0 ? `\nFilters: ${filterDesc.join(', ')}\n` : '';

      return textResponse(`# WCAG 2.2 Success Criteria (${criteria.length} found)\n${filterText}\n${output}`);
    }
  },

  {
    name: 'get-criterion',
    description: 'Gets full details for a specific WCAG success criterion by its reference ID (e.g., "1.1.1", "2.4.7", "4.1.2").',
    inputSchema: {
      type: 'object',
      properties: {
        ref_id: {
          type: 'string',
          description: 'Success criterion reference ID (e.g., "1.1.1", "2.4.7")'
        }
      },
      required: ['ref_id']
    },
    handler: async (args) => {
      const result = findSuccessCriterion(args.ref_id);
      
      if (!result) {
        return textResponse(`No success criterion found with ref_id "${args.ref_id}". Use format like "1.1.1" or "2.4.7".`);
      }

      const { principle, guideline, criterion } = result;
      
      let output = `# ${criterion.ref_id} ${criterion.title}\n\n`;
      output += `**Level:** ${criterion.level}\n`;
      output += `**Principle:** ${principle.ref_id} ${principle.title}\n`;
      output += `**Guideline:** ${guideline.ref_id} ${guideline.title}\n\n`;
      output += `## Description\n\n${criterion.description}\n\n`;
      output += `**URL:** ${criterion.url}\n`;

      if (criterion.special_cases && criterion.special_cases.length > 0) {
        output += `\n## Special Cases\n\n`;
        criterion.special_cases.forEach(sc => {
          output += `### ${sc.title} (${sc.type})\n${sc.description}\n\n`;
        });
      }

      if (criterion.notes && criterion.notes.length > 0) {
        output += `\n## Notes\n\n`;
        criterion.notes.forEach((note, i) => {
          output += `${i + 1}. ${note}\n`;
        });
      }

      if (criterion.references && criterion.references.length > 0) {
        output += `\n## References\n\n`;
        criterion.references.forEach(ref => {
          output += `- [${ref.title}](${ref.url})\n`;
        });
      }

      return textResponse(output);
    }
  },

  {
    name: 'get-guideline',
    description: 'Gets full details for a specific WCAG guideline including all its success criteria.',
    inputSchema: {
      type: 'object',
      properties: {
        ref_id: {
          type: 'string',
          description: 'Guideline reference ID (e.g., "1.1", "2.4", "4.1")'
        }
      },
      required: ['ref_id']
    },
    handler: async (args) => {
      const result = findGuideline(args.ref_id);
      
      if (!result) {
        return textResponse(`No guideline found with ref_id "${args.ref_id}". Use format like "1.1" or "2.4".`);
      }

      const { principle, guideline } = result;
      
      let output = `# Guideline ${guideline.ref_id}: ${guideline.title}\n\n`;
      output += `**Principle:** ${principle.ref_id} ${principle.title}\n\n`;
      output += `## Description\n\n${guideline.description}\n\n`;
      output += `**URL:** ${guideline.url}\n`;

      if (guideline.references && guideline.references.length > 0) {
        output += `\n## Understanding This Guideline\n\n`;
        guideline.references.forEach(ref => {
          output += `- [${ref.title}](${ref.url})\n`;
        });
      }

      output += `\n## Success Criteria (${guideline.success_criteria.length})\n\n`;
      guideline.success_criteria.forEach(sc => {
        output += `### ${sc.ref_id} ${sc.title} (Level ${sc.level})\n`;
        output += `${sc.description.substring(0, 200)}${sc.description.length > 200 ? '...' : ''}\n\n`;
      });

      return textResponse(output);
    }
  },

  {
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
        sc.title.toLowerCase().includes(query) || 
        sc.description.toLowerCase().includes(query)
      );

      if (matches.length === 0) {
        return textResponse(`No success criteria found matching "${args.query}"${args.level ? ` at level ${args.level}` : ''}.`);
      }

      const output = matches.map(sc => 
        `**${sc.ref_id} ${sc.title}** (Level ${sc.level})\n${sc.description.substring(0, 150)}${sc.description.length > 150 ? '...' : ''}`
      ).join('\n\n---\n\n');

      return textResponse(`# Search Results for "${args.query}" (${matches.length} found)\n\n${output}`);
    }
  },

  {
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

      // Group by level for better readability
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
            output += `- **${sc.ref_id}** ${sc.title}\n`;
          });
          output += '\n';
        }
      }

      return textResponse(output);
    }
  },

  {
    name: 'get-wcag-references',
    description: 'Gets the "How to Meet" and "Understanding" reference links for a specific success criterion.',
    inputSchema: {
      type: 'object',
      properties: {
        ref_id: {
          type: 'string',
          description: 'Success criterion reference ID (e.g., "1.1.1", "2.4.7")'
        }
      },
      required: ['ref_id']
    },
    handler: async (args) => {
      const result = findSuccessCriterion(args.ref_id);
      
      if (!result) {
        return textResponse(`No success criterion found with ref_id "${args.ref_id}".`);
      }

      const { criterion } = result;
      
      let output = `# References for ${criterion.ref_id} ${criterion.title}\n\n`;
      output += `**WCAG Specification:** ${criterion.url}\n\n`;

      if (criterion.references && criterion.references.length > 0) {
        output += `## Additional Resources\n\n`;
        criterion.references.forEach(ref => {
          output += `- [${ref.title}](${ref.url})\n`;
        });
      } else {
        output += 'No additional references available.\n';
      }

      return textResponse(output);
    }
  },

  {
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
            key = `${sc.principle_ref}. ${sc.principle_title}`;
            break;
          case 'guideline':
            key = `${sc.guideline_ref} ${sc.guideline_title}`;
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
  },

  {
    name: 'get-server-info',
    description: 'Returns information about this WCAG MCP server and data source.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async () => {
      const allCriteria = getAllSuccessCriteria();
      const levelCounts = { A: 0, AA: 0, AAA: 0 };
      allCriteria.forEach(sc => levelCounts[sc.level]++);

      return textResponse(
        `**WCAG MCP Server** v1.0.0\n\n` +
        `A Model Context Protocol server providing access to WCAG 2.2 guidelines and success criteria.\n\n` +
        `## Data Source\n\n` +
        `- **Source:** [tenon-io/wcag-as-json](https://github.com/tenon-io/wcag-as-json)\n` +
        `- **WCAG Version:** 2.2\n` +
        `- **Principles:** ${wcagData.length}\n` +
        `- **Guidelines:** ${wcagData.reduce((sum, p) => sum + p.guidelines.length, 0)}\n` +
        `- **Success Criteria:** ${allCriteria.length} (Level A: ${levelCounts.A}, AA: ${levelCounts.AA}, AAA: ${levelCounts.AAA})\n\n` +
        `## Attribution\n\n` +
        `WCAG data from [wcag-as-json](https://github.com/tenon-io/wcag-as-json) (MIT License).\n\n` +
        `This software includes material copied from or derived from Web Content Accessibility Guidelines (WCAG) 2.2. ` +
        `Copyright © 2023 W3C® (MIT, ERCIM, Keio, Beihang).`
      );
    }
  }
];
