/**
 * Critical JavaScript to be included in the page head.
 */

// Set theme data attribute on root element so that the user's preferred theme
// is rendered immediately and we don't get a flash of the default theme.
const storedPreference = localStorage.getItem('theme');
if (storedPreference) {
  document.documentElement.setAttribute('data-theme', storedPreference);
}
