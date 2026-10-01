import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SITE = 'https://avaviel.github.io/kle-cad';

describe('seo files point at our own site', () => {
  it('robots.txt advertises our sitemap, not upstream', () => {
    const robots = readFileSync('public/robots.txt', 'utf8');
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
    expect(robots).not.toContain('keyboard-tools.xyz');
  });

  it('sitemap.xml lists our pages, not upstream', () => {
    const sitemap = readFileSync('public/sitemap.xml', 'utf8');
    expect(sitemap).toContain(`<loc>${SITE}/</loc>`);
    expect(sitemap).toContain(`<loc>${SITE}/about.html</loc>`);
    expect(sitemap).not.toContain('keyboard-tools.xyz');
  });
});

describe('about page links escape the dub iframe cloak', () => {
  it('opens every link in a new window', () => {
    const about = readFileSync('public/about.html', 'utf8');
    const anchors = about.match(/<a\s[^>]*>/g) || [];
    expect(anchors.length).toBeGreaterThan(0);
    for (const tag of anchors) {
      expect(tag).toContain('target="_blank"');
      expect(tag).toContain('rel="noopener noreferrer"');
    }
  });
});
