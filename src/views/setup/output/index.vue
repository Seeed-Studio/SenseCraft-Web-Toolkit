<template>
  <a-card :class="['general-card', 'item-card']">
    <a-typography-title :heading="6">{{
      $t('workplace.output.conditions')
    }}</a-typography-title>
    <a-list class="list" :data="data">
      <template #header>
        <div class="list-header">
          <div class="list-header-content">
            <div class="list-header-item"
              >{{ $t('workplace.output.object') }}
            </div>
            <div class="list-header-item">{{
              $t('workplace.output.condition')
            }}</div>
            <div class="list-header-item">{{
              $t('workplace.output.confidence')
            }}</div>
          </div>
          <div class="list-header-operation">{{
            $t('workplace.output.operation')
          }}</div>
        </div>
      </template>
      <template #empty>
        <div class="list-empty">
          <a-button type="text" @click="handleOpenModal">
            <template #icon>
              <icon-plus />
            </template>
          </a-button>
          <div>
            {{ $t('workplace.output.trigger.action') }}
          </div>
        </div>
      </template>
      <template #item="{ item }">
        <a-list-item class="list-item">
          <div class="conditions-item-content">
            <div :class="['conditions-item', 'conditions-item-object']">
              {{ classes.length > 0 ? classes[item.object] : '' }}
            </div>
            <div class="conditions-item">
              {{ $t(`workplace.output.condition.${item.condition}`) }}
            </div>
            <div :class="['conditions-item', 'conditions-item-confidence']">
              {{ item.confidence }}
            </div>
          </div>
          <template #actions>
            <div class="list-actions">
              <a-button type="text" @click="handleEdit">
                <template #icon>
                  <icon-edit class="edit-icon" />
                </template>
              </a-button>
            </div>
          </template>
        </a-list-item>
      </template>
    </a-list>

    <a-typography-title class="list-actions-title" :heading="6">{{
      $t('workplace.output.actions')
    }}</a-typography-title>
    <a-list class="list">
      <a-list-item class="list-item">
        <div class="actions-item-content">
          <icon-bulb />
          <div class="actions-item-des">
            {{ $t('workplace.output.lightup.led') }}
          </div>
        </div>

        <template #actions>
          <div class="actions-item-actions">
            <a-radio value="1" :default-checked="true"></a-radio>
          </div>
        </template>
      </a-list-item>
    </a-list>
    <div v-if="data.length > 0" class="list-footer-des">
      {{
        `If the device detects ${
          classes[data[0].object]
        } and the confidence is ${data[0].condition}
            ${data[0].confidence}, then light up the device's yellow led`
      }}
    </div>
    <div class="bottom">
      <a-button
        type="primary"
        :loading="loading"
        :disabled="
          data.length === 0 ||
          deviceStore.deviceStatus !== DeviceStatus.SerialConnected ||
          deleting
        "
        @click="handleSubmit"
        >{{ $t('workplace.output.send') }}</a-button
      >
      <a-popconfirm
        :content="$t('workplace.output.delete.confirm')"
        type="warning"
        ok-text="Confirm"
        @ok="handleDelete"
      >
        <a-button
          v-if="data.length > 0"
          class="deleteBtn"
          type="primary"
          status="danger"
          :disabled="
            deviceStore.deviceStatus !== DeviceStatus.SerialConnected || loading
          "
          :loading="deleting"
        >
          {{ $t('workplace.output.delete') }}
        </a-button>
      </a-popconfirm>
    </div>

    <a-modal
      v-model:visible="modalVisible"
      :title="$t('workplace.output..model.title')"
      @cancel="handleModalCancel"
      @ok="handleModalOk"
    >
      <a-form :model="form">
        <a-form-item
          field="object"
          :label="$t('workplace.output.object')"
          :label-col-props="{ span: 16 }"
          :wrapper-col-props="{ span: 8 }"
        >
          <a-select v-model="form.object">
            <a-option
              v-for="(item, index) of classes"
              :key="item"
              :value="index"
              :label="item"
            />
          </a-select>
        </a-form-item>
        <a-form-item
          field="condition"
          :label="$t('workplace.output.condition')"
          :label-col-props="{ span: 16 }"
          :wrapper-col-props="{ span: 8 }"
        >
          <a-select v-model="form.condition">
            <a-option
              v-for="item of conditionData"
              :key="item"
              :value="item"
              :label="$t(`workplace.output.condition.${item}`)"
            />
          </a-select>
        </a-form-item>
        <a-form-item
          field="confidence"
          :label="$t('workplace.output.confidence')"
          :label-col-props="{ span: 12 }"
          :wrapper-col-props="{ span: 12 }"
        >
          <a-slider
            v-model="form.confidence"
            class="confidence-slider"
            :min="1"
            :max="100"
            show-input
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script lang="ts" setup>
  import { computed, onMounted, watch, reactive, ref, Ref } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { useDeviceStore } from '@/store';
  import { DeviceStatus, deviceManager } from '@/sscma';

  const deviceStore = useDeviceStore();
  const device = deviceManager.getDevice();

  const data: Ref<
    {
      object: number;
      condition: string;
      confidence: number;
    }[]
  > = ref([]);

  const modalVisible = ref(false);

  const loaded = ref(false);
  const loading = ref(false);
  const deleting = ref(false);
  const conditionData = ['>=', '<=', '=='];

  const classes = computed(() => deviceStore.currentModel?.classes || []);

  const form = reactive({
    object: 0,
    condition: '>=',
    confidence: 50,
  });

  const handleOpenModal = () => {
    modalVisible.value = true;
  };

  const handleModalOk = () => {
    data.value = [
      {
        object: form.object,
        condition: form.condition,
        confidence: form.confidence,
      },
    ];
  };

  const handleModalCancel = () => {
    modalVisible.value = false;
  };

  const handleEdit = () => {
    modalVisible.value = true;
  };

  const handleDelete = async () => {
    if (deviceStore.deviceStatus !== DeviceStatus.SerialConnected) {
      Message.error('Please connect the device');
      return;
    }
    deleting.value = true;
    const ret = await device.deleteAction();
    if (ret) {
      data.value = [];
      Message.success('Delete action successful');
    } else {
      Message.error('Delete action failed');
    }
    deleting.value = false;
  };

  const handleSubmit = async () => {
    if (deviceStore.deviceStatus !== DeviceStatus.SerialConnected) {
      Message.error('Please connect the device');
      return;
    }
    loading.value = true;
    const ret = await device.setAction(
      form.object,
      form.condition,
      form.confidence
    );
    if (ret) {
      await device.break();
      // await device.invoke(-1);
      Message.success('Set action successful');
    } else {
      Message.error('Set action failed');
    }
    loading.value = false;
  };

  const handelRefresh = async (deviceStatus: DeviceStatus) => {
    if (deviceStatus === DeviceStatus.SerialConnected && !loaded.value) {
      const base64Str = await device.getInfo();
      if (base64Str) {
        const str = atob(base64Str);
        const model = JSON.parse(str);
        deviceStore.setCurrentModel(model);
      }
      const cond = await device.getAction();
      if (cond?.length > 0) {
        const condFlag = cond.indexOf('=');
        if (condFlag > 0) {
          const condition = cond.slice(condFlag - 1, condFlag);
          if (condition === '>' || condition === '<' || condition === '=') {
            const maxScoreFlag = cond.indexOf('max_score');
            if (maxScoreFlag > -1) {
              const leftFlag = cond.indexOf('(');
              const rightFlag = cond.indexOf(')');
              if (leftFlag > maxScoreFlag && rightFlag > leftFlag + 8) {
                let target = cond.slice(leftFlag + 8, rightFlag);
                if (target.length > 0) {
                  target = parseInt(target, 10) || 0;
                }
                let confidence = cond.slice(condFlag + 1);
                if (confidence.length > 0) {
                  confidence = parseInt(confidence, 10) || 0;
                }
                data.value = [
                  {
                    object: target,
                    condition: `${condition}=`,
                    confidence,
                  },
                ];
                form.object = target;
                form.condition = `${condition}=`;
                form.confidence = confidence;
              }
            }
          }
        }
      } else {
        data.value = [];
      }
      loaded.value = true;
    }
  };

  watch(
    () => deviceStore.deviceStatus,
    (val) => {
      handelRefresh(val);
    }
  );

  onMounted(async () => {
    handelRefresh(deviceStore.deviceStatus);
  });
