<template>
  <div class="sides-panel">
    <p class="text-muted small mb-3">
      Each side is one plate island — a half, numpad block, or other extra. Outline offset grows
      the silhouette from the corner markers (0 looks inset). Rounding fillets the outline. Saved as
      <code>_zones</code>.
    </p>

    <div v-if="sides.length === 0" class="alert alert-info small mb-0">
      No sides yet. Use <strong>Add Corner</strong> to start a side.
    </div>

    <div v-else class="d-flex flex-column gap-3">
      <div v-for="side in sides" :key="side.zone" class="property-group">
        <div class="d-flex flex-wrap align-items-end gap-3">
          <div>
            <span
              class="side-badge"
              :style="{ backgroundColor: side.color, color: '#fff' }"
            >
              Side {{ side.zone }}
            </span>
            <div class="text-muted small mt-1">
              {{ side.cornerCount }} {{ side.cornerCount === 1 ? 'corner' : 'corners' }}
            </div>
          </div>

          <div>
            <label class="form-label small mb-1" :for="`side-shape-${side.zone}`">Shape</label>
            <select
              :id="`side-shape-${side.zone}`"
              class="form-select form-select-sm"
              style="max-width: 11rem"
              :value="side.shape"
              @change="onShape(side.zone, ($event.target as HTMLSelectElement).value)"
            >
              <option value="convex">Outer wrap</option>
              <option value="path">Follow order</option>
            </select>
          </div>

          <div>
            <label class="form-label small mb-1">Outline offset (mm)</label>
            <CustomNumberInput
              :model-value="side.offset"
              :step="0.05"
              :min="-50"
              :max="50"
              size="compact"
              title="Grow the silhouette out from the corner markers"
              @change="(value: number | undefined) => onOffset(side.zone, value)"
            />
          </div>

          <div>
            <label class="form-label small mb-1">Outline rounding (mm)</label>
            <CustomNumberInput
              :model-value="side.fillet"
              :step="0.05"
              :min="0"
              :max="50"
              size="compact"
              title="Fillet radius at each outline corner"
              @change="(value: number | undefined) => onFillet(side.zone, value)"
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

const sides = computed(() => {
  return usedZones(keyboardStore.keys).map((zone) => {
    const settings = getZoneSettings(keyboardStore.metadata, zone)
    return {
      zone,
      color: zoneColor(zone),
      cornerCount: cornersInZone(keyboardStore.keys, zone),
      ...settings,
    }
  })
})

watch(
  sides,
  (list) => {
    for (const side of list) {
      ensureZoneMeta(keyboardStore.metadata, side.zone)
    }
  },
  { immediate: true },
)

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

.side-badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
}
</style>
