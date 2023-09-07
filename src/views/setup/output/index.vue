<template>
  <a-card :class="['general-card', 'item-card']" :title="$t('workplace.output.title')">
    <a-typography-title class="list-title" :heading="6">{{ $t('workplace.output.conditions') }}</a-typography-title>
    <a-list class="list" :data="data">
      <template #empty>
        <div class="list-empty">
          <a-button type="text" @click="handleOpenModal">
            <template #icon>
              <icon-plus />
            </template>
          </a-button>
          <div>
            Trigger action when event conditions are met
          </div>
        </div>
      </template>
      <template #item="{ item }">
        <a-list-item class="list-item">
          <div class="conditions-item-content">
            <div class="conditions-item-object">
              {{ item.object }}
            </div>
            <div>
              {{ item.condition }}
            </div>
            <div class="conditions-item-confidence">
              {{ item.confidence }}
            </div>
            <div>
              {{ item.duration }}
            </div>
          </div>

          <template #actions>
            <a-button type="text" @click="handleEdit">
              <template #icon>
                <icon-edit class="edit-icon" />
              </template>
            </a-button>
            <a-button type="text" @click="handleDelete">
              <template #icon>
                <icon-delete class="delete-icon" />
              </template>
            </a-button>
          </template>
        </a-list-item>
      </template>
    </a-list>

    <a-typography-title :class="['list-title', 'list-actions-title']" :heading="6">{{ $t('workplace.output.actions')
    }}</a-typography-title>
    <a-list class="list">
      <a-list-item class="list-item">
        <div class="actions-item-content">
          <icon-bulb />
          <div class="actions-item-des">
            Light up the LED
          </div>
        </div>

        <template #actions>
          <div class="actions-item-actions">
            <a-radio value="1" :default-checked="true"></a-radio>
          </div>
        </template>
      </a-list-item>
    </a-list>

    <div class="bottom">
      <a-button type="primary">Send</a-button>
    </div>

    <a-modal v-model:visible="visible" title="Trigger Condition" @cancel="handleCancel" @ok="handleOk">
      <a-form :model="form">
        <a-form-item field="object" label="Object" :label-col-props="{ span: 12 }" :wrapper-col-props="{ span: 12 }">
          <a-select v-model="form.object">
            <a-option value="Person">Person</a-option>
            <a-option value="Car">Car</a-option>
            <a-option value="TV">TV</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="condition" label="Condition" :label-col-props="{ span: 12 }"
          :wrapper-col-props="{ span: 12 }">
          <a-select v-model="form.condition">
            <a-option value="Greater than">Greater than</a-option>
            <a-option value="Less than">Less than</a-option>
            <a-option value="Equal to">Equal to</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="confidence" label="Trigger Confidence" :label-col-props="{ span: 12 }"
          :wrapper-col-props="{ span: 12 }">
          <a-slider class="confidence-slider" v-model="form.confidence" :min="1" :max="100" show-input />
        </a-form-item>
        <a-form-item field="duration" label="Duration" :label-col-props="{ span: 12 }" :wrapper-col-props="{ span: 12 }">
          <a-input-number v-model="form.duration" :default-value="2" :min="1" :max="100" mode="button">
            <template #suffix>
              <div>s</div>
            </template>
          </a-input-number>
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script lang="ts" setup>
import { watch, reactive, ref, Ref } from 'vue';

const data: Ref<{
  object: string;
  condition: string;
  confidence: number;
  duration: number;

}[]> = ref([]);

const visible = ref(false);
const form = reactive({
  object: "Person",
  condition: "Greater than",
  confidence: 50,
  duration: 1
});

const handleOpenModal = () => {
  visible.value = true;
};

const handleOk = () => {
  data.value = [
    {
      object: 'Person',
      condition: 'Greater than',
      confidence: 50,
      duration: 1,
    }
  ]
};
const handleCancel = () => {
  visible.value = false;
}

const handleEdit = () => {
  visible.value = true;
}

const handleDelete = () => {
  data.value = []
}

</script>
<style lang="less">
.arco-form-item-label-col {
  justify-content: flex-start;
}
</style>

<style scoped lang="less">
.item-card {
  width: 680px;
  height: 100%;
  margin: 16px;

  .list-title {
    margin-left: 10px;
  }

  .list-actions-title {
    margin-top: 48px;
  }

  .list {
    margin-left: 10px;

    .list-empty {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100px;
    }

    .list-item {
      align-items: center;

      .conditions-item-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-right: 50px;

        .conditions-item-object {
          font-weight: bold;
        }

        .conditions-item-confidence {
          color: rgb(var(--success-6));
        }
      }

      .actions-item-content {
        display: flex;
        justify-content: flex-start;
        align-items: center;

        .actions-item-des {
          margin-left: 20px;
        }
      }

      .actions-item-actions {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 5px;
      }
    }

    .edit-icon {
      color: rgb(var(--primary-6));
    }

    .delete-icon {
      color: rgb(var(--danger-6));
    }

  }

  .bottom {
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 60px;
  }
}

.confidence-slider {
  display: flex;
}
</style>
