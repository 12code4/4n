/* Story content: intro, journal pages (Maren's expedition log), townsfolk barks. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  G.DATA = G.DATA || {};

  G.DATA.intro = {
    title: 'The Deed to Vale & Co.',
    body: [
      'Twelve years ago the comet Vel fell on Hollowbrook and did not explode. It burrowed. Where it passed, the earth stayed open — galleries of ember-glass, stairwells nobody built, wealth bleeding upward like the ground had been holding its breath.',
      'Maren Vale went down further than anyone. Then she outfitted one last expedition — her best delvers, her whole fortune — and the Maw kept all of it.',
      'The charter passes to you: one leaky storehouse, three days of tavern credit, and forty marks. Pinned to the assay desk, in her hand:',
      '“The Maw doesn’t take. It trades. Find out what it wants.”',
      '— Hire delvers at the tavern. Outfit an expedition. Go down, come back richer, and build something that outlasts the people you spend.'
    ]
  };

  /* Journal pages unlock at flags; expedition/system code sets flags. */
  G.DATA.journal = [
    {
      id: 'page1', title: 'Maren’s Log — Day 1 of the Last Descent', unlock: 'depth2',
      body: 'The Gullet again. The glass here holds old light — hold a slab to your ear at the right angle and you can watch a sunset from before the comet. The crews mine sunsets now. I pay them in the mornings. Fair trade is the whole grammar of this place; I have started leaving chalk where the exchange rate is honest.'
    },
    {
      id: 'page2', title: 'Maren’s Log — Day 4', unlock: 'depth3',
      body: 'There is a warden at the bottom of the Gullet. Old crew, I think — the first charter, the one before mine that nobody talks about. It stands where the stair narrows and it checks what you carry, both directions. Ticket, toll, tithe — pick your word. Pay it in blood or pay it in weight. It has never once cheated anyone. I find that worse.'
    },
    {
      id: 'page3', title: 'Maren’s Log — Day 5, margin note', unlock: 'guardian_gullet',
      body: 'We put the Warden down today. It took Corvo’s arm at the shoulder and thanked us when it died — I will not be writing that in the company minutes. Below the stair the rules change. The prices, too. Whatever mints those pale coins has noticed there is a new counterparty. The Maw adjusted its rates overnight. It is *negotiating*.'
    }
  ];

  /* Townsfolk barks: shown on the town screen, rotating; some react to flags. */
  G.DATA.barks = [
    { who: 'Petra Kiln', text: 'Assay’s open. Bring me anything with facets and I’ll tell you what the honest price was yesterday.' },
    { who: 'Petra Kiln', text: 'These pale coins — the wear on the faces is identical. Every one. You don’t wear coins identical, you MINT them worn. Who mints a worn coin?' },
    { who: 'Dov Harrow', text: 'Tavern rule: delvers drink half price the night before a descent and free the night after. Grief I pour at cost.' },
    { who: 'Dov Harrow', text: 'Maren’s tab stays open. She’s good for it. She’s always been good for it.' },
    { who: 'Dov Harrow', text: 'New faces come through weekly looking for delve work. Keep the tavern in good repair and I’ll keep the good ones drinking here.' },
    { who: 'The Silent Priest', text: '…' },
    { who: 'Petra Kiln', text: 'Storehouse insurance in this town is a handshake and a prayer. Build the walls thicker instead.' },
    { who: 'Dov Harrow', text: 'The Maw pays better than any mine in the valley. Mines don’t pay back, though. Remember that on the good weeks.' },
    { who: 'Petra Kiln', flag: 'guardian_gullet', text: 'You put the Warden down? Then it’s true what the old charter said — the Maw keeps a staff. And now it has an opening.' },
    { who: 'The Silent Priest', flag: 'guardian_gullet', text: '(He looks at you for a long moment, then rings a small bone bell, once.)' }
  ];

  G.DATA.tips = [
    'Torches burn one per passage. Darkness costs blood.',
    'Wages come due every dusk. Delvers with empty pockets walk.',
    'The market drifts daily. Hoard what’s cheap; sell what the town wants.',
    'A Shaft node is always a way home. Going deeper is always a choice.',
    'Grit is shared. Strikes and Guards earn it; skills spend it.',
    'The Infirmary heals whoever stays home. The graveyard takes whoever doesn’t.'
  ];
})();
