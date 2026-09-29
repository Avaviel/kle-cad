<template>
  <BaseHelpModal :is-visible="isVisible" title="QMK Metadata - Help" @close="close">
    <div class="help-section">
      <h6 class="help-section-title">What is QMK Metadata?</h6>
      <div class="help-content">
        <p>
          <a href="https://qmk.fm/" target="_blank">QMK</a> is a popular open-source firmware for
          custom keyboards. The QMK metadata stores keyboard-specific configuration from an
          <code>info.json</code> file, including keyboard name, manufacturer, URL, processor type,
          USB configuration, and other QMK-specific settings.
        </p>
        <p>
          When you import a QMK <code>info.json</code> file, KLE-CAD converts it to KLE format and
          preserves the QMK metadata in a <code>_kleng_qmk_data</code> field. This allows you to
          edit the layout and export it back to QMK format later.
        </p>
      </div>
    </div>

    <div class="help-section">
      <h6 class="help-section-title">Importing QMK Layouts</h6>
      <div class="help-content">
        <p>
          To import a QMK <code>info.json</code> file (e.g., from the
          <a href="https://github.com/qmk/qmk_firmware" target="_blank">QMK firmware repository</a
          >):
        </p>
        <ol>
          <li>Click the <strong>Import</strong> button in the toolbar</li>
          <li>
            Select a QMK <code>info.json</code> file or a keyboard directory containing
            <code>info.json</code>
          </li>
          <li>
            The layout will be displayed with matrix coordinates in the key labels. QMK metadata
            will appear in this field
          </li>
        </ol>
      </div>
    </div>

    <div class="help-section">
      <h6 class="help-section-title">Exporting to QMK Format</h6>
      <div class="help-content">
        <p>Layouts with matrix-annotated keys can be exported to QMK format:</p>
        <ol>
          <li>Click the <strong>Export</strong> button in the toolbar</li>
          <li>Select <strong>Download QMK JSON</strong></li>
          <li>
            The exported file will contain your edited layout with reconstructed
            <code>info.json</code> structure
          </li>
        </ol>
        <p class="text-muted">
          <small
            >Note: <strong>Download QMK JSON</strong> is only available when keys have matrix
            coordinates (in the top-left label) and the keyboard has a name.</small
          >
        </p>

        <div class="subsection-title">Alternative Layouts</div>
        <p>
          If your layout has keys with option/choice labels (format <code>option,choice</code>,
          typically in label position 8 or 3), they will be split into separate QMK layouts. For
          example:
        </p>
        <ul>
          <li>
            Keys with no option/choice label appear in <strong>all</strong> layouts (shared keys)
          </li>
          <li>
            Keys with label <code>0,0</code> go in the first layout; label <code>0,1</code> in the
            second layout, etc.
          </li>
          <li>
            Layout names are preserved from the original QMK <code>info.json</code> if available,
            otherwise auto-generated as <code>LAYOUT</code>, <code>LAYOUT_0</code>,
            <code>LAYOUT_1</code>, etc.
          </li>
        </ul>
      </div>
    </div>

    <div class="help-section">
      <h6 class="help-section-title">Editing QMK Metadata</h6>
      <div class="help-content">
        <p>
          The QMK metadata is stored as JSON and can be edited directly in the text field. The
          editor validates your input in real-time. Invalid JSON will be highlighted with an error
          indicator.
        </p>

        <div class="warning-box">
          <div class="d-flex align-items-center gap-2">
            <BiExclamationTriangleFill class="text-warning" />
            <div>
              <small>
                KLE-CAD does not validate the <b>content</b> of the JSON. It is your responsibility
                to maintain valid QMK format. See the
                <a href="https://docs.qmk.fm/" target="_blank">QMK Documentation</a>
                for field specifications.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="help-section">
      <h6 class="help-section-title">Tips</h6>
      <div class="help-content">
        <ul class="tips-list">
          <li>
            When you export, the current keyboard name and author (from the left metadata panel)
            will be used as <code>keyboard_name</code> and <code>manufacturer</code> in the output
          </li>
          <li>
            Clearing this field removes all stored QMK metadata, but you can still export to QMK if
            keys are matrix-annotated
          </li>
          <li>
            QMK metadata is preserved when exporting to KLE format (stored in the
            <code>_kleng_qmk_data</code> field)
          </li>
          <li>
            You can manually edit layout names in the JSON. These names are used in the exported QMK
            <code>info.json</code>
          </li>
          <li>
            All other QMK-specific fields (processor, USB configuration, etc.) are preserved exactly
            as stored
          </li>
        </ul>
      </div>
    </div>

    <template #footer>
      <a
        href="https://editor.keyboard-tools.xyz/docs/import-export#qmk-format"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-outline-secondary me-auto d-inline-flex align-items-center gap-1 docs-link"
      >
        Documentation <BiBoxArrowUpRight />
      </a>
      <button type="button" class="btn btn-primary" @click="close">Got it!</button>
    </template>
  </BaseHelpModal>
</template>

<script setup lang="ts">
import BaseHelpModal from './BaseHelpModal.vue'
import BiExclamationTriangleFill from 'bootstrap-icons/icons/exclamation-triangle-fill.svg'
import BiBoxArrowUpRight from 'bootstrap-icons/icons/box-arrow-up-right.svg'

interface Props {
  isVisible: boolean
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const close = () => {
  emit('close')
}
</script>

<style scoped>
.docs-link svg {
  width: 0.75em;
  height: 0.75em;
}

.warning-box {
  background: var(--bs-tertiary-bg);
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid var(--bs-warning);
  margin-top: 0.75rem;
}

.subsection-title {
  font-weight: 600;
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

@media (max-width: 767.98px) {
  .warning-box {
    padding: 10px;
  }
}
</style>
