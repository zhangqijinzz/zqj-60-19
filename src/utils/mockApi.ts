import localforage from 'localforage';
import type { DriftBottle, MemoryPalace, EmotionType, MemoryScene, MemoryNode } from '@/types';

const ANONYMOUS_NAMES = [
  '来自海边的朋友',
  '夜空中最亮的星',
  '温暖的风',
  '永不褪色的记忆',
  '远方的灯塔',
  '温柔的云朵',
  '雨后的彩虹',
  '晨曦中的微光',
  '宁静的湖水',
  '春天的第一朵花',
];

const EMOTIONS: EmotionType[] = ['warm', 'miss', 'encourage', 'peaceful'];

localforage.config({
  name: 'lingjing-db',
  storeName: 'lingjing',
});

const audioBlobStore = localforage.createInstance({
  name: 'lingjing-db',
  storeName: 'audio-blobs',
});

export async function saveAudioBlob(id: string, blob: Blob): Promise<string> {
  await audioBlobStore.setItem(id, blob);
  return `blob:${id}`;
}

export async function getAudioBlobUrl(blobRef: string): Promise<string> {
  if (!blobRef || blobRef.startsWith('blob:')) {
    const id = blobRef.replace('blob:', '');
    const blob = await audioBlobStore.getItem<Blob>(id);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return '';
  }
  return blobRef;
}

function randomId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function generateMockBottle(): DriftBottle {
  return {
    id: randomId(),
    voiceBlobUrl: '',
    duration: 15 + Math.floor(Math.random() * 60),
    createdAt: Date.now() - Math.floor(Math.random() * 86400000 * 7),
    fromAnonymous: randomChoice(ANONYMOUS_NAMES),
    emotion: randomChoice(EMOTIONS),
    content: generateMockMessage(),
  };
}

function generateMockMessage(): string {
  const messages = [
    '今天的阳光很好，想起了小时候在院子里晒太阳的日子…希望你也能感受到这份温暖。',
    '不要放弃，我们都在努力地活着。每一次呼吸都是胜利。',
    '昨晚梦见了一片花海，我在里面走了很久很久。把这个梦送给你。',
    '家人今天给我读了一本书，是关于勇气的。我想，我们每个人都很勇敢。',
    '虽然身体被困住了，但我们的灵魂是自由的。愿你今晚好梦。',
    '想起年轻时和朋友们去爬山，虽然现在走不动了，但回忆里的风依然清新。',
    '你不是一个人，我们以这样的方式相遇，本身就是一种奇迹。',
    '窗外的桂花开了，很香。即使只能闻一闻，也是今天的小确幸。',
  ];
  return randomChoice(messages);
}

export async function getRandomBottle(): Promise<DriftBottle> {
  await delay(800 + Math.random() * 700);
  const saved = await localforage.getItem<DriftBottle[]>('drift-bottles-received');
  if (saved && saved.length > 0 && Math.random() > 0.3) {
    const bottle = { ...randomChoice(saved), isCollected: false };
    return rehydrateBottle(bottle);
  }
  return generateMockBottle();
}

export async function sendBottle(
  voiceBlob: Blob,
  duration: number,
  emotion?: EmotionType,
  content?: string
): Promise<DriftBottle> {
  await delay(1000);

  const id = randomId();
  const blobRef = await saveAudioBlob(id, voiceBlob);

  const bottle: DriftBottle = {
    id,
    voiceBlobUrl: blobRef,
    duration,
    createdAt: Date.now(),
    fromAnonymous: '我',
    emotion,
    isSentByMe: true,
    content,
  };

  const sent = await localforage.getItem<DriftBottle[]>('drift-bottles-sent');
  await localforage.setItem('drift-bottles-sent', [...(sent || []), bottle]);
  return bottle;
}

async function rehydrateBottle(bottle: DriftBottle): Promise<DriftBottle> {
  if (bottle.voiceBlobUrl) {
    const realUrl = await getAudioBlobUrl(bottle.voiceBlobUrl);
    return { ...bottle, voiceBlobUrl: realUrl };
  }
  return bottle;
}

export async function getMyBottles(): Promise<DriftBottle[]> {
  await delay(300);
  const received = (await localforage.getItem<DriftBottle[]>(
    'drift-bottles-received'
  )) as DriftBottle[];
  const sent = (await localforage.getItem<DriftBottle[]>(
    'drift-bottles-sent'
  )) as DriftBottle[];

  const all = [...(received || []), ...(sent || [])].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  return Promise.all(all.map(rehydrateBottle));
}