</script>

<style lang="less">
  .arco-form-item-label-col {
    justify-content: flex-start;
  }

  .arco-list-medium .arco-list-content-wrapper .arco-list-header {
    padding: 6px 20px;
    background-color: var(--color-neutral-2);
  }
</style>

<style scoped lang="less">
  .item-card {
    width: 50%;
    min-width: 680px;
    height: 100%;
    margin: 16px;
    padding-top: 1px;

    .list-actions-title {
      margin-top: 48px;
    }

    .list {
      margin-left: 10px;

      .list-header {
        display: flex;

        .list-header-content {
          display: flex;
          flex: 1;
          justify-content: space-between;
          font-weight: 500;
          line-height: 1.5715;
          text-align: left;
          background-color: var(--color-neutral-2);

          .list-header-item {
            flex: 1;
            text-align: left;
          }
        }

        .list-header-operation {
          width: 100px;
          text-align: center;
        }
      }

      .list-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100px;
      }

      .list-actions {
        width: 100px;
        text-align: center;
      }

      .list-item {
        align-items: center;

        .conditions-item-content {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .conditions-item {
            flex: 1;
            text-align: left;
          }

          .conditions-item-object {
            font-weight: bold;
          }

          .conditions-item-confidence {
            color: rgb(var(--success-6));
          }
        }

        .actions-item-content {
          display: flex;
          align-items: center;
          justify-content: flex-start;

          .actions-item-des {
            margin-left: 20px;
          }
        }

        .actions-item-actions {
          display: flex;
          align-items: center;
          justify-content: center;
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

    .list-footer-des {
      margin-top: 10px;
      margin-left: 10px;
    }

    .bottom {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 60px;
      margin-top: 60px;

      .deleteBtn {
        margin-left: 80px;
      }
    }
  }

  .confidence-slider {
    display: flex;
  }
</style>
