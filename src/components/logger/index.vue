<template>
  <Vue3DraggableResizable class="parent" :initW="728" :initH="588" :minW="300" :minH="300" :x="500" :y="200"
    :active="true" :draggable="true" :resizable="true" :handles="['tl', 'tr', 'bl', 'br']" @resize-end="resizeEndHandle">
    <div class="header">
      <div class="title">Logger</div>
      <a-button class="close-btn" @click="handleClose" shape="circle" size="mini"><template #icon><icon-close /></template></a-button>
    </div>
    <div ref="terminal" class="terminal"></div>
  </Vue3DraggableResizable>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import 'xterm/css/xterm.css';
import Vue3DraggableResizable from 'vue3-draggable-resizable';
import 'vue3-draggable-resizable/dist/Vue3DraggableResizable.css';
import { useAppStore } from '@/store';
import { deviceManager } from '@/senseCraft';

const appStore = useAppStore();

const terminal = ref();
const term = deviceManager.term;

onMounted(async () => {
  if (terminal.value) {
    term.open(terminal.value);
  }
});

const resizeEndHandle = (payload: { x: number, y: number, w: number, h: number }) => {
  const terminalHeight = payload.h - 48;
  const terminalWidth = payload.w;
  const rows = Math.floor(terminalHeight / 18);
  const columns = Math.floor(terminalWidth / 9) - 3;
  term.resize(columns, rows)
}

const handleClose = () => {
  appStore.toggleLog(false);
}
</script>

<style lang="less" scoped>
.parent {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-neutral-3);

  .header {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    height: 48px;
    padding: 0 20px;
    border-bottom: 1px solid var(--color-neutral-3);
    background-color: white;

    .title {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      color: var(--color-text-1);
      font-weight: 500;
      font-size: 16px;
    }

    .close-btn {
      margin-left: -12px;
      color: var(--color-text-1);
      font-size: 12px;
      cursor: pointer;
    }
  }
  .terminal {
    background-color: black;
    width: 100%;
    flex: 1;
    padding-left: 8px;
    z-index: 10;
  }

}
</style>
