/**
 * Per-agent dialogue banks for the Campus Chatter system.
 * Categories: idle, working, blocked, interiorAdd, interiorSwap, interiorRemove, crossAgent.
 */
export const CHAT_MESSAGES = {
  CE: {
    idle: [
      'Checking voltage levels on the bench.',
      'Might reorganize the component bins today.',
      'The JTAG debugger is acting up again.',
      'Running diagnostics \u2014 all quiet for now.',
      'Browsing datasheets. Resistors don\'t pick themselves.'
    ],
    working: [
      'Got a good flow going. Don\'t interrupt.',
      'Flashing firmware \u2014 fingers crossed.',
      'Pipeline\'s green. Pushing changes.',
      'Deep in the build script. Almost there.'
    ],
    blocked: [
      'Waiting on that dependency to resolve.',
      'Build\'s failing. Need to dig into logs.',
      'Can\'t proceed \u2014 upstream repo is stale.',
      'Blocked on hardware. Shipment\'s late.'
    ],
    interiorAdd: [
      'New equipment in the lab. Let\'s calibrate.',
      'Added another bench module. More workspace.',
      'Fresh gear installed. Time to test.'
    ],
    interiorSwap: [
      'Rearranging the bench layout.',
      'Swapped out a panel. Better airflow now.',
      'Upgraded that station. Much cleaner.'
    ],
    interiorRemove: [
      'Clearing old gear. Out with the obsolete.',
      'Removed a dead component. Less clutter.',
      'Stripped that module down. Making room.'
    ],
    crossAgent: {
      CD: [
        'Hey MUSE, can you mock up a UI for this board?',
        'MUSE \u2014 any ideas for the enclosure design?'
      ],
      PM: [
        'LEAD, timeline estimate for the firmware push?',
        'LEAD \u2014 build\'s done. Can you update the tracker?'
      ],
      RA: [
        'SAGE, found any references on that protocol?',
        'SAGE \u2014 need specs on the new sensor module.'
      ],
      SA: [
        'GATE, is the CI pipeline healthy?',
        'GATE \u2014 I pushed to staging. Can you deploy?'
      ],
      TA: [
        'PROF, this debug trace might make a good lesson.',
        'PROF \u2014 want me to document this fix for students?'
      ]
    }
  },

  CD: {
    idle: [
      'Inspiration struck \u2014 sketching in the margins.',
      'Scrolling through color palettes. Mood: chromatic.',
      'The whiteboard is calling me.',
      'Thinking about negative space again.',
      'Doodling wireframes between tasks.'
    ],
    working: [
      'Deep in the creative zone. Colors everywhere.',
      'Iterating on this layout. Version 4\u2026 maybe 5.',
      'Mockup coming together nicely.',
      'Pushing pixels until they behave.'
    ],
    blocked: [
      'Waiting on copy. Can\'t design around placeholder text.',
      'Need brand guidelines before I proceed.',
      'Stalled \u2014 the brief is too vague.',
      'Blocked on assets. Where are those SVGs?'
    ],
    interiorAdd: [
      'New art on the wall. Studio\'s looking alive.',
      'Added a mood board. Visual inspo everywhere.',
      'Brought in another easel. Can\'t have too many.'
    ],
    interiorSwap: [
      'Rearranged the studio. Fresh perspective.',
      'Swapped the display. Better viewing angle.',
      'Changed the setup \u2014 creativity needs rotation.'
    ],
    interiorRemove: [
      'Decluttered the studio. Minimal is maximal.',
      'Took down old work. Making room for new.',
      'Removed visual noise. Focus sharpened.'
    ],
    crossAgent: {
      CE: [
        'CHIP, can you build what I just designed?',
        'CHIP \u2014 is this layout feasible for the hardware?'
      ],
      PM: [
        'LEAD, how\'s the timeline for the rebrand?',
        'LEAD \u2014 creative assets are ready for review.'
      ],
      RA: [
        'SAGE, any research on UX trends I should see?',
        'SAGE \u2014 pull some competitor visuals for me?'
      ],
      SA: [
        'GATE, the new assets are in the repo.',
        'GATE \u2014 can you check how the images load on prod?'
      ],
      TA: [
        'PROF, want to collab on course slide design?',
        'PROF \u2014 I made some diagrams for your lecture.'
      ]
    }
  },

  PM: {
    idle: [
      'Sprint velocity looking good this cycle.',
      'Reviewing the backlog. Priorities shifting.',
      'All boards updated. Breathing room.',
      'Checking in on the roadmap.',
      'No fires today. Suspicious, but I\'ll take it.'
    ],
    working: [
      'Triaging tickets. The backlog never sleeps.',
      'Syncing timelines across the team.',
      'Updating the Kanban. Cards are moving.',
      'Running the numbers on this sprint.'
    ],
    blocked: [
      'Waiting on status updates from everyone.',
      'Can\'t close this without stakeholder sign-off.',
      'Blocked on scope \u2014 need a decision.',
      'Dependency chain is holding everything up.'
    ],
    interiorAdd: [
      'New board in the command center. More visibility.',
      'Added a status display. Data at a glance.',
      'Set up another tracking station.'
    ],
    interiorSwap: [
      'Reorganized the command layout.',
      'Swapped monitor positions. Better workflow.',
      'Updated the board arrangement.'
    ],
    interiorRemove: [
      'Cleared an old dashboard. Outdated metrics.',
      'Removed redundant tracking. Streamlined.',
      'Took down the legacy board.'
    ],
    crossAgent: {
      CE: [
        'CHIP, what\'s the ETA on that build?',
        'CHIP \u2014 any blockers I should flag?'
      ],
      CD: [
        'MUSE, design review is Thursday.',
        'MUSE \u2014 assets due by end of sprint.'
      ],
      RA: [
        'SAGE, can you prioritize that research item?',
        'SAGE \u2014 findings report is overdue.'
      ],
      SA: [
        'GATE, is the deploy pipeline green?',
        'GATE \u2014 production status check, please.'
      ],
      TA: [
        'PROF, any course deadlines I should track?',
        'PROF \u2014 can you update your task status?'
      ]
    }
  },

  RA: {
    idle: [
      'Found a promising citation. Following the thread.',
      'Cross-referencing sources. The data tells a story.',
      'Quiet day in the archive. Good for reading.',
      'Browsing the latest journals.',
      'Organizing my reference library.'
    ],
    working: [
      'Deep in the literature. Papers everywhere.',
      'Running analysis on the new dataset.',
      'Hypothesis forming \u2014 need more data points.',
      'Writing up findings. Almost publication-ready.'
    ],
    blocked: [
      'Waiting on access to that database.',
      'Need more samples. Data is insufficient.',
      'Blocked \u2014 journal paywall. Classic.',
      'Can\'t proceed without peer review feedback.'
    ],
    interiorAdd: [
      'New bookshelf installed. More shelf space!',
      'Added a reference station. Research intensifies.',
      'Brought in more archive storage.'
    ],
    interiorSwap: [
      'Reorganized the stacks. Better indexing.',
      'Swapped shelf arrangement. Logical grouping.',
      'Updated the reading nook setup.'
    ],
    interiorRemove: [
      'Weeded old journals. Keeping it current.',
      'Removed outdated references.',
      'Cleared shelf space for new acquisitions.'
    ],
    crossAgent: {
      CE: [
        'CHIP, I found specs that match your project.',
        'CHIP \u2014 can you validate this technical claim?'
      ],
      CD: [
        'MUSE, need a figure for this paper.',
        'MUSE \u2014 can you visualize this dataset?'
      ],
      PM: [
        'LEAD, research phase is on track.',
        'LEAD \u2014 I\'ll have the report by Friday.'
      ],
      SA: [
        'GATE, is the data server backed up?',
        'GATE \u2014 need access to the analytics endpoint.'
      ],
      TA: [
        'PROF, good teaching moment in these results.',
        'PROF \u2014 this study would fit your curriculum.'
      ]
    }
  },

  SA: {
    idle: [
      'All services green. Monitoring continues.',
      'Checking SSL certs. Expiry in 47 days.',
      'Quiet on the ops front. Just how I like it.',
      'Reviewing access logs. Nothing unusual.',
      'Running routine health checks.'
    ],
    working: [
      'Deploying to production. Stand by.',
      'Configuring DNS records. Propagation pending.',
      'Patching the server. Maintenance window open.',
      'Spinning up a new instance.'
    ],
    blocked: [
      'DNS propagation is crawling. Patience.',
      'Blocked on credentials. Who has the keys?',
      'Build failed in CI. Investigating.',
      'Waiting on domain registrar. Bureaucracy.'
    ],
    interiorAdd: [
      'Racked a new server. More capacity.',
      'Added monitoring hardware to the NOC.',
      'New network switch installed.'
    ],
    interiorSwap: [
      'Rewired the rack layout. Better cable management.',
      'Swapped out the old switch. Faster throughput.',
      'Updated the control room display.'
    ],
    interiorRemove: [
      'Decommissioned old hardware. End of life.',
      'Pulled a dead node from the rack.',
      'Removed deprecated monitoring gear.'
    ],
    crossAgent: {
      CE: [
        'CHIP, the staging server is ready for your build.',
        'CHIP \u2014 pushed your firmware to the test env.'
      ],
      CD: [
        'MUSE, assets are cached and serving.',
        'MUSE \u2014 image CDN is updated.'
      ],
      PM: [
        'LEAD, deploy complete. All green.',
        'LEAD \u2014 uptime report attached.'
      ],
      RA: [
        'SAGE, your data backups are current.',
        'SAGE \u2014 analytics endpoint is live.'
      ],
      TA: [
        'PROF, course site is up and healthy.',
        'PROF \u2014 LMS integration checks out.'
      ]
    }
  },

  TA: {
    idle: [
      'Reviewing lecture notes from last session.',
      'Good teaching moment in those results.',
      'Thinking about how to explain this concept.',
      'Office hours are quiet. Catching up on grading.',
      'Updating the syllabus for next week.'
    ],
    working: [
      'Building out new problem sets.',
      'Recording supplemental video. Take three.',
      'Writing detailed solution guides.',
      'Designing an interactive demo for class.'
    ],
    blocked: [
      'Waiting on textbook errata confirmation.',
      'Can\'t finalize the exam without the rubric.',
      'Blocked on lab equipment availability.',
      'Need admin approval for the course change.'
    ],
    interiorAdd: [
      'New projector setup. Visual learning upgrade.',
      'Added a demo station for hands-on work.',
      'Brought in more desk space for students.'
    ],
    interiorSwap: [
      'Rearranged the classroom layout.',
      'Swapped the podium angle. Better sightlines.',
      'Updated the display configuration.'
    ],
    interiorRemove: [
      'Cleared old handouts. Going digital.',
      'Removed the broken projector mount.',
      'Took out unused furniture. More room to move.'
    ],
    crossAgent: {
      CE: [
        'CHIP, can you set up the lab equipment?',
        'CHIP \u2014 students need a debug walkthrough.'
      ],
      CD: [
        'MUSE, these slides need your design touch.',
        'MUSE \u2014 can you make a diagram for Ch. 25?'
      ],
      PM: [
        'LEAD, course deliverables are on schedule.',
        'LEAD \u2014 need the grading timeline updated.'
      ],
      RA: [
        'SAGE, any new papers for the reading list?',
        'SAGE \u2014 can you fact-check this lecture note?'
      ],
      SA: [
        'GATE, is the course site loading fast?',
        'GATE \u2014 students are reporting a login issue.'
      ]
    }
  }
};
