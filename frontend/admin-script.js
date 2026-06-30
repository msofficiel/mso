const API_URL = "http://localhost:3000";

  const loginView = document.getElementById('loginView');
  const dashView = document.getElementById('dashView');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const msgList = document.getElementById('msgList');

  function getToken(){ return localStorage.getItem('albiher_token'); }
  function setToken(t){ localStorage.setItem('albiher_token', t); }
  function clearToken(){ localStorage.removeItem('albiher_token'); }

  function showDash(){ loginView.style.display='none'; dashView.style.display='block'; loadMessages(); }
  function showLogin(){ dashView.style.display='none'; loginView.style.display='flex'; }

  // Au chargement de la page : si on a déjà un token, on va direct au tableau de bord
  if (getToken()) showDash(); else showLogin();

  loginForm.addEventListener('submit', async function(e){
    e.preventDefault();
    loginError.style.display = 'none';
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de connexion');

      setToken(data.token);
      showDash();
    } catch (err) {
      loginError.textContent = err.message;
      loginError.style.display = 'block';
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', function(){
    clearToken();
    showLogin();
  });

  async function loadMessages(){
    msgList.innerHTML = '<p class="empty">Chargement…</p>';
    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        headers: { 'Authorization': 'Bearer ' + getToken() }
      });
      if (res.status === 401) { clearToken(); showLogin(); return; }
      const messages = await res.json();
      renderMessages(messages);
    } catch (err) {
      msgList.innerHTML = '<p class="empty">Impossible de charger les messages. Le serveur est-il lancé ?</p>';
    }
  }

  function renderMessages(messages){
    document.getElementById('statTotal').textContent = messages.length;
    document.getElementById('statNew').textContent = messages.filter(m => m.status === 'nouveau').length;

    if (messages.length === 0){
      msgList.innerHTML = '<p class="empty">Aucune demande reçue pour le moment.</p>';
      return;
    }

    msgList.innerHTML = messages.map(m => {
      const date = new Date(m.created_at).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
      return `
        <div class="msg-row">
          <div class="when">${date}</div>
          <div class="who">
            <h3>${escapeHtml(m.name)}</h3>
            <span class="em">${escapeHtml(m.email)}</span>
            <p class="txt">${escapeHtml(m.message)}</p>
          </div>
          <div class="type">${escapeHtml(m.project_type || '—')}</div>
          <div>
            <span class="status-badge" data-status="${m.status}" data-id="${m.id}">${m.status}</span>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.status-badge').forEach(badge => {
      badge.addEventListener('click', async function(){
        const newStatus = this.dataset.status === 'nouveau' ? 'traité' : 'nouveau';
        await fetch(`${API_URL}/api/messages/${this.dataset.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
          body: JSON.stringify({ status: newStatus })
        });
        loadMessages();
      });
    });
  }

  // Évite qu'un message contenant du HTML/script casse la page ou exécute du code
  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
