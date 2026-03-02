import { EVOLUTION_STAGES, XP_REWARDS } from '../data/evolutionThresholds.js';

/**
 * Manages agent evolution (XP, threshold checks, stage transitions).
 * Phase 4 implementation — stubbed for now with core logic.
 */
export class EvolutionSystem {
  /**
   * Award XP for completing a task.
   * @param {object} agent - Agent instance from AgentManager
   * @param {string} priority - Task priority (P1-P5)
   * @returns {number} XP awarded
   */
  static awardTaskXP(agent, priority) {
    const xp = XP_REWARDS.taskComplete[priority] || 0;
    agent.experience.totalXP += xp;
    agent.experience.tasksCompleted += 1;
    if (agent.experience.tasksByPriority[priority] !== undefined) {
      agent.experience.tasksByPriority[priority] += 1;
    }
    return xp;
  }

  /**
   * Award XP for a novel contribution (player-marked Type 3 behavior).
   */
  static awardNovelContribution(agent) {
    agent.experience.novelContributions += 1;
    agent.experience.totalXP += XP_REWARDS.novelContribution;
    return XP_REWARDS.novelContribution;
  }

  /**
   * Check if an agent meets the quantitative threshold for the next evolution stage.
   * Does NOT automatically evolve — returns eligibility for player confirmation.
   */
  static checkEvolutionEligibility(agent) {
    const nextStage = agent.evolutionStage + 1;
    const threshold = EVOLUTION_STAGES[nextStage];

    if (!threshold) return { eligible: false, reason: 'Already at max evolution.' };

    const checks = [];

    if (threshold.xpRequired && agent.experience.totalXP < threshold.xpRequired) {
      checks.push(`XP: ${agent.experience.totalXP}/${threshold.xpRequired}`);
    }
    if (threshold.tasksRequired && agent.experience.tasksCompleted < threshold.tasksRequired) {
      checks.push(`Tasks: ${agent.experience.tasksCompleted}/${threshold.tasksRequired}`);
    }
    if (threshold.novelContributionsRequired && agent.experience.novelContributions < threshold.novelContributionsRequired) {
      checks.push(`Novel contributions: ${agent.experience.novelContributions}/${threshold.novelContributionsRequired}`);
    }

    if (checks.length > 0) {
      return { eligible: false, reason: `Not yet met: ${checks.join(', ')}` };
    }

    return {
      eligible: true,
      nextStage,
      stageName: threshold.name,
      expertType: threshold.expertType,
      requiresConfirmation: threshold.qualitativeGate
    };
  }

  /**
   * Evolve an agent to the next stage (called after player confirmation).
   */
  static evolve(agent) {
    const eligibility = this.checkEvolutionEligibility(agent);
    if (!eligibility.eligible) return false;
    agent.evolutionStage = eligibility.nextStage;
    return true;
  }
}