export async function collectBottle(bottle: DriftBottle): Promise<void> {
  const toStore = { ...bottle, isCollected: true };
  if (toStore.voiceBlobUrl && !toStore.voiceBlobUrl.startsWith('blob:')) {
    toStore.voiceBlobUrl = `blob:${bottle.id}`;
  }

  const received = (await localforage.getItem<DriftBottle[]>(
    'drift-bottles-received'
  )) as DriftBottle[];
  const toSave = [...(received || []), toStore];
  await localforage.setItem('drift-bottles-received', toSave);
}

export async function generateMemorySceneFromDescription(
  description: string
): Promise<MemoryScene> {
  await delay(2000 + Math.random() * 1500);

  const indoorKeywords = ['房间', '家', '屋', '室内', '客厅', '卧室', '书房', '厨房'];
  const outdoorKeywords = ['海边', '海', '山', '森林', '公园', '花园', '院子', '天空', '云'];
  const sunsetKeywords = ['黄昏', '傍晚', '夕阳', '日落', '晚霞'];
  const sunriseKeywords = ['清晨', '早晨', '朝阳', '日出'];
  const nightKeywords = ['夜晚', '晚上', '星空', '月亮', '深夜'];
  const noonKeywords = ['中午', '午后', '阳光灿烂'];

  let type: MemoryScene['type'] = 'mixed';
  let lighting: MemoryScene['lighting'] = 'sunset';

  if (indoorKeywords.some((k) => description.includes(k))) type = 'indoor';
  else if (outdoorKeywords.some((k) => description.includes(k))) type = 'outdoor';

  if (sunriseKeywords.some((k) => description.includes(k))) lighting = 'sunrise';
  else if (sunsetKeywords.some((k) => description.includes(k))) lighting = 'sunset';
  else if (nightKeywords.some((k) => description.includes(k))) lighting = 'night';
  else if (noonKeywords.some((k) => description.includes(k))) lighting = 'noon';

  const nodeLabels = extractKeywords(description);
  const memoryNodes: MemoryNode[] = nodeLabels.map((label, _i) => ({
    id: randomId(),
    position: [
      (Math.random() - 0.5) * 6,
      0.5 + Math.random() * 1.5,
      -2 - Math.random() * 4,
    ] as [number, number, number],
    label,
  }));

  const defaultNodes: MemoryNode[] = [
    { id: randomId(), position: [-3, 1, -3] as [number, number, number], label: '书桌' },
    { id: randomId(), position: [3, 0.8, -4] as [number, number, number], label: '窗台' },
    { id: randomId(), position: [0, 1.5, -5] as [number, number, number], label: '老照片' },
    { id: randomId(), position: [-2, 0.6, -5.5] as [number, number, number], label: '花盆' },
  ];

  return {
    type,
    lighting,
    memoryNodes: memoryNodes.length > 0 ? memoryNodes.slice(0, 6) : defaultNodes,
  };
}

function extractKeywords(text: string): string[] {
  const commonWords = ['的', '了', '是', '我', '在', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '她', '他', '它', '我们', '你们', '他们', '里', '还', '那个', '这个'];
  const words = text.split(/[\s，。！？、,.!?;；：:]+/).filter((w) => w.length >= 2 && !commonWords.includes(w));
  return [...new Set(words)].slice(0, 6);
}

async function rehydrateMemoryPalace(palace: MemoryPalace): Promise<MemoryPalace> {
  let url = palace.voiceBlobUrl;
  if (url) {
    url = await getAudioBlobUrl(url);
  }
  const nodes = await Promise.all(
    palace.sceneData.memoryNodes.map(async (node) => {
      if (node.voiceBlobUrl) {
        return {
          ...node,
          voiceBlobUrl: await getAudioBlobUrl(node.voiceBlobUrl),
        };
      }
      return node;
    })
  );
  return {
    ...palace,
    voiceBlobUrl: url,
    sceneData: {
      ...palace.sceneData,
      memoryNodes: nodes,
    },
  };
}

export async function createMemoryPalace(
  data: Omit<MemoryPalace, 'id' | 'createdAt'>
): Promise<MemoryPalace> {
  await delay(500);
  const id = randomId();

  let blobRef = data.voiceBlobUrl;
  if (blobRef && !blobRef.startsWith('blob:')) {
    try {
      const blobId = `palace-${id}`;
      const res = await fetch(blobRef);
      const blob = await res.blob();
      blobRef = await saveAudioBlob(blobId, blob);
    } catch {
      blobRef = '';
    }
  }

  const palace: MemoryPalace = {
    ...data,
    id,
    voiceBlobUrl: blobRef,
    createdAt: Date.now(),
  };

  const list = (await localforage.getItem<MemoryPalace[]>('memory-palaces')) || [];
  await localforage.setItem('memory-palaces', [palace, ...list]);
  return palace;
}

