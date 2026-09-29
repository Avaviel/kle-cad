<template>
  <div class="modules-panel">
    <p class="text-muted small mb-3">
      Each module is one plate island: a half, a numpad block, or an extra. The name is saved in
      the JSON as <code>_zones.N.name</code>, so Copy / Paste keeps it. Outline offset grows the
      silhouette from the corner markers (0 looks inset). Rounding fillets the outline.
    </p>

    <div v-if="modules.length === 0" class="alert alert-info small mb-0">
      No modules yet. Use <strong>Add Corner</strong> to start a module.
    </div>

    <div v-else class="d-flex flex-column gap-3">
      <div v-for="mod in modules" :key="mod.zone" class="property-group">
        <div class="d-flex flex-wrap align-items-end gap-3">
          <div>
            <span class="module-badge" :style="{ backgroundColor: mod.color, color: '#fff' }">
              Module {{ mod.zone }}
            </span>
            <div class="text-muted small mt-1">
              {{ mod.cornerCount }} {{ mod.cornerCount === 1 ? 'corner' : 'corners' }}
            </div>
          </div>

          <div class="flex-grow-1" style="min-width: 12rem; max-width: 18rem">
            <label class="form-label small mb-1" :for="`module-name-${mod.zone}`">Name</label>
            <input
              :id="`module-name-${mod.zone}`"
              class="form-control form-control-sm"
              type="text"
              :value="mod.name"
              :placeholder="`Module ${mod.zone}`"
              maxlength="80"
              autocomplete="off"
              spellcheck="false"
              @input="onNameInput(mod.zone, ($event.target as HTMLInputElement).value)"
              @change="onNameCommit(mod.zone, ($event.target as HTMLInputElement).value)"
            />
          </div>

          <div>
            <label class="form-label small mb-1" :for="`module-shape-${mod.zone}`">Shape</label>
            <select
              :id="`module-shape-${mod.zone}`"
              class="form-select form-select-sm"
              style="max-width: 11rem"
              :value="mod.shape"
              @change="onShape(mod.zone, ($event.target as HTMLSelectElement).value)"
            >
              <option value="convex">Outer wrap</option>
              <option value="path">Follow order</option>
            </select>
          </div>

          <div>
            <label class="form-label small mb-1">Outline offset (mm)</label>
            <CustomNumberInput
              :model-value="mod.offset"
              :step="0.05"
              :min="-50"
              :max="50"
              size="compact"
              title="Grow the silhouette out from the corner markers"
              @change="(value: number | undefined) => onOffset(mod.zone, value)"
            />
          </div>

          <div>
            <label class="form-label small mb-1">Outline rounding (mm)</label>
            <CustomNumberInput
              :model-value="mod.fillet"
              :step="0.05"
              :min="0"
              :max="50"
              size="compact"
              title="Fillet radius at each outline corner"
              @change="(value: number | undefined) => onFillet(mod.zone, value)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useKeyboardStore } from '@/stores/keyboard'
import CustomNumberInput from './CustomNumberInput.vue'
import {
  cornersInZone,
  ensureZoneMeta,
  getZoneSettings,
  usedZones,
  zoneColor,
} from '@/utils/cad-corners'

const keyboardStore = useKeyboardStore()

const modules = computed(() => {
  return usedZones(keyboardStore.keys).map((zone) => {
    const settings = getZoneSettings(keyboardStore.metadata, zone)
    return {
      zone,
      color: zoneColor(zone),
      cornerCount: cornersInZone(keyboardStore.keys, zone),
      ...settings,
      name: settings.name || '',
    }
  })
})

watch(
  modules,
  (list) => {
    for (const mod of list) {
      ensureZoneMeta(keyboardStore.metadata, mod.zone)
    }
  },
  { immediate: true },
)

const onNameInput = (zone: number, value: string) => {
  keyboardStore.updateZoneSetting(zone, { name: value }, false)
}

const onNameCommit = (zone: number, value: string) => {
  keyboardStore.updateZoneSetting(zone, { name: value }, true)
}

const onShape = (zone: number, value: string) => {
  keyboardStore.updateZoneSetting(zone, { shape: value === 'path' ? 'path' : 'convex' })
}

const onOffset = (zone: number, value: number | undefined) => {
  if (value == null || !Number.isFinite(value)) return
  keyboardStore.updateZoneSetting(zone, { offset: value })
}

const onFillet = (zone: number, value: number | undefined) => {
  if (value == null || !Number.isFinite(value)) return
  keyboardStore.updateZoneSetting(zone, { fillet: Math.max(0, value) })
}
</script>

<style scoped>
.property-group {
  padding: 0.75rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 0.375rem;
  background: var(--bs-tertiary-bg);
}

.module-badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
}
</style>
