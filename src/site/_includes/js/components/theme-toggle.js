/**
 * Custom element for toggling between light and dark theme.
 */
export class ThemeToggle extends HTMLElement {
  /**
   * Initialise the element.
   */
  constructor() {
    super();

    const storedPreference = localStorage.getItem('theme');

    // Set the active theme based on user preferences
    if (storedPreference) {
      this.activeTheme = storedPreference;
      this.setThemeAttribute(this.activeTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.activeTheme = 'dark';
    } else {
      this.activeTheme = 'light';
    }
  }

  /**
   * Render the toggle button HTML and bind click events.
   */
  connectedCallback() {
    this.innerHTML = `
      <button id="theme-toggle" class="c-theme-toggle">
        <span class="u-visually-hidden">Toggle theme</span>
        <svg class="c-icon">
          <use xlink:href="#icon-contrast"></use>
        </svg>
      </button>
    `;

    let button = document.querySelector('#theme-toggle');
    button.addEventListener('click', () => this.toggleTheme());
  }

  /**
   * Invert current theme and store preference locally.
   */
  toggleTheme() {
    this.activeTheme = this.activeTheme === 'light' ? 'dark' : 'light';
    this.setThemeAttribute(this.activeTheme);
    localStorage.setItem('theme', this.activeTheme);
  }

  /**
   * Set theme data attribute on root element.
   * @param {*} theme
   */
  setThemeAttribute(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
