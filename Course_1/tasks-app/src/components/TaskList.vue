<script lang="ts" setup>
import type { Task } from '../types';

const props = defineProps<{
    tasks: Task[]
}>();

const emits = defineEmits<{
  toggleDone: [id: string];
  removeTask: [id: string];
}>();

</script>

<template>
    <transition-group class="task-list" name="list" tag="div">
    <article 
      v-for="task in props.tasks"
      :key="task.id"
      class="task">
      <label for="">
        <input 
        @input="emits('toggleDone', task.id)" 
        :checked="task.done"
        type="checkbox"> 
          <span :class="{ done: task.done }">{{ task.title }}</span>
      </label>

      <button @click="emits('removeTask', task.id)" 
      class="outline">
        Remove
      </button>
    </article>
    </transition-group>
</template>

<style scoped>
.task-list{
  margin-top: 1rem;
}

.done {
  text-decoration: line-through;
}

.task {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(300px);
}
</style>