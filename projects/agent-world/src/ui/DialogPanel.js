/**
 * Dialog panel DOM overlay — quick interact view.
 * The actual rendering is handled by DialogSystem.js which directly manipulates
 * the #dialog-panel element defined in index.html.
 *
 * This file serves as the future home for enhanced dialog features:
 * - "Mark Complete" button that writes back to DIRECTIVES.md
 * - Task detail expansion
 * - Quick action buttons (assign, reprioritize)
 */

export class DialogPanel {
  constructor(panelElement) {
    this.el = panelElement;
  }

  /**
   * Attach a "Mark Complete" handler to task items.
   * Phase 2 enhancement.
   */
  attachTaskActions(agentTypeId, agentManager) {
    const items = this.el.querySelectorAll('.task-item:not(.completed)');
    items.forEach((item, index) => {
      // TODO Phase 2: add Mark Complete button to each task
      // On click: update DIRECTIVES.md via agentWorld.writeDirectives()
    });
  }
}
