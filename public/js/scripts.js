document.querySelectorAll(".toggle-pass").forEach(element => {
  element.addEventListener("change", function() {
    const targetId = this.getAttribute("data-target");
    
    if (targetId) {
      const inputs = document.querySelectorAll(`#${targetId}, .${targetId}`);
      
      inputs.forEach(input => {
        input.type = this.checked ? "text" : "password";
      });
    }
  });
});

const option = {
  animation: true,
  autohide: true,
  delay: 5000 // 5s for example
};

const toastElList = document.querySelectorAll('.toast');
const toastList = [...toastElList].map(toastEl => {
  const toast = new bootstrap.Toast(toastEl, option);
  const progress = toastEl.querySelector('.toast-progress');

  // Start the animation when shown
  toastEl.addEventListener('shown.bs.toast', () => {
    if (option.autohide && progress) {
      progress.style.transitionDuration = `${option.delay}ms`;
      progress.style.width = '0%';
    }
  });

  // Reset when hidden
  toastEl.addEventListener('hidden.bs.toast', () => {
    if (progress) progress.style.width = '0%';
  });

  return toast;
});



toastList.forEach(toast => toast.show()); 



const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));



document.querySelectorAll('a.song_a').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault(); // stop the instant redirect

    const url = this.href;

    setTimeout(() => {
      window.location.href = url;
    }, 250);
  });
});

function disableButton(btn, loadingText = "Loading, please wait...") {
  setTimeout(() => {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerText;
    btn.innerHTML = `  <span class="spinner-grow spinner-grow-sm me-2" aria-hidden="true"></span>
  <span role="status">${loadingText}</span>`;
  }, 10);
  setTimeout(() => {
    btn.disabled = false;
    btn.innerText = btn.dataset.originalText;
  }, 5000);




}