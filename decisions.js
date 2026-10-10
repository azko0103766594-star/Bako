/* decisions.js – Decisions / Plans + Infos */

// ========== DECISIONS ==========
function renderDecisions() {
  const list = document.getElementById('decisions-list');
  const cal = document.getElementById('calendar-view');
  if (!list || !cal) return;
  list.innerHTML = '';
  const decs = state.decisions[state.currentSpaceId] || [];
  if (!decs.length) {
    cal.innerHTML = '<p>Aucune décision.<br>Lance-en une !</p>';
    return;
  }
  const voted = decs.filter(d => d.options && d.options.some(o => o.votes > 0));
  cal.innerHTML = voted.length
    ? voted.map(d => {
        const w = d.options.reduce((a, b) => a.votes >= b.votes ? a : b);
        return '<p><strong>' + d.q + '</strong><br>→ ' + w.text + '</p>';
      }).join('')
    : '<p>Votes en cours...</p>';

  decs.forEach((d, di) => {
    const card = document.createElement('div');
    card.className = 'decision-card';
    card.innerHTML = '<h4>' + d.q + '</h4>' + d.options.map((o, oi) =>
      '<div class="opt ' + (o.me ? 'voted' : '') + '" data-d="' + di + '" data-o="' + oi + '"><span>' + o.text + '</span><span class="v">' + o.votes + ' vote' + (o.votes > 1 ? 's' : '') + '</span></div>'
    ).join('');
    list.appendChild(card);
  });
  list.querySelectorAll('.opt').forEach(el => {
    el.onclick = () => {
      const d = state.decisions[state.currentSpaceId][el.dataset.d];
      d.options.forEach(o => { if (o.me) { o.votes = Math.max(0, o.votes - 1); o.me = false; } });
      d.options[el.dataset.o].votes++;
      d.options[el.dataset.o].me = true;
      save();
      renderDecisions();
      toast('Vote enregistré');
    };
  });
}

function createDecision() {
  const q = (document.getElementById('decision-question').value || '').trim();
  const raw = (document.getElementById('decision-options').value || '').trim();
  if (!q || !raw) { toast('Remplis tout'); return; }
  const opts = raw.split('\n').map(s => s.trim()).filter(Boolean).map(t => ({ text: t, votes: 0, me: false }));
  if (opts.length < 2) { toast('Min 2 options'); return; }
  if (!state.decisions[state.currentSpaceId]) state.decisions[state.currentSpaceId] = [];
  state.decisions[state.currentSpaceId].push({ id: uid(), q, options: opts });
  save();
  document.getElementById('modal-decision').classList.remove('show');
  renderDecisions();
  toast('Décision lancée !');
}

function renderInfos() {
  const sp = state.spaces.find(s => s.id === state.currentSpaceId);
  if (!sp) return;
  document.getElementById('space-code-display').textContent = sp.code || '------';
  document.getElementById('invite-link').value = sp.link || (getBaseUrl() + '/?code=' + sp.code);
  document.getElementById('members-list').innerHTML = (sp.members || []).map(m => {
    const av = m.avatar
      ? '<img src="' + m.avatar + '" alt="">'
      : initial(m.firstname);
    return '<li><div class="m-avatar">' + av + '</div><span>' + m.firstname + ' <small style="color:#A1A1AA">@' + m.username + '</small></span></li>';
  }).join('');
}

