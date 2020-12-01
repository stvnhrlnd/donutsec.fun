/**
 * Entry point for the client-side JavaScript.
 */

import { ThemeToggle } from './components/theme-toggle';

if ('customElements' in window) {
  customElements.define('theme-toggle', ThemeToggle);
}
