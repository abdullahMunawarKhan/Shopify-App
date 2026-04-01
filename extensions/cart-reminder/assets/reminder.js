(function() {
  const overlay = document.getElementById('cart-reminder-overlay');
  const closeBtn = document.getElementById('cart-reminder-close');
  const form = document.getElementById('cart-reminder-form');
  const emailInput = document.getElementById('reminder-email');
  const consentCheckbox = document.getElementById('reminder-consent');
  const submitButton = form.querySelector('button[type="submit"]');
  const statusMsg = document.getElementById('reminder-status');

  if (!overlay) return;

  const config = window.cartReminderSettings || { delay: 10000 };

  // Don't show if already dismissed or captured in this session
  if (localStorage.getItem('cart_reminder_captured')) return;

  // Enable/disable submit button based on consent checkbox
  function updateSubmitButton() {
    submitButton.disabled = !consentCheckbox.checked;
  }

  // Initialize button state
  updateSubmitButton();

  // Listen for checkbox changes
  consentCheckbox.addEventListener('change', updateSubmitButton);

  setTimeout(() => {
    overlay.style.display = 'flex';
  }, config.delay);

  closeBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const consent = consentCheckbox.checked;

    if (!consent) {
      statusMsg.innerText = "Please accept the privacy policy to continue.";
      statusMsg.style.display = 'block';
      statusMsg.style.color = '#d72c0d';
      return;
    }

    submitButton.innerText = 'Capturing...';
    submitButton.disabled = true;

    try {
      // 1. Get the current cart via AJAX
      const cartResponse = await fetch('/cart.js');
      const cartData = await cartResponse.json();

      if (!cartData.items || cartData.items.length === 0) {
        statusMsg.innerText = "Add something to your cart first!";
        statusMsg.style.display = 'block';
        statusMsg.style.color = '#d72c0d';
        submitButton.innerText = 'Remind Me';
        submitButton.disabled = false;
        return;
      }

      // 2. Send payload to App Proxy
      const payload = {
        email: email,
        cart: cartData,
        shop: config.shop,
        consent: consent
      };

      const captureResponse = await fetch('/apps/cart-reminder/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (captureResponse.ok) {
        statusMsg.innerText = "Success! Check your inbox soon.";
        statusMsg.style.display = 'block';
        statusMsg.style.color = '#008060';
        localStorage.setItem('cart_reminder_captured', 'true');
        setTimeout(() => {
          overlay.style.display = 'none';
        }, 2000);
      } else {
        throw new Error('Capture failed');
      }

    } catch (err) {
      console.error(err);
      statusMsg.innerText = "Something went wrong. Please try again.";
      statusMsg.style.display = 'block';
      statusMsg.style.color = '#d72c0d';
      submitButton.innerText = 'Remind Me';
      submitButton.disabled = false;
    }
  });
})();
