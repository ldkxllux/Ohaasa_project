const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const translate = require('@iamtraction/google-translate');

const app = express();
app.use(cors());
const PORT = 3000;

const ZODIAC_MAP = {
  "ohitsuji": "양자리",
  "ousi": "황소자리",
  "futago": "쌍둥이자리",
  "kani": "게자리",
  "sisi": "사자자리",
  "otome": "처녀자리",
  "tenbin": "천칭자리",
  "sasori": "전갈자리",
  "ite": "사수자리",
  "yagi": "염소자리",
  "mizugame": "물병자리",
  "uo": "물고기자리"
};

async function scrapeFortune() {
  try {
    const url = 'https://www.tv-asahi.co.jp/goodmorning/uranai/';
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    const results = [];
    const rankMap = {}; // 별자리별 순위 저장용

    // 순서대로 순위 매기기
    $('.rank-box li').each((index, el) => {
      const rank = index + 1; // 1등부터 시작
      const id = $(el).find('a').attr('data-label');

      rankMap[id] = rank; // id에 해당하는 순위 저장
    });

    // 별자리별 상세 운세
    const boxes = $('.seiza-box').toArray();

    for(const el of boxes) {
      const id = $(el).attr('id'); // 별자리 ID
      
      const content = $(el).find('.read').text().trim(); // 운세 내용

      let luckyColor = "";
      let luckyItem = "";

      const colorNode = $(el).find('.lucky-color-txt'); // 행운의 색상
      if (colorNode.length > 0 && colorNode[0].next) {
         luckyColor = colorNode[0].next.data; 
      }

      const itemNode = $(el).find('.key-txt'); // 행운의 아이템
      if (itemNode.length > 0 && itemNode[0].next) {
         luckyItem = itemNode[0].next.data;
      }

      // 불필요한 문자 제거
      luckyColor = luckyColor ? luckyColor.replace(/[:：\s]/g, '').trim() : "";
      luckyItem = luckyItem ? luckyItem.replace(/[:：\s]/g, '').trim() : "";

      if (id && ZODIAC_MAP[id]) {
        try{
          const [translatedContent, translatedColor, translatedItem] = await Promise.all([
            translate(content, { from: 'ja', to: 'ko' }),
            translate(luckyColor, { from: 'ja', to: 'ko' }),
            translate(luckyItem, { from: 'ja', to: 'ko' })
          ]);
        
          results.push({
            id: id,
            name: ZODIAC_MAP[id], // 한국어 이름
            rank: rankMap[id], // 순위 정보 가져오기
            content: translatedContent.text,
            luckyColor: translatedColor.text,
            luckyItem: translatedItem.text
          });
        } catch (e) {
        console.error(`❌ 번역 실패 (${id}):`, e);
        }
      }
    }
    
    console.log(`✅ 총 ${results.length}개 데이터 수집 완료!`);
    return results;

  } catch (e) {
    console.error("❌ 크롤링 실패:", e);
    return [];
  }
}

app.get('/fortune', async (req, res) => {
  const data = await scrapeFortune();
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`🚀 서버 가동: http://localhost:${PORT}/fortune`);
});