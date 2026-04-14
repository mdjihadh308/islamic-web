/**
 * main-nav.js — Shared Navigation & UI helpers
 * Scroll effects, sticky nav, mobile, scroll-to-top
 */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initScrollTop();
  initNavScroll();
  initFadeObserver();
});

function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initNavScroll() {
  const nav = document.getElementById('topNav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });
}

function initFadeObserver() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(el => obs.observe(el));
}