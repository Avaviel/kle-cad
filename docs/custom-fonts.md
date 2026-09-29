# Custom Fonts & CSS

## CSS Metadata {#css-import}

The original [Keyboard Layout Editor](https://www.keyboard-layout-editor.com/) provided [fine-grained](https://github.com/ijprest/keyboard-layout-editor/wiki/Custom-Styles) control over keyboard CSS style via a `css` metadata field defined in a layout. This allows using any web font (like Google Fonts) for key label rendering.

When you import a KLE layout that contains CSS metadata, KLE-CAD displays that value in the **CSS** field of the **Keyboard Metadata** panel.

## Supported CSS Features {#supported-syntax}

KLE-CAD supports only a minimal subset of CSS for loading fonts:

```css
@import url(https://fonts.googleapis.com/css2?family=Noto+Sans+JP);
```

The font name is automatically extracted from the URL and applied globally to all canvas text.

::: info
It is not possible to define different fonts for different key labels — the font applies to all labels on all keys.

All other CSS expressions are ignored and have no effect.
:::

## Adding a Custom Font

### Adding a Font from Google Fonts

1. Open the **Keyboard Metadata** panel
2. In the **CSS** field, add an `@import` statement with your Google Fonts URL
3. The font name is automatically extracted and applied to canvas rendering

### Example

**Adding Noto Sans JP:**

```css
@import url(https://fonts.googleapis.com/css2?family=Noto+Sans+JP);
```

This is especially useful for layouts with international characters, special symbols, or stylistic typography.
Following layout has been rendered with Noto Sans JP on a system without Japanese fonts installed.

![Keyboard with Japanese font](/keyboard-layout-iso-jis-tkl.png){.docs-screenshot}

[Open in editor →](https://editor.keyboard-tools.xyz/#share=NobwRAxgzlYFxgAIEsC2AHA9gJwC4AIBXbAGwAoALXXdKOAenoDNMA7XKAOgHNNNuSAUwCG6ZFwiZU9aFABMAfibDUyEgE8AvADlMuTAGoAysNZQDAKQAKASgDcYAL4AaUGGHwA7M7BN4AFhcwAFEoCDBncAAPeABGIIAxWIiwBLkUhIBmDP8I6PgABk4AVkTijIA2DM8MgA48sBi4ItKfBIBODNiCruS22PTIxsLOOWKfPzhMoKs8I3CfeexMEhJ8ABlMCABrBo84QJ8rYUIoQQAdVgAhbBFdgF1XcHUR8fd4N8m5IMApZUAlyPol0ARPaAdW1LuDWBDABaKfz2AQmASCAEJLrEIYAbBhS5zAlzkEMArgwpACll0yl0AggyXQBCDCkACSXfyXQCiDJdAGIMKQApJdipdAOIMl0AEgwpAB6lwql0AkgyXQBSDCkAGSXTyXQDBDJdACEMKQAVJdapdAKEMl0AYQwpMiXdqXQDhDJdABEMKRslwKl0ASQyXQDxDCkAPqXAC0EMA3gwpAyXTQQwAeDCkAD7g84QwA-DHC4J4goBqYnwV22UHQDSaRTGCKmQQAkmYUgAJKSCFJWbgAVSzjzcyngwGKjzAAHc4iUggAVYQAI3wgFPCBP+fOHMAARQhl0A+gwpADqM9YgDMGFLBCGAYQZLoARBhSACVl4BNBhSPeXgGkGFIATWXgGSGFI15eAKwYUoXl4BrBhSAHll4BIhiry6ANoMKQgJcwCXIAMAyXIA2QwpI4lz3JcgCwDJcgA5DNmIx5u8ib5m8nZwLEoxvBQ8ByD47bpARJQ+BQlGxD4USUd6uatCE7CCNg+CAHPEGHNER+bTD4AAiggkOurAACZVtwQmsGADbgE2cAtm2+GEZ4rEAMKiFAGxbNsgCPQYADqajuOQQAILLoAhgwpEYy6ABYMKRCcugDqDBky6APYMKQAOLLoAsgxlsugDyDCkFjLoAfgwpAA0sugB2DCk6zLoAUQwpHAlx2BCgAxDCkiCXAA5BCgCKDCkAB+lwAMQQoAAQzyU82HeB2XZjEEgDnhPgRgUMgTC4KOQRRpCMaQqw8Y+AAWsugAmDCkAAay6AKoMKSacugC6DCkABqy6AE4MKRXMugDKDCk2jLoA-gwpAAssugBBDCkAA8lzOBCgC2DCkAB8lycBCgDRDCkCiXICQ2AIEMKQADWXAABhCgCxDAmDVqZwGmte1nXdbxhFYZMrGAE2ktWNvCjVUc1PiabgpApEwclDBjQSAGrkDSTBO5kkD1lPwIJYCAISOgCQmoA28YJgU5EBN2Pgw0EPMJp8pECwTrGANUMgD9DDLgBTDJcgC3DLGgB7DGCQ1bb+gAyDC+Qz7A19MWUz3nYHTHxBIAJaSWwcQTE6TQw5vxvhWz4gADpCkgA9pCkgBtpPJ9xAA)

## Finding Google Fonts URLs

1. Go to [fonts.google.com](https://fonts.google.com/) and select a font.
2. Click **Get font**, then **Get embed code**.
3. Copy the URL from the `@import` line shown (e.g., `https://fonts.googleapis.com/css2?family=Roboto+Mono`).
4. Paste it into the CSS field as shown in the example above.

::: info
The font loads from Google's servers when the layout is opened. If the browser cannot reach Google Fonts (e.g., in certain regions or behind a firewall), the fallback system font is used instead.
:::

## Troubleshooting

### Font Not Appearing

**Font doesn't appear after adding the CSS** — The font is applied when the CSS field loses focus (on blur). Click outside the CSS text area to trigger the load. A notification appears when the font is applied successfully.

### System Font Still Showing

**Labels still show the system font** — Check that the `@import` URL is correct and that the family name in the URL matches exactly. If you typed the font name manually, ensure capitalization and spacing match the Google Fonts URL format (e.g., `Noto+Sans+JP` not `Noto Sans JP`).

### Mixed Fonts

**Different fonts for different keys are not possible** — KLE-CAD applies one font globally. If you need mixed scripts (e.g., Latin and Japanese on the same layout), choose a font that supports both character ranges, such as Noto Sans.

## CSS Metadata in KLE Export

The CSS field value is preserved when exporting to KLE JSON format. This means layouts with custom fonts remain compatible with other KLE-based tools.
