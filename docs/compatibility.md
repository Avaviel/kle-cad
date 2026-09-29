# KLE Compatibility

KLE-CAD maintains compatibility with the standard [KLE JSON format](https://github.com/ijprest/kle-serial) for layouts. However, **100% visual compatibility with keyboard-layout-editor.com is not a goal** — the same layout file may render slightly differently between the two editors.

## Intentionally Unsupported Features

The following features from the original Keyboard Layout Editor are **not** supported in KLE-CAD:

### Key Profiles

Different key profiles (keycap shapes/appearance) are not supported. KLE-CAD uses a single default keycap rendering style for all keys.

### Full HTML Label Styling

The original editor supported arbitrary HTML content in key labels with full CSS customization. KLE-CAD supports only a small subset of HTML tags:

### Supported HTML Tags

| Supported              | Not Supported                                        |
| ---------------------- | ---------------------------------------------------- |
| `<br>`                 | `<h1>`–`<h6>` (use text size key properties instead) |
| `<b>`, `<strong>`      | `<center>` (use center label positions instead)      |
| `<i>`, `<em>`          | Arbitrary CSS in label content                       |
| `<a>`                  |                                                      |
| `<ul>`, `<ol>`, `<li>` |                                                      |
| `<img>`                |                                                      |
| `<svg>`                |                                                      |

### Background Textures and CSS Label Styling

Background textures and highly customized CSS label styling are not supported. KLE-CAD provides [minimal `css` metadata support](./custom-fonts) specifically for loading web fonts.

### Legacy Rendering Quirks

Edge cases and quirks from the original editor's rendering engine are not reproduced.

## `ta` Property (Text Alignment Colors)

KLE-CAD uses the [kle-serial](https://github.com/adamws/kle-serial2) fork. Starting in v0.18.0, it introduced a new KLE property type `'ta'` as a solution for color handling problems present in the original editor ([#344](https://github.com/ijprest/keyboard-layout-editor/issues/344), [#334](https://github.com/ijprest/keyboard-layout-editor/issues/334), [#315](https://github.com/ijprest/keyboard-layout-editor/issues/315), [#214](https://github.com/ijprest/keyboard-layout-editor/issues/214)).

The `'ta'` property follows the same semantics as the text size property `'fa'`. Layouts using `'ta'` can be opened with the legacy editor, but font colors will render differently there.

## Icon Compatibility

The original Keyboard Layout Editor supported two sets of internal icons usable as labels:

### Unsupported Icon Formats

- **Font Awesome Icons** (v4.4.0) — e.g., `<i class='fa fa-github'></i>`
- **Keyboard-Layout-Editor Icons** — e.g., `<i class='kb kb-logo-windows-8'></i>`

These icon formats are **not supported** in kle-ng. This method limits the icon choice to a fixed predefined set and ties appearance to internal CSS definitions. Instead, KLE-CAD encourages using [inline SVGs](./key-properties#image-and-svg-labels), which make layouts self-contained and support any icon or graphic. See [#42](https://github.com/adamws/kle-ng/issues/42) for background.

<a href="https://editor.keyboard-tools.xyz/#share=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-EWM0Mo2RwC1GQE8bIYBxAoHI2AcgKADr-go8oFACQKPrBQDABgABXOADQAASUByDEBgFAYg0h1jrGIAAZQAGoAHFiCZHsMJ0TvhpACDgL4LQaAuO+F+P4EoDhpAMBMMoYgkgGBifMyERTZgIDEEIP4CAcBcgWeIHAVo0hqDqF8HQAExA0DSBUEwcQOwBguF0PoGQcgFCmBoNoJTCA-BWAgFx1oAB+ULAgGDSAgOsBAAAyBAXR5D+HWH0EoUWPAKDQNoaQJQHOWcC8FuAoW+jha0LoJTWAHAwAQBwJTVhxBCA4OsRAsQIDaAq4N4btX6u1YM2gAzvgoBQAANbmamNJ+TtnCBAgBNIBbVh9PHdM3AEwG2hurA2ICXLknDjHBIOoBgEQ4AMBgJcBAYmmBAlayluA6xchXegCQcTkmthwGoMQAAFHsVoexiDqFaKsKYG3KC+F8JtyzXAACqxA1twCEAgAAlEdk7JQzCRG2wpkT+PCfEDUxpzH4hLi+Ek9D8gxmIApZiMgVYhx7MA6sB9iALQABSUmADyAA5IEVgmAmBgL4EQTBaDUA05Z2niATDSHUH5jHQIoBcYEL54gABHI38BiCmeM9IRXb2Sdk9q7psoABdKoJGUApAo1R5AYwGjWFS60HoEA0BLDaB0bo7XnBDBGOMSY0xZjzAWEsFYaxNjbD6N4g4Rw4gwB2NnsAxALhXFuPcPojwYYMK+BVv4AIzPAj6GCCEeprnwnlCiZMxNsSWm0VpV05JYNinkQybsLJ14Di5KKvkblHRWlNuKd4tbaIDQCuGIafd1Q4hFrqKqBpJkmkmSWDD8-2l2hrk6YfYEPTWi7GWCkrzgzEXxuGL0I6hTnXjANJMaYQpd6eBmFmDmHmAWA+G5CWGWBWJ+i6s2DpAghBBvI6O2OjMfteD2FaP2HyPck-DAYRBOGMjUnOMGEuIQuWNTIFKyGSvuIeA+F-PsheG3ELMuPeLqs+NBG+IRI7PjL+LSA-IBMBC2IAuBEui+DBPtNCgktcm6KhLqk-ElLcrhHWtVERGkORJjNZFRNBjCKnAxCdFaMYjkiyJxABB8tGFvPOkJLjJrOJEQZyNJAqABgpC9HdKpN2Jvn-NpETHpKKOgtCK1KZJMhZGZFXKrPMkipKmkqGq5LlBanipiJhn5KupygvCFI9HPG2gcq1DFJKnFJXHPCiObAvPaOQgjNlLlEUbMterwvyGVLshSJVPkTVLavVMNHYvOgjB1JCt1BJH1EXGsmvo1P0VhDiBNAmNNAFHNNcpKqjIMmdNqopAcptKWNmHYntHBIdMdKdOdCkIes4unP-HdC+AvImAgq9G6M3Bol9NvEgX9ADFMVXCDGDO2N5JDELO8C8APvDMnAHMjIyDMR2BjE5H-IpDjPUiVEfkTL5CjFkdxBTOyFTBOLTPcnBkZAvMzJKtzNeIbJzCibjBeLzCSPzP0ZpKiCLK8GLHwZLANNLMmMnFWH3IrDMvyBnGrBrG0mZAYnrEUlaKosbNXGbA5JbA5DbK0ghjEu5E7C7AjIpO7CkJ7PSHKdwHImooHMHKHC6KTGolHKUYgXHHiYnHBsnGsWnFopnNvKNLnE2tCF6kXDxFiAnPWpXNXEyXXA3Ckd3NOP4fjDgovM0j3C0v3IUUPM5JYs9OPDUegfyDPMyqSovAfM7LSrigdLGReFvMWCPvUgfJOvPCfNQCWnfJfL5NfOIu5HfNBD1OKmapyCYTIp-EKHKm2AhoAgAh2MAj2GAgfDSJAtBK1Bsbftcp0SrMgiGkiGghfpgkKPLAjHgo3OPhhsQuqMbOQj9FQl+kAvtGJC9A2rPswjbGwrzCEUmIutIoKXwgIrUZctKCIgUe5CWdtNXI+IHHhMqYvIorjMxGQodP3BorURnPwAjLouZPovnPEsYvGZYuqvypyLPDYnYs4suHBWrIrG4sms4V4j4lWf4kyIEuPsEqEu2OEl6ERHGFAbEnGDvOEWqLSCko5OktqteNkuxHkq8AUj2MUj9LIYnBUlUvCbUs1PstCEKhAc0qvu8XcmaJ0iyv0fYSebiAegFBMiMsRBCtmBMh0i6EyYgmEYyIsg-t-kgivIkPEs7P5L5DsqkEhPspFEcpCCct-skRckwtcrKLcu0kOIiI8o3HqOqK8pcqOFyF8thc1L8tCUBqvIyECl6CCl2nEipQ6piFEvFKmJUQivNJ5X5dqgpOiuUVisUmWTgfirGCYsSlRRvASnYT2P3raj6HyW-vSm-jNI0XPNtPPI1Ryual9FpLMtMmsv8mlC-M2tPrRBUg5FdDKhSA2b5JPkqhWKqikM+lSPmHwjqoES-AakaEaiiVwtWGamXK5CWeVMiDal-Lig6tAfCLjP5UTO6t-p6pkT6kaH6uGu8IGsuokq-OZDtaMpGjRW7OGPGkcgxu4imu6JKISTCJmqKTmuvu0QWl+kMm5dsp8sRBWvxOGNWtvFKPhHkn1OQqMi2oMnRNtN2m9TxLRNGPDQxh5DKEOiOk1CHJ9dmRiEuFXKafOqGgBI3CugFKTRukZUKNuuhGif1MCV5UetORvE8GevqpkR+VUcCnevqevE+h2EZGDO+qypTT+lWY3AkABp4rjE-CBjiGBkTJQpBirOwrBiPghgCs1JYrvC-uhpaBiCeDhmAHhrVksG7q7kAA">
  <img src="/label-fontawesome-guide.png" alt="Font Awesome icon replacement guide using inline SVGs">
</a>

[Open in editor →](https://editor.keyboard-tools.xyz/#share=NobwRAdg9gLgpgZzALjAHgIQFosYGJQQwAEAggO6JQC2cxeATnHQG4DsAdAIwcAMxAIwCexAAIAzQjACGlBDTpZiACxgwADgmQB6bZKKyqtDgGMaxADIBLE3AgJFKtZp16ph+cbPVtAGxt2DnpMdADCUOpCDFYA5qrEAEy8CQCs9FI2hAgANMQAkhAmHDgAfGAAvtmgYNIobJXoCCwxxAAe1L72ALwAOmCqGq7kwxzkAMwcUAwx2km8vNpNMX3E5FYAJjDKvWBjCSvKcLGqO3srLFZw5ABCUK07-PwALE8AHMQpXPtgJWjq0ltiOsdgBZBJJDgATmIXwmYxMXGIHDSPHePDYxDGMI4GJ4iP4CQ4rywHCeiShWB4aQ4CUppLpkKwhLGWAmtMJjPRJLYrIpXCwKWRJP5pKRtKJSJ5HAAbNjERwsTwscy5ZjReiAF4griQ6FfFIImnEAl0hKYum47gk2UTEVkiYpOmymkkp4k8WMmV0-k8aUkxkTYlewXUn0KpF+iZkqm8s0cpGIxMSqnktGkrVPJLEJ68QMmXl+t2CllcX1YTi0nU4unE15Wiac6VEym8IXg+lK71Mr2E-lujl0lnNwk8mNPK1myEuhKcLGCv0pceOiY8thTn08N1jVv8sadlJNt1PJuOtjjt1cTj8hIxsYrrBPHgBqPls1Cp6C6GCn17l1sQXElwv4lsk9J-k2aK5vSbCcHqYyCpWOKJC+h7ZqiTKEmk0rjqOdbQu2jofsiHx1sSKR1oikJNjysqXhSpGYk2-JNmaKRwlgJ4fM2pbqjhlJNrKEK0uOZrjiB4afpSGJ1mMCCUmSfpcHWKJLvmvZqoyhLvBR3ZooSZL8A2EbELB2JmjxaZmhR5IooKGIShCZFGlw54ClCiSuYSZq-higYmeGPHRq2aQQomKp0ViEyyjmDlISkU6KphMJTpBopjFOerjoiKSfjCrbRmWhKCXiWBToJklCTCmHCokTYsoKZJvAqHEyjC46ckad6tcWHzftm3DGeForjoJxHUb4-DcCYMkwtRyEOWJ2atsqioCYOmJZZSiJNSyM7uUBXpcKhYx+gkbIfK2AZef5R7EQdF47jCDaUjN9J1sJHazpSIZMlObBauCfmvLOJgpRhnUiUyqLZm6oqcS5nWtduFKLTFF5es2FWHUVD77VaPDeROSHPSN-WAeh048uuTJfV9QoHXqrbkw5LKbbSU5bvTrMdi1nolqTA43kSWpKbaJkAQij0EkzbXOeumIOryKLlgN1VcK2omtQTWB4byu07qVh1lTrorViliTa9DCTWfKaaerSuU-Vw87yYdwUCupdZFr2GrUJSUXENKrZsCYLG47RUUtrLPrBf1PLnk99MiYksGu2aV7GjC87ksquV4YH4ZZTCSr9WS7ayglxBe2qKIrsQf15Xd73drKV5bbL-YjjCOk8YikdVmikbvbLAYUn+lKG6dVrEorXwuur9JJN9JuFtxbIth2fHO81m649CvClf1lbMr7cIK08anE9+D5GWMrn-gFxIJBl33NtKdZ+ie5Zf0Lmn0nx+lKRdxxgkQ8E13QmEAZwZ0ik-Q9metrTggFuLUk0oZIUc1lKG0TOOZmiplq8lxOhKMyUvQZS4o6Oy9d6bxgRiWd418Qx5RNomTgNF3I22cn1CCFt9rSl8FWG085QZ3XIU8MWTVGqInflCX2dJ+yfnzJtNaxsDqKVcoI-y+JZbsmctRE2+FmosWNK7RknB+ztX9vTZuYwZKsmqrY5qewuZCi9lDfGdYeQJBGr9KEcldrsScQhEwCFwZ6g-g+BCKcXTxSNMyC0SJ3jr08YkJmJsURMSZAnNizUipV30hGJkwcKEPmhgdYk0oUxfBpmlWm7VMQJS2l3PEiT+o2iNMYouAskLWTmnPWiy0qrqgJMpahokCkEwLrSB0xc-x3UktCF+Ys6K1lau2EsaQ2GYnyokKhZ5wxjArPXKhTFZnRhmvBYiZ1WrYSRs1Aa9kgp42jIGVkdktrVn2eydirxLF8R8ZYtaON4Z5J4nGKc3k66XNYoYtEvo1QrSQmlKhR04YSkuXqUyyNfK4O7OKXcRoD7J3QZWA2CDoHgyfpkwRK9WR+giY4xKNCBqQyUgFABm5om7WTNrAO3jqwJ3SmPTZ1YA5KRau8Z+9jVYDjYHNZxnI6H+QSL7VI5iPkGn9LNZsj45YUmlOdY8LjzLvOfqKflR4+UhjkqA98zYuqjgSko6svduz9mWfWOqapRzJwhUyBiL8YrOkAlErk1tiKQ0cRiHGC8sRrTouZe8Qt5RDjfFKRUJJqRonOrOWqWsGJmpRHks+2KVZpEcReL1fMs7VncuXLilEOHEQzsjRUGddUDK1vClypDa5IX5dKEWbASEuU8ZA7E0IcL9TSO8DOAkuImuTK2QSuaF60XhQSaquVfyARlpY0Fl1yyy13aSBAkkvW2halPUan8G3OvtC6Bu6qGbUOJOYo+lIpwog1r4xmNI5JsvjsOSxf18yXq3dWU81YmwdUdLvJ84dcbcw6rDMMSSkLogLikDUfRtC-EWM0Mo2RwC1GQE8bIYBxAoHI2AcgKADr-go8oFACQKPrBQDABgABXOADQAASUByDEBgFAYg0h1jrGIAAZQAGoAHFiCZHsMJ0TvhpACDgL4LQaAuO+F+P4EoDhpAMBMMoYgkgGBifMyERTZgIDEEIP4CAcBcgWeIHAVo0hqDqF8HQAExA0DSBUEwcQOwBguF0PoGQcgFCmBoNoJTCA-BWAgFx1oAB+ULAgGDSAgOsBAAAyBAXR5D+HWH0EoUWPAKDQNoaQJQHOWcC8FuAoW+jha0LoJTWAHAwAQBwJTVhxBCA4OsRAsQIDaAq4N4btX6u1YM2gAzvgoBQAANbmamNJ+TtnCBAgBNIBbVh9PHdM3AEwG2hurA2ICXLknDjHBIOoBgEQ4AMBgJcBAYmmBAlayluA6xchXegCQcTkmthwGoMQAAFHsVoexiDqFaKsKYG3KC+F8JtyzXAACqxA1twCEAgAAlEdk7JQzCRG2wpkT+PCfEDUxpzH4hLi+Ek9D8gxmIApZiMgVYhx7MA6sB9iALQABSUmADyAA5IEVgmAmBgL4EQTBaDUA05Z2niATDSHUH5jHQIoBcYEL54gABHI38BiCmeM9IRXb2Sdk9q7psoABdKoJGUApAo1R5AYwGjWFS60HoEA0BLDaB0bo7XnBDBGOMSY0xZjzAWEsFYaxNjbD6N4g4Rw4gwB2NnsAxALhXFuPcPojwYYMK+BVv4AIzPAj6GCCEeprnwnlCiZMxNsSWm0VpV05JYNinkQybsLJ14Di5KKvkblHRWlNuKd4tbaIDQCuGIafd1Q4hFrqKqBpJkmkmSWDD8-2l2hrk6YfYEPTWi7GWCkrzgzEXxuGL0I6hTnXjANJMaYQpd6eBmFmDmHmAWA+G5CWGWBWJ+i6s2DpAghBBvI6O2OjMfteD2FaP2HyPck-DAYRBOGMjUnOMGEuIQuWNTIFKyGSvuIeA+F-PsheG3ELMuPeLqs+NBG+IRI7PjL+LSA-IBMBC2IAuBEui+DBPtNCgktcm6KhLqk-ElLcrhHWtVERGkORJjNZFRNBjCKnAxCdFaMYjkiyJxABB8tGFvPOkJLjJrOJEQZyNJAqABgpC9HdKpN2Jvn-NpETHpKKOgtCK1KZJMhZGZFXKrPMkipKmkqGq5LlBanipiJhn5KupygvCFI9HPG2gcq1DFJKnFJXHPCiObAvPaOQgjNlLlEUbMterwvyGVLshSJVPkTVLavVMNHYvOgjB1JCt1BJH1EXGsmvo1P0VhDiBNAmNNAFHNNcpKqjIMmdNqopAcptKWNmHYntHBIdMdKdOdCkIes4unP-HdC+AvImAgq9G6M3Bol9NvEgX9ADFMVXCDGDO2N5JDELO8C8APvDMnAHMjIyDMR2BjE5H-IpDjPUiVEfkTL5CjFkdxBTOyFTBOLTPcnBkZAvMzJKtzNeIbJzCibjBeLzCSPzP0ZpKiCLK8GLHwZLANNLMmMnFWH3IrDMvyBnGrBrG0mZAYnrEUlaKosbNXGbA5JbA5DbK0ghjEu5E7C7AjIpO7CkJ7PSHKdwHImooHMHKHC6KTGolHKUYgXHHiYnHBsnGsWnFopnNvKNLnE2tCF6kXDxFiAnPWpXNXEyXXA3Ckd3NOP4fjDgovM0j3C0v3IUUPM5JYs9OPDUegfyDPMyqSovAfM7LSrigdLGReFvMWCPvUgfJOvPCfNQCWnfJfL5NfOIu5HfNBD1OKmapyCYTIp-EKHKm2AhoAgAh2MAj2GAgfDSJAtBK1Bsbftcp0SrMgiGkiGghfpgkKPLAjHgo3OPhhsQuqMbOQj9FQl+kAvtGJC9A2rPswjbGwrzCEUmIutIoKXwgIrUZctKCIgUe5CWdtNXI+IHHhMqYvIorjMxGQodP3BorURnPwAjLouZPovnPEsYvGZYuqvypyLPDYnYs4suHBWrIrG4sms4V4j4lWf4kyIEuPsEqEu2OEl6ERHGFAbEnGDvOEWqLSCko5OktqteNkuxHkq8AUj2MUj9LIYnBUlUvCbUs1PstCEKhAc0qvu8XcmaJ0iyv0fYSebiAegFBMiMsRBCtmBMh0i6EyYgmEYyIsg-t-kgivIkPEs7P5L5DsqkEhPspFEcpCCct-skRckwtcrKLcu0kOIiI8o3HqOqK8pcqOFyF8thc1L8tCUBqvIyECl6CCl2nEipQ6piFEvFKmJUQivNJ5X5dqgpOiuUVisUmWTgfirGCYsSlRRvASnYT2P3raj6HyW-vSm-jNI0XPNtPPI1Ryual9FpLMtMmsv8mlC-M2tPrRBUg5FdDKhSA2b5JPkqhWKqikM+lSPmHwjqoES-AakaEaiiVwtWGamXK5CWeVMiDal-Lig6tAfCLjP5UTO6t-p6pkT6kaH6uGu8IGsuokq-OZDtaMpGjRW7OGPGkcgxu4imu6JKISTCJmqKTmuvu0QWl+kMm5dsp8sRBWvxOGNWtvFKPhHkn1OQqMi2oMnRNtN2m9TxLRNGPDQxh5DKEOiOk1CHJ9dmRiEuFXKafOqGgBI3CugFKTRukZUKNuuhGif1MCV5UetORvE8GevqpkR+VUcCnevqevE+h2EZGDO+qypTT+lWY3AkABp4rjE-CBjiGBkTJQpBirOwrBiPghgCs1JYrvC-uhpaBiCeDhmAHhrVksG7q7kAA)

## Migrating from keyboard-layout-editor.com

If you have existing layouts from the original KLE, here is what to expect when opening them in KLE-CAD:

### Compatible Layouts

**Standard alphanumeric layouts** — Import and render correctly with no changes needed.

### Layouts with Icons

**Layouts using Font Awesome or KLE icons** — The icon tags (`<i class='fa ...'/>`, `<i class='kb ...'/>`) will appear as literal text in the label. Replace them with [inline SVG labels](./key-properties#image-and-svg-labels) to restore the visual.

### Layouts with Custom CSS

**Layouts relying on heavy CSS customization** — Custom colors, borders, and shadows defined in the `css` field will not take effect. Only `@import` font rules are processed.

### Layouts with Heading Tags

**Layouts using heading tags** (`<h1>` through `<h6>`) — These render as plain text. Use the **Default Text Size** or per-label text size controls in **Key Properties** to achieve size variation.

### Layouts with Key Profiles

**Layouts with key profiles** — Profile names are preserved in the JSON but not rendered. All keys use KLE-CAD's default keycap style.
