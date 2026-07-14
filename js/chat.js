/* ===================================================================
   CHAT.JS — Multilingual Chat Simulation (Interactive Demo)
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initChat();
});

function initChat() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const colEn = document.getElementById('chat-col-en');
  const colEs = document.getElementById('chat-col-es');
  const colAr = document.getElementById('chat-col-ar');
  const quickPrompts = document.querySelectorAll('.chat__quick-prompt');

  if (!input || !sendBtn || !colEn || !colEs || !colAr) return;

  // Translation database (pre-scripted for demo)
  const translations = {
    'Where is Gate B?': {
      es: '¿Dónde está la Puerta B?',
      ar: 'أين البوابة B؟',
      aiEn: 'Gate B is on the east side of MetLife Stadium, accessible from Lot J parking. From your current location near Section 214, head down Ramp 3 — approximately 4 minutes on foot.',
      aiEs: 'La Puerta B está en el lado este del MetLife Stadium, accesible desde el estacionamiento Lote J. Desde tu ubicación actual cerca de la Sección 214, baja por la Rampa 3 — aproximadamente 4 minutos a pie.',
      aiAr: 'البوابة B تقع في الجانب الشرقي من ملعب MetLife، ويمكن الوصول إليها من موقف السيارات Lot J. من موقعك الحالي بالقرب من القسم 214، انزل من المنحدر 3 — حوالي 4 دقائق سيراً على الأقدام.'
    },
    'When does the match start?': {
      es: '¿Cuándo comienza el partido?',
      ar: 'متى تبدأ المباراة؟',
      aiEn: 'USA vs. Brazil kicks off at 20:00 EDT tonight (July 10, 2026). Gates open at 17:30. You\'re in Section 214, Row G — we recommend arriving by 19:15 to be seated comfortably before the opening ceremony.',
      aiEs: 'USA vs. Brasil inicia a las 20:00 EDT esta noche (10 de julio de 2026). Las puertas abren a las 17:30. Estás en la Sección 214, Fila G — recomendamos llegar a las 19:15 para estar sentado cómodamente antes de la ceremonia de apertura.',
      aiAr: 'تبدأ مباراة الولايات المتحدة ضد البرازيل الساعة 20:00 بتوقيت EDT الليلة (10 يوليو 2026). تفتح البوابات الساعة 17:30. أنت في القسم 214، الصف G — ننصحك بالوصول بحلول 19:15 لتكون جالساً بارتياح قبل حفل الافتتاح.'
    },
    'I need wheelchair assistance': {
      es: 'Necesito asistencia en silla de ruedas',
      ar: 'أحتاج مساعدة للكرسي المتحرك',
      aiEn: 'Wheelchair assistance is on the way. I\'ve notified the nearest accessibility team member (Concourse C, Zone 14 — ETA 2 minutes). Your accessible route to Section 214 uses Elevator Bank 3 and Ramp 2A — I\'ll guide you turn by turn once assistance arrives.',
      aiEs: 'La asistencia en silla de ruedas está en camino. He notificado al miembro más cercano del equipo de accesibilidad (Pasillo C, Zona 14 — llegada estimada en 2 minutos). Tu ruta accesible a la Sección 214 usa el Banco de Ascensores 3 y la Rampa 2A — te guiaré paso a paso cuando llegue la asistencia.',
      aiAr: 'المساعدة بالكرسي المتحرك في الطريق. لقد أبلغت أقرب عضو في فريق إمكانية الوصول (الممر C، المنطقة 14 — الوصول المتوقع خلال دقيقتين). مسارك المتاح للقسم 214 يستخدم مجموعة المصاعد 3 والمنحدر 2A — سأرشدك خطوة بخطوة عند وصول المساعدة.'
    },
    'Where can I find halal food?': {
      es: '¿Dónde puedo encontrar comida halal?',
      ar: 'أين أجد طعام حلال؟',
      aiEn: 'Halal food is available at two locations near you: (1) "Saffron Kitchen" — Concourse C, Stand 47 (3 min walk, ~2 min queue now): lamb shawarma, chicken biryani, falafel wraps. (2) "Global Grill" — Concourse B, Stand 22 (5 min walk, no queue): certified halal burgers and grilled chicken. Both vendors are FIFA-certified halal compliant.',
      aiEs: 'La comida halal está disponible en dos ubicaciones cerca de ti: (1) "Saffron Kitchen" — Pasillo C, Puesto 47 (3 min caminando, ~2 min de cola ahora): shawarma de cordero, biryani de pollo, wraps de falafel. (2) "Global Grill" — Pasillo B, Puesto 22 (5 min caminando, sin cola): hamburguesas halal certificadas y pollo a la parrilla.',
      aiAr: 'الطعام الحلال متوفر في موقعين بالقرب منك: (1) "مطبخ الزعفران" — الممر C، المتجر 47 (3 دقائق مشياً، ~دقيقتان انتظار حالياً): شاورما لحم، برياني دجاج، لفائف فلافل. (2) "الشواية العالمية" — الممر B، المتجر 22 (5 دقائق مشياً، بدون انتظار): برغر حلال معتمد ودجاج مشوي.'
    }
  };

  // Fallback for unrecognized messages
  const fallback = {
    es: 'Lo siento, no tengo una traducción específica para eso. Un voluntario puede ayudarte en el Escritorio de Servicios al Visitante más cercano.',
    ar: 'عذراً، ليس لدي ترجمة محددة لذلك. يمكن لمتطوع مساعدتك في أقرب مكتب خدمات الزوار.',
    aiEn: 'I\'ll connect you with a volunteer who can help with that specific request. The nearest Guest Services desk is at Concourse C, next to Elevator Bank 2 — 2 minutes from your location.',
    aiEs: 'Te conectaré con un voluntario que pueda ayudarte con esa solicitud específica. El escritorio de Servicios al Visitante más cercano está en el Pasillo C, junto al Banco de Ascensores 2 — a 2 minutos de tu ubicación.',
    aiAr: 'سأوصلك بمتطوع يمكنه مساعدتك في هذا الطلب المحدد. أقرب مكتب خدمات الزوار في الممر C، بجانب مجموعة المصاعد 2 — على بعد دقيقتين من موقعك.'
  };

  /**
   * Sanitizes user input to prevent XSS
   * @param {string} str - Raw user input
   * @returns {string} Sanitized string
   */
  function sanitizeInput(str) {
    return str.replace(/[&<>"']/g, function(m) {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#039;';
        default: return m;
      }
    });
  }

  let isProcessing = false;

  function addMessage(column, text, type, delay = 0) {
    return new Promise(resolve => {
      setTimeout(() => {
        const msg = document.createElement('div');
        msg.className = `chat__message chat__message--${type}`;
        if (column.id === 'chat-col-ar') {
          msg.style.direction = 'rtl';
          msg.style.textAlign = 'right';
        }
        msg.innerHTML = sanitizeInput(text);
        column.appendChild(msg);
        column.scrollTop = column.scrollHeight;
        resolve();
      }, delay);
    });
  }

  function addTypingIndicator(column) {
    const indicator = document.createElement('div');
    indicator.className = 'chat__message chat__message--ai chat__message--typing';
    indicator.setAttribute('aria-label', 'AI is typing');
    if (column.id === 'chat-col-ar') {
      indicator.style.direction = 'rtl';
    }
    column.appendChild(indicator);
    column.scrollTop = column.scrollHeight;
    return indicator;
  }

  async function processMessage(text) {
    if (isProcessing) return;
    isProcessing = true;

    const trimmed = text.trim();
    if (!trimmed) { isProcessing = false; return; }

    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;

    const pipeline = document.getElementById('chat-pipeline');
    
    // Find translation
    const trans = translations[trimmed] || null;

    // Add user message to English column
    await addMessage(colEn, trimmed, 'user');

    // Pipeline: Detecting
    if (pipeline) {
      pipeline.innerHTML = `
        <span class="chat__pipeline-step active" id="pipe-detect">🔍 Detecting language...</span>
        <span class="chat__pipeline-arrow">▶</span>
        <span class="chat__pipeline-step" id="pipe-trans">🌐 Translating to ES, AR...</span>
        <span class="chat__pipeline-arrow">▶</span>
        <span class="chat__pipeline-step" id="pipe-gen">💬 Generating AI Response...</span>
      `;
    }
    
    await new Promise(r => setTimeout(r, 600));

    // Pipeline: Translating
    if (pipeline) {
      document.getElementById('pipe-detect').classList.replace('active', 'done');
      document.getElementById('pipe-trans').classList.add('active');
    }

    // Add translated user messages
    if (trans) {
      await addMessage(colEs, trans.es, 'user', 400);
      await addMessage(colAr, trans.ar, 'user', 600);
    } else {
      await addMessage(colEs, trimmed + ' (→ traduciendo...)', 'user', 400);
      await addMessage(colAr, trimmed + ' (→ ...ترجمة)', 'user', 600);
    }

    // Show typing indicators & Pipeline: Generating
    if (pipeline) {
      document.getElementById('pipe-trans').classList.replace('active', 'done');
      document.getElementById('pipe-gen').classList.add('active');
    }

    await new Promise(r => setTimeout(r, 400));
    const typEn = addTypingIndicator(colEn);
    const typEs = addTypingIndicator(colEs);
    const typAr = addTypingIndicator(colAr);

    // Wait for "AI processing"
    await new Promise(r => setTimeout(r, 1500));

    // Remove typing indicators
    typEn.remove();
    typEs.remove();
    typAr.remove();

    // Add AI responses
    const aiData = trans || fallback;
    await addMessage(colEn, aiData.aiEn, 'ai');
    await addMessage(colEs, aiData.aiEs, 'ai', 300);
    await addMessage(colAr, aiData.aiAr, 'ai', 500);

    // Pipeline: Done
    if (pipeline) {
      document.getElementById('pipe-gen').classList.replace('active', 'done');
      setTimeout(() => {
        pipeline.innerHTML = '';
      }, 2000);
    }

    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
    isProcessing = false;
  }

  // Event listeners
  sendBtn.addEventListener('click', () => processMessage(input.value));

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processMessage(input.value);
    }
  });

  quickPrompts.forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.getAttribute('data-prompt');
      input.value = prompt;
      processMessage(prompt);
    });
  });

  // Initial welcome message after a delay
  setTimeout(() => {
    addMessage(colEn, 'Welcome to MetLife Stadium! I\'m the Nexus AI Copilot. How can I help you today?', 'ai');
    setTimeout(() => {
      addMessage(colEs, '¡Bienvenido al MetLife Stadium! Soy el copiloto de IA de Nexus. ¿En qué puedo ayudarte hoy?', 'ai');
    }, 150);
    setTimeout(() => {
      addMessage(colAr, 'مرحباً بك في ملعب MetLife! أنا مساعد الذكاء الاصطناعي Nexus. كيف يمكنني مساعدتك اليوم؟', 'ai');
    }, 600);
  }, 1500);
}
