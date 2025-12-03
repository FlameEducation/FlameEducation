// 豆包TTS语音类型配置
export const DOUBAO_VOICE_LIST = [
  {
    "name": "北京小爷",
    "type": "zh_male_beijingxiaoye_emo_v2_mars_bigtts",
    "emotion": ["生气", "惊讶", "激动", "冷漠", "中性"]
  },
  {
    "name": "柔美女友",
    "type": "zh_female_roumeinvyou_emo_v2_mars_bigtts",
    "emotion": ["开心", "悲伤", "生气", "惊讶", "激动", "冷漠", "中性"]
  },
  {
    "name": "阳光青年",
    "type": "zh_male_yangguangqingnian_emo_v2_mars_bigtts",
    "emotion": ["开心", "悲伤", "生气", "激动", "冷漠", "中性"]
  },
  {
    "name": "魅力女友",
    "type": "zh_female_meilinvyou_emo_v2_mars_bigtts",
    "emotion": ["悲伤", "中性"]
  },
  {
    "name": "爽快思思",
    "type": "zh_female_shuangkuaisisi_emo_v2_mars_bigtts",
    "emotion": ["开心", "悲伤", "生气", "惊讶", "激动", "冷漠", "中性"]
  },
  {
    "name": "甜心小美",
    "type": "zh_female_tianxinxiaomei_emo_v2_mars_bigtts",
    "emotion": ["悲伤", "中性"]
  },
  {
    "name": "高冷御姐",
    "type": "zh_female_gaolengyujie_emo_v2_mars_bigtts",
    "emotion": ["开心", "悲伤", "生气", "惊讶", "激动", "冷漠", "中性"]
  },
  {
    "name": "傲娇霸总",
    "type": "zh_male_aojiaobazong_emo_v2_mars_bigtts",
    "emotion": ["中性", "开心", "生气"]
  },
  {
    "name": "广州德哥",
    "type": "zh_male_guangzhoudege_emo_mars_bigtts",
    "emotion": ["生气", "中性"]
  },
  {
    "name": "京腔侃爷",
    "type": "zh_male_jingqiangkanye_emo_mars_bigtts",
    "emotion": ["开心", "生气", "惊讶", "中性"]
  },
  {
    "name": "邻居阿姨",
    "type": "zh_female_linjuayi_emo_v2_mars_bigtts",
    "emotion": ["中性", "生气", "冷漠", "悲伤", "惊讶"]
  },
  {
    "name": "优柔公子",
    "type": "zh_male_yourougongzi_emo_v2_mars_bigtts",
    "emotion": ["开心", "生气", "激动", "中性", "悲伤"]
  },
  {
    "name": "儒雅男友",
    "type": "zh_male_ruyayichen_emo_v2_mars_bigtts",
    "emotion": ["开心", "悲伤", "生气", "激动", "冷漠", "中性"]
  },
  {
    "name": "俊朗男友",
    "type": "zh_male_junlangnanyou_emo_v2_mars_bigtts",
    "emotion": ["开心", "悲伤", "生气", "惊讶", "中性"]
  },
  {
    "name": "冷酷哥哥",
    "type": "zh_male_lengkugege_emo_v2_mars_bigtts",
    "emotion": ["生气", "冷漠", "开心", "中性", "悲伤", "沮丧"]
  },
  {
    "name": "亲切女声",
    "type": "zh_female_qinqienvsheng_moon_bigtts",
    "emotion": ["中性"]
  },
  {
    "name": "甜美悦悦",
    "type": "zh_female_tianmeiyueyue_moon_bigtts",
    "emotion": ["中性"]
  },
  {
    "name": "甜美小源",
    "type": "zh_female_tianmeixiaoyuan_moon_bigtts",
    "emotion": ["中性"]
  },
  {
    "name": "清澈梓梓",
    "type": "zh_female_qingchezizi_moon_bigtts",
    "emotion": ["中性"]
  },
  {
    "name": "Tina老师",
    "type": "zh_female_yingyujiaoyu_mars_bigtts",
    "emotion": ["中性"]
  }
] as const;

export const DOUBAO_EMOTION_MAP: Record<string, string> = {
    "开心": "happy",
    "悲伤": "sad",
    "生气": "angry",
    "惊讶": "surprised",
    "激动": "excited",
    "冷漠": "cold",
    "中性": "neutral",
    "沮丧": "depressed",
    "撒娇": "lovey-dovey",
    "害羞": "shy",
    "安慰鼓励": "comfort",
    "咆哮/焦急": "tension",
    "温柔": "tender",
    "讲故事 / 自然讲述": "storytelling",
    "情感电台": "radio",
    "磁性": "magnetic",
    "广告营销": "advertising",
    "气泡音": "vocal-fry",
    "低语": "asmr",
    "新闻播报": "news",
    "娱乐八卦": "entertainment",
    "方言": "dialect"
};