export async function listMemoryPalaces(): Promise<MemoryPalace[]> {
  await delay(200);
  const list = (await localforage.getItem<MemoryPalace[]>('memory-palaces')) || [];
  if (list.length === 0) {
    const demoPalace: MemoryPalace = {
      id: randomId(),
      name: '童年的院子',
      description: '记忆里有一棵很大的桂花树，每到秋天就开满了花，奶奶坐在树下织毛衣…',
      voiceBlobUrl: '',
      createdAt: Date.now() - 86400000 * 3,
      isShared: false,
      sceneData: {
        type: 'outdoor',
        lighting: 'sunset',
        memoryNodes: [
          { id: randomId(), position: [0, 2, -5] as [number, number, number], label: '桂花树' },
          { id: randomId(), position: [-3, 0.5, -3] as [number, number, number], label: '藤椅' },
          { id: randomId(), position: [3, 0.5, -4] as [number, number, number], label: '石桌' },
          { id: randomId(), position: [-2, 1.2, -6] as [number, number, number], label: '晾衣绳' },
        ],
      },
    };
    await localforage.setItem('memory-palaces', [demoPalace]);
    return [demoPalace];
  }
  return list;
}

export async function getMemoryPalace(id: string): Promise<MemoryPalace | null> {
  await delay(200);
  const list = (await localforage.getItem<MemoryPalace[]>('memory-palaces')) || [];
  const palace = list.find((p) => p.id === id) || null;
  if (palace) {
    return rehydrateMemoryPalace(palace);
  }
  return null;
}

export async function sharePalace(id: string): Promise<string> {
  const list = (await localforage.getItem<MemoryPalace[]>('memory-palaces')) || [];
  const palace = list.find((p) => p.id === id);
  if (!palace) return '';
  
  if (palace.isShared && palace.shareCode) {
    return palace.shareCode;
  }
  
  const shareCode = Math.random().toString(36).substr(2, 8).toUpperCase();
  palace.isShared = true;
  palace.shareCode = shareCode;
  await localforage.setItem('memory-palaces', list);
  return shareCode;
}

export async function getMemoryPalaceByShareCode(code: string): Promise<MemoryPalace | null> {
  await delay(200);
  const list = (await localforage.getItem<MemoryPalace[]>('memory-palaces')) || [];
  const palace = list.find((p) => p.shareCode === code.toUpperCase() && p.isShared) || null;
  if (palace) {
    return rehydrateMemoryPalace(palace);
  }
  return null;
}

export async function updateMemoryPalace(
  id: string,
  updates: Partial<MemoryPalace>
): Promise<MemoryPalace | null> {
  await delay(200);
  const list = (await localforage.getItem<MemoryPalace[]>('memory-palaces')) || [];
  const index = list.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updated = { ...list[index], ...updates };
  list[index] = updated;
  await localforage.setItem('memory-palaces', list);
  return rehydrateMemoryPalace(updated);
}

export async function updateMemoryNodePosition(
  palaceId: string,
  nodeId: string,
  position: [number, number, number]
): Promise<MemoryPalace | null> {
  await delay(100);
  const list = (await localforage.getItem<MemoryPalace[]>('memory-palaces')) || [];
  const palaceIndex = list.findIndex((p) => p.id === palaceId);
  if (palaceIndex === -1) return null;

  const palace = list[palaceIndex];
  const nodeIndex = palace.sceneData.memoryNodes.findIndex((n) => n.id === nodeId);
  if (nodeIndex === -1) return null;

  palace.sceneData.memoryNodes[nodeIndex].position = position;
  await localforage.setItem('memory-palaces', list);
  return rehydrateMemoryPalace(palace);
}

export async function updateMemoryNodesPositions(
  palaceId: string,
  nodes: { id: string; position: [number, number, number] }[]
): Promise<MemoryPalace | null> {
  await delay(150);
  const list = (await localforage.getItem<MemoryPalace[]>('memory-palaces')) || [];
  const palaceIndex = list.findIndex((p) => p.id === palaceId);
  if (palaceIndex === -1) return null;

  const palace = list[palaceIndex];
  nodes.forEach(({ id, position }) => {
    const nodeIndex = palace.sceneData.memoryNodes.findIndex((n) => n.id === id);
    if (nodeIndex !== -1) {
      palace.sceneData.memoryNodes[nodeIndex].position = position;
    }
  });

  await localforage.setItem('memory-palaces', list);
  return rehydrateMemoryPalace(palace);
}
