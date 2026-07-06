import { HistoricalEvent } from './types';

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    id: 'netherlands-fortress',
    title: '荷蘭人建城',
    period: '荷蘭時期',
    year: 1624,
    yearText: '1624 年',
    description: '荷蘭東印度公司在大員（現今台南安平）建造熱蘭遮城，作為東亞的重要貿易節點，開啟台灣與世界接軌的歷史。',
    iconName: 'Castle',
    color: {
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      text: 'text-sky-800',
      accent: 'bg-sky-500 hover:bg-sky-600',
      lightBg: 'bg-sky-100/50',
    },
    keyFacts: [
      '建立熱蘭遮城 (Fort Zeelandia，今安平古堡)',
      '發展鹿皮、砂糖等大宗國際轉口貿易',
      '引進荷蘭文（新港文書）與紅毛土等西方產物'
    ]
  },
  {
    id: 'koxinga-arrival',
    title: '鄭成功來台',
    period: '明鄭時期',
    year: 1662,
    yearText: '1662 年',
    description: '鄭成功率領萬人軍隊橫渡海峽，包圍熱蘭遮城數月，最終迫使荷蘭人投降並撤離台灣，開啟明鄭政權。',
    iconName: 'Flag',
    color: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      accent: 'bg-amber-500 hover:bg-amber-600',
      lightBg: 'bg-amber-100/50',
    },
    keyFacts: [
      '擊敗當時的海上霸權荷蘭東印度公司',
      '以台灣為「反清復明」的復興基地',
      '建立台灣第一個漢人儒家教育與孔廟制度'
    ]
  },
  {
    id: 'qing-rule',
    title: '清領時期',
    period: '清領時期',
    year: 1683,
    yearText: '1683 年',
    description: '施琅率領清軍渡海擊敗明鄭政權，台灣納入清帝國版圖。後期劉銘傳出任首任巡撫，推動各項現代化建設。',
    iconName: 'Scroll',
    color: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      accent: 'bg-emerald-500 hover:bg-emerald-600',
      lightBg: 'bg-emerald-100/50',
    },
    keyFacts: [
      '台灣納入清朝版圖，歷時長達 212 年',
      '劉銘傳興建台灣首條鐵路（基隆至新竹）',
      '開闢北中南主要交通要道，並推動「開山撫番」'
    ]
  },
  {
    id: 'japanese-rule',
    title: '日治時期',
    period: '日治時期',
    year: 1895,
    yearText: '1895 年',
    description: '中日甲午戰爭戰敗後，清廷與日本簽訂《馬關條約》將台灣割讓給日本，展開為期半個世紀的日治時期。',
    iconName: 'Train',
    color: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      accent: 'bg-purple-500 hover:bg-purple-600',
      lightBg: 'bg-purple-100/50',
    },
    keyFacts: [
      '因清廷簽訂《馬關條約》將台灣澎湖永久割讓',
      '推行公學校、標準時間概念、現代公共衛生與戶政體系',
      '興建日月潭發電廠、縱貫鐵路全線通車及八田與一設計之嘉南大圳'
    ]
  }
];
