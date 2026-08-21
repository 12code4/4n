/* v2.0 — Contract clients & market news. Data for systems/contracts.js and
 * the market-event engine in economy.js. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var D = G.DATA;

  /* Clients flavor the offers and set their generosity. */
  D.contractClients = [
    { id: 'glaziers', name: 'The Glasswrights’ Guild', mult: 1.6, likes: ['ember_glass', 'wisp_resin'],
      blurb: 'Cathedral windows that glow after dark. Ask nothing else.' },
    { id: 'bellfound', name: 'Harrowick Bellfoundry', mult: 1.7, likes: ['singing_ore', 'grave_iron'],
      blurb: 'A bell for every town the comet spared.' },
    { id: 'apotheca', name: 'The Valley Apothecaries', mult: 1.65, likes: ['root_amber', 'cinderbloom', 'wisp_resin'],
      blurb: 'Tinctures, salves, and things best not asked after.' },
    { id: 'crown_assay', name: 'The Crown Assay', mult: 1.9, likes: ['pale_coin', 'hollow_pearl', 'vel_shard'],
      blurb: 'The capital wants samples. The capital pays like it’s guilty.' },
    { id: 'smiths', name: 'The Ironmongers’ Court', mult: 1.55, likes: ['slag_iron', 'forge_salt', 'grave_iron'],
      blurb: 'Honest metal for honest work, priced dishonestly in your favor.' },
    { id: 'priest', name: 'The Bone-Chapel', mult: 2.1, likes: ['pale_coin', 'hollow_pearl'],
      blurb: '(The request arrives written on a knucklebone.)' }
  ];

  /* Market shock templates. mult applied to drifted price for `days`. */
  D.marketNews = [
    { mult: [1.3, 1.8], days: [3, 5], head: '{client} corners the {mat} supply — prices surge!' },
    { mult: [1.25, 1.6], days: [3, 4], head: 'Caravan from the capital pays premium for {mat}.' },
    { mult: [0.5, 0.75], days: [3, 5], head: 'A rival crew floods the market with {mat}.' },
    { mult: [0.55, 0.8], days: [2, 4], head: 'Fashion turns: {mat} is "last season" in the capital.' },
    { mult: [1.4, 1.9], days: [2, 3], head: 'The {client} lost a warehouse to fire — {mat} wanted urgently.' },
    { mult: [0.6, 0.85], days: [3, 5], head: 'Tariff row: {mat} shipments stalled at the toll bridge.' }
  ];

  /* Injuries (v2.0): survivors who surface badly hurt may carry these home. */
  D.injuries = [
    { id: 'ribs', name: 'Cracked Ribs', mod: { might: -2 }, days: 6, desc: 'Every swing costs a wince. −2 Might until healed.' },
    { id: 'ligament', name: 'Torn Ligament', mod: { wits: -2 }, days: 6, desc: 'Slow on the turn. −2 Wits until healed.' },
    { id: 'nerves', name: 'Shaken Nerves', mod: { luck: -2 }, days: 5, desc: 'Twitchy at shadows. −2 Luck until healed.' },
    { id: 'gash', name: 'Deep Gash', mod: { vig: -6 }, days: 7, desc: 'A wound with opinions. −6 Vigor until healed.' }
  ];
})();
