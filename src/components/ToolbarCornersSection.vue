<template>
  <div class="toolbar-section">
    <label class="section-label">Modules</label>
    <div class="tool-buttons">
      <div class="btn-group-vertical add-corner-group dropend">
        <button
          class="tool-button primary-add-btn"
          data-testid="toolbar-add-corner"
          title="Add Corner"
          @click="$emit('add-corner')"
        >
          <BiPlusSquare />
        </button>
        <button
          class="tool-button dropdown-btn dropdown-toggle"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          data-testid="toolbar-add-corner-menu"
          title="Add Corner to module"
        >
          <BiChevronDown />
        </button>
        <ul class="dropdown-menu">
          <li>
            <h6 class="dropdown-header">Add to module</h6>
          </li>
          <li v-for="z in zoneChoices" :key="z">
            <button class="dropdown-item" @click="$emit('add-corner', z)">Module {{ z }}</button>
          </li>
        </ul>
      </div>

      <button
        class="tool-button"
        :class="{ active: showMarkers }"
        data-testid="toolbar-corner-markers"
        :title="showMarkers ? 'Markers: Shown' : 'Markers: Hidden'"
        @click="$emit('toggle-markers')"
      >
        <BiEye v-if="showMarkers" />
        <BiEyeSlash v-else />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import BiPlusSquare from 'bootstrap-icons/icons/plus-square.svg'
import BiChevronDown from 'bootstrap-icons/icons/chevron-down.svg'
import BiEye from 'bootstrap-icons/icons/eye.svg'
import BiEyeSlash from 'bootstrap-icons/icons/eye-slash.svg'

defineProps<{
  zoneChoices: number[]
  showMarkers: boolean
}>()

defineEmits<{
  'add-corner': [zone?: number]
  'toggle-markers': []
}>()
</script>

<style scoped>
.add-corner-group .dropdown-toggle::after {
  display: none;
}
</style>
