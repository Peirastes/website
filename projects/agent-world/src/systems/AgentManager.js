import { DirectivesParser } from './DirectivesParser.js';
import { AGENT_TYPES } from '../data/agentDefinitions.js';

/**
 * Central registry for agent state and parsed directives.
 */
export class AgentManager {
  constructor() {
    // Parsed directives for each agent type
    this.directives = {};
    // Runtime agent instance data (for evolution/XP tracking)
    this.agents = {};

    // Initialize default state for each agent type
    for (const typeId of Object.keys(AGENT_TYPES)) {
      this.agents[typeId] = {
        id: `${typeId.toLowerCase()}_001`,
        typeId,
        name: AGENT_TYPES[typeId].defaultNickname,
        evolutionStage: 1,
        experience: {
          tasksCompleted: 0,
          tasksByPriority: { P1: 0, P2: 0, P3: 0, P4: 0, P5: 0 },
          novelContributions: 0,
          totalXP: 0
        },
        mood: 'idle',
        interior: {},
        lastInteriorChange: 0
      };
    }
  }

  /**
   * Update directives from raw markdown content.
   */
  updateDirectives(agentTypeId, content) {
    this.directives[agentTypeId] = DirectivesParser.parse(content);
    // Update mood based on task state
    this.updateMood(agentTypeId);
  }

  /**
   * Get parsed directives for an agent.
   */
  getDirectives(agentTypeId) {
    return this.directives[agentTypeId] || null;
  }

  /**
   * Get agent instance data.
   */
  getAgent(agentTypeId) {
    return this.agents[agentTypeId] || null;
  }

  /**
   * Update agent mood based on current task state.
   */
  updateMood(agentTypeId) {
    const directives = this.directives[agentTypeId];
    if (!directives) return;

    const agent = this.agents[agentTypeId];
    const activeTasks = directives.activeTasks.filter(t => !t.isComplete);

    if (activeTasks.some(t => t.isBlocked)) {
      agent.mood = 'blocked';
    } else if (activeTasks.some(t => t.status.toLowerCase().includes('in progress'))) {
      agent.mood = 'working';
    } else {
      agent.mood = 'idle';
    }
  }

  /**
   * Get a summary of all agents for the HUD.
   */
  getSummary() {
    const summary = {};
    for (const typeId of Object.keys(AGENT_TYPES)) {
      const agent = this.agents[typeId];
      const directives = this.directives[typeId];
      const activeTasks = directives
        ? directives.activeTasks.filter(t => !t.isComplete)
        : [];

      summary[typeId] = {
        name: agent.name,
        mood: agent.mood,
        evolutionStage: agent.evolutionStage,
        activeTaskCount: activeTasks.length,
        blockedCount: activeTasks.filter(t => t.isBlocked).length,
        color: AGENT_TYPES[typeId].color
      };
    }
    return summary;
  }

  /**
   * Load saved agent state.
   */
  loadState(savedData) {
    if (savedData && savedData.agents) {
      for (const [typeId, agentData] of Object.entries(savedData.agents)) {
        if (this.agents[typeId]) {
          Object.assign(this.agents[typeId], agentData);
        }
      }
    }
  }

  /**
   * Get serializable state for saving.
   */
  getState() {
    return { agents: this.agents };
  }
}
