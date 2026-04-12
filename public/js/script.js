// Auth state management
let currentUser = window.authState?.user || null;

// DOM Ready handler
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupProtectedLinks();
    setupAuthForms();
    setupProtectedButtons();
  
    const fileInput = document.getElementById('uploadProfilePic');
    const fileNameSpan = document.getElementById('uploadFileName');
  
    if (fileInput && fileNameSpan) {
      fileInput.addEventListener('change', () => {
        const fileName = fileInput.files[0]?.name || 'No file selected';
        fileNameSpan.textContent = fileName;
      });
    }

    // Modal UI Logic
    const loginBtn = document.querySelector('a[href="/login"]');
    const modal = document.getElementById('loginModal');
    const closeBtn = document.getElementById('closeLogin');
  
    // Show modal
    loginBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      modal.style.display = 'flex';
    });
  
    // Close modal
    closeBtn?.addEventListener('click', () => {
      modal.style.display = 'none';
    });
});
  
// Check auth status
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/status');
        if (!response.ok) throw new Error('Auth check failed');
        
        const { user } = await response.json();
        currentUser = user;
        updateAuthUI();
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

// Update UI based on auth state
function updateAuthUI() {
    // Toggle auth-specific elements
    document.querySelectorAll('[data-auth]').forEach(el => {
        el.style.display = el.dataset.auth === (currentUser ? 'logged-in' : 'guest') ? '' : 'none';
    });
    
    // Update user info
    if (currentUser) {
        document.querySelectorAll('[data-user]').forEach(el => {
            el.textContent = currentUser[el.dataset.user];
        });
    }
}

// Setup protected links
function setupProtectedLinks() {
    document.querySelectorAll('a[href="/profile"], a[href="/sell"]').forEach(link => {
        link.addEventListener('click', (e) => {
            if (!currentUser) {
                e.preventDefault();
                window.location.href = `/login?redirect=${encodeURIComponent(link.getAttribute('href'))}`;
            }
        });
    });
}

// Setup protected buttons
function setupProtectedButtons() {
    document.querySelectorAll('[data-protected]').forEach(button => {
        button.addEventListener('click', (e) => {
            if (!currentUser) {
                e.preventDefault();
                window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
                return false;
            }
        });
    });
}

// Setup auth forms
function setupAuthForms() {
    
    // Login form (Consolidated & Cleaned)
    const loginForm = document.getElementById('loginForm');
    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);
  
      // Clear any previous errors on the UI before trying again
      const errorElement = form.parentElement.querySelector('.error-message');
      if (errorElement) errorElement.style.display = 'none';
  
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(Object.fromEntries(formData))
        });
  
        if (response.ok) {
          // ✅ Login successful – refresh page to update auth UI
          window.location.reload();
        } else {
          const error = await response.json();
          showError(form, error.message || 'Login failed');
        }
      } catch (err) {
        showError(form, 'Network error. Please try again.');
      }
    });
    
    // Register form
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;

      const email = form.dlsuEmail.value;
      const studentId = form.studentId.value;
      const password = form.password.value;
      const confirmPassword = form.confirmPassword.value;
      

      if (!/^[^@]+@dlsu\.edu\.ph$/.test(email)) {
        showPopup('❌ Email must be a valid @dlsu.edu.ph address', 'error');
        return;
      }
    
      if (!/^\d{8}$/.test(studentId)) {
        showPopup('❌ Student ID must be exactly 8 digits', 'error');
        return;
      }
    
      if (password !== confirmPassword) {
        showPopup('❌ Passwords do not match', 'error');
        return;
      }
  
      try {
          const response = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  fullName: form.fullName.value,
                  dlsuEmail: form.dlsuEmail.value,
                  studentId: form.studentId.value,
                  password: form.password.value
              })
          });
  
          if (response.ok) {
              showPopup('✅ Registration successful! Redirecting...', 'success');
              setTimeout(() => {
                  window.location.href = getRedirectUrl() || '/';
              }, 2000);
          } else {
              const error = await response.json();
              showPopup(`⚠️ ${error.message || 'Registration failed'}`, 'error');
          }
      } catch (error) {
          showPopup('❌ Network error. Please try again.', 'error');
      }
  });
    
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    });
}

// Helper functions
function getRedirectUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect');
}

// Fixed showError function - targets existing red element instead of creating a new one
function showError(form, message) {
    const errorElement = form.parentElement.querySelector('.error-message');
    if (errorElement) {
        errorElement.style.display = 'block';
        errorElement.textContent = message;
    }
}

// --- Edit Profile Modal Logic ---
const profileModal = document.getElementById('editProfileModal');
const bioTextarea = document.getElementById('editBio');

document.getElementById('editProfileBtn')?.addEventListener('click', () => {
  if (!profileModal) return;
  profileModal.style.display = 'flex';

  // Pre-fill existing values
  fetch('/api/user/data')
    .then(res => res.json())
    .then(data => {
      document.getElementById('editFullName').value = data.fullName || '';
      document.getElementById('editContact').value = data.contactNumber || '';
      document.getElementById('editFacebook').value = data.facebook || '';
      if(bioTextarea) {
        bioTextarea.value = data.bio || '';
        autoGrow(bioTextarea);
      }
    });
});

document.getElementById('cancelProfileBtn')?.addEventListener('click', () => {
  if (profileModal) profileModal.style.display = 'none';
});

document.getElementById('editProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const form = e.target;
    const formData = new FormData(form);
  
    const res = await fetch('/api/user/update', {
      method: 'POST',
      body: formData
    });
    
    if (res.ok) {
      // Close the modal
      if (profileModal) profileModal.style.display = 'none';
    
      // Show popup
      showPopup('✅ Profile updated!', 'success', 'profilePopup');
    
      // Reload after a short delay
      setTimeout(() => location.reload(), 2000);
    }
});
  
// 🔁 Auto-grow bio textarea
function autoGrow(element) {
  element.style.height = 'auto';
  element.style.height = (element.scrollHeight) + 'px';
}
bioTextarea?.addEventListener('input', () => autoGrow(bioTextarea));

// Popup Helper
function showPopup(message, type = 'success', popupId = 'registerPopup') {
  const popup = document.getElementById(popupId);
  if (!popup) return;

  popup.textContent = message;
  popup.className = `popup ${type}`;
  popup.style.display = 'block';

  setTimeout(() => {
    popup.style.display = 'none';
  }, 3000);
}