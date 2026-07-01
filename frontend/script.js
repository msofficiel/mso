// Adresse du serveur backend. En local pendant le développement, puis on changera
  // cette valeur quand le site sera déployé en ligne (Jour 3).
  const API_URL = "http://localhost:3000";

  const form = document.getElementById('contactForm');
  const msgEl = document.getElementById('formMsg');

  form.addEventListener('submit', async function(e){
    e.preventDefault();

    const data = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      type: document.getElementById('type').value,
      message: document.getElementById('message').value
    };

    msgEl.style.color = "var(--ink-soft)";
    msgEl.textContent = "Envoi en cours…";

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Une erreur est survenue.");
      }

      msgEl.style.color = "var(--accent2)";
      msgEl.textContent = "Message envoyé — réponse sous 48h.";
      form.reset();
    } catch (err) {
      msgEl.style.color = "#B5502F";
      msgEl.textContent = "Erreur : " + err.message + " (le serveur est-il lancé ?)";
    }
  });


  // FAQ accordéon
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', function(){
    const item = this.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});