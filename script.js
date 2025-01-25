// JavaScript for interactive login page features

// Toggle password visibility
const togglePasswordButton = document.querySelector('.toggle-password');
const passwordInput = document.querySelector('#password');

togglePasswordButton.addEventListener('click', () => {
    // Toggle password input type
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    // Change icon based on password visibility
    togglePasswordButton.textContent = type === 'password' ? '\uF06E' : '\uF070';
});
