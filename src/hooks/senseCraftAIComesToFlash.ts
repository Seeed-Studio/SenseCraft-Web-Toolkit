import { useRoute } from 'vue-router';
import { onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { useDeviceStore } from '@/store';
import { DeviceType } from '@/sscma/constants';
import { FlashWayType } from '@/store/modules/device';

export async function fetchConstant() {
  return fetch('https://sensecraft.seeed.cc/aiserverapi/user/get_constant')
    .then((res) => res.json())
    .then((res) => res.data);
}

export async function fetchModelDetail(modelId: string, needParams?: string[]) {
  const response: Record<string, any> = await fetch(
    `https://sensecraft.seeed.cc/aiserverapi/model/view_model?model_id=${modelId}`
  ).then((res) => res.json());
  if (response?.code !== '0') {
    throw new Error(response.msg);
  }
  if (!needParams) {
    return response;
  }
  return needParams.map((param) => response.data?.[param]);
}

export async function fetchModelFileUrl(modelId: string, token: string) {
  const response = await fetch(
    `https://sensecraft.seeed.cc/aiserverapi/model/apply_model?model_id=${modelId}`,
    { headers: { Authorization: token } }
  ).then((res) => res.json());
  if (response?.code !== '0') {
    throw new Error(response.msg);
  }
  const modelFile = JSON.parse(response.data.model_snapshot);
  return modelFile;
}

const useSenseCraftAIComesToFlash = () => {
  const route = useRoute();
  const deviceStore = useDeviceStore();
  const { id: modelId, token } = route.query ?? {};
  const handleSenseCraftAI = async () => {
    if (!(modelId && token && route.name === 'process')) {
      return {};
    }
    const [
      [
        modelImg,
        deviceTypes,
        labels,
        description,
        size,
        name,
        aiFramework,
        modelFormat,
      ],
      modelFile,
      constant,
    ] = await Promise.all<any>([
      fetchModelDetail(modelId as string, [
        'pic_url',
        'uniform_types',
        'labels',
        'description',
        'model_size',
        'name',
        'ai_framework',
        'model_format',
      ]),
      fetchModelFileUrl(modelId as string, token as string),
      fetchConstant(),
    ]);
    if (deviceTypes.length > 0) {
      const deviceType: string = deviceTypes[0];
      const deviceKeyToId: Record<string, string> = {
        '32': DeviceType.XiaoEsp32s3,
      };
      if (typeof deviceKeyToId[deviceType] === 'string') {
        deviceStore.setDeviceTypeById(deviceKeyToId[deviceType]);
      }
      deviceStore.setComeToSenseCraftAI({
        model: {
          description,
          classes:
            labels?.reduce(
              (
                arr: string[],
                e: { object_id: string; object_name: string }
              ) => {
                arr[Number(e.object_id)] = e.object_name;
                return arr;
              },
              []
            ) ?? [],
          algorithm: constant.ai_framework_array[aiFramework as string],
          name,
          version: modelFile.version ?? '1.0.0',
          category: modelFile.algorithm[0].algorithm_name ?? 'Object Detection',
          model_type: constant.model_format_array[modelFormat],
          size,
          modelImg,
          isCustom: true,
        },
        modelUrl: modelFile.arguments.url,
      });
      deviceStore.setFlashWay(FlashWayType.ComeToSenseCraftAI);
    }
    return null;
  };
  onMounted(async () => {
    try {
      await handleSenseCraftAI();
    } catch (err: any) {
      Message.warning(err?.message ?? '');
    }
  });
};

export default useSenseCraftAIComesToFlash;
