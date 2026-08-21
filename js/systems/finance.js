/* v6.0 — The Countinghouse: daily interest on banked marks and short loans. */
(function () {
  var G = (globalThis.G = globalThis.G || {});
  var F = (G.Finance = {});

  F.rate = function () { return G.bldFx('countinghouse', 'interest', 0); };
  F.loanCap = function () { return G.bldFx('countinghouse', 'loanCap', 0); };

  /* interest is paid on marks held over a floor, capped so it can't snowball */
  F.dailyInterest = function () {
    var st = G.state;
    if (!G.bld('countinghouse')) return;
    var rate = F.rate();
    var over = Math.max(0, st.marks - 20); // first 20 marks earn nothing (petty cash)
    var gain = Math.min(40 + G.bld('countinghouse') * 20, Math.floor(over * rate));
    if (gain > 0) { st.marks += gain; st.stats.earned += gain; }
    // a live loan accrues and comes due
    if (st.loan) {
      if (st.day >= st.loan.dueDay) {
        var owed = st.loan.owed;
        if (st.marks >= owed) { st.marks -= owed; st.stats.spent += owed; st.loan = null; G.log('Loan repaid in full (' + owed + 'ᵯ).', 'info'); }
        else {
          // partial seizure + renown ding; the rest rolls with penalty interest
          st.marks = 0; st.loan.owed = Math.round((owed - st.marks) * 1.15);
          st.loan.dueDay = st.day + 3;
          if (G.Renown) G.Renown.award(null, -8);
          G.log('Loan overdue — the Countinghouse seizes what it can and adds penalty interest. Renown suffers.', 'bad');
        }
      }
    }
  };

  F.takeLoan = function (amount) {
    var st = G.state;
    if (!G.bld('countinghouse')) return { ok: false, msg: 'No Countinghouse.' };
    if (st.loan) return { ok: false, msg: 'A loan is already outstanding.' };
    amount = G.U.clamp(amount | 0, 10, F.loanCap());
    st.marks += amount;
    st.loan = { principal: amount, owed: Math.round(amount * 1.2), dueDay: st.day + 8 };
    G.log('Loan taken: ' + amount + 'ᵯ now, ' + st.loan.owed + 'ᵯ due by day ' + st.loan.dueDay + '.', 'info');
    G.emit('finance');
    return { ok: true };
  };
  F.repayLoan = function () {
    var st = G.state;
    if (!st.loan) return { ok: false, msg: 'No loan to repay.' };
    if (st.marks < st.loan.owed) return { ok: false, msg: 'Not enough marks to repay (' + st.loan.owed + 'ᵯ).' };
    st.marks -= st.loan.owed; st.stats.spent += st.loan.owed;
    G.log('Loan repaid early (' + st.loan.owed + 'ᵯ). The clerk is briefly disappointed.', 'good');
    st.loan = null;
    G.emit('finance');
    return { ok: true };
  };
})();
